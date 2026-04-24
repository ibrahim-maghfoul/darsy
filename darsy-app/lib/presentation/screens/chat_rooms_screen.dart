import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/app_colors.dart';
import '../../core/services/api_service.dart';
import '../providers/auth_provider.dart';
import '../providers/preferences_provider.dart';
import 'chat_screen.dart';
import 'teacher_room_screen.dart';

// ─── Providers ────────────────────────────────────────────────────────────────

final _teacherRoomsProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>(
  (ref) async {
    final api = ref.watch(apiServiceProvider);
    final res = await api.get('/teacher/rooms/joined');
    final List data = res.data is List ? res.data : [];
    return data.cast<Map<String, dynamic>>();
  },
);

final _myRoomsProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>(
  (ref) async {
    final api = ref.watch(apiServiceProvider);
    final res = await api.get('/teacher/rooms/me');
    final List data = res.data is List ? res.data : [];
    return data.cast<Map<String, dynamic>>();
  },
);

// ─── Main screen ─────────────────────────────────────────────────────────────

class ChatRoomsScreen extends ConsumerStatefulWidget {
  const ChatRoomsScreen({super.key});

  @override
  ConsumerState<ChatRoomsScreen> createState() => _ChatRoomsScreenState();
}

class _ChatRoomsScreenState extends ConsumerState<ChatRoomsScreen>
    with AutomaticKeepAliveClientMixin, SingleTickerProviderStateMixin {
  @override
  bool get wantKeepAlive => true;

  late final TabController _tabs;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final authState = ref.watch(authProvider);

    if (!authState.isAuthenticated) {
      return Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.chat_bubble_outline_rounded,
                    size: 80, color: AppColors.primary.withOpacity(0.3)),
                const SizedBox(height: 24),
                const Text('Chat Rooms',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                Text(
                  'Sign in to join your school chat room and connect with classmates.',
                  style: TextStyle(fontSize: 16, color: AppColors.textGrey),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      );
    }

    final user = authState.user!;
    final prefs = ref.watch(preferencesProvider);
    final isTeacher = user.role == 'teacher' || user.role == 'instructor' || user.role == 'admin';

    final guidance = user.level?.guidance ??
        prefs.getGuidanceTitle() ??
        prefs.getSelectedGuidance() ??
        user.selectedPath?.guidanceId ?? '';
    final level = user.level?.level ??
        prefs.getLevelTitle() ??
        prefs.getSelectedLevel() ??
        user.selectedPath?.levelId ?? '';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Chat Rooms', style: TextStyle(fontWeight: FontWeight.bold)),
        bottom: TabBar(
          controller: _tabs,
          indicatorColor: AppColors.primary,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textGrey,
          tabs: [
            const Tab(icon: Icon(Icons.groups_rounded), text: 'عام'),
            Tab(
              icon: const Icon(Icons.school_rounded),
              text: isTeacher ? 'غرفي' : 'غرف الأساتذة',
            ),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabs,
        children: [
          // ── Tab 1: General level-based chat ──
          ChatScreen(guidance: guidance, level: level, roomTitle: 'غرفة الدعم'),

          // ── Tab 2: Teacher rooms ──
          isTeacher
              ? _TeacherOwnRoomsTab(userId: user.id)
              : _StudentTeacherRoomsTab(userId: user.id),
        ],
      ),
    );
  }
}

// ─── Teacher: their own created rooms ────────────────────────────────────────

class _TeacherOwnRoomsTab extends ConsumerStatefulWidget {
  final String userId;
  const _TeacherOwnRoomsTab({required this.userId});

  @override
  ConsumerState<_TeacherOwnRoomsTab> createState() => _TeacherOwnRoomsTabState();
}

class _TeacherOwnRoomsTabState extends ConsumerState<_TeacherOwnRoomsTab> {
  bool _showCreateForm = false;
  final _nameCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  bool _creating = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  Future<void> _createRoom() async {
    if (_nameCtrl.text.trim().isEmpty) return;
    setState(() => _creating = true);
    try {
      final api = ref.read(apiServiceProvider);
      final res = await api.post('/teacher/rooms', data: {
        'name': _nameCtrl.text.trim(),
        'description': _descCtrl.text.trim(),
        'guidanceId': 'general',
        'subjectId': 'general',
      });
      final roomCode = res.data['roomCode']?.toString() ?? '';
      final inviteLink = res.data['inviteLink']?.toString() ?? '';
      ref.invalidate(_myRoomsProvider);
      setState(() => _showCreateForm = false);
      _nameCtrl.clear();
      _descCtrl.clear();
      if (mounted) {
        _showInviteDialog(roomCode, inviteLink);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to create room: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _creating = false);
    }
  }

  void _showInviteDialog(String roomCode, String inviteLink) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Row(
          children: [
            Text('🎉', style: TextStyle(fontSize: 22)),
            SizedBox(width: 8),
            Text('Room Created!'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Share this link with your students:',
                style: TextStyle(color: AppColors.textGrey, fontSize: 13)),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.07),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.primary.withOpacity(0.2)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      'darsy.app$inviteLink',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.copy_rounded, color: AppColors.primary, size: 18),
                    onPressed: () {
                      Clipboard.setData(ClipboardData(text: 'darsy.app$inviteLink'));
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Link copied!')),
                      );
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Text('Room Code: $roomCode',
                style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textGrey)),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            child: const Text('Done', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final roomsAsync = ref.watch(_myRoomsProvider);

    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(_myRoomsProvider),
      child: CustomScrollView(
        slivers: [
          // Create room form / button
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 250),
                child: _showCreateForm
                    ? _CreateRoomForm(
                        nameCtrl: _nameCtrl,
                        descCtrl: _descCtrl,
                        creating: _creating,
                        onCreate: _createRoom,
                        onCancel: () => setState(() => _showCreateForm = false),
                      )
                    : SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: () => setState(() => _showCreateForm = true),
                          icon: const Icon(Icons.add_rounded),
                          label: const Text('إنشاء غرفة جديدة'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                        ),
                      ),
              ),
            ),
          ),

          // Rooms list
          roomsAsync.when(
            loading: () => const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator())),
            error: (e, _) => SliverFillRemaining(
                child: Center(child: Text('Error: $e', style: const TextStyle(color: Colors.red)))),
            data: (rooms) {
              if (rooms.isEmpty) {
                return const SliverFillRemaining(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text('🏫', style: TextStyle(fontSize: 56)),
                        SizedBox(height: 12),
                        Text('لم تنشئ أي غرفة بعد', style: TextStyle(fontWeight: FontWeight.bold)),
                        SizedBox(height: 6),
                        Text('أنشئ غرفتك الأولى وشارك الرابط مع طلابك.',
                            style: TextStyle(color: AppColors.textGrey), textAlign: TextAlign.center),
                      ],
                    ),
                  ),
                );
              }
              return SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (ctx, i) {
                      final r = rooms[i];
                      return _TeacherRoomCard(room: r, isTeacher: true)
                          .animate().fadeIn(delay: (i * 50).ms).slideX(begin: 0.05);
                    },
                    childCount: rooms.length,
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

// ─── Create Room Form ─────────────────────────────────────────────────────────

class _CreateRoomForm extends StatelessWidget {
  final TextEditingController nameCtrl;
  final TextEditingController descCtrl;
  final bool creating;
  final VoidCallback onCreate;
  final VoidCallback onCancel;

  const _CreateRoomForm({
    required this.nameCtrl,
    required this.descCtrl,
    required this.creating,
    required this.onCreate,
    required this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.primary.withOpacity(0.05),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.primary.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('غرفة جديدة',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.primary)),
          const SizedBox(height: 12),
          TextField(
            controller: nameCtrl,
            decoration: InputDecoration(
              labelText: 'اسم الغرفة *',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.primary)),
            ),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: descCtrl,
            maxLines: 2,
            decoration: InputDecoration(
              labelText: 'وصف (اختياري)',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.primary)),
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              TextButton(onPressed: onCancel, child: const Text('إلغاء')),
              const Spacer(),
              ElevatedButton(
                onPressed: creating ? null : onCreate,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: creating
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('إنشاء وإنشاء رابط الدعوة'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── Student: rooms they joined ───────────────────────────────────────────────

class _StudentTeacherRoomsTab extends ConsumerWidget {
  final String userId;
  const _StudentTeacherRoomsTab({required this.userId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final roomsAsync = ref.watch(_teacherRoomsProvider);

    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(_teacherRoomsProvider),
      child: roomsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: Colors.red))),
        data: (rooms) {
          if (rooms.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.school_outlined, size: 72, color: AppColors.primary.withOpacity(0.3)),
                    const SizedBox(height: 16),
                    const Text('لم تنضم إلى أي غرفة بعد',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    const Text(
                      'اطلب من أستاذك رابط الغرفة للانضمام.',
                      style: TextStyle(color: AppColors.textGrey),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: rooms.length,
            itemBuilder: (ctx, i) {
              return _TeacherRoomCard(room: rooms[i], isTeacher: false)
                  .animate().fadeIn(delay: (i * 60).ms).slideX(begin: 0.05);
            },
          );
        },
      ),
    );
  }
}

// ─── Room Card ────────────────────────────────────────────────────────────────

class _TeacherRoomCard extends StatelessWidget {
  final Map<String, dynamic> room;
  final bool isTeacher;
  const _TeacherRoomCard({required this.room, required this.isTeacher});

  @override
  Widget build(BuildContext context) {
    final name        = room['name']?.toString() ?? 'Room';
    final desc        = room['description']?.toString() ?? '';
    final roomCode    = room['roomCode']?.toString() ?? '';
    final teacherSlug = room['teacherSlug']?.toString() ?? '';
    final lastMsg     = room['lastMessagePreview']?.toString() ?? '';
    final members     = (room['members'] as List?)?.length ?? 0;
    final pendingReqs = (room['joinRequests'] as List?)
            ?.where((r) => r['status'] == 'pending').length ?? 0;
    final roomId      = room['_id']?.toString() ?? '';
    final inviteLink  = '/room/$teacherSlug/$roomCode';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        elevation: 0,
        child: InkWell(
          borderRadius: BorderRadius.circular(18),
          onTap: () => Navigator.push(context, MaterialPageRoute(
              builder: (_) => TeacherRoomScreen(roomId: roomId, roomName: name))),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: AppColors.primary.withOpacity(0.15)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.school_rounded, color: AppColors.primary, size: 22),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                          if (desc.isNotEmpty)
                            Text(desc, style: const TextStyle(fontSize: 12, color: AppColors.textGrey),
                                maxLines: 1, overflow: TextOverflow.ellipsis),
                        ],
                      ),
                    ),
                    if (isTeacher && pendingReqs > 0)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.orange.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text('+$pendingReqs طلب',
                            style: const TextStyle(color: Colors.orange, fontSize: 11, fontWeight: FontWeight.bold)),
                      ),
                    const SizedBox(width: 6),
                    const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppColors.textGrey),
                  ],
                ),
                if (lastMsg.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Text(lastMsg,
                      style: const TextStyle(fontSize: 12, color: AppColors.textGrey),
                      maxLines: 1, overflow: TextOverflow.ellipsis),
                ],
                const SizedBox(height: 10),
                Row(
                  children: [
                    const Icon(Icons.people_rounded, size: 14, color: AppColors.textGrey),
                    const SizedBox(width: 4),
                    Text('$members عضو', style: const TextStyle(fontSize: 12, color: AppColors.textGrey)),
                    const Spacer(),
                    if (isTeacher) ...[
                      InkWell(
                        onTap: () {
                          Clipboard.setData(ClipboardData(text: 'darsy.app$inviteLink'));
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Invite link copied!')),
                          );
                        },
                        child: Row(
                          children: [
                            const Icon(Icons.copy_rounded, size: 13, color: AppColors.primary),
                            const SizedBox(width: 4),
                            Text('نسخ الرابط',
                                style: const TextStyle(fontSize: 11, color: AppColors.primary,
                                    fontWeight: FontWeight.w600)),
                          ],
                        ),
                      ),
                    ],
                    if (!isTeacher)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(roomCode,
                            style: const TextStyle(fontSize: 11, color: AppColors.primary,
                                fontWeight: FontWeight.bold, letterSpacing: 1.5)),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
