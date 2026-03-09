import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_slidable/flutter_slidable.dart';
import 'package:share_plus/share_plus.dart';
import 'package:path_provider/path_provider.dart';
import '../../core/app_colors.dart';
import '../../core/services/download_service.dart';
import '../../core/services/ads_service.dart';
import '../../core/services/connectivity_service.dart';
import '../../l10n/app_localizations.dart';
import 'pdf_viewer_screen.dart';
import '../providers/downloaded_files_provider.dart';
import '../providers/auth_provider.dart';
import '../widgets/native_ad_widget.dart';

class DownloadedScreen extends ConsumerWidget {
  const DownloadedScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // ... existing build method ...
    final filesAsync = ref.watch(downloadedFilesProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(AppLocalizations.of(context)?.downloaded ?? 'Downloads'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ref.read(downloadedFilesProvider.notifier).refresh();
            },
          ),
          IconButton(
            icon: const Icon(Icons.delete_forever_rounded),
            onPressed: () => _showDeleteAllDialog(context, ref),
          ),
        ],
      ),
      body: filesAsync.when(
        skipLoadingOnRefresh: true,
        data: (files) {
          if (files.isEmpty) {
            return _buildEmptyState(context);
          }

          // Filter PDFs
          final pdfFiles = files
              .where((file) => file.path.endsWith('.pdf'))
              .toList();

          if (pdfFiles.isEmpty) {
            return _buildEmptyState(context);
          }

          // Group by Subject → Lesson → Files (3 levels)
          final Map<String, Map<String, List<FileSystemEntity>>> groupedFiles =
              {};

          for (var file in pdfFiles) {
            // Extract subject and lesson from path
            // Path structure should be: .../documents/Subject/Lesson/file.pdf
            String subjectName = 'Misc';
            String lessonName = 'Misc';

            // Split the full path and find our custom directories
            final pathParts = file.path.split(Platform.pathSeparator);

            // Find the index after common system directories
            int startIndex = -1;
            for (int i = pathParts.length - 1; i >= 0; i--) {
              if (pathParts[i] == 'app_flutter' ||
                  pathParts[i] == 'documents' ||
                  pathParts[i] == 'files') {
                startIndex = i + 1;
                break;
              }
            }

            if (startIndex != -1 && startIndex < pathParts.length - 1) {
              // We have at least one custom directory
              final customParts = pathParts.sublist(
                startIndex,
                pathParts.length - 1,
              ); // Exclude filename

              if (customParts.length >= 2) {
                // Subject/Lesson/file.pdf
                subjectName = customParts[0];
                lessonName = customParts[1];
              } else if (customParts.length == 1) {
                // Lesson/file.pdf (no subject)
                lessonName = customParts[0];
              }
            }

            if (!groupedFiles.containsKey(subjectName)) {
              groupedFiles[subjectName] = {};
            }
            if (!groupedFiles[subjectName]!.containsKey(lessonName)) {
              groupedFiles[subjectName]![lessonName] = [];
            }
            groupedFiles[subjectName]![lessonName]!.add(file);
          }

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: groupedFiles.length,
            itemBuilder: (context, subjectIndex) {
              final subjectName = groupedFiles.keys.elementAt(subjectIndex);
              final lessons = groupedFiles[subjectName]!;
              final totalFiles = lessons.values.fold<int>(
                0,
                (sum, files) => sum + files.length,
              );

              return _AnimatedSubjectItem(
                key: ValueKey(subjectName),
                subjectName: subjectName,
                lessons: lessons,
                totalFiles: totalFiles,
              );
            },
            separatorBuilder: (context, index) {
              // Show native ad every 3 subjects, but only if online
              if ((index + 1) % 3 == 0) {
                return FutureBuilder<bool>(
                  future: ref
                      .read(connectivityServiceProvider)
                      .hasInternetConnection(),
                  builder: (context, snapshot) {
                    if (snapshot.hasData && snapshot.data == true) {
                      return const Column(
                        children: [
                          SizedBox(height: 12),
                          NativeAdWidget(height: 300),
                          SizedBox(height: 12),
                        ],
                      );
                    }
                    return const SizedBox.shrink();
                  },
                );
              }
              return const SizedBox.shrink();
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.download_outlined,
            size: 80,
            color: AppColors.grey.withOpacity(0.5),
          ),
          const SizedBox(height: 16),
          Text(
            AppLocalizations.of(context)?.noDownloads ?? 'No Downloads',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: AppColors.grey.withOpacity(0.7),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            AppLocalizations.of(context)?.downloadOfflineMessage ??
                'Download PDFs to access them offline',
            style: TextStyle(
              fontSize: 14,
              color: AppColors.grey.withOpacity(0.5),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _showDeleteAllDialog(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete All Downloads?'),
        content: const Text(
          'This will remove ALL downloaded files. This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('CANCEL'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('DELETE ALL'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        final dir = await getApplicationDocumentsDirectory();
        if (await dir.exists()) {
          await for (var entity in dir.list()) {
            await entity.delete(recursive: true);
          }
        }
        await ref.read(downloadedFilesProvider.notifier).refresh();
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('All downloads deleted'),
              backgroundColor: AppColors.error,
            ),
          );
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Error deleting files: $e'),
              backgroundColor: AppColors.error,
            ),
          );
        }
      }
    }
  }
}

class _AnimatedSubjectItem extends ConsumerStatefulWidget {
  final String subjectName;
  final Map<String, List<FileSystemEntity>> lessons;
  final int totalFiles;

  const _AnimatedSubjectItem({
    super.key,
    required this.subjectName,
    required this.lessons,
    required this.totalFiles,
  });

  @override
  ConsumerState<_AnimatedSubjectItem> createState() =>
      _AnimatedSubjectItemState();
}

class _AnimatedSubjectItemState extends ConsumerState<_AnimatedSubjectItem> {
  bool _isDeleting = false;

  Future<void> _handleDelete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Entire Subject?'),
        content: Text(
          'This will remove all downloaded files for "${widget.subjectName}". This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('CANCEL'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('DELETE ALL'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      setState(() => _isDeleting = true);
      await Future.delayed(const Duration(milliseconds: 300));
      await DownloadService().deleteSubject(widget.subjectName);
      ref
          .read(downloadedFilesProvider.notifier)
          .deleteSubjectLocal(widget.subjectName);
      // Still refresh in background for consistency
      ref.read(downloadedFilesProvider.notifier).refresh();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Deleted all files for ${widget.subjectName}'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedOpacity(
      opacity: _isDeleting ? 0.0 : 1.0,
      duration: const Duration(milliseconds: 300),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        height: _isDeleting ? 0 : null,
        curve: Curves.easeInOut,
        margin: EdgeInsets.only(bottom: _isDeleting ? 0 : 12),
        child: _isDeleting
            ? const SizedBox.shrink()
            : Container(
                decoration: BoxDecoration(
                  gradient: AppColors.orangeGradient,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.accent.withValues(alpha: 0.3),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Theme(
                  data: Theme.of(
                    context,
                  ).copyWith(dividerColor: Colors.transparent),
                  child: ExpansionTile(
                    key: PageStorageKey(widget.subjectName),
                    leading: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.folder_rounded,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                    title: Row(
                      children: [
                        Expanded(
                          child: Text(
                            widget.subjectName,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(
                            Icons.delete_sweep_rounded,
                            color: Colors.white,
                            size: 20,
                          ),
                          onPressed: _handleDelete,
                        ),
                      ],
                    ),
                    subtitle: Text(
                      '${widget.totalFiles} ${AppLocalizations.of(context)?.items ?? "items"}',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.white.withValues(alpha: 0.8),
                      ),
                    ),
                    iconColor: Colors.white,
                    collapsedIconColor: Colors.white,
                    childrenPadding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    children: widget.lessons.entries.map((lessonEntry) {
                      return _AnimatedLessonItem(
                        key: ValueKey(
                          '${widget.subjectName}-${lessonEntry.key}',
                        ),
                        subjectName: widget.subjectName,
                        lessonName: lessonEntry.key,
                        lessonFiles: lessonEntry.value,
                      );
                    }).toList(),
                  ),
                ),
              ),
      ),
    );
  }
}

class _AnimatedLessonItem extends ConsumerStatefulWidget {
  final String subjectName;
  final String lessonName;
  final List<FileSystemEntity> lessonFiles;

  const _AnimatedLessonItem({
    super.key,
    required this.subjectName,
    required this.lessonName,
    required this.lessonFiles,
  });

  @override
  ConsumerState<_AnimatedLessonItem> createState() =>
      _AnimatedLessonItemState();
}

class _AnimatedLessonItemState extends ConsumerState<_AnimatedLessonItem> {
  bool _isDeleting = false;

  Future<void> _handleDelete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Entire Lesson?'),
        content: Text(
          'This will remove all downloaded files for "${widget.lessonName}". This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('CANCEL'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('DELETE ALL'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      setState(() => _isDeleting = true);
      await Future.delayed(const Duration(milliseconds: 300));
      await DownloadService().deleteLesson(
        widget.subjectName,
        widget.lessonName,
      );
      ref
          .read(downloadedFilesProvider.notifier)
          .deleteLessonLocal(widget.subjectName, widget.lessonName);
      // Still refresh in background for consistency
      ref.read(downloadedFilesProvider.notifier).refresh();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Deleted all files for ${widget.lessonName}'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedOpacity(
      opacity: _isDeleting ? 0.0 : 1.0,
      duration: const Duration(milliseconds: 300),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        height: _isDeleting ? 0 : null,
        curve: Curves.easeInOut,
        margin: EdgeInsets.only(bottom: _isDeleting ? 0 : 8),
        child: _isDeleting
            ? const SizedBox.shrink()
            : Container(
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surfaceVariant,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Theme(
                  data: Theme.of(
                    context,
                  ).copyWith(dividerColor: Colors.transparent),
                  child: ExpansionTile(
                    key: PageStorageKey(
                      '${widget.subjectName}-${widget.lessonName}',
                    ),
                    leading: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: Colors.orange.withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.folder_open_rounded,
                        color: Colors.white,
                        size: 16,
                      ),
                    ),
                    title: Row(
                      children: [
                        Expanded(
                          child: Text(
                            widget.lessonName,
                            style: Theme.of(context).textTheme.titleSmall
                                ?.copyWith(fontWeight: FontWeight.w600),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(
                            Icons.delete_outline_rounded,
                            color: Colors.redAccent,
                            size: 18,
                          ),
                          onPressed: _handleDelete,
                        ),
                      ],
                    ),
                    subtitle: Text(
                      '${widget.lessonFiles.length} ${AppLocalizations.of(context)?.items ?? "items"}',
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textGrey,
                      ),
                    ),
                    childrenPadding: const EdgeInsets.symmetric(
                      horizontal: 4,
                      vertical: 2,
                    ),
                    children: widget.lessonFiles.map((file) {
                      return _AnimatedFileItem(
                        key: ValueKey(file.path),
                        file: file as File,
                      );
                    }).toList(),
                  ),
                ),
              ),
      ),
    );
  }
}

class _AnimatedFileItem extends ConsumerStatefulWidget {
  final File file;
  const _AnimatedFileItem({super.key, required this.file});

  @override
  ConsumerState<_AnimatedFileItem> createState() => _AnimatedFileItemState();
}

class _AnimatedFileItemState extends ConsumerState<_AnimatedFileItem> {
  bool _isDeleting = false;

  Future<void> _handleDelete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete File?'),
        content: Text(
          'Delete "${widget.file.path.split(Platform.pathSeparator).last}"?',
        ),
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
      setState(() => _isDeleting = true);
      // Wait for animation
      await Future.delayed(const Duration(milliseconds: 300));
      try {
        await widget.file.delete();
        ref
            .read(downloadedFilesProvider.notifier)
            .deleteEntityLocal(widget.file.path);
        // Still refresh in background for consistency
        ref.read(downloadedFilesProvider.notifier).refresh();
      } catch (e) {
        if (mounted) {
          setState(() => _isDeleting = false);
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text('Error: $e')));
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = widget.file.path.split(Platform.pathSeparator).last;
    final stat = widget.file.statSync();
    final sizeMb = (stat.size / (1024 * 1024)).toStringAsFixed(2);
    final date = stat.modified.toString().split('.')[0];

    return AnimatedOpacity(
      opacity: _isDeleting ? 0.0 : 1.0,
      duration: const Duration(milliseconds: 300),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        height: _isDeleting ? 0 : 80, // Approximate height
        margin: EdgeInsets.only(bottom: _isDeleting ? 0 : 12),
        curve: Curves.easeInOut,
        child: OverflowBox(
          minHeight: 0,
          maxHeight: 80,
          alignment: Alignment.topCenter,
          child: SizedBox(
            height: 80,
            child: Slidable(
              key: ValueKey(widget.file.path),
              startActionPane: ActionPane(
                motion: const ScrollMotion(),
                children: [
                  SlidableAction(
                    onPressed: (_) async {
                      try {
                        final xFile = XFile(widget.file.path);
                        await Share.shareXFiles([xFile], text: name);
                      } catch (e) {
                        debugPrint('Error sharing: $e');
                      }
                    },
                    backgroundColor: AppColors.secondary,
                    foregroundColor: Colors.white,
                    icon: Icons.share_rounded,
                    label: AppLocalizations.of(context)?.share ?? 'Share',
                    borderRadius: BorderRadius.circular(16),
                  ),
                ],
              ),
              endActionPane: ActionPane(
                motion: const ScrollMotion(),
                children: [
                  SlidableAction(
                    onPressed: (_) => _handleDelete(),
                    backgroundColor: AppColors.error,
                    foregroundColor: Colors.white,
                    icon: Icons.delete_outline_rounded,
                    label: AppLocalizations.of(context)?.delete ?? 'Delete',
                    borderRadius: BorderRadius.circular(16),
                  ),
                ],
              ),
              child: Card(
                margin: EdgeInsets.zero,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                child: ListTile(
                  contentPadding: const EdgeInsets.all(12),
                  leading: Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: Theme.of(
                        context,
                      ).colorScheme.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      Icons.picture_as_pdf_rounded,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                  ),
                  title: Row(
                    children: [
                      Expanded(
                        child: Text(
                          name,
                          style: const TextStyle(fontWeight: FontWeight.w600),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Consumer(
                        builder: (context, ref, child) {
                          final user = ref.watch(authProvider).user;
                          final cleanName = name.replaceAll('.pdf', '');
                          final isCompleted =
                              user?.progress?.lessons.any((l) {
                                if (l is Map) {
                                  final completedResources =
                                      l['completedResources'] as List?;
                                  return completedResources?.contains(
                                        cleanName,
                                      ) ??
                                      false;
                                }
                                return false;
                              }) ??
                              false;

                          if (!isCompleted) return const SizedBox.shrink();

                          return Container(
                            margin: const EdgeInsets.only(left: 8),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.green,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Text(
                              'Read',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                  subtitle: Text(
                    '$sizeMb MB • $date',
                    style: const TextStyle(fontSize: 12),
                  ),
                  trailing: IconButton(
                    icon: const Icon(
                      Icons.delete_outline_rounded,
                      color: Colors.grey,
                      size: 20,
                    ),
                    onPressed: _handleDelete,
                  ),
                  onTap: () {
                    // Show interstitial ad before opening PDF
                    final showed = ref
                        .read(adsServiceProvider)
                        .showInterstitialAd(
                          onAdDismissed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (context) => PDFViewerScreen(
                                  title: name,
                                  pdfUrl: widget.file.path,
                                ),
                              ),
                            );
                          },
                        );

                    // If ad not ready, navigate immediately
                    if (!showed) {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) => PDFViewerScreen(
                            title: name,
                            pdfUrl: widget.file.path,
                          ),
                        ),
                      );
                    }
                  },
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
