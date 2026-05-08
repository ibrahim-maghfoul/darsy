import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/services/progress_service.dart';
import '../providers/auth_provider.dart';
import '../widgets/styled_snackbar.dart';

class PDFViewerScreen extends ConsumerStatefulWidget {
  final String title;
  final String pdfUrl;
  final String? lessonId;
  final String? subjectId;
  final String? resourceId;
  final String? docId;

  const PDFViewerScreen({
    super.key,
    required this.title,
    required this.pdfUrl,
    this.lessonId,
    this.subjectId,
    this.resourceId,
    this.docId,
  });

  @override
  ConsumerState<PDFViewerScreen> createState() => _PDFViewerScreenState();
}

class _PDFViewerScreenState extends ConsumerState<PDFViewerScreen> {
  final GlobalKey<SfPdfViewerState> _pdfViewerKey = GlobalKey();
  final PdfViewerController _pdfController = PdfViewerController();

  int _currentPage = 1;
  int _totalPages = 0;

  final Stopwatch _stopwatch = Stopwatch();
  late Timer? _timer;
  String _timeSpent = '00:00';

  @override
  void initState() {
    super.initState();
    _pdfController.addListener(_onPageChanged);
    _stopwatch.start();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          final duration = _stopwatch.elapsed;
          _timeSpent =
              '${duration.inMinutes.toString().padLeft(2, '0')}:${(duration.inSeconds % 60).toString().padLeft(2, '0')}';
        });
      }
    });

    // Track view automatically, but let user mark as read manually
    if (widget.lessonId != null) {
      final effectiveResourceId = widget.docId ?? widget.resourceId;
      if (effectiveResourceId != null) {
        WidgetsBinding.instance.addPostFrameCallback((_) async {
          try {
            final progressService = ref.read(progressServiceProvider);
            await progressService.trackResourceView(
              lessonId: widget.lessonId!,
              subjectId: widget.subjectId ?? '',
              resourceId: effectiveResourceId,
              resourceType: 'pdf',
            );
          } catch (e) {
            debugPrint('Failed to track PDF view: $e');
          }
        });
      }
    }
  }

  Future<void> _markAsRead() async {
    final effectiveResourceId = widget.docId ?? widget.resourceId;
    if (widget.lessonId == null || effectiveResourceId == null) return;

    try {
      final progressService = ref.read(progressServiceProvider);
      await progressService.markResourceComplete(
        lessonId: widget.lessonId!,
        subjectId: widget.subjectId ?? '',
        resourceId: effectiveResourceId,
        resourceType: 'pdf',
      );
      await ref.read(authProvider.notifier).refreshUser();
      if (mounted) {
        StyledSnackBar.showSuccess(context, 'Marked as read!');
      }
    } catch (e) {
      if (mounted) {
        StyledSnackBar.showError(context, 'Failed to mark as read: $e');
      }
    }
  }

  void _onPageChanged() {
    final newPage = _pdfController.pageNumber;
    if (newPage != _currentPage) {
      setState(() {
        _currentPage = newPage;
      });

      // Show native ad every N pages
      // if (_currentPage - _lastAdPage >= _adInterval && _currentPage > 1) {
      //   _showNativeAdOverlay();
      //   _lastAdPage = _currentPage;
      // }
    }
  }

  /*
  void _loadNativeAd() {
    _adService.loadNativeAd(
      onAdLoaded: (ad) {
        setState(() {
          _nativeAd = ad;
          _isNativeAdLoaded = true;
        });
      },
      onAdFailed: (ad, error) {
        debugPrint('Native ad failed to load: $error');
        ad.dispose();
      },
    );
  }
  */

  /*
  void _showNativeAdOverlay() {
    if (!_isNativeAdLoaded || _nativeAd == null) return;

    setState(() => _showNativeAd = true);

    // Auto-hide after 5 seconds or wait for user to close
    Future.delayed(const Duration(seconds: 5), () {
      if (mounted && _showNativeAd) {
        setState(() => _showNativeAd = false);
      }
    });
  }
  */

  @override
  void dispose() {
    _pdfController.removeListener(_onPageChanged);
    _pdfController.dispose();
    _stopwatch.stop();
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isNetwork = widget.pdfUrl.startsWith('http');
    final authState = ref.watch(authProvider);
    final effectiveResourceId = widget.docId ?? widget.resourceId;
    final isCompleted =
        authState.user?.progress?.lessons.any((l) {
          if (l is Map) {
            final completedResources = l['completedResources'] as List?;
            return completedResources?.contains(effectiveResourceId) ?? false;
          }
          return false;
        }) ??
        false;

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
        actions: [
          Text(
            _timeSpent,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
          ),
          const SizedBox(width: 12),
          if (widget.lessonId != null)
            IconButton(
              icon: Icon(
                isCompleted
                    ? Icons.check_circle_rounded
                    : Icons.check_circle_outline_rounded,
                color: Colors.green,
              ),
              onPressed: isCompleted ? null : _markAsRead,
              tooltip: isCompleted ? 'Completed' : 'Mark as read',
            ),
          IconButton(
            icon: const Icon(Icons.bookmark),
            onPressed: () {
              _pdfViewerKey.currentState?.openBookmarkView();
            },
          ),
        ],
      ),
      body: Stack(
        children: [
          // PDF Viewer
          isNetwork
              ? SfPdfViewer.network(
                  widget.pdfUrl,
                  key: _pdfViewerKey,
                  controller: _pdfController,
                  canShowScrollHead: true,
                  canShowScrollStatus: true,
                  onDocumentLoaded: (details) {
                    setState(() {
                      _totalPages = details.document.pages.count;
                    });
                  },
                )
              : SfPdfViewer.file(
                  File(widget.pdfUrl),
                  key: _pdfViewerKey,
                  controller: _pdfController,
                  canShowScrollHead: true,
                  canShowScrollStatus: true,
                  onDocumentLoaded: (details) {
                    setState(() {
                      _totalPages = details.document.pages.count;
                    });
                  },
                ),

          // Native Ad Overlay (appears between pages)
          // if (_showNativeAd && _isNativeAdLoaded && _nativeAd != null)
          //   Positioned.fill(
          //     child: Container(
          //       color: Colors.black87,
          //       child: Center(
          //         child: Container(
          //           constraints: const BoxConstraints(maxWidth: 400),
          //           margin: const EdgeInsets.all(20),
          //           decoration: BoxDecoration(
          //             color: Colors.white,
          //             borderRadius: BorderRadius.circular(16),
          //           ),
          //           child: Column(
          //             mainAxisSize: MainAxisSize.min,
          //             children: [
          //               // Close button
          //               Align(
          //                 alignment: Alignment.topRight,
          //                 child: IconButton(
          //                   icon: const Icon(Icons.close),
          //                   onPressed: () {
          //                     setState(() => _showNativeAd = false);
          //                   },
          //                 ),
          //               ),
          //               // Native Ad
          //               Container(
          //                 height: 300,
          //                 padding: const EdgeInsets.all(16),
          //                 child: AdWidget(ad: _nativeAd!),
          //               ),
          //               const SizedBox(height: 16),
          //               Text(
          //                 'Continue reading in $_adInterval seconds...',
          //                 style: const TextStyle(
          //                   fontSize: 12,
          //                   color: Colors.grey,
          //                 ),
          //               ),
          //               const SizedBox(height: 16),
          //             ],
          //           ),
          //         ),
          //       ),
          //     ),
          //   ),

          // Page indicator
          Positioned(
            top: 10,
            right: 10,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.black54,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                'Page $_currentPage${_totalPages > 0 ? ' / $_totalPages' : ''}',
                style: const TextStyle(color: Colors.white, fontSize: 12),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
