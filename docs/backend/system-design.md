# Continuum — System Design Diagram

View at [mermaid.live](https://mermaid.live) or in VS Code with the Mermaid extension.

![System Architecture](../../docs/system-design/system-architecture.png)

```mermaid
flowchart TB
    subgraph CLIENT["Browser — React 18 (Vercel)"]
        direction TB
        RQ["React Query v5\nstaleTime: 30s\ninvalidateQueries on socket events"]
        AC["AuthContext\nuser state · login · logout\nupdateUser()"]
        SC["Socket.io Client\ntransports: websocket\nauth: Bearer JWT"]
        AX["Axios Instance\nwithCredentials: true\nJWT interceptor\nauto-refresh on 401 via httpOnly cookie"]
    end

    subgraph BACKEND["Backend — Node.js + Express (Render Starter)"]
        direction TB
        ROUTER["Express Router\n17 route groups"]

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
            IO["Socket.io Server\nJWT on handshake\nuser:id rooms\ngetIO()\n@socket.io/redis-adapter"]
        end

        subgraph CACHE["lib/cache.js"]
            REDIS_LIB["getOrSet / invalidate\nno-op if REDIS_URL unset\nerrors silently swallowed"]
        end
    end

    subgraph DATA["Data Layer"]
        MONGO[("MongoDB Atlas\nUser · Note · Task\nFlashcardSet · Flashcard · StudySession\nConversation · Message\nFriendship · Activity\nComment · Application\nResume · RefreshToken\nOAuthCode · SyncQueue")]
        REDIS[("Upstash Redis (TLS)\nuser:id — 5 min\nactivity:<userId>:<cursor> — 5 min\nshared-notes:id — 60s\nshared-sets:id — 60s\nshared-tasks:id — 60s\nstudy-streak:<userId> — 30 min\nai:<type>:<userId>:<date> — daily cap")]
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
    IO -- "new_message\nfriend_request\ntask_updated\nnote_shared\nactivity_updated\nflashcard_shared\ncomment_added\nstudy:session-complete" --> SC

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

![Write + Real-Time Flow](../../docs/system-design/write-realtime-flow.png)

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
    BE->>RD: invalidate activity:A:first, activity:B:first
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
    BE->>RD: get activity:B:first — MISS (just invalidated)
    BE->>DB: Activity.find(visibleTo: B)
    BE->>RD: set activity:B:first TTL 5min
    BE->>UB: 200 { feed, nextCursor }
```

---

## Auth Flow

![Auth Flow](../../docs/system-design/auth-flow.png)

```mermaid
flowchart LR
    subgraph EMAIL["Email / Password"]
        REG["POST /auth/register"] --> JWT1["issue JWT\nset httpOnly refreshToken cookie"]
        LOGIN["POST /auth/login"] --> JWT1
    end

    subgraph GOOGLE["Google OAuth"]
        REDIRECT["window.location\n→ /api/auth/google"] --> CONSENT["Google consent screen"]
        CONSENT --> CALLBACK["GET /api/auth/google/callback"]
        CALLBACK --> CODE["OAuthCode (SHA-256 hash)\n60s TTL — single use"]
        CODE --> TOKEN["POST /api/auth/google/exchange"]
        TOKEN --> JWT2["issue JWT\nset httpOnly refreshToken cookie"]
    end

    JWT1 --> STORE["localStorage: token only\nhttpOnly cookie: refreshToken\n(set by server, not readable by JS)"]
    JWT2 --> STORE
    STORE --> CONNECT["connectSocket(token)\nregisterSocketEvents()"]

    subgraph REFRESH["Token Refresh (axios interceptor)"]
        R401["401 response"] --> TRY["POST /auth/refresh\ncookie sent automatically"]
        TRY --> SUCCESS["store new access token\nretry original request"]
        TRY --> FAIL["clear localStorage\nredirect /login"]
    end
```

---

## Production Deployment

![Production Deployment](../../docs/system-design/production-deployment.png)

```mermaid
flowchart TB
    subgraph PROD["Production Stack"]
        USER["User Browser"] --> VERCEL["Vercel\nhttps://continuum-web.vercel.app\nVite SPA — vercel.json SPA rewrite"]
        VERCEL -- "REST + WebSocket\nHTTPS + WSS" --> RENDER["Render Starter\nhttps://continuum-backend-yrrr.onrender.com\nNode.js · Express 5"]
        RENDER --> ATLAS["MongoDB Atlas\nShared Cluster (M0)"]
        RENDER --> UPSTASH["Upstash Redis\nrediss:// TLS\nHTTP + WebSocket pub/sub"]
        RENDER --> CLOUDINARY["Cloudinary\nImage + PDF storage"]
        RENDER --> RESEND["Resend\nTransactional email"]
        RENDER --> GROQ["Groq API\nLlama 3 inference"]
        RENDER --> GOOGLEOAUTH["Google Cloud\nOAuth 2.0"]
    end
```

| Service | Plan | URL |
|---------|------|-----|
| Frontend | Vercel Hobby | https://continuum-web.vercel.app |
| Backend | Render Starter | https://continuum-backend-yrrr.onrender.com |
| Database | MongoDB Atlas M0 (free) | Atlas cloud console |
| Cache / Pub-Sub | Upstash Redis (free) | `rediss://` TLS endpoint |
| Storage | Cloudinary (free) | — |
| Email | Resend (free) | — |
| AI | Groq API (free) | — |

---

## Scaling Path

![Scaling Path](../../docs/system-design/scaling-path.png)

```mermaid
flowchart TB
    subgraph NOW["Current — Single Instance (Render Starter)"]
        LB1["Render load balancer"] --> B1["Backend × 1"]
        B1 --> R1[("Upstash Redis")]
        B1 --> M1[("MongoDB Atlas")]
    end

    subgraph NEXT["Multi-Instance — When Needed"]
        LB2["Render load balancer"] --> B2["Backend × N"]
        B2 -- "@socket.io/redis-adapter\nPub/Sub" --> R2[("Upstash Redis")]
        B2 --> M2[("MongoDB Atlas")]
    end

    NOW -.->|"upgrade Render plan · add replicas\n@socket.io/redis-adapter already wired"| NEXT
```
