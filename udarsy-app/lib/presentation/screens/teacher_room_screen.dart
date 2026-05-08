import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../../core/app_colors.dart';
import '../../core/services/api_service.dart';
import '../providers/auth_provider.dart';

const _kTeacherTabLabel = 'الأستاذ';

// ─── Models ───────────────────────────────────────────────────────────────────

class _TRoomMessage {
  final String id;
  final String text;
  final String senderId;
  final String senderName;
  final String? senderPhoto;
  final String senderRole;
  final String messageType; // text | file | link
  final String? fileUrl;
  final String? fileName;
  final int? fileSize;
  final String? linkUrl;
  final String? linkTitle;
  final DateTime createdAt;

  bool get isTeacher => senderRole == 'teacher' || senderRole == 'instructor' || senderRole == 'admin';

  _TRoomMessage({
    required this.id,
    required this.text,
    required this.senderId,
    required this.senderName,
    this.senderPhoto,
    required this.senderRole,
    required this.messageType,
    this.fileUrl,
    this.fileName,
    this.fileSize,
    this.linkUrl,
    this.linkTitle,
    required this.createdAt,
  });

  factory _TRoomMessage.fromJson(Map<String, dynamic> j) {
    final sender = j['sender'] is Map ? j['sender'] as Map : <String, dynamic>{};
    return _TRoomMessage(
      id:          j['_id']?.toString() ?? '',
      text:        j['text']?.toString() ?? '',
      senderId:    sender['_id']?.toString() ?? '',
      senderName:  sender['displayName']?.toString() ?? 'User',
      senderPhoto: sender['photoURL']?.toString(),
      senderRole:  sender['role']?.toString() ?? 'user',
      messageType: j['messageType']?.toString() ?? 'text',
      fileUrl:     j['fileUrl']?.toString(),
      fileName:    j['fileName']?.toString(),
      fileSize:    (j['fileSize'] as num?)?.toInt(),
      linkUrl:     j['linkUrl']?.toString(),
      linkTitle:   j['linkTitle']?.toString(),
      createdAt:   DateTime.tryParse(j['createdAt']?.toString() ?? '') ?? DateTime.now(),
    );
  }
}

class _JoinRequest {
  final String userId;
  final String displayName;
  final String? photoURL;
  final String status;

  _JoinRequest({
    required this.userId,
    required this.displayName,
    this.photoURL,
    required this.status,
  });

  factory _JoinRequest.fromJson(Map<String, dynamic> j) => _JoinRequest(
        userId:      j['userId']?.toString() ?? '',
        displayName: j['displayName']?.toString() ?? 'Student',
        photoURL:    j['photoURL']?.toString(),
        status:      j['status']?.toString() ?? 'pending',
      );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

class TeacherRoomScreen extends ConsumerStatefulWidget {
  final String roomId;
  final String roomName;

  const TeacherRoomScreen({
    super.key,
    required this.roomId,
    required this.roomName,
  });

  @override
  ConsumerState<TeacherRoomScreen> createState() => _TeacherRoomScreenState();
}

class _TeacherRoomScreenState extends ConsumerState<TeacherRoomScreen>
    with SingleTickerProviderStateMixin {

  late final TabController _tabs;
  final _msgCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();

  io.Socket? _socket;
  final List<_TRoomMessage> _messages = [];
  final List<_JoinRequest> _joinRequests = [];
  bool _loading = true;
  bool _isConnected = false;
  bool _isTeacher = false;
  String? _myUserId;

  String? _linkUrl;
  String? _linkTitle;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) => _init());
  }

  Future<void> _init() async {
    final user = ref.read(currentUserProvider);
    _myUserId = user?.id;
    _isTeacher = user?.role == 'teacher' || user?.role == 'instructor' || user?.role == 'admin';
    await _loadHistory();
    if (_isTeacher) await _loadJoinRequests();
    _connectSocket();
  }

  Future<void> _loadHistory() async {
    try {
      final api = ref.read(apiServiceProvider);
      final res = await api.get('/teacher/rooms/${widget.roomId}/messages');
      final List data = res.data is List ? res.data : [];
      setState(() {
        _messages.addAll(data.map((j) => _TRoomMessage.fromJson(j)));
        _loading = false;
      });
      _scrollToBottom();
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _loadJoinRequests() async {
    try {
      final api = ref.read(apiServiceProvider);
      final res = await api.get('/teacher/rooms/${widget.roomId}/requests');
      final List data = res.data is List ? res.data : [];
      setState(() {
        _joinRequests
          ..clear()
          ..addAll(data.map((j) => _JoinRequest.fromJson(j)));
      });
    } catch (_) {}
  }

  void _connectSocket() {
    final api = ref.read(apiServiceProvider);
    final user = ref.read(currentUserProvider);
    if (user == null) return;

    _socket = io.io(
      api.baseUrl,
      io.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .setExtraHeaders({'Authorization': 'Bearer ${api.token}'})
          .enableAutoConnect()
          .build(),
    );

    _socket!.onConnect((_) {
      setState(() => _isConnected = true);
      _socket!.emit('join_teacher_room', {
        'roomId': widget.roomId,
        'userId': user.id,
        'displayName': user.displayName,
        'isTeacher': _isTeacher,
      });
    });

    _socket!.on('receive_teacher_message', (data) {
      final msg = _TRoomMessage.fromJson(data as Map<String, dynamic>);
      setState(() => _messages.add(msg));
      _scrollToBottom();
    });

    _socket!.onDisconnect((_) => setState(() => _isConnected = false));
    _socket!.connect();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(_scrollCtrl.position.maxScrollExtent,
            duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
      }
    });
  }

  void _sendTextMessage() {
    final text = _msgCtrl.text.trim();
    if (text.isEmpty) return;

    _socket?.emit('send_teacher_message', {
      'roomId': widget.roomId,
      'sender': _myUserId,
      'isTeacher': _isTeacher,
      'text': text,
      'messageType': 'text',
    });
    _msgCtrl.clear();
  }

  void _sendLink() async {
    await showDialog(
      context: context,
      builder: (_) => _LinkDialog(
        onSend: (url, title) {
          _socket?.emit('send_teacher_message', {
            'roomId': widget.roomId,
            'sender': _myUserId,
            'isTeacher': true,
            'messageType': 'link',
            'linkUrl': url,
            'linkTitle': title,
          });
        },
      ),
    );
  }

  Future<void> _reviewRequest(String userId, String action) async {
    try {
      final api = ref.read(apiServiceProvider);
      await api.patch('/teacher/rooms/${widget.roomId}/requests/$userId', data: {'action': action});
      await _loadJoinRequests();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(action == 'accept' ? 'Student accepted ✓' : 'Request rejected')),
        );
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _socket?.disconnect();
    _socket?.dispose();
    _msgCtrl.dispose();
    _scrollCtrl.dispose();
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final pendingCount = _joinRequests.where((r) => r.status == 'pending').length;

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.roomName, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            Text(
              _isConnected ? 'متصل' : 'جاري الاتصال...',
              style: TextStyle(fontSize: 11, color: Theme.of(context).colorScheme.onSurface.withOpacity(0.5)),
            ),
          ],
        ),
        actions: [
          Container(
            width: 8, height: 8,
            margin: const EdgeInsets.only(right: 16),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: _isConnected ? Colors.green : Colors.grey,
            ),
          ),
        ],
        bottom: TabBar(
          controller: _tabs,
          indicatorColor: AppColors.primary,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textGrey,
          tabs: [
            const Tab(icon: Icon(Icons.group_rounded), text: 'الكل'),
            Tab(
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: const [
                      Icon(Icons.verified_user_rounded),
                      SizedBox(width: 4),
                      Text(_isTeacherLabel),
                    ],
                  ),
                  if (_isTeacher && pendingCount > 0)
                    Positioned(
                      top: -4, right: -12,
                      child: Container(
                        padding: const EdgeInsets.all(3),
                        decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                        child: Text('$pendingCount', style: const TextStyle(color: Colors.white, fontSize: 9)),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabs,
        children: [
          // ── Tab 1: All students chat ──
          Column(
            children: [
              Expanded(child: _loading
                  ? const Center(child: CircularProgressIndicator())
                  : _buildMessageList()),
              _buildInput(),
            ],
          ),
          // ── Tab 2: Teacher panel / My teacher ──
          _isTeacher
              ? _buildTeacherPanel()
              : _buildMyTeacherView(),
        ],
      ),
    );
  }

  static const _isTeacherLabel = 'الأستاذ';

  Widget _buildMessageList() {
    if (_messages.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.chat_bubble_outline, size: 56, color: AppColors.primary.withOpacity(0.3)),
            const SizedBox(height: 12),
            const Text('لا توجد رسائل بعد', style: TextStyle(color: AppColors.textGrey)),
          ],
        ),
      );
    }
    return ListView.builder(
      controller: _scrollCtrl,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      itemCount: _messages.length,
      itemBuilder: (ctx, i) {
        final msg = _messages[i];
        final isMe = msg.senderId == _myUserId;
        return _MessageBubble(msg: msg, isMe: isMe, baseUrl: ref.read(apiServiceProvider).baseUrl)
            .animate().fadeIn(delay: (i * 20).ms);
      },
    );
  }

  Widget _buildInput() {
    final bottom = MediaQuery.of(context).padding.bottom;
    return Container(
      padding: EdgeInsets.fromLTRB(12, 8, 12, bottom + 8),
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        boxShadow: const [BoxShadow(color: Color(0x0D000000), blurRadius: 8, offset: Offset(0, -2))],
      ),
      child: Row(
        children: [
          if (_isTeacher) ...[
            IconButton(
              icon: const Icon(Icons.link_rounded, color: AppColors.primary),
              onPressed: _sendLink,
              tooltip: 'Share link',
            ),
          ],
          Expanded(
            child: TextField(
              controller: _msgCtrl,
              maxLines: 4, minLines: 1,
              textInputAction: TextInputAction.send,
              onSubmitted: (_) => _sendTextMessage(),
              decoration: InputDecoration(
                hintText: 'اكتب رسالة...',
                filled: true,
                fillColor: Theme.of(context).colorScheme.onSurface.withOpacity(0.05),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Container(
            decoration: const BoxDecoration(shape: BoxShape.circle, color: AppColors.primary),
            child: IconButton(
              icon: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
              onPressed: _sendTextMessage,
            ),
          ),
        ],
      ),
    );
  }

  // Teacher sees join requests
  Widget _buildTeacherPanel() {
    final pending = _joinRequests.where((r) => r.status == 'pending').toList();
    final accepted = _joinRequests.where((r) => r.status == 'accepted').toList();

    return RefreshIndicator(
      onRefresh: _loadJoinRequests,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (pending.isNotEmpty) ...[
            _sectionHeader('طلبات الانضمام (${pending.length})', Icons.pending_actions_rounded, Colors.orange),
            ...pending.map((r) => _JoinRequestCard(
              request: r,
              onAccept: () => _reviewRequest(r.userId, 'accept'),
              onReject: () => _reviewRequest(r.userId, 'reject'),
            )),
            const Divider(height: 24),
          ],
          _sectionHeader('الطلاب المقبولين (${accepted.length})', Icons.check_circle_rounded, AppColors.primary),
          if (accepted.isEmpty)
            const Padding(
              padding: EdgeInsets.all(24),
              child: Center(child: Text('لم يُقبل أي طالب بعد', style: TextStyle(color: AppColors.textGrey))),
            )
          else
            ...accepted.map((r) => _AcceptedStudentTile(request: r)),
        ],
      ),
    );
  }

  // Student sees who the teacher is
  Widget _buildMyTeacherView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.08),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.school_rounded, size: 56, color: AppColors.primary),
            ),
            const SizedBox(height: 16),
            const Text('غرفة الأستاذ', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            const Text(
              'هذه الغرفة أنشأها أستاذك. يمكنه مشاركة الملفات والروابط معك.\nشارك في المحادثة من التبويب الأول.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.textGrey, height: 1.5),
            ),
          ],
        ),
      ),
    );
  }

  Widget _sectionHeader(String title, IconData icon, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 8),
          Text(title, style: TextStyle(fontWeight: FontWeight.bold, color: color, fontSize: 15)),
        ],
      ),
    );
  }
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

class _MessageBubble extends StatelessWidget {
  final _TRoomMessage msg;
  final bool isMe;
  final String baseUrl;
  const _MessageBubble({required this.msg, required this.isMe, required this.baseUrl});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        mainAxisAlignment: isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isMe) ...[
            CircleAvatar(
              radius: 14,
              backgroundColor: msg.isTeacher ? AppColors.primary.withOpacity(0.15) : Colors.grey.withOpacity(0.15),
              child: Text(
                msg.senderName.isNotEmpty ? msg.senderName[0].toUpperCase() : '?',
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold,
                    color: msg.isTeacher ? AppColors.primary : AppColors.textGrey),
              ),
            ),
            const SizedBox(width: 6),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: isMe ? AppColors.primary : Theme.of(context).colorScheme.onSurface.withOpacity(0.06),
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(14),
                  topRight: const Radius.circular(14),
                  bottomLeft: Radius.circular(isMe ? 14 : 4),
                  bottomRight: Radius.circular(isMe ? 4 : 14),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (!isMe)
                    Text(
                      msg.isTeacher ? '${msg.senderName} 👨‍🏫' : msg.senderName,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: msg.isTeacher ? AppColors.primary : Colors.grey,
                      ),
                    ),
                  if (msg.messageType == 'link') _buildLinkCard() else _buildTextContent(isMe),
                  const SizedBox(height: 2),
                  Text(
                    '${msg.createdAt.hour.toString().padLeft(2, '0')}:${msg.createdAt.minute.toString().padLeft(2, '0')}',
                    style: TextStyle(fontSize: 9, color: isMe ? Colors.white54 : Colors.grey),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTextContent(bool isMe) {
    return Text(msg.text, style: TextStyle(color: isMe ? Colors.white : null));
  }

  Widget _buildLinkCard() {
    return GestureDetector(
      onTap: () {/* launch URL */},
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.15),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.white.withOpacity(0.3)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.link_rounded, size: 16, color: Colors.white),
            const SizedBox(width: 6),
            Flexible(child: Text(msg.linkTitle ?? msg.linkUrl ?? '',
                style: const TextStyle(color: Colors.white, decoration: TextDecoration.underline, fontSize: 13))),
          ],
        ),
      ),
    );
  }
}

// ─── Join Request Card ────────────────────────────────────────────────────────

class _JoinRequestCard extends StatelessWidget {
  final _JoinRequest request;
  final VoidCallback onAccept;
  final VoidCallback onReject;
  const _JoinRequestCard({required this.request, required this.onAccept, required this.onReject});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.orange.withOpacity(0.05),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.orange.withOpacity(0.2)),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 20,
            backgroundColor: Colors.orange.withOpacity(0.15),
            child: Text(request.displayName[0].toUpperCase(),
                style: const TextStyle(color: Colors.orange, fontWeight: FontWeight.bold)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(request.displayName,
                style: const TextStyle(fontWeight: FontWeight.w600)),
          ),
          TextButton(
            onPressed: onReject,
            style: TextButton.styleFrom(foregroundColor: Colors.red, padding: EdgeInsets.zero),
            child: const Text('رفض'),
          ),
          const SizedBox(width: 4),
          ElevatedButton(
            onPressed: onAccept,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 12),
            ),
            child: const Text('قبول'),
          ),
        ],
      ),
    ).animate().fadeIn().slideX(begin: 0.05);
  }
}

class _AcceptedStudentTile extends StatelessWidget {
  final _JoinRequest request;
  const _AcceptedStudentTile({required this.request});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: CircleAvatar(
        backgroundColor: AppColors.primary.withOpacity(0.12),
        child: Text(request.displayName[0].toUpperCase(),
            style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
      ),
      title: Text(request.displayName, style: const TextStyle(fontWeight: FontWeight.w500)),
      trailing: const Icon(Icons.check_circle_rounded, color: AppColors.primary, size: 18),
    );
  }
}

// ─── Link Dialog ─────────────────────────────────────────────────────────────

class _LinkDialog extends StatefulWidget {
  final void Function(String url, String title) onSend;
  const _LinkDialog({required this.onSend});

  @override
  State<_LinkDialog> createState() => _LinkDialogState();
}

class _LinkDialogState extends State<_LinkDialog> {
  final _urlCtrl = TextEditingController();
  final _titleCtrl = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Share Link'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(controller: _urlCtrl, decoration: const InputDecoration(labelText: 'URL', hintText: 'https://')),
          const SizedBox(height: 12),
          TextField(controller: _titleCtrl, decoration: const InputDecoration(labelText: 'Title (optional)')),
        ],
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        ElevatedButton(
          onPressed: () {
            final url = _urlCtrl.text.trim();
            if (url.isEmpty) return;
            widget.onSend(url, _titleCtrl.text.trim().isNotEmpty ? _titleCtrl.text.trim() : url);
            Navigator.pop(context);
          },
          style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
          child: const Text('Send', style: TextStyle(color: Colors.white)),
        ),
      ],
    );
  }

  @override
  void dispose() {
    _urlCtrl.dispose();
    _titleCtrl.dispose();
    super.dispose();
  }
}
