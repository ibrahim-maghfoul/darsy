import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_slidable/flutter_slidable.dart';
import 'package:dio/dio.dart';
import 'package:darsy/presentation/providers/auth_provider.dart';
import 'package:share_plus/share_plus.dart';
import '../../core/app_colors.dart';
import '../../core/services/download_service.dart';
import '../../data/models/lesson_model.dart';
import '../providers/lessons_provider.dart';
import '../screens/lessons/lesson_detail_screen.dart';
import '../providers/bookmarks_provider.dart';
import '../providers/downloaded_files_provider.dart';
import '../../l10n/app_localizations.dart';

class LessonCard extends ConsumerWidget {
  final Lesson lesson;
  final int index;

  const LessonCard({super.key, required this.lesson, this.index = 0});

  bool get hasPdfResources =>
      lesson.coursesPdf.isNotEmpty || lesson.exercices.isNotEmpty;

  Future<void> _shareLessonInfo() async {
    // ... same share logic ...
    final text =
        '''
${lesson.title}

Resources: ${lesson.totalResources} items
📚 Courses: ${lesson.coursesPdf.length}
🎥 Videos: ${lesson.videos.length}
📝 Exercises: ${lesson.exercices.length}
📖 Resources: ${lesson.resourses.length}
''';
    await Share.share(text, subject: lesson.title);
  }

  Future<void> _downloadLessonResources(
    BuildContext context,
    WidgetRef ref,
  ) async {
    final List<LessonResource> pdfResources = [
      ...lesson.coursesPdf,
      ...lesson.exercices,
      ...lesson.exams,
    ];

    if (pdfResources.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No PDF resources available')),
      );
      return;
    }

    if (!context.mounted) return;

    final progressNotifier = ValueNotifier<double>(0.0);
    final currentDocNotifier = ValueNotifier<String>('');
    final cancelToken = CancelToken();
    bool isCancelled = false;

    // Attempt to find subject name
    String folderPath = lesson.title.replaceAll(RegExp(r'[<>:"/\\|?*]'), '');
    try {
      final subjects = ref.read(subjectsProvider).asData?.value;
      if (subjects != null) {
        final subject = subjects.firstWhere(
          (s) => s.id == lesson.subjectId,
          orElse: () => subjects.first,
        );
        final safeSubject = subject.title.replaceAll(
          RegExp(r'[<>:"/\\|?*]'),
          '',
        );
        folderPath = '$safeSubject/$folderPath';
      }
    } catch (e) {
      debugPrint('Error finding subject name: $e');
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: ValueListenableBuilder<double>(
          valueListenable: progressNotifier,
          builder: (context, progress, child) {
            return ValueListenableBuilder<String>(
              valueListenable: currentDocNotifier,
              builder: (context, currentTitle, child) {
                return Container(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                    children: [
                      SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(
                          value: progress > 0 ? progress : null,
                          backgroundColor: Colors.white24,
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              AppLocalizations.of(context)?.downloading ??
                                  'Downloading...',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                                color: Colors.white,
                              ),
                            ),
                            if (currentTitle.isNotEmpty)
                              Text(
                                currentTitle,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Colors.white.withOpacity(0.8),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            );
          },
        ),
        action: SnackBarAction(
          label: 'CANCEL',
          textColor: Colors.white,
          onPressed: () {
            isCancelled = true;
            cancelToken.cancel();
          },
        ),
        backgroundColor: AppColors.secondary,
        duration: const Duration(minutes: 10),
        behavior: SnackBarBehavior.floating,
      ),
    );

    try {
      final downloadService = DownloadService();
      int successCount = 0;

      for (var resource in pdfResources) {
        if (isCancelled) break;

        final safeFileTitle = resource.title.replaceAll(
          RegExp(r'[<>:"/\\|?*]'),
          '',
        );
        final filename = '$safeFileTitle.pdf';

        if (await downloadService.isDownloaded(
          filename,
          subjectName: folderPath,
        )) {
          successCount++;
          continue;
        }

        currentDocNotifier.value = resource.title;

        final savedPath = await downloadService.downloadFile(
          resource.url,
          filename,
          subjectName: folderPath,
          cancelToken: cancelToken,
          onProgress: (received, total) {
            if (total != -1) {
              progressNotifier.value = received / total;
            }
          },
        );

        if (savedPath != null) {
          successCount++;
        }
      }

      if (context.mounted) {
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
      }

      if (successCount > 0 && !isCancelled) {
        await ref.read(downloadedFilesProvider.notifier).refresh();
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                AppLocalizations.of(context)?.downloadComplete ??
                    'Download complete',
              ),
              backgroundColor: AppColors.success,
              duration: const Duration(seconds: 2),
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          );
        }
      } else if (isCancelled) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Download cancelled'),
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              '${AppLocalizations.of(context)?.downloadError ?? "Download failed"}: $e',
            ),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final downloadedFiles =
        ref.watch(downloadedFilesProvider).asData?.value ?? [];

    final authState = ref.watch(authProvider);
    final user = authState.user;
    final isGuest = user == null;
    double completion = 0.0;

    if (!isGuest &&
        user.progress != null &&
        user.progress!.lessons.isNotEmpty) {
      final lessonProgressList = user.progress!.lessons
          .cast<Map<String, dynamic>>();
      final lessonProgress = lessonProgressList.firstWhere(
        (l) => l['lessonId'] == lesson.id,
        orElse: () => <String, dynamic>{}, // explicit type
      );
      if (lessonProgress.isNotEmpty &&
          lessonProgress.containsKey('completionPercent')) {
        completion = (lessonProgress['completionPercent'] as num).toDouble();
      } else if (lessonProgress.isNotEmpty &&
          lessonProgress.containsKey('progress')) {
        completion = (lessonProgress['progress'] as num).toDouble();
      }
    }

    // Check if all resources are downloaded
    final allResources = [
      ...lesson.coursesPdf,
      ...lesson.exercices,
      ...lesson.exams,
    ];

    bool isFullyDownloaded = false;

    // Calculate folder path once
    // We need subjectName for the path.
    // If not found, we use just lesson title as folder.
    String folderPath = lesson.title.replaceAll(RegExp(r'[<>:"/\\|?*]'), '');
    try {
      final subjects = ref.read(subjectsProvider).asData?.value;
      if (subjects != null) {
        final subject = subjects.firstWhere(
          (s) => s.id == lesson.subjectId,
          orElse: () => subjects.first,
        );
        final safeSubject = subject.title.replaceAll(
          RegExp(r'[<>:"/\\|?*]'),
          '',
        );
        folderPath = '$safeSubject/$folderPath';
      }
    } catch (_) {}

    if (allResources.isNotEmpty) {
      isFullyDownloaded = allResources.every((resource) {
        final safeFileTitle = resource.title.replaceAll(
          RegExp(r'[<>:"/\\|?*]'),
          '',
        );
        final filename = '$safeFileTitle.pdf';
        // We check if file exists in the specific folder
        // BUT downloadedFilesProvider returns a LIST OF FILES.
        // We need to check if ANY file in the list allows us to say "it's downloaded".
        // The list contains full paths.
        // So we check if path ends with "folderPath/filename".
        // Normalize separators?
        // Let's use simpler check: name match + size check?
        // Or just rely on filename uniqueness within the lesson?
        // With simplified filenames, collisions are possible across lessons if we ignore folders.
        // So we must check folder.

        // Let's reconstruct the expected path suffix
        // folderPath is "Subject/Lesson" (sanitized)
        // filename is "File.pdf" (sanitized)
        // Expected suffix: "Subject/Lesson/File.pdf" (with OS separators)

        // Since we don't know exact OS separator in this specific snippet easily without 'dart:io',
        // and downloadedFilesProvider gives FileSystemEntity.
        // Let's check loose match: contains(folderPath) AND endsWith(filename).

        return downloadedFiles.any((file) {
          final path = file.path;
          // Check filename match
          if (!path.endsWith(filename)) return false;

          // Check folder match (heuristic)
          // If we normalized folderPath to use /, we can check text.
          // Or just trust the filename if it's unique enough?
          // "Exercise1.pdf" is NOT unique.
          // So we definitely need to check parent folder.

          // Extract parent folder name
          // We can't import dart:io here easily if not already imports (it is in main imports usually, checking file...)
          // Assuming dart:io is available (it is in main imports usually, checking file...)
          // File 102 imports dart:io? No it imports dio, share_plus etc.
          // Wait, LessonCard imports download_service.dart.
          // I'll stick to string checks.
          return path.contains(
            folderPath.replaceAll('/', Platform.pathSeparator),
          );
        });
      });
    }

    final isBookmarked = ref
        .watch(bookmarksProvider.notifier)
        .isBookmarked(lesson.id);

    final bookmarkAction = SlidableAction(
      onPressed: (_) {
        ref.read(bookmarksProvider.notifier).toggleBookmark(lesson);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              isBookmarked ? 'Removed from Bookmarks' : 'Added to Bookmarks',
            ),
            duration: const Duration(seconds: 2),
            behavior: SnackBarBehavior.floating,
          ),
        );
      },
      backgroundColor: isBookmarked ? Colors.redAccent : Colors.orangeAccent,
      foregroundColor: Colors.white,
      icon: isBookmarked
          ? Icons.bookmark_remove_rounded
          : Icons.bookmark_add_rounded,
      label: isBookmarked ? 'Unsave' : 'Save',
      borderRadius: BorderRadius.circular(16),
    );

    final downloadAction = hasPdfResources
        ? SlidableAction(
            onPressed: (_) => _downloadLessonResources(context, ref),
            backgroundColor: AppColors.accent,
            foregroundColor: Colors.white,
            icon: Icons.download_rounded,
            label: AppLocalizations.of(context)?.pdf ?? 'PDF',
            borderRadius: BorderRadius.circular(16),
          )
        : null;

    final shareAction = SlidableAction(
      onPressed: (_) => _shareLessonInfo(),
      backgroundColor: AppColors.secondary,
      foregroundColor: Colors.white,
      icon: Icons.share_rounded,
      label: AppLocalizations.of(context)?.share ?? 'Share',
      borderRadius: BorderRadius.circular(16),
    );

    return Slidable(
          key: ValueKey(lesson.id),
          // Start actions (swipe right)
          startActionPane: ActionPane(
            motion: const ScrollMotion(),
            extentRatio: hasPdfResources ? 0.45 : 0.35,
            children: [if (downloadAction != null) downloadAction, shareAction],
          ),
          // End actions (swipe left)
          endActionPane: ActionPane(
            motion: const ScrollMotion(),
            extentRatio: 0.25,
            children: [bookmarkAction],
          ),
          child: InkWell(
            onTap: () {
              final subjects = ref.read(subjectsProvider).value;
              final subjectName =
                  subjects
                      ?.firstWhere(
                        (s) => s.id == lesson.subjectId,
                        orElse: () => subjects.first,
                      )
                      .title ??
                  '';
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => LessonDetailScreen(
                    lesson: lesson,
                    subjectName: subjectName,
                  ),
                ),
              );
            },
            borderRadius: BorderRadius.circular(16),
            child: Container(
              width: 160,
              margin: const EdgeInsets.symmetric(horizontal: 4),
              decoration: BoxDecoration(
                gradient: isFullyDownloaded
                    ? AppColors.greenGradient
                    : AppColors.blueGradient,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.1),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Thumbnail / Icon
                  Container(
                    height: 100,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(16),
                      ),
                    ),
                    child: Center(
                      child: Icon(
                        isFullyDownloaded
                            ? Icons.check_circle_rounded
                            : Icons.play_circle_fill_rounded,
                        size: 48,
                        color: Colors.white,
                      ),
                    ),
                  ),

                  // Details
                  Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          lesson.title,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(
                              Icons.file_copy_rounded,
                              size: 14,
                              color: Colors.white70,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '${lesson.totalResources} ${AppLocalizations.of(context)?.items ?? "items"}',
                              style: const TextStyle(
                                fontSize: 12,
                                color: Colors.white70,
                              ),
                            ),
                          ],
                        ),
                        if (completion > 0) ...[
                          const SizedBox(height: 8),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: LinearProgressIndicator(
                              value: completion,
                              minHeight: 4,
                              backgroundColor: Colors.white.withValues(
                                alpha: 0.2,
                              ),
                              valueColor: const AlwaysStoppedAnimation<Color>(
                                Colors.white,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        )
        .animate()
        .fadeIn(delay: (50 * index).ms, duration: 300.ms)
        .slideX(
          begin: 0.2,
          end: 0,
          delay: (50 * index).ms,
          duration: 400.ms,
          curve: Curves.easeOutCubic,
        );
  }
}
