# Continuum Database Schema Diagram

View this diagram at [mermaid.live](https://mermaid.live) or in VS Code with Mermaid extension.

```mermaid
erDiagram
    %% ===== SPRINT 1: FOUNDATION =====
    User {
        ObjectId _id PK
        String email UK
        String username UK4
        String passwordHash
        String firstName
        String lastName
        String avatarUrl
        String bio
        String googleId UK
        String googleAccessToken
        String googleRefreshToken
        Date googleTokenExpiry
        Object settings
        Date lastLoginAt
        Boolean emailVerified
        Date deletedAt
        Date createdAt
        Date updatedAt
    }

    %% ===== SPRINT 2: CONTENT =====
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
        Boolean hasSummary
        Boolean hasFlashcards
        Boolean isPinned
        Number viewCount
        Date lastViewedAt
        Date deletedAt
        Date createdAt
        Date updatedAt
    }

    NoteSummary {
        ObjectId _id PK
        ObjectId noteId FK
        ObjectId userId FK
        String quickSummary
        String detailedSummary
        Date generatedAt
        String model
        Number tokenCount
        Date deletedAt
        Date createdAt
        Date updatedAt
    }

    %% ===== SPRINT 3: LEARNING =====
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

    %% ===== SPRINT 4: TASKS =====
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
        Boolean isShared
        Array participants
        Date completedAt
        Date deletedAt
        Date createdAt
        Date updatedAt
    }

    %% ===== SPRINT 5: SOCIAL =====
    Friendship {
        ObjectId _id PK
        ObjectId user1 FK
        ObjectId user2 FK
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
        Object userSnapshot
        Date deletedAt
        Date createdAt
        Date updatedAt
    }

    %% ===== SPRINT 6: MESSAGING =====
    Conversation {
        ObjectId _id PK
        Array participants
        Object lastMessage
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

    %% ===== SPRINT 7: CAREER =====
    Resume {
        ObjectId _id PK
        ObjectId userId FK
        String fileName
        String fileUrl
        Number fileSize
        String mimeType
        String version
        String targetRole
        Boolean hasFeedback
        Date uploadedAt
        Date deletedAt
        Date createdAt
        Date updatedAt
    }

    ResumeFeedback {
        ObjectId _id PK
        ObjectId resumeId FK
        ObjectId userId FK
        Number overallScore
        Array strengths
        Array improvements
        Array sections
        Object keywordOptimization
        String model
        Date generatedAt
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

    %% ===== SPRINT 8: ACTIVITY (Optional) =====
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
    User ||--o{ NoteSummary : "owns"
    User ||--o{ FlashcardSet : "owns"
    User ||--o{ Task : "owns"
    User ||--o{ Resume : "owns"
    User ||--o{ Application : "owns"
    User ||--o{ Comment : "writes"
    User ||--o{ Message : "sends"
    User ||--o{ SyncQueue : "queues"
    User ||--o{ Activity : "generates"

    %% Note relationships
    Note ||--o| NoteSummary : "has"
    Note ||--o{ FlashcardSet : "generates"
    Note ||--o{ Task : "linked to"
    Note ||--o{ Comment : "receives"

    %% Flashcard relationships
    FlashcardSet ||--o{ Flashcard : "contains"

    %% Social relationships
    User ||--o{ Friendship : "user1"
    User ||--o{ Friendship : "user2"

    %% Messaging relationships
    Conversation ||--o{ Message : "contains"
    User }o--o{ Conversation : "participates"

    %% Career relationships
    Resume ||--o{ ResumeFeedback : "receives"
    Resume ||--o{ Application : "used in"

    %% Comment threading
    Comment ||--o{ Comment : "replies"
```

## Quick Reference

### Collections by Sprint

| Sprint | Collections | Purpose |
|--------|-------------|---------|
| 1 | User | Authentication & profiles |
| 2 | Note, NoteSummary | Content management |
| 3 | FlashcardSet, Flashcard | Study tools |
| 4 | Task | Time management |
| 5 | Friendship, Comment | Social features |
| 6 | Conversation, Message, SyncQueue | Messaging & offline |
| 7 | Resume, ResumeFeedback, Application | Career tools |
| 8 | Activity | Activity feed (optional) |

### Key Relationships

- **User-centric**: Every collection references `userId` for ownership
- **Note hub**: Notes link to summaries, flashcards, tasks, and comments
- **Soft deletes**: All collections have `deletedAt` for recovery
- **Denormalized**: `lastMessage` in Conversation, `userSnapshot` in Comment

### Relationship Types

- `||--o{` = One to Many (User has many Notes)
- `||--o|` = One to One (Note has one Summary)
- `}o--o{` = Many to Many (Users in Conversations)
