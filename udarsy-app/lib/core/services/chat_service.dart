import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'api_service.dart';

class ChatReaction {
  final String emoji;
  final String userId;

  ChatReaction({required this.emoji, required this.userId});

  factory ChatReaction.fromJson(Map<String, dynamic> json) {
    return ChatReaction(
      emoji: json['emoji']?.toString() ?? '',
      userId: json['userId']?.toString() ?? '',
    );
  }
}

/// Chat message model
class ChatMessage {
  final String id;
  final String chatRoomId;
  final ChatSender sender;
  final String text;
  final ChatMessage? replyTo;
  final List<ChatReaction> reactions;
  final DateTime createdAt;

  ChatMessage({
    required this.id,
    required this.chatRoomId,
    required this.sender,
    required this.text,
    this.replyTo,
    this.reactions = const [],
    required this.createdAt,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['_id']?.toString() ?? json['id'] ?? '',
      chatRoomId: json['chatRoomId']?.toString() ?? '',
      sender: ChatSender.fromJson(
        json['sender'] is Map ? json['sender'] : {'_id': json['sender']},
      ),
      text: json['text'] ?? '',
      replyTo: json['replyTo'] != null && json['replyTo'] is Map
          ? ChatMessage.fromJson(json['replyTo'])
          : null,
      reactions:
          (json['reactions'] as List?)
              ?.map((r) => ChatReaction.fromJson(r))
              .toList() ??
          [],
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
    );
  }

  ChatMessage copyWith({List<ChatReaction>? reactions}) {
    return ChatMessage(
      id: id,
      chatRoomId: chatRoomId,
      sender: sender,
      text: text,
      replyTo: replyTo,
      reactions: reactions ?? this.reactions,
      createdAt: createdAt,
    );
  }
}

class ChatSender {
  final String id;
  final String displayName;
  final String? photoURL;
  final String? role;
  final String? subscriptionPlan;

  ChatSender({
    required this.id,
    required this.displayName,
    this.photoURL,
    this.role,
    this.subscriptionPlan,
  });

  factory ChatSender.fromJson(Map<String, dynamic> json) {
    return ChatSender(
      id: json['_id']?.toString() ?? json['id'] ?? '',
      displayName: json['displayName'] ?? 'User',
      photoURL: json['photoURL'],
      role: json['role']?.toString(),
      subscriptionPlan:
          json['subscription']?['plan']?.toString() ??
          json['subscriptionPlan']?.toString(),
    );
  }
}

/// Online user in a chat room
class OnlineUser {
  final String id;
  final String displayName;
  final String? photoURL;
  final String? subscriptionPlan;

  OnlineUser({
    required this.id,
    required this.displayName,
    this.photoURL,
    this.subscriptionPlan,
  });

  factory OnlineUser.fromJson(Map<String, dynamic> json) {
    return OnlineUser(
      id: json['_id']?.toString() ?? json['id'] ?? json['userId'] ?? '',
      displayName: json['displayName'] ?? 'User',
      photoURL: json['photoURL'],
      subscriptionPlan:
          json['subscription']?['plan']?.toString() ??
          json['subscriptionPlan']?.toString(),
    );
  }
}

/// Chat state
class ChatState {
  final List<ChatMessage> messages;
  final List<OnlineUser> onlineUsers;
  final bool isConnected;
  final bool isLoading;
  final String? error;
  final List<OnlineUser> typingUsers;
  final int unreadCount;
  final bool isLoadingMore;

  const ChatState({
    this.messages = const [],
    this.onlineUsers = const [],
    this.isConnected = false,
    this.isLoading = false,
    this.error,
    this.typingUsers = const [],
    this.unreadCount = 0,
    this.isLoadingMore = false,
  });

  ChatState copyWith({
    List<ChatMessage>? messages,
    List<OnlineUser>? onlineUsers,
    bool? isConnected,
    bool? isLoading,
    String? error,
    List<OnlineUser>? typingUsers,
    int? unreadCount,
    bool? isLoadingMore,
  }) {
    return ChatState(
      messages: messages ?? this.messages,
      onlineUsers: onlineUsers ?? this.onlineUsers,
      isConnected: isConnected ?? this.isConnected,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      typingUsers: typingUsers ?? this.typingUsers,
      unreadCount: unreadCount ?? this.unreadCount,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
    );
  }
}

class ChatService extends Notifier<ChatState> {
  late final ApiService _api;
  io.Socket? _socket;
  String? _guidance;
  String? _level;
  String? _userId;
  String? _displayName;
  String? _photoURL;

  @override
  ChatState build() {
    _api = ref.watch(apiServiceProvider);

    // Cleanup on dispose
    ref.onDispose(() {
      leaveRoom();
    });

    return const ChatState();
  }

  /// Connect to socket server and join a room
  Future<void> joinRoom({
    required String guidance,
    required String level,
    required String userId,
    required String displayName,
    String? photoURL,
    String? subscriptionPlan,
    int limit = 20,
  }) async {
    // Leave previous room if any
    leaveRoom();

    state = state.copyWith(isLoading: true, error: null, unreadCount: 0);
    _guidance = guidance;
    _level = level;
    _userId = userId;
    _displayName = displayName;
    _photoURL = photoURL;

    try {
      debugPrint('📩 Loading chat history for $guidance - $level');
      // Load chat history first
      final response = await _api.get(
        '/chat/history',
        queryParameters: {'guidance': guidance, 'level': level, 'limit': limit},
      );

      final List data = response.data;
      final messages = data.map((json) => ChatMessage.fromJson(json)).toList();
      state = state.copyWith(messages: messages);

      // Connect socket
      final baseUrl = _api.baseUrl;
      final token = _api.token;

      _socket = io.io(
        baseUrl,
        io.OptionBuilder()
            .setTransports(['websocket', 'polling'])
            .setExtraHeaders({
              if (token != null) 'Authorization': 'Bearer $token',
            })
            .enableAutoConnect()
            .build(),
      );

      _socket!.onConnect((_) {
        debugPrint('🔌 Socket connected');
        _safeStateUpdate(() {
          state = state.copyWith(isConnected: true, isLoading: false);
        });

        // Join the room
        _socket!.emit('join_room', {
          'guidance': guidance,
          'level': level,
          'userId': userId,
          'displayName': displayName,
          'photoURL': photoURL,
          'subscriptionPlan': subscriptionPlan,
        });
      });

      _socket!.on('receive_message', (data) {
        final message = ChatMessage.fromJson(data);
        _safeStateUpdate(() {
          // Deduplicate
          if (state.messages.any((m) => m.id == message.id)) return;

          final newUnread = (message.sender.id != _userId)
              ? state.unreadCount + 1
              : state.unreadCount;
          state = state.copyWith(
            messages: [...state.messages, message],
            unreadCount: newUnread,
          );
        });
      });

      _socket!.on('room_users', (data) {
        final users = (data as List)
            .map((u) => OnlineUser.fromJson(u as Map<String, dynamic>))
            .toList();
        _safeStateUpdate(() {
          state = state.copyWith(onlineUsers: users);
        });
      });

      _socket!.on('user_typing', (data) {
        final user = OnlineUser.fromJson(data as Map<String, dynamic>);
        if (user.id.isNotEmpty && user.id != _userId) {
          _safeStateUpdate(() {
            final exists = state.typingUsers.any((u) => u.id == user.id);
            if (!exists) {
              state = state.copyWith(typingUsers: [...state.typingUsers, user]);
            }
          });
        }
      });

      _socket!.on('user_stopped_typing', (data) {
        final userId = data['userId']?.toString() ?? '';
        _safeStateUpdate(() {
          state = state.copyWith(
            typingUsers: state.typingUsers
                .where((u) => u.id != userId)
                .toList(),
          );
        });
      });

      _socket!.onDisconnect((_) {
        debugPrint('🔌 Socket disconnected');
        _safeStateUpdate(() {
          state = state.copyWith(isConnected: false);
        });
      });

      _socket!.onError((err) {
        debugPrint('❌ Socket error: $err');
        _safeStateUpdate(() {
          state = state.copyWith(error: 'Connection error');
        });
      });

      _socket!.on('message_reaction', (data) {
        final messageId = data['messageId']?.toString() ?? '';
        _safeStateUpdate(() {
          final messages = state.messages.map((m) {
            if (m.id == messageId) {
              if (data['allReactions'] != null) {
                final newReactions = (data['allReactions'] as List)
                    .map((r) => ChatReaction.fromJson(r))
                    .toList();
                return m.copyWith(reactions: newReactions);
              }
            }
            return m;
          }).toList();
          state = state.copyWith(messages: messages);
        });
      });

      _socket!.connect();
    } catch (e) {
      debugPrint('Error joining chat room: $e');
      _safeStateUpdate(() {
        state = state.copyWith(isLoading: false, error: 'Failed to load chat');
      });
    }
  }

  /// Send a message
  void sendMessage(String text, {String? replyToId}) {
    if (_socket == null ||
        !state.isConnected ||
        _guidance == null ||
        _level == null)
      return;

    _socket!.emit('send_message', {
      'guidance': _guidance,
      'level': _level,
      'sender': _userId,
      'text': text,
      if (replyToId != null) 'replyTo': replyToId,
    });
  }

  /// Load more messages for pagination
  Future<void> loadMoreMessages() async {
    if (_guidance == null ||
        _level == null ||
        state.messages.isEmpty ||
        state.isLoadingMore)
      return;

    state = state.copyWith(isLoadingMore: true);

    try {
      final lastMessageId = state.messages.first.id;
      final response = await _api.get(
        '/chat/history',
        queryParameters: {
          'guidance': _guidance,
          'level': _level,
          'before': lastMessageId,
          'limit': 20,
        },
      );

      final List data = response.data;
      final olderMessages = data
          .map((json) => ChatMessage.fromJson(json))
          .toList();

      if (olderMessages.isNotEmpty) {
        _safeStateUpdate(() {
          // Deduplicate
          final existingIds = state.messages.map((m) => m.id).toSet();
          final uniqueOlder = olderMessages
              .where((m) => !existingIds.contains(m.id))
              .toList();

          state = state.copyWith(
            messages: [...uniqueOlder, ...state.messages],
            isLoadingMore: false,
          );
        });
      } else {
        state = state.copyWith(isLoadingMore: false);
      }
    } catch (e) {
      debugPrint('Error loading more messages: $e');
      state = state.copyWith(isLoadingMore: false);
    }
  }

  /// Reset unread count
  void resetUnread() {
    state = state.copyWith(unreadCount: 0);
  }

  /// Add a reaction to a message
  void addReaction({required String messageId, required String emoji}) {
    if (_socket == null || !state.isConnected || _userId == null) return;

    // Optimistic local update – show reaction immediately
    final updatedMessages = state.messages.map((m) {
      if (m.id == messageId) {
        final newReactions = [
          ...m.reactions,
          ChatReaction(emoji: emoji, userId: _userId!),
        ];
        return m.copyWith(reactions: newReactions);
      }
      return m;
    }).toList();
    state = state.copyWith(messages: updatedMessages);

    // Matching website event name "reaction" instead of "add_reaction"
    _socket!.emit('reaction', {
      'messageId': messageId,
      'emoji': emoji,
      'userId': _userId,
      'guidance': _guidance,
      'level': _level,
    });
  }

  /// Emit typing events
  void emitTyping() {
    if (_socket == null ||
        !state.isConnected ||
        _guidance == null ||
        _level == null)
      return;
    _socket!.emit('typing_start', {
      'guidance': _guidance,
      'level': _level,
      'userId': _userId,
      'displayName': _displayName,
      'photoURL': _photoURL,
    });
  }

  /// Emit stop typing event
  void emitStopTyping() {
    if (_socket == null ||
        !state.isConnected ||
        _guidance == null ||
        _level == null)
      return;
    _socket!.emit('typing_end', {
      'guidance': _guidance,
      'level': _level,
      'userId': _userId,
    });
  }

  /// Report a message
  Future<void> reportMessage({
    required String reportedUserId,
    required String reason,
    required String details,
    String? messageId,
  }) async {
    try {
      await _api.post(
        '/chat/report',
        data: {
          'reportedUserId': reportedUserId,
          'reason': reason,
          'details': details,
          if (messageId != null) 'messageId': messageId,
        },
      );
    } catch (e) {
      debugPrint('Error reporting message: $e');
      rethrow;
    }
  }

  /// Helper to safely update state across async gaps or disposal
  void _safeStateUpdate(VoidCallback update) {
    // In Riverpod 2.x Notifier, there isn't a simple 'mounted' check
    // but we can catch errors if the provider is already disposed.
    try {
      update();
    } catch (e) {
      debugPrint('Skipping state update: $e');
    }
  }

  /// Leave room and disconnect
  void leaveRoom() {
    if (_socket != null) {
      if (_guidance != null && _level != null) {
        _socket!.emit('leave_room', {'guidance': _guidance, 'level': _level});
      }
      _socket!.disconnect();
      _socket!.dispose();
      _socket = null;
    }
    _guidance = null;
    _level = null;
    _userId = null;

    // Reset state asynchronously to avoid "modify during build/dispose" error
    Future.microtask(() {
      _safeStateUpdate(() {
        state = const ChatState();
      });
    });
  }
}

// Provider
final chatServiceProvider =
    NotifierProvider.autoDispose<ChatService, ChatState>(ChatService.new);
