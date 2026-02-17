# Continuum Database Schema Diagram

View this diagram at [mermaid.live](https://mermaid.live) or in VS Code with Mermaid extension.

```mermaid
erDiagram
    %% ===== MUST-SHIP: AUTH =====
    User {
        ObjectId _id PK
        String email UK
        String username UK
        String password
        String firstName
        String lastName
        String avatarUrl
        String bio
        String googleId UK
        String googleAccessToken
        String googleRefreshToken
        Date googleTokenExpiry
        String passwordResetToken
        Date passwordResetExpires
        Object settings
        Date lastLoginAt
        Boolean emailVerified
        Date deletedAt
        Date createdAt
        Date updatedAt
    }

    %% ===== MUST-SHIP: NOTES (summary embedded) =====
    Note {
        ObjectId _id PK
        ObjectId userId FK
        String title
        String content
        String contentType
        String googleDocId UK
        String googleDocUrl
        Date lastSyncedAt
        Array tags
        String subject
        String folder
        String visibility
        Array sharedWith
        Object summary "embedded quickSummary detailedSummary"
        Boolean hasFlashcards
        Boolean isPinned
        Number viewCount
        Date lastViewedAt
        Date deletedAt
        Date createdAt
        Date updatedAt
    }

    %% ===== MUST-SHIP: LEARNING =====
    FlashcardSet {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId noteId FK
        String title
        String description
        Number totalCards
        Date lastStudiedAt
        Number studySessionCount
        String visibility
        Array sharedWith
        Boolean isAIGenerated
        Date generatedAt
        Date deletedAt
        Date createdAt
        Date updatedAt
    }

    Flashcard {
        ObjectId _id PK
        ObjectId setId FK
        String front
        String back
        Array userProgress
        Number order
        Date deletedAt
        Date createdAt
        Date updatedAt
    }

    %% ===== MUST-SHIP: TASKS =====
    Task {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId noteId FK
        String title
        String description
        Date dueDate
        Number duration
        Number reminderMinutes
        String type
        String priority
        String status
        Object recurrence "frequency interval daysOfWeek endDate parentTaskId"
        Boolean isShared
        Array participants "userId status completedAt per participant"
        Date completedAt
        Date deletedAt
        Date createdAt
        Date updatedAt
    }

    %% ===== MUST-SHIP: SOCIAL =====
    Friendship {
        ObjectId _id PK
        ObjectId user1 FK "user1 < user2"
        ObjectId user2 FK "user1 < user2"
        ObjectId requestedBy FK
        String status
        Date requestedAt
        Date respondedAt
        Date deletedAt
        Date createdAt
        Date updatedAt
    }

    Comment {
        ObjectId _id PK
        ObjectId targetId FK
        String targetType
        ObjectId userId FK
        String content
        ObjectId parentId FK
        Array likes
        Object userSnapshot "embedded username avatarUrl"
        Date deletedAt
        Date createdAt
        Date updatedAt
    }

    %% ===== MUST-SHIP: CAREER (feedback embedded) =====
    Resume {
        ObjectId _id PK
        ObjectId userId FK
        String fileName
        String fileUrl
        Number fileSize
        String mimeType
        String version
        String targetRole
        Array feedback "embedded overallScore strengths improvements"
        String extractedText "cached PDF text for AI"
        Date uploadedAt
        Date deletedAt
        Date createdAt
        Date updatedAt
    }

    Application {
        ObjectId _id PK
        ObjectId userId FK
        String company
        String position
        String location
        String jobUrl
        String status
        Date appliedAt
        Array interviewDates
        Date offerReceivedAt
        Date deadlineDate
        Array contacts
        String notes
        ObjectId resumeUsed FK
        Array followUpReminders
        Date deletedAt
        Date createdAt
        Date updatedAt
    }

    %% ===== STRETCH: MESSAGING =====
    Conversation {
        ObjectId _id PK
        Array participants
        Object lastMessage "embedded senderId content sentAt"
        Array unreadCounts
        Date deletedAt
        Date createdAt
        Date updatedAt
    }

    Message {
        ObjectId _id PK
        ObjectId conversationId FK
        ObjectId senderId FK
        String content
        Array readBy
        Date clientTimestamp
        String syncStatus
        Date deletedAt
        Date createdAt
        Date updatedAt
    }

    %% ===== STRETCH: OFFLINE =====
    SyncQueue {
        ObjectId _id PK
        ObjectId userId FK
        String operation
        String collection
        ObjectId documentId
        Object data
        String status
        String errorMessage
        Date clientTimestamp
        Date processedAt
        Date createdAt
        Date updatedAt
    }

    %% ===== STRETCH: ACTIVITY FEED =====
    Activity {
        ObjectId _id PK
        ObjectId userId FK
        String type
        ObjectId targetId
        String targetType
        Array visibleTo
        Object metadata
        Date createdAt
    }

    %% ===== RELATIONSHIPS =====

    %% User owns everything
    User ||--o{ Note : "owns"
    User ||--o{ FlashcardSet : "owns"
    User ||--o{ Task : "owns"
    User ||--o{ Resume : "owns"
    User ||--o{ Application : "owns"
    User ||--o{ Comment : "writes"
    User ||--o{ Message : "sends"
    User ||--o{ SyncQueue : "queues"
    User ||--o{ Activity : "generates"

    %% Note relationships (summary is embedded, not a separate entity)
    Note ||--o{ FlashcardSet : "generates"
    Note ||--o{ Task : "linked to"
    Note ||--o{ Comment : "receives"

    %% Flashcard relationships
    FlashcardSet ||--o{ Flashcard : "contains"
    FlashcardSet ||--o{ Comment : "receives"

    %% Task relationships
    Task ||--o{ Comment : "receives"
    %% Task self-reference: recurrence.parentTaskId links to parent Task (not supported in Mermaid ER)

    %% Social relationships
    User ||--o{ Friendship : "user1"
    User ||--o{ Friendship : "user2"

    %% Messaging relationships (stretch)
    Conversation ||--o{ Message : "contains"
    User }o--o{ Conversation : "participates"

    %% Career relationships (feedback is embedded in Resume)
    Resume ||--o{ Application : "used in"

    %% Comment threading: parentId links to parent Comment (not supported in Mermaid ER)
```

## Quick Reference

### Collections by Category

| Category | Collections | Must-Ship |
|----------|-------------|-----------|
| Auth | User | Yes |
| Notes | Note (summary embedded) | Yes |
| Learning | FlashcardSet, Flashcard | Yes |
| Tasks | Task | Yes |
| Social | Friendship, Comment | Yes |
| Career | Resume (feedback embedded), Application | Yes |
| Messaging | Conversation, Message | Stretch |
| Offline | SyncQueue | Stretch |
| Feed | Activity | Stretch |

**Total: 13 collections (9 must-ship + 4 stretch)**

### What Changed (Consolidation)

| Before | After | Why |
|--------|-------|-----|
| Note + NoteSummary (2 collections) | Note with embedded `summary` field | 1:1 relationship, always viewed together |
| Resume + ResumeFeedback (2 collections) | Resume with embedded `feedback[]` array | 1:few relationship, always viewed together |
| `passwordHash` field name | `password` field (hashed via pre-save) | Clearer naming — field stores plain input, hook hashes it |

### Key Relationships

- **User-centric**: Every collection references `userId` for ownership
- **Note hub**: Notes link to flashcards, tasks, and comments. Summary is embedded.
- **Resume hub**: Resumes link to applications. Feedback is embedded.
- **Soft deletes**: All collections have `deletedAt` for recovery
- **Denormalized**: `lastMessage` in Conversation, `userSnapshot` in Comment, `summary` in Note, `feedback` in Resume

### Relationship Types

- `||--o{` = One to Many (User has many Notes)
- `}o--o{` = Many to Many (Users in Conversations)
