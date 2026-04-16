package com.continuum.android.core.network.json

import com.squareup.moshi.FromJson
import com.squareup.moshi.JsonClass
import com.squareup.moshi.JsonReader
import com.squareup.moshi.JsonWriter
import com.squareup.moshi.ToJson

/**
 * Backend often returns `userId` as either a Mongo id string or a populated
 * `{ "_id": "...", "firstName": "...", "lastName": "...", "username": "..." }` object.
 * Moshi needs a single adapter for both.
 */
@JsonClass(generateAdapter = false)
data class OwnerRef(
    val id: String,
    val firstName: String? = null,
    val lastName: String? = null,
    val username: String? = null
) {
    /** Best available display name: "First Last", fallback to @username. */
    val displayName: String? get() {
        val fn = firstName.orEmpty()
        val ln = lastName.orEmpty()
        return when {
            fn.isNotBlank() || ln.isNotBlank() -> "$fn $ln".trim()
            !username.isNullOrBlank() -> username
            else -> null
        }
    }
}

class OwnerRefJsonAdapter {
    @FromJson
    fun fromJson(reader: JsonReader): OwnerRef? {
        return when (reader.peek()) {
            JsonReader.Token.NULL -> {
                reader.nextNull<Any>()
                null
            }
            JsonReader.Token.STRING -> OwnerRef(reader.nextString())
            JsonReader.Token.BEGIN_OBJECT -> {
                var id = ""
                var firstName: String? = null
                var lastName: String? = null
                var username: String? = null
                reader.beginObject()
                while (reader.hasNext()) {
                    when (reader.nextName()) {
                        "_id" -> id = reader.nextString()
                        "firstName" -> firstName = reader.nextString()
                        "lastName" -> lastName = reader.nextString()
                        "username" -> username = reader.nextString()
                        else -> reader.skipValue()
                    }
                }
                reader.endObject()
                OwnerRef(id, firstName, lastName, username)
            }
            else -> {
                reader.skipValue()
                null
            }
        }
    }

    @ToJson
    fun toJson(writer: JsonWriter, value: OwnerRef?) {
        if (value == null) {
            writer.nullValue()
            return
        }
        writer.value(value.id)
    }
}
