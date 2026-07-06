package com.continuum.android.debugtools

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.continuum.android.R
import com.continuum.android.core.ui.components.IntegrationLogo
import com.continuum.android.core.ui.theme.ContinuumTheme

/**
 * Debug-only screen for eyeballing every integration logo VectorDrawable at once.
 * Launch with:
 *   adb shell am start -n com.continuum.android/.debugtools.LogoGalleryActivity
 */
class LogoGalleryActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            ContinuumTheme {
                LogoGalleryScreen()
            }
        }
    }
}

private data class LogoEntry(val name: String, val iconRes: Int)

private val LIGHT_LOGOS = listOf(
    LogoEntry("googledrive", R.drawable.ic_logo_googledrive),
    LogoEntry("dropbox", R.drawable.ic_logo_dropbox),
    LogoEntry("notion", R.drawable.ic_logo_notion),
    LogoEntry("onedrive", R.drawable.ic_logo_onedrive),
    LogoEntry("anki", R.drawable.ic_logo_anki),
    LogoEntry("googlecalendar", R.drawable.ic_logo_googlecalendar),
    LogoEntry("apple", R.drawable.ic_logo_apple),
    LogoEntry("quizlet", R.drawable.ic_logo_quizlet),
    LogoEntry("youtube", R.drawable.ic_logo_youtube),
)

private val DARK_VARIANT_LOGOS = listOf(
    LogoEntry("notion_dark", R.drawable.ic_logo_notion_dark),
    LogoEntry("apple_dark", R.drawable.ic_logo_apple_dark),
)

@Composable
private fun LogoGalleryScreen() {
    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(text = "Integration Logo Gallery", style = MaterialTheme.typography.titleLarge)

            Text(text = "Light background", style = MaterialTheme.typography.labelLarge)
            LIGHT_LOGOS.forEach { entry ->
                LogoRow(entry = entry, rowBackground = Color.White, labelColor = Color.Black)
            }

            Text(text = "Dark background (white-fill variants)", style = MaterialTheme.typography.labelLarge)
            DARK_VARIANT_LOGOS.forEach { entry ->
                LogoRow(entry = entry, rowBackground = Color.Black, labelColor = Color.White)
            }
        }
    }
}

@Composable
private fun LogoRow(entry: LogoEntry, rowBackground: Color, labelColor: Color) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(rowBackground)
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        IntegrationLogo(iconRes = entry.iconRes, size = 40.dp)
        Text(text = entry.name, color = labelColor, style = MaterialTheme.typography.bodyLarge)
    }
}

@Preview
@Composable
private fun LogoGalleryPreview() {
    ContinuumTheme {
        LogoGalleryScreen()
    }
}
