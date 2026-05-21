package com.continuum.android.feature.notifications.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.continuum.android.core.network.SocketManager
import com.continuum.android.feature.notifications.data.repository.NotificationsRepository
import com.continuum.android.feature.notifications.domain.Notification
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class NotificationsUiState(
    val items: List<Notification> = emptyList(),
    val isLoading: Boolean = false,
    val nextCursor: String? = null,
    val unreadCount: Int = 0,
    val isMarkingAllRead: Boolean = false
)

@HiltViewModel
class NotificationsViewModel @Inject constructor(
    private val repository: NotificationsRepository,
    private val socketManager: SocketManager
) : ViewModel() {

    private val _state = MutableStateFlow(NotificationsUiState())
    val state: StateFlow<NotificationsUiState> = _state.asStateFlow()

    init {
        loadUnreadCount()
        subscribeToSocket()
    }

    private fun subscribeToSocket() {
        viewModelScope.launch {
            socketManager.newNotificationFlow.collect { raw ->
                val unread = Regex(""""unreadCount"\s*:\s*(\d+)""")
                    .find(raw)?.groupValues?.getOrNull(1)?.toIntOrNull() ?: -1
                if (unread >= 0) {
                    _state.update { it.copy(unreadCount = unread) }
                }
            }
        }
    }

    fun loadUnreadCount() {
        viewModelScope.launch {
            repository.getNotifications(cursor = null)
                .onSuccess { (_, _, unread) ->
                    _state.update { it.copy(unreadCount = unread) }
                }
        }
    }

    fun loadNotifications() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            repository.getNotifications(cursor = null)
                .onSuccess { (items, cursor, unread) ->
                    _state.update {
                        it.copy(
                            items = items,
                            nextCursor = cursor,
                            unreadCount = unread,
                            isLoading = false
                        )
                    }
                }
                .onFailure { _state.update { it.copy(isLoading = false) } }
        }
    }

    fun loadMore() {
        val cursor = _state.value.nextCursor ?: return
        viewModelScope.launch {
            repository.getNotifications(cursor = cursor)
                .onSuccess { (newItems, newCursor, _) ->
                    _state.update {
                        it.copy(
                            items = it.items + newItems,
                            nextCursor = newCursor
                        )
                    }
                }
        }
    }

    fun markAllRead() {
        viewModelScope.launch {
            _state.update { it.copy(isMarkingAllRead = true) }
            repository.markAllRead()
                .onSuccess {
                    _state.update { s ->
                        s.copy(
                            items = s.items.map { it.copy(read = true) },
                            unreadCount = 0,
                            isMarkingAllRead = false
                        )
                    }
                }
                .onFailure { _state.update { it.copy(isMarkingAllRead = false) } }
        }
    }

    fun markOneRead(id: String) {
        viewModelScope.launch {
            repository.markOneRead(id)
                .onSuccess {
                    _state.update { s ->
                        val wasUnread = s.items.find { it.id == id }?.read == false
                        s.copy(
                            items = s.items.map { if (it.id == id) it.copy(read = true) else it },
                            unreadCount = if (wasUnread) maxOf(0, s.unreadCount - 1) else s.unreadCount
                        )
                    }
                }
        }
    }

    fun deleteNotification(id: String) {
        viewModelScope.launch {
            repository.deleteNotification(id)
                .onSuccess {
                    _state.update { s ->
                        val removed = s.items.find { it.id == id }
                        s.copy(
                            items = s.items.filter { it.id != id },
                            unreadCount = if (removed?.read == false) maxOf(0, s.unreadCount - 1) else s.unreadCount
                        )
                    }
                }
        }
    }
}
