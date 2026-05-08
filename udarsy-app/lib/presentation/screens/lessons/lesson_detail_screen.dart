import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_slidable/flutter_slidable.dart';
import 'package:share_plus/share_plus.dart';

import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/app_colors.dart';
import '../../../core/services/download_service.dart';
import '../../../data/models/lesson_model.dart';
import '../../../l10n/app_localizations.dart';

import '../../providers/bookmarks_provider.dart';
import '../pdf_viewer_screen.dart';
import '../webview_screen.dart';
import '../../widgets/download_buttons.dart';
import '../../widgets/styled_snackbar.dart';
// ignore: deprecated_member_use
import 'package:youtube_player_flutter/youtube_player_flutter.dart';

import '../../providers/user_progress_provider.dart';
import '../../providers/auth_provider.dart';
import '../../../core/services/progress_service.dart';

class LessonDetailScreen extends ConsumerStatefulWidget {
  final Lesson lesson;
  final String subjectName;

  const LessonDetailScreen({
    super.key,
    required this.lesson,
    required this.subjectName,
  });

  @override
  ConsumerState<LessonDetailScreen> createState() => _LessonDetailScreenState();
}

class _LessonDetailScreenState extends ConsumerState<LessonDetailScreen> {
  bool _isNavigating = false;
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(userProgressProvider.notifier).addToHistory(widget.lesson.title);
    });
  }

  @override
  Widget build(BuildContext context) {
    final isBookmarked = ref
        .watch(bookmarksProvider)
        .any((l) => l.id == widget.lesson.id);
    final lesson = widget.lesson;
    final subjectName = widget.subjectName;
    // ... code ...
    // Flatten all resources into a single list with type information
    final List<_ResourceItem> allResources = [];

    // Add course PDFs
    for (var resource in lesson.coursesPdf) {
      allResources.add(
        _ResourceItem(
          resource: resource,
          type: 'pdf',
          icon: FontAwesomeIcons.filePen,
          iconColor: Colors.green,
          label: 'Course PDF',
        ),
      );
    }

    // Add videos
    for (var resource in lesson.videos) {
      allResources.add(
        _ResourceItem(
          resource: resource,
          type: 'video',
          icon: FontAwesomeIcons.youtube,
          iconColor: Colors.red,
          label: 'Video',
        ),
      );
    }

    // Add exercises
    for (var resource in lesson.exercices) {
      allResources.add(
        _ResourceItem(
          resource: resource,
          type: 'exercise',
          icon: FontAwesomeIcons.clipboardList,
          iconColor: Colors.blue,
          label: 'Exercise',
        ),
      );
    }

    // Add exams
    for (var resource in lesson.exams) {
      allResources.add(
        _ResourceItem(
          resource: resource,
          type: 'pdf',
          icon: FontAwesomeIcons.graduationCap,
          iconColor: Colors.green,
          label: 'Exam',
        ),
      );
    }

    // Add other resources
    for (var resource in lesson.resourses) {
      // Detect type from URL
      final url = resource.url.toLowerCase();
      String type;
      IconData icon;
      Color iconColor;
      String label;

      if (url.endsWith('.pdf')) {
        type = 'pdf';
        icon = Icons.picture_as_pdf;
        iconColor = Colors.green;
        label = 'PDF';
      } else if (url.contains('youtube') ||
          url.contains('vimeo') ||
          url.endsWith('.mp4') ||
          url.endsWith('.avi') ||
          url.endsWith('.mov')) {
        type = 'video';
        icon = Icons.play_circle_outline;
        iconColor = Colors.red;
        label = 'Video';
      } else {
        type = 'resource';
        icon = Icons.language_rounded;
        iconColor = Colors.blue;
        label = 'Link';
      }

      allResources.add(
        _ResourceItem(
          resource: resource,
          type: type,
          icon: icon,
          iconColor: iconColor,
          label: label,
        ),
      );
    }

    // ... inside build ...
    return Scaffold(
      appBar: AppBar(
        title: Text(lesson.title),
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(
              isBookmarked
                  ? Icons.bookmark_rounded
                  : Icons.bookmark_border_rounded,
              color: isBookmarked ? AppColors.primary : null,
            ),
            onPressed: () {
              if (mounted) {
                if (isBookmarked) {
                  StyledSnackBar.showInfo(context, 'Removed from bookmarks');
                } else {
                  StyledSnackBar.showSuccess(context, 'Added to bookmarks');
                }
              }
            },
          ),
        ],
      ),
      body: allResources.isEmpty
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(32.0),
                child: Text(
                  AppLocalizations.of(context)?.noDownloads ??
                      'No resources available',
                  style: const TextStyle(color: Colors.grey),
                ),
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(20),
              itemCount: allResources.length,
              itemBuilder: (context, index) {
                final item = allResources[index];

                return Slidable(
                      key: ValueKey(item.resource.url),
                      startActionPane: ActionPane(
                        motion: const ScrollMotion(),
                        children: [
                          SlidableAction(
                            onPressed: (_) async {
                              await Share.share(
                                'Check out this ${item.label}: ${item.resource.title}\n${item.resource.url}',
                                subject: item.resource.title,
                              );
                            },
                            backgroundColor: AppColors.secondary,
                            foregroundColor: Colors.white,
                            icon: Icons.share_rounded,
                            label:
                                AppLocalizations.of(context)?.share ?? 'Share',
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ],
                      ),
                      endActionPane: null,
                      child: Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        elevation: 2,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Consumer(
                          builder: (context, ref, child) {
                            final user = ref.watch(authProvider).user;
                            final effectiveResourceId =
                                item.resource.docId ?? item.resource.title;
                            final isCompleted =
                                user?.progress?.lessons.any((l) {
                                  if (l is Map) {
                                    final completedResources =
                                        l['completedResources'] as List?;
                                    return completedResources?.contains(
                                          effectiveResourceId,
                                        ) ??
                                        false;
                                  }
                                  return false;
                                }) ??
                                false;

                            return Stack(
                              children: [
                                Container(
                                  decoration: BoxDecoration(
                                    color: isCompleted
                                        ? Colors.green.withOpacity(0.08)
                                        : null,
                                    borderRadius: BorderRadius.circular(16),
                                    border: isCompleted
                                        ? Border.all(
                                            color: Colors.green.withOpacity(
                                              0.25,
                                            ),
                                            width: 1,
                                          )
                                        : null,
                                  ),
                                  child: ListTile(
                                    contentPadding: const EdgeInsets.all(12),
                                    leading: Container(
                                      width: 50,
                                      height: 50,
                                      decoration: BoxDecoration(
                                        color: isCompleted
                                            ? Colors.green.withOpacity(0.1)
                                            : item.iconColor.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Icon(
                                        isCompleted
                                            ? Icons.check_circle
                                            : item.icon,
                                        color: isCompleted
                                            ? Colors.green
                                            : item.iconColor,
                                      ),
                                    ),
                                    title: Text(
                                      item.resource.title,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w600,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    subtitle: Text(
                                      item.label,
                                      style: const TextStyle(fontSize: 12),
                                    ),
                                    trailing: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        if (item.type == 'pdf')
                                          FileDownloadButton(
                                            resource: item.resource,
                                            lesson: lesson,
                                            subjectName: subjectName,
                                          ),
                                        const Icon(
                                          Icons.chevron_right_rounded,
                                          color: AppColors.grey,
                                        ),
                                      ],
                                    ),
                                    onTap: () =>
                                        _openResource(context, item, ref),
                                  ),
                                ),
                                if (isCompleted)
                                  Positioned(
                                    bottom: 8,
                                    right: 8,
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 3,
                                      ),
                                      decoration: BoxDecoration(
                                        color: Colors.green,
                                        borderRadius: BorderRadius.circular(10),
                                        boxShadow: [
                                          BoxShadow(
                                            color: Colors.green.withOpacity(
                                              0.3,
                                            ),
                                            blurRadius: 4,
                                            offset: const Offset(0, 2),
                                          ),
                                        ],
                                      ),
                                      child: const Text(
                                        'Read',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ),
                              ],
                            );
                          },
                        ),
                      ),
                    )
                    .animate()
                    .fadeIn(delay: (50 * index).ms)
                    .slideY(begin: 0.1, end: 0);
              },
            ),
    );
  }

  void _openResource(
    BuildContext context,
    _ResourceItem item,
    WidgetRef ref,
  ) async {
    // Increment stat based on type
    if (item.type == 'pdf') {
      ref.read(userProgressProvider.notifier).incrementPdfCount();
    } else if (item.type == 'video') {
      ref.read(userProgressProvider.notifier).incrementVideoCount();
    } else if (item.type == 'exercise') {
      ref.read(userProgressProvider.notifier).incrementExerciseCount();
    }

    if (item.type == 'pdf') {
      final service = DownloadService();

      // Reconstruct filename and path
      final safeLessonTitle = widget.lesson.title.replaceAll(
        RegExp(r'[<>:"/\\|?*]'),
        '',
      );
      final safeFileTitle = item.resource.title.replaceAll(
        RegExp(r'[<>:"/\\|?*]'),
        '',
      );
      final filename = '$safeFileTitle.pdf';

      String folderPath = safeLessonTitle;
      if (widget.subjectName.isNotEmpty) {
        final safeSubject = widget.subjectName.replaceAll(
          RegExp(r'[<>:"/\\|?*]'),
          '',
        );
        folderPath = '$safeSubject/$safeLessonTitle';
      }

      final isDownloaded = await service.isDownloaded(
        filename,
        subjectName: folderPath,
      );

      if (!isDownloaded) {
        if (mounted) {
          _navigateToPDF(context, item.resource.title, item.resource.url);
        }
        return;
      }

      final path = await service.getFilePath(filename, subjectName: folderPath);

      if (context.mounted) {
        _navigateToPDF(context, item.resource.title, path);
      }
    } else if (item.type == 'video') {
      // ... existing video logic ...
      final url = item.resource.url.toLowerCase();
      if (url.contains('youtube') || url.contains('youtu.be')) {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => _YouTubePlayerScreen(
              videoUrl: item.resource.url,
              title: item.resource.title,
              lessonId: widget.lesson.id,
              subjectId: widget.lesson.subjectId,
              docId: item.resource.docId,
            ),
          ),
        );
      } else {
        _launchUrl(item.resource.url);
      }
    } else {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) =>
              WebViewScreen(url: item.resource.url, title: item.resource.title),
        ),
      );
    }
  }

  Future<void> _navigateToPDF(
    BuildContext context,
    String title,
    String url,
  ) async {
    if (_isNavigating) return;
    setState(() => _isNavigating = true);

    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => PDFViewerScreen(
          title: title,
          pdfUrl: url,
          lessonId: widget.lesson.id,
          subjectId: widget.lesson.subjectId,
          resourceId: title,
          docId: _getDocIdForResource(title),
        ),
      ),
    );

    if (mounted) setState(() => _isNavigating = false);
  }

  Future<void> _launchUrl(String urlString) async {
    final uri = Uri.parse(urlString);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  String? _getDocIdForResource(String title) {
    final allResources = [
      ...widget.lesson.coursesPdf,
      ...widget.lesson.exercices,
      ...widget.lesson.exams,
      ...widget.lesson.videos,
      ...widget.lesson.resourses,
    ];
    for (final r in allResources) {
      if (r.title == title) return r.docId;
    }
    return null;
  }
}

// Helper class to hold resource with type information
class _ResourceItem {
  final LessonResource resource;
  final String type;
  final IconData icon;
  final Color iconColor;
  final String label;

  _ResourceItem({
    required this.resource,
    required this.type,
    required this.icon,
    required this.iconColor,
    required this.label,
  });
}

class _YouTubePlayerScreen extends ConsumerStatefulWidget {
  final String videoUrl;
  final String title;
  final String? lessonId;
  final String? subjectId;
  final String? docId;

  const _YouTubePlayerScreen({
    required this.videoUrl,
    required this.title,
    this.lessonId,
    this.subjectId,
    this.docId,
  });

  @override
  ConsumerState<_YouTubePlayerScreen> createState() =>
      _YouTubePlayerScreenState();
}

class _YouTubePlayerScreenState extends ConsumerState<_YouTubePlayerScreen> {
  late YoutubePlayerController _controller;

  @override
  void initState() {
    super.initState();
    final videoId = YoutubePlayer.convertUrlToId(widget.videoUrl);
    _controller = YoutubePlayerController(
      initialVideoId: videoId ?? '',
      flags: const YoutubePlayerFlags(autoPlay: true, mute: false),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    // Force portrait when closing
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
    ]);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      body: SafeArea(
        child: OrientationBuilder(
          builder: (context, orientation) {
            final isLandscape = orientation == Orientation.landscape;

            if (isLandscape) {
              return Stack(
                children: [
                  Center(
                    child: YoutubePlayer(
                      controller: _controller,
                      showVideoProgressIndicator: true,
                      progressIndicatorColor: AppColors.primary,
                      onReady: () {
                        // Player is ready.
                      },
                    ),
                  ),
                  Positioned(
                    top: 10,
                    left: 10,
                    child: CircleAvatar(
                      backgroundColor: Colors.black.withOpacity(0.3),
                      child: IconButton(
                        icon: const Icon(
                          Icons.arrow_back,
                          color: Colors.white,
                          size: 20,
                        ),
                        onPressed: () => Navigator.of(context).pop(),
                      ),
                    ),
                  ),
                ],
              );
            }

            return Stack(
              children: [
                Column(
                  children: [
                    // Video Player at the top
                    YoutubePlayer(
                      controller: _controller,
                      showVideoProgressIndicator: true,
                      progressIndicatorColor: AppColors.primary,
                    ),
                    // Mark as Read button below the video
                    if (widget.lessonId != null)
                      Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 12,
                        ),
                        child: SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            onPressed: () async {
                              try {
                                final progressService = ref.read(
                                  progressServiceProvider,
                                );
                                await progressService.markResourceComplete(
                                  lessonId: widget.lessonId!,
                                  subjectId: widget.subjectId ?? '',
                                  resourceId: widget.docId ?? widget.title,
                                  resourceType: 'video',
                                );
                                await ref
                                    .read(authProvider.notifier)
                                    .refreshUser();
                                if (mounted) {
                                  StyledSnackBar.showSuccess(
                                    context,
                                    'تم التأشير كمقروء!',
                                  );
                                }
                              } catch (e) {
                                if (mounted) {
                                  StyledSnackBar.showError(
                                    context,
                                    'فشل في التأشير: $e',
                                  );
                                }
                              }
                            },
                            icon: const Icon(
                              Icons.check_circle,
                              color: Colors.white,
                            ),
                            label: const Text(
                              'Mark as Read',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
                // Back Button (Portrait)
                Positioned(
                  top: 10,
                  left: 10,
                  child: CircleAvatar(
                    backgroundColor: Colors.black.withOpacity(0.1),
                    child: IconButton(
                      icon: const Icon(
                        Icons.arrow_back,
                        color: Colors.white,
                        size: 20,
                      ),
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}
