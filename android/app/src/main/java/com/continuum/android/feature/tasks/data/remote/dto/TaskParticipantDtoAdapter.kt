package com.continuum.android.feature.tasks.data.remote.dto

import com.squareup.moshi.FromJson
import com.squareup.moshi.JsonReader

/**
 * Backend may return [TaskParticipantDto.userId] as either a string id or a populated user object.
 */
class TaskParticipantDtoAdapter {
    @FromJson
    fun fromJson(reader: JsonReader): TaskParticipantDto {
        var userId = ""
        var status = "todo"
        var completedAt: String? = null
        var firstName: String? = null
        var lastName: String? = null
        var username: String? = null
        var avatarUrl: String? = null

        reader.beginObject()
        while (reader.hasNext()) {
            when (reader.nextName()) {
                "userId" -> {
                    when (reader.peek()) {
                        JsonReader.Token.STRING -> userId = reader.nextString()
                        JsonReader.Token.NULL -> reader.nextNull<Unit>()
                        JsonReader.Token.BEGIN_OBJECT -> {
                            reader.beginObject()
                            while (reader.hasNext()) {
                                when (reader.nextName()) {
                                    "_id" -> userId = reader.nextString()
                                    "firstName" -> firstName = reader.nextStringOrNull()
                                    "lastName" -> lastName = reader.nextStringOrNull()
                                    "username" -> username = reader.nextStringOrNull()
                                    "avatarUrl" -> avatarUrl = reader.nextStringOrNull()
                                    else -> reader.skipValue()
                                }
                            }
                            reader.endObject()
                        }
                        else -> reader.skipValue()
                    }
                }
                "status" -> status = reader.nextString()
                "completedAt" -> completedAt = reader.nextStringOrNull()
                else -> reader.skipValue()
            }
        }
        reader.endObject()

        return TaskParticipantDto(
            userId = userId,
            status = status,
            completedAt = completedAt,
            profileFirstName = firstName,
            profileLastName = lastName,
            profileUsername = username,
            profileAvatarUrl = avatarUrl
        )
    }

    private fun JsonReader.nextStringOrNull(): String? =
        when (peek()) {
            JsonReader.Token.NULL -> {
                nextNull<Unit>()
                null
            }
            JsonReader.Token.STRING -> nextString()
            else -> {
                skipValue()
                null
            }
        }
}
