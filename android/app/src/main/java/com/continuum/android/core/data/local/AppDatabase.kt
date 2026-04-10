package com.continuum.android.core.data.local

import androidx.room.Dao
import androidx.room.Database
import androidx.room.Delete
import androidx.room.Entity
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.RoomDatabase
import androidx.room.Update

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

@Entity(tableName = "notes")
data class NoteEntity(
    @PrimaryKey val id: String,
    val title: String,
    val content: String,
    val tags: String,         // JSON array serialised to String
    val isFavorite: Boolean = false,
    val updatedAt: String,
    val createdAt: String
)

@Entity(tableName = "flashcard_sets")
data class FlashcardSetEntity(
    @PrimaryKey val id: String,
    val title: String,
    val description: String,
    val cardCount: Int,
    val updatedAt: String
)

@Entity(tableName = "flashcards")
data class FlashcardEntity(
    @PrimaryKey val id: String,
    val setId: String,
    val front: String,
    val back: String,
    val position: Int
)

@Entity(tableName = "tasks")
data class TaskEntity(
    @PrimaryKey val id: String,
    val title: String,
    val description: String,
    val status: String,       // "todo" | "in_progress" | "completed"
    val priority: String?,
    val dueDate: String?,
    val updatedAt: String
)

@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey val id: String,
    val firstName: String,
    val lastName: String,
    val email: String,
    val avatar: String?
)

/**
 * Mirrors the SyncQueue MongoDB model for offline mutation queuing.
 * [localId] is auto-generated; [resourceId] is null for create operations.
 */
@Entity(tableName = "sync_queue")
data class SyncQueueEntity(
    @PrimaryKey(autoGenerate = true) val localId: Long = 0,
    val operation: String,    // "create" | "update" | "delete"
    val resourceType: String, // "note" | "task" | "flashcard_set" | "flashcard"
    val resourceId: String?,
    val payload: String,      // JSON body to send
    val createdAt: Long = System.currentTimeMillis(),
    val retryCount: Int = 0
)

// ---------------------------------------------------------------------------
// DAOs
// ---------------------------------------------------------------------------

@Dao
interface NoteDao {
    @Query("SELECT * FROM notes ORDER BY updatedAt DESC")
    suspend fun getAll(): List<NoteEntity>

    @Query("SELECT * FROM notes WHERE id = :id LIMIT 1")
    suspend fun getById(id: String): NoteEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(notes: List<NoteEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(note: NoteEntity)

    @Update
    suspend fun update(note: NoteEntity)

    @Query("DELETE FROM notes WHERE id = :id")
    suspend fun deleteById(id: String)

    @Query("DELETE FROM notes")
    suspend fun deleteAll()
}

@Dao
interface FlashcardSetDao {
    @Query("SELECT * FROM flashcard_sets ORDER BY updatedAt DESC")
    suspend fun getAll(): List<FlashcardSetEntity>

    @Query("SELECT * FROM flashcard_sets WHERE id = :id LIMIT 1")
    suspend fun getById(id: String): FlashcardSetEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(sets: List<FlashcardSetEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(set: FlashcardSetEntity)

    @Query("DELETE FROM flashcard_sets WHERE id = :id")
    suspend fun deleteById(id: String)

    @Query("DELETE FROM flashcard_sets")
    suspend fun deleteAll()
}

@Dao
interface FlashcardDao {
    @Query("SELECT * FROM flashcards WHERE setId = :setId ORDER BY position ASC")
    suspend fun getBySetId(setId: String): List<FlashcardEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(cards: List<FlashcardEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(card: FlashcardEntity)

    @Update
    suspend fun update(card: FlashcardEntity)

    @Query("DELETE FROM flashcards WHERE id = :id")
    suspend fun deleteById(id: String)

    @Query("DELETE FROM flashcards WHERE setId = :setId")
    suspend fun deleteBySetId(setId: String)
}

@Dao
interface TaskDao {
    @Query("SELECT * FROM tasks ORDER BY updatedAt DESC")
    suspend fun getAll(): List<TaskEntity>

    @Query("SELECT * FROM tasks WHERE id = :id LIMIT 1")
    suspend fun getById(id: String): TaskEntity?

    @Query("SELECT * FROM tasks WHERE status = :status ORDER BY updatedAt DESC")
    suspend fun getByStatus(status: String): List<TaskEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(tasks: List<TaskEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(task: TaskEntity)

    @Update
    suspend fun update(task: TaskEntity)

    @Query("DELETE FROM tasks WHERE id = :id")
    suspend fun deleteById(id: String)

    @Query("DELETE FROM tasks")
    suspend fun deleteAll()
}

@Dao
interface UserDao {
    @Query("SELECT * FROM users LIMIT 1")
    suspend fun getCurrentUser(): UserEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(user: UserEntity)

    @Query("DELETE FROM users")
    suspend fun deleteAll()
}

@Dao
interface SyncQueueDao {
    @Query("SELECT * FROM sync_queue ORDER BY createdAt ASC")
    suspend fun getAll(): List<SyncQueueEntity>

    @Insert
    suspend fun insert(item: SyncQueueEntity): Long

    @Update
    suspend fun update(item: SyncQueueEntity)

    @Delete
    suspend fun delete(item: SyncQueueEntity)

    @Query("DELETE FROM sync_queue WHERE localId = :localId")
    suspend fun deleteById(localId: Long)

    @Query("SELECT COUNT(*) FROM sync_queue")
    suspend fun count(): Int
}

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

@Database(
    entities = [
        NoteEntity::class,
        FlashcardSetEntity::class,
        FlashcardEntity::class,
        TaskEntity::class,
        UserEntity::class,
        SyncQueueEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun noteDao(): NoteDao
    abstract fun flashcardSetDao(): FlashcardSetDao
    abstract fun flashcardDao(): FlashcardDao
    abstract fun taskDao(): TaskDao
    abstract fun userDao(): UserDao
    abstract fun syncQueueDao(): SyncQueueDao
}
