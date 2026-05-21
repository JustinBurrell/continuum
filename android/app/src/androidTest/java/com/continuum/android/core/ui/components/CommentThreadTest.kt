package com.continuum.android.core.ui.components

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.continuum.android.feature.social.domain.Comment
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class CommentThreadTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    private fun makeComment(
        id: String = "c1",
        authorId: String = "u1",
        authorName: String = "Alice Smith",
        authorUsername: String? = "alicesmith",
        content: String = "Hello world"
    ) = Comment(
        id = id,
        authorId = authorId,
        authorName = authorName,
        authorUsername = authorUsername,
        authorAvatar = null,
        authorRoles = emptyList(),
        content = content,
        likes = 0,
        replies = emptyList(),
        createdAt = "2026-01-01T00:00:00Z"
    )

    @Test
    fun replyPrefillsAtMentionInInputField() {
        composeTestRule.setContent {
            CommentThread(
                comments = listOf(makeComment()),
                onAddComment = { _, _ -> },
                onLikeComment = {}
            )
        }

        composeTestRule.onNodeWithText("Reply").performClick()

        composeTestRule.onNode(hasSetTextAction()).assertTextContains("@alicesmith ")
    }

    @Test
    fun replyBannerShowsUsername() {
        composeTestRule.setContent {
            CommentThread(
                comments = listOf(makeComment(authorUsername = "alicesmith")),
                onAddComment = { _, _ -> },
                onLikeComment = {}
            )
        }

        composeTestRule.onNodeWithText("Reply").performClick()

        composeTestRule.onNodeWithText("Replying to @alicesmith").assertIsDisplayed()
    }

    @Test
    fun replyBannerShowsGenericTextWhenUsernameIsNull() {
        composeTestRule.setContent {
            CommentThread(
                comments = listOf(makeComment(authorUsername = null)),
                onAddComment = { _, _ -> },
                onLikeComment = {}
            )
        }

        composeTestRule.onNodeWithText("Reply").performClick()

        composeTestRule.onNodeWithText("Replying to comment").assertIsDisplayed()
    }

    @Test
    fun cancelReplyClearsInputAndBanner() {
        composeTestRule.setContent {
            CommentThread(
                comments = listOf(makeComment()),
                onAddComment = { _, _ -> },
                onLikeComment = {}
            )
        }

        composeTestRule.onNodeWithText("Reply").performClick()
        composeTestRule.onNode(hasSetTextAction()).assertTextContains("@alicesmith ")

        composeTestRule.onNodeWithContentDescription("Cancel reply").performClick()

        composeTestRule.onNode(hasSetTextAction()).assertTextEquals("")
        composeTestRule.onNodeWithText("Replying to @alicesmith").assertDoesNotExist()
    }

    @Test
    fun replySendsWithParentIdAndClearsInput() {
        val sent = mutableListOf<Pair<String, String?>>()

        composeTestRule.setContent {
            CommentThread(
                comments = listOf(makeComment(id = "c1")),
                onAddComment = { content, parentId -> sent.add(content to parentId) },
                onLikeComment = {}
            )
        }

        composeTestRule.onNodeWithText("Reply").performClick()

        // Verify the prefill is there and send it
        composeTestRule.onNode(hasSetTextAction()).assertTextContains("@alicesmith ")
        composeTestRule.onNodeWithContentDescription("Send").performClick()

        assert(sent.size == 1)
        assert(sent[0].first == "@alicesmith")
        assert(sent[0].second == "c1")

        // Input cleared after send
        composeTestRule.onNode(hasSetTextAction()).assertTextEquals("")
    }
}
