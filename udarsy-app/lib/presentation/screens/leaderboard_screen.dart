import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/app_colors.dart';
import '../../core/services/api_service.dart';
import '../providers/auth_provider.dart';

// ─── Rank tier definitions ────────────────────────────────────────────────────

class _RankTier {
  final String name;
  final String nameAr;
  final String emoji;
  final Color color;
  final Color bg;
  final int minScore;

  const _RankTier({
    required this.name,
    required this.nameAr,
    required this.emoji,
    required this.color,
    required this.bg,
    required this.minScore,
  });
}

const _tiers = [
  _RankTier(name: 'Legend',     nameAr: 'أسطورة',     emoji: '👑', color: Color(0xFFE5A000), bg: Color(0xFFFFF8E1), minScore: 50000),
  _RankTier(name: 'Diamond',    nameAr: 'ماسة',       emoji: '💎', color: Color(0xFF00B4D8), bg: Color(0xFFE0F7FA), minScore: 20000),
  _RankTier(name: 'Platinum',   nameAr: 'بلاتين',    emoji: '🏅', color: Color(0xFF7209B7), bg: Color(0xFFF3E5F5), minScore: 10000),
  _RankTier(name: 'Gold',       nameAr: 'ذهب',        emoji: '🥇', color: Color(0xFFF59E0B), bg: Color(0xFFFFF9E6), minScore: 5000),
  _RankTier(name: 'Silver',     nameAr: 'فضة',        emoji: '🥈', color: Color(0xFF64748B), bg: Color(0xFFF1F5F9), minScore: 2000),
  _RankTier(name: 'Bronze',     nameAr: 'برونز',      emoji: '🥉', color: Color(0xFF92400E), bg: Color(0xFFFEF3C7), minScore: 500),
  _RankTier(name: 'Starter',    nameAr: 'مبتدئ',     emoji: '🌱', color: Color(0xFF22C55E), bg: Color(0xFFE8F5E9), minScore: 0),
];

_RankTier _getTier(int score) {
  for (final t in _tiers) {
    if (score >= t.minScore) return t;
  }
  return _tiers.last;
}

// ─── Data model ───────────────────────────────────────────────────────────────

class _RankEntry {
  final String userId;
  final String displayName;
  final String? photoURL;
  final int score;
  final int points;
  final int learningTime;
  final int contributionCount;
  final int newsInteractions;
  final int rank;

  const _RankEntry({
    required this.userId,
    required this.displayName,
    this.photoURL,
    required this.score,
    required this.points,
    required this.learningTime,
    required this.contributionCount,
    required this.newsInteractions,
    required this.rank,
  });

  factory _RankEntry.fromJson(Map<String, dynamic> j) => _RankEntry(
        userId:            j['userId']?.toString() ?? '',
        displayName:       j['displayName'] ?? 'Student',
        photoURL:          j['photoURL'],
        score:             (j['score'] as num?)?.toInt() ?? 0,
        points:            (j['points'] as num?)?.toInt() ?? 0,
        learningTime:      (j['learningTime'] as num?)?.toInt() ?? 0,
        contributionCount: (j['contributionCount'] as num?)?.toInt() ?? 0,
        newsInteractions:  (j['newsInteractions'] as num?)?.toInt() ?? 0,
        rank:              (j['rank'] as num?)?.toInt() ?? 0,
      );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

final _leaderboardProvider = FutureProvider.family<List<_RankEntry>, String>(
  (ref, month) async {
    final api = ref.watch(apiServiceProvider);
    final res = await api.get('/leaderboard/monthly', queryParameters: {'month': month});
    final entries = (res.data['entries'] as List? ?? [])
        .map((e) => _RankEntry.fromJson(e as Map<String, dynamic>))
        .toList();
    return entries;
  },
);

// ─── Screen ───────────────────────────────────────────────────────────────────

class LeaderboardScreen extends ConsumerStatefulWidget {
  const LeaderboardScreen({super.key});

  @override
  ConsumerState<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends ConsumerState<LeaderboardScreen>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  String _selectedMonth = _currentMonth();

  static String _currentMonth() => DateTime.now().toIso8601String().substring(0, 7);

  static String _formatMonth(String m) {
    final parts = m.split('-');
    if (parts.length < 2) return m;
    const months = [
      '', 'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    final idx = int.tryParse(parts[1]) ?? 0;
    return '${months[idx]} ${parts[0]}';
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final leaderboard = ref.watch(_leaderboardProvider(_selectedMonth));
    final currentUserId = ref.watch(currentUserProvider.select((u) => u?.id));
    final baseUrl = ref.watch(apiServiceProvider).baseUrl;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Leaderboard', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: _MonthPicker(
              selected: _selectedMonth,
              onChanged: (m) => setState(() => _selectedMonth = m),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // ── How scoring works banner ──
          _ScoringInfoBanner(),
          Expanded(
            child: leaderboard.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(
                child: Text('Failed to load: $e',
                    style: const TextStyle(color: Colors.red)),
              ),
              data: (entries) {
                if (entries.isEmpty) {
                  return _EmptyLeaderboard(month: _formatMonth(_selectedMonth));
                }
                return _LeaderboardList(
                  entries: entries,
                  currentUserId: currentUserId,
                  baseUrl: baseUrl,
                  month: _formatMonth(_selectedMonth),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Month picker ─────────────────────────────────────────────────────────────

class _MonthPicker extends StatelessWidget {
  final String selected;
  final ValueChanged<String> onChanged;

  const _MonthPicker({required this.selected, required this.onChanged});

  List<String> get _months {
    final now = DateTime.now();
    return List.generate(6, (i) {
      final d = DateTime(now.year, now.month - i, 1);
      return '${d.year}-${d.month.toString().padLeft(2, '0')}';
    });
  }

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<String>(
      onSelected: onChanged,
      icon: const Icon(Icons.calendar_month_rounded),
      itemBuilder: (_) => _months.map((m) {
        final parts = m.split('-');
        const mNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        final label = '${mNames[int.parse(parts[1])]} ${parts[0]}';
        return PopupMenuItem(value: m, child: Text(label));
      }).toList(),
    );
  }
}

// ─── Scoring info ─────────────────────────────────────────────────────────────

class _ScoringInfoBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF4ADE80), Color(0xFF22C55E)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(18),
        boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.2), blurRadius: 12, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Text('🏆', style: TextStyle(fontSize: 20)),
              SizedBox(width: 8),
              Text('How to climb the ranks',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
            ],
          ),
          const SizedBox(height: 10),
          _factorRow('⭐', 'XP Points',             '×1.0 per point'),
          _factorRow('⏱', 'Learning Time',          '×0.5 per minute'),
          _factorRow('📤', 'Contributions',          '×15 per upload'),
          _factorRow('📰', 'News Interactions',      '×3 per article saved'),
          _factorRow('💬', 'Chat Participation',     '×1.5 per message'),
          const SizedBox(height: 6),
          const Text(
            'Rankings are refreshed monthly. Keep learning every day!',
            style: TextStyle(color: Colors.white70, fontSize: 11),
          ),
        ],
      ),
    ).animate().fadeIn().slideY(begin: -0.1);
  }

  Widget _factorRow(String icon, String label, String weight) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 3),
      child: Row(
        children: [
          Text(icon, style: const TextStyle(fontSize: 13)),
          const SizedBox(width: 6),
          Expanded(child: Text(label, style: const TextStyle(color: Colors.white, fontSize: 12))),
          Text(weight, style: const TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

// ─── Tier badges ─────────────────────────────────────────────────────────────

class _TierBadge extends StatelessWidget {
  final int score;
  final bool compact;
  const _TierBadge({required this.score, this.compact = false});

  @override
  Widget build(BuildContext context) {
    final t = _getTier(score);
    return Container(
      padding: EdgeInsets.symmetric(horizontal: compact ? 6 : 10, vertical: compact ? 3 : 5),
      decoration: BoxDecoration(color: t.bg, borderRadius: BorderRadius.circular(20)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(t.emoji, style: TextStyle(fontSize: compact ? 11 : 14)),
          const SizedBox(width: 4),
          Text(t.nameAr, style: TextStyle(color: t.color, fontSize: compact ? 10 : 12, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}

// ─── Main List ────────────────────────────────────────────────────────────────

class _LeaderboardList extends StatelessWidget {
  final List<_RankEntry> entries;
  final String? currentUserId;
  final String baseUrl;
  final String month;

  const _LeaderboardList({
    required this.entries,
    required this.currentUserId,
    required this.baseUrl,
    required this.month,
  });

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      itemCount: entries.length + (entries.length >= 3 ? 1 : 0),
      itemBuilder: (ctx, i) {
        if (i == 0 && entries.length >= 3) {
          return _TopThreePodium(entries: entries.take(3).toList(), baseUrl: baseUrl)
              .animate().fadeIn(delay: 50.ms);
        }
        final entry = i == 0 ? entries[0] : entries[i - 1];
        final isMe = entry.userId == currentUserId;
        return _RankCard(entry: entry, isMe: isMe, baseUrl: baseUrl)
            .animate().fadeIn(delay: (50 + i * 40).ms).slideX(begin: 0.05, end: 0);
      },
    );
  }
}

// ─── Top 3 Podium ─────────────────────────────────────────────────────────────

class _TopThreePodium extends StatelessWidget {
  final List<_RankEntry> entries;
  final String baseUrl;
  const _TopThreePodium({required this.entries, required this.baseUrl});

  @override
  Widget build(BuildContext context) {
    final first  = entries[0];
    final second = entries[1];
    final third  = entries[2];

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.symmetric(vertical: 20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1A1A2E), Color(0xFF16213E)],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          _PodiumSlot(entry: second, position: 2, height: 80, baseUrl: baseUrl),
          _PodiumSlot(entry: first,  position: 1, height: 110, baseUrl: baseUrl),
          _PodiumSlot(entry: third,  position: 3, height: 60, baseUrl: baseUrl),
        ],
      ),
    );
  }
}

class _PodiumSlot extends StatelessWidget {
  final _RankEntry entry;
  final int position;
  final double height;
  final String baseUrl;
  const _PodiumSlot({required this.entry, required this.position, required this.height, required this.baseUrl});

  Color get _podiumColor => position == 1
      ? const Color(0xFFE5A000)
      : position == 2
          ? const Color(0xFF94A3B8)
          : const Color(0xFF92400E);

  String get _medal => position == 1 ? '🥇' : position == 2 ? '🥈' : '🥉';

  @override
  Widget build(BuildContext context) {
    final photoUrl = entry.photoURL != null
        ? entry.photoURL!.startsWith('http') ? entry.photoURL! : '$baseUrl/${entry.photoURL}'
        : null;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(_medal, style: const TextStyle(fontSize: 22)),
        const SizedBox(height: 4),
        CircleAvatar(
          radius: position == 1 ? 32 : 26,
          backgroundColor: _podiumColor.withOpacity(0.2),
          backgroundImage: photoUrl != null ? NetworkImage(photoUrl) : null,
          child: photoUrl == null
              ? Text(entry.displayName[0].toUpperCase(),
                  style: TextStyle(color: _podiumColor, fontWeight: FontWeight.bold,
                      fontSize: position == 1 ? 22 : 18))
              : null,
        ),
        const SizedBox(height: 6),
        Text(
          entry.displayName.split(' ').first,
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
          maxLines: 1, overflow: TextOverflow.ellipsis,
        ),
        Text(
          '${entry.score} pts',
          style: TextStyle(color: _podiumColor, fontSize: 11, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 8),
        Container(
          width: 60,
          height: height,
          decoration: BoxDecoration(
            color: _podiumColor.withOpacity(0.15),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
            border: Border.all(color: _podiumColor.withOpacity(0.4)),
          ),
          alignment: Alignment.center,
          child: Text(
            '#$position',
            style: TextStyle(color: _podiumColor, fontWeight: FontWeight.bold, fontSize: 16),
          ),
        ),
      ],
    );
  }
}

// ─── Rank Card ────────────────────────────────────────────────────────────────

class _RankCard extends StatelessWidget {
  final _RankEntry entry;
  final bool isMe;
  final String baseUrl;
  const _RankCard({required this.entry, required this.isMe, required this.baseUrl});

  @override
  Widget build(BuildContext context) {
    final tier = _getTier(entry.score);
    final photoUrl = entry.photoURL != null
        ? entry.photoURL!.startsWith('http') ? entry.photoURL! : '$baseUrl/${entry.photoURL}'
        : null;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: isMe ? AppColors.primary.withOpacity(0.08) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isMe ? AppColors.primary : Colors.grey.withOpacity(0.12),
          width: isMe ? 1.5 : 1,
        ),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 8)],
      ),
      child: Row(
        children: [
          // Rank number
          SizedBox(
            width: 36,
            child: Text(
              '#${entry.rank}',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 14,
                color: entry.rank <= 3 ? tier.color : AppColors.textGrey,
              ),
            ),
          ),
          // Avatar
          CircleAvatar(
            radius: 22,
            backgroundColor: tier.bg,
            backgroundImage: photoUrl != null ? NetworkImage(photoUrl) : null,
            child: photoUrl == null
                ? Text(entry.displayName[0].toUpperCase(),
                    style: TextStyle(color: tier.color, fontWeight: FontWeight.bold))
                : null,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        entry.displayName + (isMe ? '  (أنت)' : ''),
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                          color: isMe ? AppColors.primary : AppColors.textDark,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    _miniStat('⭐', '${entry.points}'),
                    const SizedBox(width: 10),
                    _miniStat('⏱', '${entry.learningTime ~/ 60}h'),
                    const SizedBox(width: 10),
                    _miniStat('📤', '${entry.contributionCount}'),
                  ],
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              _TierBadge(score: entry.score, compact: true),
              const SizedBox(height: 4),
              Text('${entry.score}', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: tier.color)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _miniStat(String icon, String val) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(icon, style: const TextStyle(fontSize: 10)),
        const SizedBox(width: 2),
        Text(val, style: const TextStyle(fontSize: 10, color: AppColors.textGrey, fontWeight: FontWeight.w600)),
      ],
    );
  }
}

// ─── Empty state ─────────────────────────────────────────────────────────────

class _EmptyLeaderboard extends StatelessWidget {
  final String month;
  const _EmptyLeaderboard({required this.month});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Text('🏆', style: TextStyle(fontSize: 64)),
          const SizedBox(height: 16),
          Text('No data for $month', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const Text('Start learning to appear on the board!',
              style: TextStyle(color: AppColors.textGrey)),
        ],
      ),
    );
  }
}
