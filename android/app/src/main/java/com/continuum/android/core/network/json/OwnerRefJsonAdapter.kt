package com.continuum.android.core.network.json

import com.squareup.moshi.FromJson
import com.squareup.moshi.JsonClass
import com.squareup.moshi.JsonReader
import com.squareup.moshi.JsonWriter
import com.squareup.moshi.ToJson

/**
 * Backend often returns `userId` as either a Mongo id string or a populated
 * `{ "_id": "...", "username": "..." }` object. Moshi needs a single adapter for both.
 */
@JsonClass(generateAdapter = false)
data class OwnerRef(val id: String)

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
                reader.beginObject()
                while (reader.hasNext()) {
                    when (reader.nextName()) {
                        "_id" -> id = reader.nextString()
                        else -> reader.skipValue()
                    }
                }
                reader.endObject()
                OwnerRef(id)
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
