package com.continuum.android.core

import com.continuum.android.core.ui.utils.toDisplayDate
import org.junit.Assert.assertEquals
import org.junit.Test

class DateUtilsTest {

    @Test
    fun `toDisplayDate converts ISO date to MM-dd-yyyy`() {
        assertEquals("01-15-2025", "2025-01-15".toDisplayDate())
    }

    @Test
    fun `toDisplayDate handles full ISO datetime by using only the date portion`() {
        assertEquals("06-01-2025", "2025-06-01T14:30:00.000Z".toDisplayDate())
    }

    @Test
    fun `toDisplayDate returns original truncated string on unparseable input`() {
        val input = "not-a-date"
        val result = input.toDisplayDate()
        assertEquals(input.take(10), result)
    }

    @Test
    fun `toDisplayDate pads single-digit month and day`() {
        assertEquals("03-07-2024", "2024-03-07".toDisplayDate())
    }

    @Test
    fun `toDisplayDate handles leap day`() {
        assertEquals("02-29-2024", "2024-02-29".toDisplayDate())
    }

    @Test
    fun `toDisplayDate handles end of year`() {
        assertEquals("12-31-2025", "2025-12-31".toDisplayDate())
    }
}
