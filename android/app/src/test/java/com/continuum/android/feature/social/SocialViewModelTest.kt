package com.continuum.android.feature.social

import com.continuum.android.feature.social.data.repository.SocialRepository
import com.continuum.android.feature.social.domain.ActivityItem
import com.continuum.android.feature.social.domain.Friend
import com.continuum.android.feature.social.domain.FriendRequest
import com.continuum.android.feature.social.domain.SharedNote
import com.continuum.android.feature.social.domain.UserProfile
import com.continuum.android.feature.social.domain.UserSearchResult
import com.continuum.android.feature.social.presentation.SocialViewModel
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class SocialViewModelTest {

    private val testDispatcher = UnconfinedTestDispatcher()
    private val repository: SocialRepository = mockk()
    private lateinit var viewModel: SocialViewModel

    private fun fakeActivity(id: String = "act1", actorName: String = "Alice") = ActivityItem(
        id = id, type = "note_created", actorId = "u1", actorName = actorName,
        actorAvatar = null, actorRoles = emptyList(), resourceId = "r1",
        resourceTitle = "Note Title", createdAt = "2025-01-01T00:00:00.000Z"
    )

    private fun fakeFriend(id: String = "f1", userId: String = "u2") = Friend(
        id = id, userId = userId, firstName = "Bob", lastName = "Smith",
        username = "bsmith", avatar = null, mutualFriendsCount = 0, roles = emptyList()
    )

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        viewModel = SocialViewModel(repository)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    // ─── Activity ──────────────────────────────────────────────────────────────

    @Test
    fun `loadActivity success — emits items`() = runTest {
        val items = listOf(fakeActivity("a1", "Alice"), fakeActivity("a2", "Bob"))
        coEvery { repository.getActivity(null) } returns Result.success(Pair(items, null))

        viewModel.loadActivity()
        advanceUntilIdle()

        assertEquals(2, viewModel.activityState.value.items.size)
        assertFalse(viewModel.activityState.value.isLoading)
    }

    @Test
    fun `loadActivity failure — clears loading flag`() = runTest {
        coEvery { repository.getActivity(null) } returns Result.failure(Exception("Offline"))

        viewModel.loadActivity()
        advanceUntilIdle()

        assertFalse(viewModel.activityState.value.isLoading)
    }

    @Test
    fun `setActivitySearch filters items by actor name`() = runTest {
        val items = listOf(fakeActivity("a1", "Alice"), fakeActivity("a2", "Bob"))
        coEvery { repository.getActivity(null) } returns Result.success(Pair(items, null))

        viewModel.loadActivity()
        advanceUntilIdle()

        viewModel.setActivitySearch("Ali")
        advanceUntilIdle()

        assertEquals(1, viewModel.activityState.value.items.size)
        assertEquals("Alice", viewModel.activityState.value.items.first().actorName)
    }

    @Test
    fun `setActivitySearch empty string — restores all items`() = runTest {
        val items = listOf(fakeActivity("a1", "Alice"), fakeActivity("a2", "Bob"))
        coEvery { repository.getActivity(null) } returns Result.success(Pair(items, null))

        viewModel.loadActivity()
        advanceUntilIdle()
        viewModel.setActivitySearch("Alice")
        advanceUntilIdle()
        viewModel.setActivitySearch("")
        advanceUntilIdle()

        assertEquals(2, viewModel.activityState.value.items.size)
    }

    @Test
    fun `markActivitySeen calls repository`() = runTest {
        coEvery { repository.markActivitySeen() } returns Result.success(Unit)

        viewModel.markActivitySeen()
        advanceUntilIdle()

        coVerify { repository.markActivitySeen() }
    }

    // ─── Friends ───────────────────────────────────────────────────────────────

    @Test
    fun `loadFriends populates friends and incoming requests`() = runTest {
        val friends = listOf(fakeFriend("f1"))
        val incoming = listOf(
            FriendRequest(
                id = "req1",
                sender = fakeFriend("f2", "u3"),
                receiver = fakeFriend("f1", "u2"),
                status = "pending"
            )
        )
        coEvery { repository.getFriends() } returns Result.success(friends)
        coEvery { repository.getFriendRequests() } returns Result.success(incoming)
        coEvery { repository.getSentRequests() } returns Result.success(emptyList())

        viewModel.loadFriends()
        advanceUntilIdle()

        assertEquals(1, viewModel.friendsState.value.friends.size)
        assertEquals(1, viewModel.friendsState.value.incomingRequests.size)
        assertFalse(viewModel.friendsState.value.isLoading)
    }

    @Test
    fun `acceptRequest calls repository and reloads friends`() = runTest {
        coEvery { repository.acceptFriendRequest("req1") } returns Result.success(Unit)
        coEvery { repository.getFriends() } returns Result.success(emptyList())
        coEvery { repository.getFriendRequests() } returns Result.success(emptyList())
        coEvery { repository.getSentRequests() } returns Result.success(emptyList())

        viewModel.acceptRequest("req1")
        advanceUntilIdle()

        coVerify { repository.acceptFriendRequest("req1") }
    }

    @Test
    fun `declineRequest calls repository and reloads friends`() = runTest {
        coEvery { repository.declineFriendRequest("req1") } returns Result.success(Unit)
        coEvery { repository.getFriends() } returns Result.success(emptyList())
        coEvery { repository.getFriendRequests() } returns Result.success(emptyList())
        coEvery { repository.getSentRequests() } returns Result.success(emptyList())

        viewModel.declineRequest("req1")
        advanceUntilIdle()

        coVerify { repository.declineFriendRequest("req1") }
    }

    @Test
    fun `removeFriend calls repository and reloads friends`() = runTest {
        coEvery { repository.removeFriend("u2") } returns Result.success(Unit)
        coEvery { repository.getFriends() } returns Result.success(emptyList())
        coEvery { repository.getFriendRequests() } returns Result.success(emptyList())
        coEvery { repository.getSentRequests() } returns Result.success(emptyList())

        viewModel.removeFriend("u2")
        advanceUntilIdle()

        coVerify { repository.removeFriend("u2") }
    }

    // ─── Search ────────────────────────────────────────────────────────────────

    @Test
    fun `searchUsers success — emits results`() = runTest {
        val results = listOf(
            UserSearchResult("u3", "Carol", "C", "carol", null, "none")
        )
        coEvery { repository.searchUsers("carol") } returns Result.success(results)

        viewModel.searchUsers("carol")
        advanceUntilIdle()

        assertEquals(1, viewModel.searchState.value.results.size)
        assertEquals("Carol", viewModel.searchState.value.results.first().firstName)
    }

    @Test
    fun `searchUsers blank query — clears results immediately`() = runTest {
        viewModel.searchUsers("")
        advanceUntilIdle()

        assertTrue(viewModel.searchState.value.results.isEmpty())
        assertFalse(viewModel.searchState.value.isLoading)
    }

    // ─── Shared note ───────────────────────────────────────────────────────────

    @Test
    fun `loadSharedNote success — populates sharedNoteState`() = runTest {
        val note = SharedNote(
            id = "n1", title = "Shared", content = "<p>Hi</p>",
            comments = emptyList(), ownerName = "Alice", ownerUserId = "u1", hasFlashcards = false
        )
        coEvery { repository.getSharedNote("n1") } returns Result.success(note)

        viewModel.loadSharedNote("n1")
        advanceUntilIdle()

        assertNotNull(viewModel.sharedNoteState.value.note)
        assertEquals("Shared", viewModel.sharedNoteState.value.note?.title)
        assertFalse(viewModel.sharedNoteState.value.isLoading)
    }

    @Test
    fun `loadSharedNote failure — sets error`() = runTest {
        coEvery { repository.getSharedNote("n1") } returns Result.failure(Exception("Not found"))

        viewModel.loadSharedNote("n1")
        advanceUntilIdle()

        assertEquals("Not found", viewModel.sharedNoteState.value.error)
        assertFalse(viewModel.sharedNoteState.value.isLoading)
    }

    // ─── Thread comments ───────────────────────────────────────────────────────

    @Test
    fun `clearThreadComments resets to empty state`() = runTest {
        viewModel.clearThreadComments()

        assertTrue(viewModel.threadCommentsState.value.comments.isEmpty())
        assertNull(viewModel.threadCommentsState.value.targetId)
    }

    // ─── User profile ──────────────────────────────────────────────────────────

    @Test
    fun `loadUserProfile success — populates userProfileState`() = runTest {
        val profile = UserProfile(
            id = "u2", firstName = "Bob", lastName = "S", username = "bobs",
            avatarUrl = null, bio = null, linkedinUrl = null, instagramHandle = null,
            createdAt = "2025-01-01", roles = emptyList(), friendStatus = "none",
            friendshipId = null, incomingRequestId = null, outgoingRequestId = null,
            notesCount = 5, setsCount = 2, streak = 3
        )
        coEvery { repository.getUserProfile("u2") } returns Result.success(profile)

        viewModel.loadUserProfile("u2")
        advanceUntilIdle()

        assertEquals("Bob", viewModel.userProfileState.value.user?.firstName)
        assertFalse(viewModel.userProfileState.value.isLoading)
    }

    @Test
    fun `loadUserProfile failure — sets error`() = runTest {
        coEvery { repository.getUserProfile("bad") } returns Result.failure(Exception("Not found"))

        viewModel.loadUserProfile("bad")
        advanceUntilIdle()

        assertEquals("Not found", viewModel.userProfileState.value.error)
        assertFalse(viewModel.userProfileState.value.isLoading)
    }
}
