import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../../core/app_colors.dart';
import '../../data/models/subject_model.dart';
import '../../data/models/lesson_model.dart';
import '../providers/lessons_provider.dart';
import 'lessons/lesson_detail_screen.dart';
import '../widgets/download_buttons.dart';

import '../providers/user_progress_provider.dart';
import '../providers/auth_provider.dart';
import '../providers/downloaded_files_provider.dart';
import '../../core/services/download_service.dart';
import 'settings_screen.dart';

class SubjectsScreen extends ConsumerStatefulWidget {
  final Subject subject;

  const SubjectsScreen({super.key, required this.subject});

  @override
  ConsumerState<SubjectsScreen> createState() => _SubjectsScreenState();
}

class _SubjectsScreenState extends ConsumerState<SubjectsScreen>
    with SingleTickerProviderStateMixin {
  @override
  void initState() {
    super.initState();
    // Load lessons for this subject
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(lessonsProvider(widget.subject.id).notifier).loadLessons();
      // Track visit
      ref
          .read(userProgressProvider.notifier)
          .addToHistory(widget.subject.title);
    });
  }

  @override
  Widget build(BuildContext context) {
    final lessonsState = ref.watch(lessonsProvider(widget.subject.id));

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: Text(widget.subject.title),
          actions: [
            IconButton(
              icon: const Icon(
                Icons.download_for_offline_rounded,
                color: Colors.amber, // Modern Gold
              ),
              onPressed: () => _showDownloadAllDialog(context, ref),
              tooltip: 'Download All Lessons',
            ),
            IconButton(
              icon: const Icon(
                Icons.delete_sweep_rounded,
                color: Colors.redAccent,
              ),
              onPressed: () => _showDeleteAllDialog(context, ref),
              tooltip: 'Clear Subject Downloads',
            ),
          ],
          bottom: TabBar(
            tabs: const [
              Tab(text: 'Lessons'),
              Tab(text: 'Exams'),
            ],
            indicatorColor: AppColors.secondary,
            labelColor: AppColors.secondary,
            unselectedLabelColor:
                Theme.of(context).brightness == Brightness.dark
                ? Colors.white
                : AppColors.textGrey,
          ),
        ),
        body: TabBarView(
          children: [_buildLessonsTab(ref, lessonsState), _buildExamsTab(ref)],
        ),
      ),
    );
  }

  Widget _buildLessonsTab(WidgetRef ref, LessonsState lessonsState) {
    return NotificationListener<ScrollNotification>(
      onNotification: (ScrollNotification scrollInfo) {
        if (scrollInfo.metrics.pixels == scrollInfo.metrics.maxScrollExtent &&
            lessonsState.hasMore) {
          ref
              .read(lessonsProvider(widget.subject.id).notifier)
              .loadLessons(loadMore: true);
        }
        return true;
      },
      child: lessonsState.lessons.isEmpty && lessonsState.isLoading
          ? const Center(child: CircularProgressIndicator())
          : lessonsState.lessons.isEmpty
          ? _buildEmptyState(context, 'No lessons found')
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount:
                  lessonsState.lessons.length + (lessonsState.hasMore ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == lessonsState.lessons.length) {
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.all(8.0),
                      child: CircularProgressIndicator(),
                    ),
                  );
                }

                final lesson = lessonsState.lessons[index];
                return _buildLessonCard(context, ref, lesson, index);
              },
            ),
    );
  }

  Widget _buildExamsTab(WidgetRef ref) {
    final examsAsync = ref.watch(examsProvider(widget.subject.id));

    return examsAsync.when(
      data: (exams) {
        if (exams.isEmpty) {
          return _buildEmptyState(context, 'No exams found');
        }
        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: exams.length,
          itemBuilder: (context, index) {
            final exam = exams[index];
            return _buildLessonCard(context, ref, exam, index);
          },
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (err, stack) => Center(child: Text('Error: $err')),
    );
  }

  Widget _buildLessonCard(
    BuildContext context,
    WidgetRef ref,
    Lesson lesson,
    int index,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: Theme.of(context).brightness == Brightness.dark
                ? AppColors.secondary.withOpacity(0.2)
                : AppColors.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Center(
            child: FaIcon(
              FontAwesomeIcons.boltLightning, // More modern/dynamic
              color: Theme.of(context).brightness == Brightness.dark
                  ? AppColors.secondary
                  : AppColors.primary,
              size: 20,
            ),
          ),
        ),
        title: Text(
          lesson.title,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Wrap(
            spacing: 8,
            children: [
              _buildCountBadge(
                lesson.coursesPdf.length,
                FontAwesomeIcons.filePdf,
                Colors.greenAccent,
              ),
              _buildCountBadge(
                lesson.videos.length,
                FontAwesomeIcons.youtube,
                Colors.red,
              ),
              _buildCountBadge(
                lesson.exercices.length,
                FontAwesomeIcons.clipboardList,
                Colors.blue,
              ),
              _buildCountBadge(
                lesson.exams.length,
                FontAwesomeIcons.graduationCap,
                Colors.orange,
              ),
            ],
          ),
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [_buildDownloadStatus(ref, lesson)],
        ),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => LessonDetailScreen(
                lesson: lesson,
                subjectName: widget.subject.title,
              ),
            ),
          );
        },
      ),
    ).animate().fadeIn(delay: (50 * index).ms).slideY(begin: 0.1, end: 0);
  }

  Widget _buildDownloadStatus(WidgetRef ref, Lesson lesson) {
    return LessonDownloadButton(
      lesson: lesson,
      subjectName: widget.subject.title,
    );
  }

  Widget _buildEmptyState(BuildContext context, String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.info_outline,
            size: 64,
            color: Colors.grey.withOpacity(0.5),
          ),
          const SizedBox(height: 16),
          Text(
            message,
            style: const TextStyle(color: Colors.grey, fontSize: 16),
          ),
        ],
      ),
    );
  }

  Widget _buildCountBadge(int count, IconData icon, Color color) {
    if (count == 0) return const SizedBox.shrink();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          FaIcon(icon, size: 10, color: color),
          const SizedBox(width: 4),
          Text(
            count.toString(),
            style: TextStyle(
              color: color,
              fontSize: 10,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _showDownloadAllDialog(
    BuildContext context,
    WidgetRef ref,
  ) async {
    final authState = ref.read(authProvider);
    final user = authState.user;
    final isPremium = user?.subscription?.isPremium ?? false;

    if (!isPremium) {
      _showPremiumRequiredDialog(context);
      return;
    }

    final lessonsState = ref.read(lessonsProvider(widget.subject.id));
    if (lessonsState.lessons.isEmpty) return;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Theme.of(context).scaffoldBackgroundColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.1),
              blurRadius: 20,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 50,
                height: 5,
                margin: const EdgeInsets.only(bottom: 24),
                decoration: BoxDecoration(
                  color: Colors.grey.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              ShaderMask(
                shaderCallback: (bounds) =>
                    AppColors.greenGradient.createShader(bounds),
                child: const Icon(
                  Icons.cloud_download_rounded,
                  size: 80,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Download Entire Course',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w900,
                  color: AppColors.textDark,
                ),
              ),
              const SizedBox(height: 12),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Text(
                  'This will download all ${lessonsState.lessons.length} lessons in "${widget.subject.title}" for offline study.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 16,
                    color: AppColors.textGrey,
                    height: 1.5,
                  ),
                ),
              ),
              const SizedBox(height: 32),
              Column(
                children: [
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: () {
                        Navigator.pop(context);
                        _startDownloadAll(context, ref, lessonsState.lessons);
                      },
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        padding: const EdgeInsets.symmetric(vertical: 18),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      child: const Text(
                        'Confirm Download',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text(
                        'Maybe Later',
                        style: TextStyle(
                          color: AppColors.textGrey,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ).animate().fadeIn(duration: 300.ms).slideY(begin: 0.2, end: 0),
      ),
    );
  }

  void _startDownloadAll(
    BuildContext context,
    WidgetRef ref,
    List<Lesson> lessons,
  ) {
    // Implement bulk download logic here or reuse individual lesson download logic in a loop
    // For now, we'll show a snackbar and trigger them
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(const SnackBar(content: Text('Starting bulk download...')));
    // Note: Implementing a robust bulk downloader might require a dedicated manager
  }

  void _showDeleteAllDialog(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear All Downloads?'),
        content: Text(
          'This will remove all offline content for "${widget.subject.title}". You will need to download them again for offline access.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              await _performDeleteAll(context, ref);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('Delete All'),
          ),
        ],
      ),
    );
  }

  Future<void> _performDeleteAll(BuildContext context, WidgetRef ref) async {
    try {
      final downloadService = DownloadService();
      await downloadService.deleteSubject(widget.subject.title);

      // Update local state in provider
      ref
          .read(downloadedFilesProvider.notifier)
          .deleteSubjectLocal(widget.subject.title);

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('All downloads for ${widget.subject.title} cleared.'),
            backgroundColor: AppColors.primary,
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to clear some files.'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _showPremiumRequiredDialog(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Theme.of(context).scaffoldBackgroundColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
        ),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 24),
                decoration: BoxDecoration(
                  color: Colors.grey.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const Icon(
                Icons.workspace_premium_rounded,
                size: 64,
                color: Colors.amber,
              ),
              const SizedBox(height: 16),
              const Text(
                'Premium Feature',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              const Text(
                'Downloading entire courses is a premium feature. Upgrade now to access all resources offline.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 16, color: AppColors.textGrey),
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context);
                    // Navigate to subscription (SettingsScreen tab 2)
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const SettingsScreen(initialTab: 2),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.amber,
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: const Text(
                    'Upgrade to Premium',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
