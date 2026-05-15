package com.continuum.android.core.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.continuum.android.R

val FrauncesFamily = FontFamily(
    Font(R.font.fraunces_bold, FontWeight.Bold),
    Font(R.font.fraunces_black, FontWeight.Black)
)

val PlusJakartaSansFamily = FontFamily(
    Font(R.font.plus_jakarta_sans_regular, FontWeight.Normal),
    Font(R.font.plus_jakarta_sans_medium, FontWeight.Medium),
    Font(R.font.plus_jakarta_sans_semibold, FontWeight.SemiBold),
    Font(R.font.plus_jakarta_sans_bold, FontWeight.Bold)
)

val ContinuumTypography = Typography(
    // Display / hero headlines — Fraunces
    displayLarge  = TextStyle(fontFamily = FrauncesFamily, fontWeight = FontWeight.Black,    fontSize = 36.sp),
    displayMedium = TextStyle(fontFamily = FrauncesFamily, fontWeight = FontWeight.Bold,     fontSize = 28.sp),
    displaySmall  = TextStyle(fontFamily = FrauncesFamily, fontWeight = FontWeight.Bold,     fontSize = 22.sp),
    // Headlines
    headlineLarge  = TextStyle(fontFamily = FrauncesFamily,         fontWeight = FontWeight.Bold,     fontSize = 24.sp),
    headlineMedium = TextStyle(fontFamily = PlusJakartaSansFamily,  fontWeight = FontWeight.Bold,     fontSize = 20.sp),
    headlineSmall  = TextStyle(fontFamily = PlusJakartaSansFamily,  fontWeight = FontWeight.SemiBold, fontSize = 16.sp),
    // Body — Plus Jakarta Sans
    bodyLarge  = TextStyle(fontFamily = PlusJakartaSansFamily, fontWeight = FontWeight.Normal, fontSize = 16.sp, lineHeight = 24.sp),
    bodyMedium = TextStyle(fontFamily = PlusJakartaSansFamily, fontWeight = FontWeight.Normal, fontSize = 14.sp, lineHeight = 20.sp),
    bodySmall  = TextStyle(fontFamily = PlusJakartaSansFamily, fontWeight = FontWeight.Normal, fontSize = 12.sp, lineHeight = 16.sp),
    // Labels
    labelLarge  = TextStyle(fontFamily = PlusJakartaSansFamily, fontWeight = FontWeight.SemiBold, fontSize = 14.sp),
    labelMedium = TextStyle(fontFamily = PlusJakartaSansFamily, fontWeight = FontWeight.Medium,   fontSize = 12.sp),
    labelSmall  = TextStyle(fontFamily = PlusJakartaSansFamily, fontWeight = FontWeight.Medium,   fontSize = 12.sp),
)
