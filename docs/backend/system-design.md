# Continuum — System Design Diagram

View at [mermaid.live](https://mermaid.live) or in VS Code with the Mermaid extension.

```mermaid
flowchart TB
    subgraph CLIENT["Browser — React 18"]
        direction TB
        RQ["React Query v5\nstaleTime: 30s\ninvalidateQueries on socket events"]
        AC["AuthContext\nuser state · login · logout\nupdateUser()"]
        SC["Socket.io Client\ntransports: websocket\nauth: Bearer JWT"]
        AX["Axios Instance\nJWT interceptor\nauto-refresh on 401"]
    end

    subgraph BACKEND["Backend — Node.js + Express"]
        direction TB
        ROUTER["Express Router\n16 route groups"]

        subgraph MIDDLEWARE["Middleware"]
            AUTH_MW["Auth Middleware\nJWT verify\ngetOrSet user:id 5min"]
        end

        subgraph CONTROLLERS["Controllers"]
            CC["auth · notes · tasks\nflashcard-sets · friends\nmessages · comments\nactivity · applications\nresumes · forum"]
        end

        subgraph SERVICES["Services"]
            ACT_SVC["activity.service\nresolves visibleTo\nnotifyActivityAudience\ninvalidates activity cache"]
            SHARE_SVC["share.service\nauto-DM on share"]
            GROQ_SVC["groq.service\nAI summaries + flashcards"]
        end

        subgraph REALTIME["lib/socket.js"]
            IO["Socket.io Server\nJWT on handshake\nuser:id rooms\ngetIO()"]
        end

        subgraph CACHE["lib/cache.js"]
            REDIS_LIB["getOrSet / invalidate\nno-op if REDIS_URL unset\nerrors silently swallowed"]
        end
    end

    subgraph DATA["Data Layer"]
        MONGO[("MongoDB\nUser · Note · Task\nFlashcardSet · Flashcard\nConversation · Message\nFriendship · Activity\nComment · Application\nResume · RefreshToken\nOAuthCode · Notification")]
        REDIS[("Redis\nuser:id — 5 min\nactivity:id — 30s\nshared-notes:id — 60s\nshared-sets:id — 60s\nshared-tasks:id — 60s")]
    end

    subgraph EXTERNAL["External Services"]
        CLOUDINARY["Cloudinary\navatar storage"]
        RESEND["Resend\ntransactional email"]
        GOOGLE["Google OAuth\nsign-in · account link"]
        GROQ["Groq AI\nLlama 3 inference"]
        FCM["Firebase FCM\npush notifications\n(planned)"]
    end

    %% Client ↔ Backend transport
    AX -- "HTTP REST /api/*\nBearer JWT" --> ROUTER
    SC -- "WebSocket ws://\nauth token" --> IO
    ROUTER --> AUTH_MW
    AUTH_MW --> CC
    AUTH_MW -- "cache read/write" --> REDIS_LIB

    %% Controllers use services + socket + cache
    CC -- "activity events" --> ACT_SVC
    CC -- "share events" --> SHARE_SVC
    CC -- "AI generation" --> GROQ_SVC
    CC -- "emit events" --> IO
    CC -- "invalidate keys" --> REDIS_LIB

    %% Socket pushes to client
    IO -- "new_message\nfriend_request\ntask_updated\nnote_shared\nactivity_updated\nflashcard_shared\ncomment_added" --> SC

    %% Client reacts
    SC -- "invalidateQueries" --> RQ

    %% Data reads
    AUTH_MW -- "findById (on miss)" --> MONGO
    CC -- "CRUD queries" --> MONGO
    REDIS_LIB -- "read / write" --> REDIS
    REDIS_LIB -- "fetch on miss" --> MONGO

    %% External service calls
    CC -- "avatar upload" --> CLOUDINARY
    CC -- "send email" --> RESEND
    CC -- "OAuth flow" --> GOOGLE
    GROQ_SVC -- "inference API" --> GROQ
    ACT_SVC -- "push (planned)" --> FCM
```

---

## Write + Real-Time Flow

Shows what happens when User A shares a task with User B.

```mermaid
sequenceDiagram
    participant UA as User A (Browser)
    participant BE as Backend
    participant RD as Redis
    participant DB as MongoDB
    participant UB as User B (Browser)

    UA->>BE: PATCH /api/tasks/:id/participants
    BE->>DB: Task.findOne() — validate ownership
    BE->>DB: Friendship.findOne() — validate participants are friends
    BE->>DB: task.save() — update participants
    BE->>DB: Activity.create() — share activity entry
    BE->>RD: invalidate activity:A, activity:B
    BE->>RD: invalidate shared-tasks:B
    BE-->>UB: socket emit task_created
    BE-->>UB: socket emit activity_updated
    BE-->>UB: socket emit new_message (auto-DM)
    BE->>UA: 200 { success: true, task }

    UA->>UA: invalidateQueries(['tasks'])

    UB->>UB: socket handler fires
    UB->>BE: GET /api/tasks/shared
    BE->>RD: get shared-tasks:B — MISS (just invalidated)
    BE->>DB: Task.find(participants: B)
    BE->>RD: set shared-tasks:B TTL 60s
    BE->>UB: 200 { tasks }
    UB->>BE: GET /api/activity
    BE->>RD: get activity:B — MISS (just invalidated)
    BE->>DB: Activity.find(visibleTo: B)
    BE->>RD: set activity:B TTL 30s
    BE->>UB: 200 { feed }
```

---

## Auth Flow

```mermaid
flowchart LR
    subgraph EMAIL["Email / Password"]
        REG["POST /auth/register"] --> JWT1["issue JWT\n+ refreshToken"]
        LOGIN["POST /auth/login"] --> JWT1
    end

    subgraph GOOGLE["Google OAuth"]
        REDIRECT["window.location\n→ /api/auth/google"] --> CONSENT["Google consent screen"]
        CONSENT --> CALLBACK["GET /api/auth/google/callback"]
        CALLBACK --> CODE["OAuthCode\n30s TTL"]
        CODE --> TOKEN["POST /api/auth/google/token"]
        TOKEN --> JWT2["issue JWT\n+ refreshToken"]
    end

    JWT1 --> STORE["localStorage\ntoken + refreshToken"]
    JWT2 --> STORE
    STORE --> CONNECT["connectSocket(token)\nregisterSocketEvents()"]

    subgraph REFRESH["Token Refresh (axios interceptor)"]
        R401["401 response"] --> TRY["POST /auth/refresh\nwith refreshToken"]
        TRY --> SUCCESS["store new token\nretry original request"]
        TRY --> FAIL["clear storage\nredirect /login"]
    end
```

---

## Scaling Path

```mermaid
flowchart TB
    subgraph NOW["Current — Single Instance"]
        LB1["Direct / Load Balancer"] --> B1["Backend × 1"]
        B1 --> R1[("Redis")]
        B1 --> M1[("MongoDB")]
    end

    subgraph NEXT["Multi-Instance — When Needed"]
        LB2["Load Balancer\nsticky sessions"] --> B2["Backend × N"]
        B2 -- "@socket.io/redis-adapter\nPub/Sub" --> R2[("Redis")]
        B2 --> M2[("MongoDB")]
    end

    NOW -.->|"add replicas\nsee redis-socket-adapter.md"| NEXT
```
