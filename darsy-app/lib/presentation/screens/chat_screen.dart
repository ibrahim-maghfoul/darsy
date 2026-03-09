import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/app_colors.dart';
import '../../core/services/api_service.dart';
import '../../core/services/chat_service.dart';
import '../providers/auth_provider.dart';

// Pre-computed border radii (const) — no allocations per frame
const _radiusTL = Radius.circular(14);
const _radiusTR = Radius.circular(14);
const _radiusBLMe = Radius.circular(14);
const _radiusBRMe = Radius.circular(4);
const _radiusBLOther = Radius.circular(4);
const _radiusBROther = Radius.circular(14);

const _bubbleBorderRadiusMe = BorderRadius.only(
  topLeft: _radiusTL,
  topRight: _radiusTR,
  bottomLeft: _radiusBLMe,
  bottomRight: _radiusBRMe,
);
const _bubbleBorderRadiusOther = BorderRadius.only(
  topLeft: _radiusTL,
  topRight: _radiusTR,
  bottomLeft: _radiusBLOther,
  bottomRight: _radiusBROther,
);

const _replyBorder = Border(
  left: BorderSide(color: AppColors.primary, width: 3),
);

class ChatScreen extends ConsumerStatefulWidget {
  final String guidance;
  final String level;
  final String roomTitle;

  const ChatScreen({
    super.key,
    required this.guidance,
    required this.level,
    this.roomTitle = 'Chat Room',
  });

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  final _messageController = TextEditingController();
  final _scrollController = ScrollController();
  String? _replyToId;
  String? _replyToText;

  late final ChatService _chatNotifier;

  // Debounce loadMore so it doesn't fire on every scroll frame
  bool _isLoadMoreThrottled = false;

  @override
  void initState() {
    super.initState();
    _chatNotifier = ref.read(chatServiceProvider.notifier);
    _scrollController.addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _joinRoom();
      // Give it some time to render existing messages if any
      Future.delayed(const Duration(milliseconds: 500), _scrollToBottom);
    });
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
      // Re-scroll after next frame to ensure any late builds are caught
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_scrollController.hasClients) {
          _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
        }
      });
    }
  }

  void _onScroll() {
    if (_isLoadMoreThrottled) return;
    if (_scrollController.hasClients &&
        _scrollController.position.pixels <= 150) {
      _isLoadMoreThrottled = true;
      _chatNotifier.loadMoreMessages();
      Future.delayed(const Duration(seconds: 2), () {
        _isLoadMoreThrottled = false;
      });
    }
  }

  void _joinRoom() {
    final user = ref.read(currentUserProvider);
    if (user == null) return;
    final apiService = ref.read(apiServiceProvider);
    _chatNotifier.joinRoom(
      guidance: widget.guidance,
      level: widget.level,
      userId: user.id,
      displayName: user.displayName,
      photoURL: user.getPhotoURL(apiService.baseUrl),
      subscriptionPlan: user.subscription?.plan,
    );
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _sendMessage() {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;
    _chatNotifier.sendMessage(text, replyToId: _replyToId);
    _messageController.clear();
    _chatNotifier.emitStopTyping();
    if (_replyToId != null) {
      setState(() {
        _replyToId = null;
        _replyToText = null;
      });
    }
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);

    // Auto-scroll on initial load completion
    ref.listen(chatServiceProvider.select((s) => s.isLoading), (prev, next) {
      if (prev == true && next == false) {
        Future.delayed(const Duration(milliseconds: 200), _scrollToBottom);
      }
    });

    // Auto-scroll on new messages
    ref.listen(chatServiceProvider.select((s) => s.messages.length), (
      prev,
      next,
    ) {
      if (prev != null && next > prev) {
        if (_scrollController.hasClients) {
          final pos = _scrollController.position;
          // Auto scroll if user is near the bottom
          if (pos.pixels >= pos.maxScrollExtent - 300 || prev == 0) {
            Future.delayed(const Duration(milliseconds: 100), () {
              if (_scrollController.hasClients) {
                _scrollController.animateTo(
                  _scrollController.position.maxScrollExtent,
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeOut,
                );
              }
            });
          }
        }
      }
    });

    final isConnected = ref.watch(
      chatServiceProvider.select((s) => s.isConnected),
    );
    final onlineCount = ref.watch(
      chatServiceProvider.select((s) => s.onlineUsers.length),
    );
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.roomTitle,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
            Text(
              isConnected ? '$onlineCount متصل' : 'جاري الاتصال...',
              style: TextStyle(
                fontSize: 12,
                color: theme.colorScheme.onSurface.withOpacity(0.5),
              ),
            ),
          ],
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isConnected ? Colors.green : Colors.grey,
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: _ChatMessagesList(
              scrollController: _scrollController,
              onReply: (id, text) {
                setState(() {
                  _replyToId = id;
                  _replyToText = text;
                });
              },
            ),
          ),
          const _TypingIndicator(),
          if (_replyToText != null)
            _ReplyPreview(
              text: _replyToText!,
              onCancel: () => setState(() {
                _replyToId = null;
                _replyToText = null;
              }),
            ),
          _ChatInput(
            controller: _messageController,
            onSend: _sendMessage,
            onTypingChanged: (isTyping) {
              if (isTyping)
                _chatNotifier.emitTyping();
              else
                _chatNotifier.emitStopTyping();
            },
          ),
        ],
      ),
    );
  }
}

// ─── Messages List ───────────────────────────────────────────────────────────

class _ChatMessagesList extends ConsumerWidget {
  final ScrollController scrollController;
  final void Function(String id, String text) onReply;

  const _ChatMessagesList({
    required this.scrollController,
    required this.onReply,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final messages = ref.watch(chatServiceProvider.select((s) => s.messages));
    final isLoading = ref.watch(chatServiceProvider.select((s) => s.isLoading));
    final isLoadingMore = ref.watch(
      chatServiceProvider.select((s) => s.isLoadingMore),
    );
    final currentUserId = ref.watch(currentUserProvider.select((u) => u?.id));

    if (isLoading) return const Center(child: CircularProgressIndicator());

    if (messages.isEmpty) {
      return const Center(
        child: Text(
          'لا توجد رسائل بعد\nكن أول من يبدأ المحادثة!',
          textAlign: TextAlign.center,
        ),
      );
    }

    return ListView.builder(
      controller: scrollController,
      cacheExtent: 2000,
      addAutomaticKeepAlives:
          false, // false is faster — keeps are handled by ValueKey
      addRepaintBoundaries: true,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      itemCount: messages.length + (isLoadingMore ? 1 : 0),
      itemBuilder: (context, index) {
        if (isLoadingMore && index == 0) {
          return const Padding(
            padding: EdgeInsets.all(8),
            child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
          );
        }
        final i = isLoadingMore ? index - 1 : index;
        final msg = messages[i];
        final isMe = msg.sender.id == currentUserId;
        return _MessageBubble(
          key: ValueKey(msg.id),
          msg: msg,
          isMe: isMe,
          onReply: () => onReply(msg.id, msg.text),
          onReaction: (emoji) => ref
              .read(chatServiceProvider.notifier)
              .addReaction(messageId: msg.id, emoji: emoji),
        );
      },
    );
  }
}

// ─── Typing Indicator ────────────────────────────────────────────────────────

class _TypingIndicator extends ConsumerWidget {
  const _TypingIndicator();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final typingUsers = ref.watch(
      chatServiceProvider.select((s) => s.typingUsers),
    );
    if (typingUsers.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Text(
        typingUsers.length == 1
            ? '${typingUsers.first.displayName} يكتب...'
            : 'متعددون يكتبون...',
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: AppColors.primary.withOpacity(0.7),
        ),
      ),
    );
  }
}

// ─── Reply Preview ───────────────────────────────────────────────────────────

class _ReplyPreview extends StatelessWidget {
  final String text;
  final VoidCallback onCancel;
  const _ReplyPreview({required this.text, required this.onCancel});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: Theme.of(context).colorScheme.onSurface.withOpacity(0.04),
      child: Row(
        children: [
          Container(
            width: 3,
            height: 30,
            decoration: BoxDecoration(
              color: AppColors.primary,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 12,
                color: Theme.of(context).colorScheme.onSurface.withOpacity(0.5),
              ),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.close, size: 18),
            onPressed: onCancel,
          ),
        ],
      ),
    );
  }
}

// ─── Chat Input ───────────────────────────────────────────────────────────────

class _ChatInput extends StatelessWidget {
  final TextEditingController controller;
  final VoidCallback onSend;
  final ValueChanged<bool> onTypingChanged;

  const _ChatInput({
    required this.controller,
    required this.onSend,
    required this.onTypingChanged,
  });

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).padding.bottom;
    final bgColor = Theme.of(context).scaffoldBackgroundColor;
    final fillColor = Theme.of(context).colorScheme.onSurface.withOpacity(0.05);

    return Container(
      padding: EdgeInsets.fromLTRB(12, 8, 12, bottom + 8),
      decoration: BoxDecoration(
        color: bgColor,
        boxShadow: const [
          BoxShadow(
            color: Color(0x0D000000),
            blurRadius: 8,
            offset: Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: controller,
              maxLines: 4,
              minLines: 1,
              textInputAction: TextInputAction.send,
              onSubmitted: (_) => onSend(),
              onChanged: (t) => onTypingChanged(t.trim().isNotEmpty),
              decoration: InputDecoration(
                hintText: 'اكتب رسالة...',
                filled: true,
                fillColor: fillColor,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 10,
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Container(
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.primary,
            ),
            child: IconButton(
              icon: const Icon(
                Icons.send_rounded,
                color: Colors.white,
                size: 20,
              ),
              onPressed: onSend,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
// Pure StatelessWidget — no provider watches, no allocations of decoration
// objects in hot path. Uses top-level const BorderRadius.

class _MessageBubble extends StatefulWidget {
  final ChatMessage msg;
  final bool isMe;
  final VoidCallback onReply;
  final ValueChanged<String> onReaction;

  const _MessageBubble({
    super.key,
    required this.msg,
    required this.isMe,
    required this.onReply,
    required this.onReaction,
  });

  @override
  State<_MessageBubble> createState() => _MessageBubbleState();
}

class _MessageBubbleState extends State<_MessageBubble>
    with SingleTickerProviderStateMixin {
  double _dragOffset = 0;
  late final AnimationController _snapBack;
  late Animation<double> _snapAnimation;

  @override
  void initState() {
    super.initState();
    _snapBack = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
    _snapAnimation = Tween<double>(
      begin: 0,
      end: 0,
    ).animate(CurvedAnimation(parent: _snapBack, curve: Curves.easeOut));
    _snapBack.addListener(() {
      setState(() => _dragOffset = _snapAnimation.value);
    });
  }

  @override
  void dispose() {
    _snapBack.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textColor = widget.isMe ? Colors.white : cs.onSurface;
    final bubbleColor = widget.isMe
        ? AppColors.primary
        : cs.onSurface.withOpacity(0.06);
    final borderRadius = widget.isMe
        ? _bubbleBorderRadiusMe
        : _bubbleBorderRadiusOther;

    return GestureDetector(
      onLongPress: () => _showReactionPicker(context),
      onHorizontalDragUpdate: (details) {
        setState(() {
          _dragOffset = (_dragOffset + details.delta.dx).clamp(-60.0, 60.0);
        });
      },
      onHorizontalDragEnd: (details) {
        if (_dragOffset.abs() > 40) {
          HapticFeedback.lightImpact();
          widget.onReply();
        }
        _snapAnimation = Tween<double>(
          begin: _dragOffset,
          end: 0,
        ).animate(CurvedAnimation(parent: _snapBack, curve: Curves.easeOut));
        _snapBack.forward(from: 0);
      },
      behavior: HitTestBehavior.opaque,
      child: Transform.translate(
        offset: Offset(_dragOffset, 0),
        child: Padding(
          padding: const EdgeInsets.only(bottom: 5),
          child: Row(
            mainAxisAlignment: widget.isMe
                ? MainAxisAlignment.end
                : MainAxisAlignment.start,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              if (!widget.isMe) ...[
                _SenderAvatar(
                  name: widget.msg.sender.displayName,
                  isPremium:
                      widget.msg.sender.subscriptionPlan == 'premium' ||
                      widget.msg.sender.subscriptionPlan == 'pro',
                ),
                const SizedBox(width: 6),
              ],
              Flexible(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: bubbleColor,
                    borderRadius: borderRadius,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (!widget.isMe)
                        _SenderName(sender: widget.msg.sender, cs: cs),
                      if (widget.msg.replyTo != null)
                        _ReplyQuote(
                          text: widget.msg.replyTo!.text,
                          isMe: widget.isMe,
                          cs: cs,
                        ),
                      Text(widget.msg.text, style: TextStyle(color: textColor)),
                      const SizedBox(height: 2),
                      _MessageMeta(
                        msg: widget.msg,
                        isMe: widget.isMe,
                        textColor: textColor,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showReactionPicker(BuildContext context) {
    HapticFeedback.mediumImpact();
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        height: 70,
        margin: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(35),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: ['👍', '❤️', '😂', '😮', '😢', '🔥']
              .map(
                (e) => GestureDetector(
                  onTap: () {
                    HapticFeedback.lightImpact();
                    widget.onReaction(e);
                    Navigator.pop(context);
                  },
                  child: Text(e, style: const TextStyle(fontSize: 28)),
                ),
              )
              .toList(),
        ),
      ),
    );
  }
}

// ─── Sub-widgets extracted for build-method isolation ────────────────────────

class _SenderAvatar extends StatelessWidget {
  final String name;
  final bool isPremium;
  const _SenderAvatar({required this.name, this.isPremium = false});

  @override
  Widget build(BuildContext context) {
    Widget avatar = CircleAvatar(
      radius: 14,
      backgroundColor: const Color(
        0x26009688,
      ), // AppColors.primary at 15% opacity, const
      child: Text(
        name.isNotEmpty ? name[0].toUpperCase() : '?',
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.bold,
          color: AppColors.primary,
        ),
      ),
    );

    if (!isPremium) return avatar;

    return Stack(
      clipBehavior: Clip.none,
      children: [
        avatar,
        Positioned(
          top: -2,
          right: -2,
          child: Container(
            padding: const EdgeInsets.all(2),
            decoration: const BoxDecoration(
              color: Colors.amber,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black26,
                  blurRadius: 2,
                  offset: Offset(0, 1),
                ),
              ],
            ),
            child: const Icon(
              Icons.workspace_premium_rounded,
              size: 8,
              color: Colors.white,
            ),
          ),
        ),
      ],
    );
  }
}

class _SenderName extends StatelessWidget {
  final ChatSender sender;
  final ColorScheme cs;
  const _SenderName({required this.sender, required this.cs});

  @override
  Widget build(BuildContext context) {
    final isAdmin = sender.role == 'admin';
    return Text(
      isAdmin ? 'Darsy Team' : sender.displayName,
      style: TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w600,
        color: isAdmin ? AppColors.primary : cs.onSurface.withOpacity(0.7),
      ),
    );
  }
}

class _ReplyQuote extends StatelessWidget {
  final String text;
  final bool isMe;
  final ColorScheme cs;
  const _ReplyQuote({required this.text, required this.isMe, required this.cs});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: (isMe ? Colors.white : AppColors.primary).withOpacity(0.1),
        borderRadius: const BorderRadius.all(Radius.circular(6)),
        border: _replyBorder,
      ),
      child: Text(
        text,
        maxLines: 2,
        overflow: TextOverflow.ellipsis,
        style: TextStyle(
          fontSize: 11,
          color: isMe ? Colors.white70 : cs.onSurface.withOpacity(0.5),
        ),
      ),
    );
  }
}

class _MessageMeta extends StatelessWidget {
  final ChatMessage msg;
  final bool isMe;
  final Color textColor;
  const _MessageMeta({
    required this.msg,
    required this.isMe,
    required this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    final timeStr =
        '${msg.createdAt.hour.toString().padLeft(2, '0')}:${msg.createdAt.minute.toString().padLeft(2, '0')}';
    final metaColor = isMe ? Colors.white54 : textColor.withOpacity(0.35);

    // Group reactions once
    Map<String, int>? reactionGroups;
    if (msg.reactions.isNotEmpty) {
      reactionGroups = {};
      for (final r in msg.reactions) {
        reactionGroups[r.emoji] = (reactionGroups[r.emoji] ?? 0) + 1;
      }
    }

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(timeStr, style: TextStyle(fontSize: 10, color: metaColor)),
        if (reactionGroups != null) ...[
          const SizedBox(width: 6),
          for (final e in reactionGroups.entries)
            Padding(
              padding: const EdgeInsets.only(left: 2),
              child: Text(
                e.value > 1 ? '${e.key}${e.value}' : e.key,
                style: const TextStyle(fontSize: 11),
              ),
            ),
        ],
      ],
    );
  }
}

// ─── ChatSender extension ────────────────────────────────────────────────────

extension ChatSenderExt on ChatSender {
  String getPhotoUrl(String baseUrl) {
    if (photoURL == null || photoURL!.isEmpty) return '';
    if (photoURL!.startsWith('http')) return photoURL!;
    final cleanBase = baseUrl.endsWith('/')
        ? baseUrl.substring(0, baseUrl.length - 1)
        : baseUrl;
    if (!photoURL!.contains('/'))
      return '$cleanBase/data/images/profile-picture/$photoURL';
    return photoURL!.startsWith('/')
        ? '$cleanBase$photoURL'
        : '$cleanBase/$photoURL';
  }
}
