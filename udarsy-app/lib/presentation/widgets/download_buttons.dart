import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/app_colors.dart';
import '../../core/services/download_service.dart';
import '../../data/models/lesson_model.dart';
import '../providers/downloaded_files_provider.dart';
import 'styled_snackbar.dart';
import '../../l10n/app_localizations.dart';
import '../../core/services/ads_service.dart';

class FileDownloadButton extends ConsumerWidget {
  final LessonResource resource;
  final Lesson lesson;
  final String subjectName;
  final VoidCallback? onDownloadComplete;

  const FileDownloadButton({
    super.key,
    required this.resource,
    required this.lesson,
    required this.subjectName,
    this.onDownloadComplete,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final downloadedFilesAsync = ref.watch(downloadedFilesProvider);

    return downloadedFilesAsync.when(
      data: (files) {
        final isDownloaded = _checkDownloaded(files);

        if (isDownloaded) {
          return IconButton(
            icon: const Icon(Icons.delete_outline_rounded, color: Colors.grey),
            onPressed: () => _confirmDelete(context, ref),
            tooltip: AppLocalizations.of(context)?.delete ?? 'Delete',
          );
        }

        return IconButton(
          icon: Icon(
            Icons.cloud_download_rounded,
            color: Theme.of(context).brightness == Brightness.dark
                ? AppColors.secondary
                : AppColors.primary,
          ),
          onPressed: () => _downloadFile(context, ref),
          tooltip: AppLocalizations.of(context)?.download ?? 'Download',
        );
      },
      loading: () => const SizedBox(
        width: 24,
        height: 24,
        child: CircularProgressIndicator(strokeWidth: 2),
      ),
      error: (_, __) => const Icon(Icons.error_outline, color: AppColors.error),
    );
  }

  bool _checkDownloaded(List<FileSystemEntity> files) {
    final safeLessonTitle = lesson.title.replaceAll(
      RegExp(r'[<>:"/\\|?*]'),
      '',
    );
    final safeFileTitle = resource.title.replaceAll(
      RegExp(r'[<>:"/\\|?*]'),
      '',
    );
    final filename = '$safeFileTitle.pdf';

    String folderPath = safeLessonTitle;
    if (subjectName.isNotEmpty) {
      final safeSubject = subjectName.replaceAll(RegExp(r'[<>:"/\\|?*]'), '');
      folderPath = '$safeSubject/$safeLessonTitle';
    }

    final normalizedFolder = folderPath.replaceAll('/', Platform.pathSeparator);

    return files.any((file) {
      return file.path.endsWith(filename) &&
          file.path.contains(normalizedFolder);
    });
  }

  Future<void> _downloadFile(BuildContext context, WidgetRef ref) async {
    final service = DownloadService();
    if (!await service.requestPermission()) return;

    // Show Interstitial Ad before download
    final adsService = ref.read(adsServiceProvider);

    // Check if ad is ready before showing
    if (!adsService.isInterstitialAdReady) {
      await _proceedWithDownload(context, ref, service);
      return;
    }

    final showed = adsService.showInterstitialAd(
      onAdDismissed: () {
        _proceedWithDownload(context, ref, service);
      },
    );

    // If ad not ready (should have been caught above, but safety check), proceed immediately
    if (!showed) {
      debugPrint('Interstitial ad not ready for download, proceeding anyway');
      _proceedWithDownload(context, ref, service);
    }
  }

  Future<void> _proceedWithDownload(
    BuildContext context,
    WidgetRef ref,
    DownloadService service,
  ) async {
    final progressNotifier = ValueNotifier<double>(0.0);
    // Use a ValueNotifier for cancellation to share state across async gaps
    final isCancelledNotifier = ValueNotifier<bool>(false);

    if (context.mounted) {
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: ValueListenableBuilder<double>(
            valueListenable: progressNotifier,
            builder: (context, progress, child) {
              return Row(
                children: [
                  SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      value: progress > 0 ? progress : null,
                      backgroundColor: Colors.white24,
                      color: Colors.white,
                      strokeWidth: 2,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Downloading ${resource.title}...',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              );
            },
          ),
          backgroundColor: Theme.of(context).brightness == Brightness.dark
              ? AppColors.secondary
              : AppColors.primary,
          duration: const Duration(minutes: 2),
          action: SnackBarAction(
            label: 'CANCEL',
            textColor: Theme.of(context).brightness == Brightness.dark
                ? Colors.black
                : Colors.white,
            onPressed: () => isCancelledNotifier.value = true,
          ),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }

    // Show styled loading dialog for interstitial ad
    if (context.mounted) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => Center(
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const CircularProgressIndicator(),
                const SizedBox(height: 16),
                Text(
                  'Loading Ad...',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ],
            ),
          ),
        ),
      );
    }

    // Wait for interstitial ad to be ready
    final adsService = ref.read(adsServiceProvider);
    await adsService.loadInterstitialAd();

    // Close loading dialog
    if (context.mounted) {
      Navigator.of(context, rootNavigator: true).pop();
    }

    if (!context.mounted) return;

    // Show Interstitial Ad before download
    adsService.showInterstitialAd(
      onAdDismissed: () {
        if (!isCancelledNotifier.value) {
          _startDownload(context, ref, service);
        }
      },
    );
  }

  Future<void> _startDownload(
    BuildContext context,
    WidgetRef ref,
    DownloadService service,
  ) async {
    final progressNotifier = ValueNotifier<double>(0);
    bool isCancelled = false;

    if (context.mounted) {
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Colors.white,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: ValueListenableBuilder<double>(
                  valueListenable: progressNotifier,
                  builder: (context, progress, child) =>
                      Text('Downloading... ${(progress * 100).toInt()}%'),
                ),
              ),
            ],
          ),
          action: SnackBarAction(
            label: 'CANCEL',
            textColor: Colors.white,
            onPressed: () => isCancelled = true,
          ),
          backgroundColor: AppColors.secondary,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          margin: const EdgeInsets.all(16),
        ),
      );
    }

    final safeLessonTitle = lesson.title.replaceAll(
      RegExp(r'[<>:"/\\|?*]'),
      '',
    );
    final safeFileTitle = resource.title.replaceAll(
      RegExp(r'[<>:"/\\|?*]'),
      '',
    );
    final filename = '$safeFileTitle.pdf';

    String folderPath = safeLessonTitle;
    if (subjectName.isNotEmpty) {
      final safeSubject = subjectName.replaceAll(RegExp(r'[<>:"/\\|?*]'), '');
      folderPath = '$safeSubject/$safeLessonTitle';
    }

    try {
      await service.downloadFile(
        resource.url,
        filename,
        subjectName: folderPath,
        onProgress: (received, total) {
          if (total != -1) {
            progressNotifier.value = received / total;
          }
        },
      );
      if (isCancelled) return;

      if (context.mounted) {
        StyledSnackBar.showSuccess(
          context,
          '${resource.title} downloaded successfully',
        );
      }

      await ref.read(downloadedFilesProvider.notifier).refresh();
      onDownloadComplete?.call();
    } catch (e) {
      if (context.mounted) {
        StyledSnackBar.showError(context, 'Download failed: $e');
      }
    }
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(AppLocalizations.of(context)?.delete ?? 'Delete File?'),
        content: Text('Delete "${resource.title}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('CANCEL'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('DELETE'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final service = DownloadService();
      final safeLessonTitle = lesson.title.replaceAll(
        RegExp(r'[<>:"/\\|?*]'),
        '',
      );
      final safeFileTitle = resource.title.replaceAll(
        RegExp(r'[<>:"/\\|?*]'),
        '',
      );
      final filename = '$safeFileTitle.pdf';

      String folderPath = safeLessonTitle;
      if (subjectName.isNotEmpty) {
        final safeSubject = subjectName.replaceAll(RegExp(r'[<>:"/\\|?*]'), '');
        folderPath = '$safeSubject/$safeLessonTitle';
      }

      final path = await service.getFilePath(filename, subjectName: folderPath);
      final file = File(path);

      if (await file.exists()) {
        await file.delete();
        await ref.read(downloadedFilesProvider.notifier).refresh();
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('File deleted'),
              backgroundColor: AppColors.error,
            ),
          );
        }
      }
    }
  }
}

class LessonDownloadButton extends ConsumerWidget {
  final Lesson lesson;
  final String subjectName;

  const LessonDownloadButton({
    super.key,
    required this.lesson,
    required this.subjectName,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final downloadedFilesAsync = ref.watch(downloadedFilesProvider);

    return downloadedFilesAsync.when(
      data: (files) {
        final status = _checkStatus(files);

        switch (status) {
          case LessonDownloadStatus.downloaded:
            return Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.success.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.cloud_done_rounded,
                color: AppColors.success,
                size: 20,
              ),
            );
          case LessonDownloadStatus.partial:
            return Stack(
              alignment: Alignment.center,
              children: [
                const SizedBox(
                  width: 32,
                  height: 32,
                  child: CircularProgressIndicator(
                    value: 0.7,
                    strokeWidth: 2,
                    color: Colors.orange,
                  ),
                ),
                IconButton(
                  icon: const Icon(
                    Icons.cloud_download_rounded,
                    color: Colors.orange,
                    size: 18,
                  ),
                  onPressed: () => _downloadLesson(context, ref),
                  tooltip: 'Complete Download',
                  constraints: const BoxConstraints(
                    minWidth: 32,
                    minHeight: 32,
                  ),
                  padding: EdgeInsets.zero,
                ),
              ],
            );
          case LessonDownloadStatus.none:
            return Container(
              decoration: BoxDecoration(
                color: Theme.of(context).brightness == Brightness.dark
                    ? AppColors.secondary.withOpacity(0.2)
                    : AppColors.primary.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: IconButton(
                icon: Icon(
                  Icons.cloud_download_rounded,
                  color: Theme.of(context).brightness == Brightness.dark
                      ? AppColors.textGrey.withOpacity(0.8)
                      : AppColors.textGrey.withOpacity(0.5),
                  size: 20,
                ),
                onPressed: () => _downloadLesson(context, ref),
                tooltip: AppLocalizations.of(context)?.download ?? 'Download',
                constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                padding: EdgeInsets.zero,
              ),
            );
        }
      },
      loading: () => const SizedBox(
        width: 20,
        height: 20,
        child: CircularProgressIndicator(strokeWidth: 2),
      ),
      error: (_, __) => const Icon(Icons.error_outline, size: 20),
    );
  }

  LessonDownloadStatus _checkStatus(List<FileSystemEntity> files) {
    final pdfs = [
      ...lesson.coursesPdf,
      ...lesson.exercices.where((e) => e.url.toLowerCase().endsWith('.pdf')),
      ...lesson.exams,
    ];

    if (pdfs.isEmpty) return LessonDownloadStatus.none;

    int foundCount = 0;
    final safeLessonTitle = lesson.title.replaceAll(
      RegExp(r'[<>:"/\\|?*]'),
      '',
    );
    final safeSubject = subjectName.replaceAll(RegExp(r'[<>:"/\\|?*]'), '');
    final folderPath = '$safeSubject/$safeLessonTitle';
    final normalizedFolder = folderPath.replaceAll('/', Platform.pathSeparator);

    for (var pdf in pdfs) {
      final safeFileTitle = pdf.title.replaceAll(RegExp(r'[<>:"/\\|?*]'), '');
      final filename = '$safeFileTitle.pdf';

      if (files.any(
        (f) => f.path.endsWith(filename) && f.path.contains(normalizedFolder),
      )) {
        foundCount++;
      }
    }

    if (foundCount == pdfs.length) return LessonDownloadStatus.downloaded;
    if (foundCount > 0) return LessonDownloadStatus.partial;
    return LessonDownloadStatus.none;
  }

  Future<void> _downloadLesson(BuildContext context, WidgetRef ref) async {
    final pdfs = [
      ...lesson.coursesPdf,
      ...lesson.exercices.where((e) => e.url.toLowerCase().endsWith('.pdf')),
      ...lesson.exams,
    ];

    if (pdfs.isEmpty) return;

    final service = DownloadService();
    if (!await service.requestPermission()) return;

    // Show confirmation dialog first
    if (!context.mounted) return;

    final shouldProceed = await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Theme.of(context).scaffoldBackgroundColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 10,
              offset: const Offset(0, -4),
            ),
          ],
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
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.cloud_download_rounded,
                  size: 48,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Download Full Lesson',
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              Text(
                'You are about to download ${pdfs.length} files for offline access.',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'To support our free educational content, please watch a short rewarded ad.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14, color: AppColors.textGrey),
              ),
              const SizedBox(height: 32),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      onPressed: () => Navigator.of(context).pop(false),
                      child: const Text('Cancel'),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      onPressed: () => Navigator.of(context).pop(true),
                      child: const Text(
                        'Watch Ad',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );

    if (shouldProceed != true || !context.mounted) return;

    // Show styled loading dialog while waiting for ad
    if (context.mounted) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => Center(
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const CircularProgressIndicator(),
                const SizedBox(height: 16),
                Text(
                  'Loading Ad...',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ],
            ),
          ),
        ),
      );
    }

    // Wait for ad to be ready
    final adsService = ref.read(adsServiceProvider);
    final isReady = await adsService.loadRewardedAd();

    // Close loading dialog
    if (context.mounted) {
      Navigator.of(context, rootNavigator: true).pop();
    }

    if (!context.mounted) return;

    if (!isReady) {
      debugPrint('❌ Rewarded ad failed to load after waiting');
      if (context.mounted) {
        StyledSnackBar.showError(
          context,
          'Ad failed to load. Please check your connection and try again.',
        );
      }
      return;
    }

    bool rewardEarned = false;

    // Show Rewarded Ad
    final showed = adsService.showRewardedAd(
      onUserEarnedReward: (reward) {
        debugPrint('✅ User earned reward: ${reward.amount} ${reward.type}');
        rewardEarned = true;
        _startDownload(context, ref, pdfs, service);
      },
      onAdDismissed: () {
        debugPrint('⚠️ Rewarded ad dismissed. Earned: $rewardEarned');
        if (!rewardEarned && context.mounted) {
          StyledSnackBar.showWarning(
            context,
            'Please watch the complete ad to download',
          );
        }
      },
    );

    // If ad didn't show (shouldn't happen if isReady is true, but safe check)
    if (!showed && context.mounted) {
      StyledSnackBar.showError(
        context,
        'Something went wrong. Please try again.',
      );
    }
  }

  Future<void> _startDownload(
    BuildContext context,
    WidgetRef ref,
    List<dynamic> pdfs,
    DownloadService service,
  ) async {
    final progressNotifier = ValueNotifier<double>(0.0);
    final currentDocNotifier = ValueNotifier<String>('');
    bool isCancelled = false;

    if (context.mounted) {
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: ValueListenableBuilder<double>(
            valueListenable: progressNotifier,
            builder: (context, progress, child) {
              return ValueListenableBuilder<String>(
                valueListenable: currentDocNotifier,
                builder: (context, currentTitle, child) {
                  return Row(
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
                  );
                },
              );
            },
          ),
          action: SnackBarAction(
            label: 'CANCEL',
            textColor: Theme.of(context).brightness == Brightness.dark
                ? Colors.black
                : Colors.white,
            onPressed: () => isCancelled = true,
          ),
          backgroundColor: Theme.of(context).brightness == Brightness.dark
              ? AppColors.secondary
              : AppColors.primary,
          duration: const Duration(minutes: 5),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }

    final safeLessonTitle = lesson.title.replaceAll(
      RegExp(r'[<>:"/\\|?*]'),
      '',
    );
    final safeSubject = subjectName.replaceAll(RegExp(r'[<>:"/\\|?*]'), '');
    final folderPath = '$safeSubject/$safeLessonTitle';

    int completed = 0;
    for (var resource in pdfs) {
      if (isCancelled) break;
      currentDocNotifier.value = resource.title;
      final safeFileTitle = resource.title.replaceAll(
        RegExp(r'[<>:"/\\|?*]'),
        '',
      );
      final filename = '$safeFileTitle.pdf';

      try {
        await service.downloadFile(
          resource.url,
          filename,
          subjectName: folderPath,
          onProgress: (received, total) {
            if (total != -1) {
              final fileProgress = received / total;
              progressNotifier.value = (completed + fileProgress) / pdfs.length;
            }
          },
        );
        completed++;
        progressNotifier.value = completed / pdfs.length;
      } catch (e) {
        debugPrint('Error downloading $filename: $e');
      }
    }

    if (context.mounted) ScaffoldMessenger.of(context).hideCurrentSnackBar();
    await ref.read(downloadedFilesProvider.notifier).refresh();
  }
}

enum LessonDownloadStatus { none, partial, downloaded }
