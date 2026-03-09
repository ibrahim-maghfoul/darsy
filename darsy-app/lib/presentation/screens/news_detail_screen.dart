import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/app_colors.dart';
import '../../core/services/api_service.dart';
import '../../core/services/news_service.dart';
import '../../data/models/news_model.dart';
import '../providers/auth_provider.dart';
import '../widgets/styled_snackbar.dart';
import '../../core/utils/bidi_helper.dart';
import '../../l10n/app_localizations.dart';
import 'pdf_viewer_screen.dart';

class NewsDetailScreen extends ConsumerStatefulWidget {
  final NewsModel news;

  const NewsDetailScreen({super.key, required this.news});

  @override
  ConsumerState<NewsDetailScreen> createState() => _NewsDetailScreenState();
}

class _NewsDetailScreenState extends ConsumerState<NewsDetailScreen> {
  late NewsModel _news;
  bool _isLoadingFullNews = true;
  bool _isSaved = false;
  bool _isSaving = false;
  double _userRating = 0;
  List<dynamic> _questions = [];
  bool _isLoadingComments = false;
  bool _isOffline = false;

  Future<void> _launchURL(String urlString) async {
    final Uri url = Uri.parse(urlString);
    if (!await launchUrl(url, mode: LaunchMode.externalApplication)) {
      throw Exception('Could not launch $url');
    }
  }

  @override
  void initState() {
    super.initState();
    _news = widget.news;
    // _loadBannerAd(); // Ads disabled
    _trackView();
    _checkIfSaved();
    _fetchComments();
    _fetchFullNews();
    _loadUserRating();
  }

  void _loadUserRating() {
    setState(() => _userRating = _news.userRating);
  }

  Future<void> _fetchFullNews() async {
    try {
      final fullNews = await ref
          .read(newsServiceProvider)
          .getNewsById(_news.id);
      if (mounted) {
        setState(() {
          _news = fullNews;
          _isLoadingFullNews = false;
          _userRating = _news.userRating; // Sync user rating from fetched data
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoadingFullNews = false;
          _isOffline = true;
        });
        StyledSnackBar.showError(
          context,
          'لا يمكن الاتصال بالخادم. عرض البيانات المخزنة مؤقتًا.',
        );
      }
    }
  }

  Future<void> _fetchComments() async {
    if (!mounted) return;
    setState(() => _isLoadingComments = true);
    try {
      final questions = await ref
          .read(newsServiceProvider)
          .getQuestions(_news.id);
      if (mounted) {
        setState(() {
          _questions = questions;
          _isLoadingComments = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoadingComments = false);
    }
  }

  Future<void> _trackView() async {
    try {
      await ref.read(newsServiceProvider).trackView(_news.id);
      if (mounted) {
        setState(() {
          _news = _news.copyWith(viewCount: _news.viewCount + 1);
        });
      }
    } catch (_) {}
  }

  void _checkIfSaved() {
    final user = ref.read(authProvider).user;
    final savedNews = user?.progress?.savedNews ?? [];
    setState(() => _isSaved = savedNews.contains(_news.id));
  }

  final _commentController = TextEditingController();

  Future<void> _postComment() async {
    final text = _commentController.text.trim();
    if (text.isEmpty) return;

    if (!ref.read(authProvider).isAuthenticated) {
      StyledSnackBar.showError(
        context,
        context.translate('login_required_comment'),
      );
      return;
    }

    try {
      await ref.read(newsServiceProvider).askQuestion(_news.id, text);
      _commentController.clear();
      await _fetchComments(); // Refresh comments list
      if (mounted) {
        StyledSnackBar.showSuccess(context, context.translate('comment_added'));
      }
    } catch (e) {
      if (mounted) {
        StyledSnackBar.showError(context, 'فشل في إضافة التعليق: $e');
      }
    }
  }

  Future<void> _deleteComment(String questionId) async {
    try {
      await ref.read(newsServiceProvider).deleteQuestion(_news.id, questionId);
      await _fetchComments();
      if (mounted) {
        StyledSnackBar.showSuccess(
          context,
          context.translate('comment_deleted'),
        );
      }
    } catch (e) {
      if (mounted) {
        StyledSnackBar.showError(context, 'فشل في حذف التعليق: $e');
      }
    }
  }

  Future<void> _toggleSave() async {
    if (!ref.read(authProvider).isAuthenticated) {
      StyledSnackBar.showError(
        context,
        context.translate('login_required_save'),
      );
      return;
    }

    setState(() => _isSaving = true);
    try {
      final api = ref.read(apiServiceProvider);
      await api.post('/user/saved-news', data: {'newsId': _news.id});
      setState(() => _isSaved = !_isSaved);
      if (mounted) {
        if (_isSaved) {
          StyledSnackBar.showFavoriteSuccess(
            context,
            context.translate('added_to_favorites'),
          );
        } else {
          StyledSnackBar.showInfo(
            context,
            context.translate('removed_from_favorites'),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        StyledSnackBar.showError(context, 'حدث خطأ: $e');
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<void> _rateNews(double rating) async {
    if (_userRating > 0) {
      StyledSnackBar.showInfo(context, 'لقد قمت بتقييم هذا الخبر بالفعل.');
      return;
    }

    if (!ref.read(authProvider).isAuthenticated) {
      StyledSnackBar.showError(
        context,
        context.translate('login_required_rate'),
      );
      return;
    }

    try {
      final newsService = ref.read(newsServiceProvider);
      final response = await newsService.rateNews(_news.id, rating);

      if (mounted) {
        setState(() {
          _userRating = rating;
          if (response != null && response['rating'] != null) {
            _news = _news.copyWith(
              rating: (response['rating']['average'] ?? 0.0).toDouble(),
              ratingCount: response['rating']['count'] ?? 0,
            );
          }
        });
        StyledSnackBar.showRatingSuccess(
          context,
          '${context.translate('rated')} ${rating.toInt()}/5 ⭐',
        );
      }
    } catch (e) {
      if (mounted) {
        StyledSnackBar.showError(context, 'Could not submit rating: $e');
      }
    }
  }

  void _showImagePreview(String url, {required String tag}) {
    showDialog(
      context: context,
      builder: (context) => Stack(
        children: [
          InteractiveViewer(
            minScale: 0.5,
            maxScale: 4.0,
            child: Center(
              child: Hero(
                tag: tag,
                child: CachedNetworkImage(
                  imageUrl: url,
                  placeholder: (_, __) => const CircularProgressIndicator(),
                  errorWidget: (_, __, ___) => const Icon(Icons.error),
                ),
              ),
            ),
          ),
          Positioned(
            top: 40,
            right: 20,
            child: Material(
              color: Colors.transparent,
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white, size: 30),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 280,
            pinned: true,
            backgroundColor: AppColors.backgroundLight,
            actions: [
              IconButton(
                icon: _isSaving
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Icon(
                        _isSaved
                            ? Icons.favorite_rounded
                            : Icons.favorite_border_rounded,
                        color: _isSaved ? Colors.redAccent : Colors.white,
                      ),
                onPressed: _toggleSave,
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  Hero(
                    tag: 'news_image_${_news.id}',
                    child: GestureDetector(
                      onTap: () => _showImagePreview(
                        _news.imageUrl,
                        tag: 'news_image_${_news.id}',
                      ),
                      child: CachedNetworkImage(
                        imageUrl: _news.imageUrl,
                        fit: BoxFit.cover,
                        placeholder: (_, __) => Container(
                          color: AppColors.surfaceLight,
                          child: const Center(
                            child: CircularProgressIndicator(),
                          ),
                        ),
                        errorWidget: (_, __, ___) => Container(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          child: const Icon(
                            Icons.newspaper_rounded,
                            size: 64,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                    ),
                  ),
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          Colors.black.withValues(alpha: 0.7),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded),
              color: Colors.black,
              onPressed: () => Navigator.pop(context),
            ),
          ),

          SliverToBoxAdapter(
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: const BoxDecoration(
                color: AppColors.backgroundLight,
                borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
              ),
              transform: Matrix4.translationValues(0, -32, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 16),

                  // Category + time + view count row
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          _news.category,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      const Icon(
                        Icons.access_time_rounded,
                        size: 15,
                        color: AppColors.textGrey,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        _news.timeAgo,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textGrey,
                        ),
                      ),
                      const Spacer(),
                      const Icon(
                        Icons.visibility_outlined,
                        size: 15,
                        color: AppColors.textGrey,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${_news.viewCount}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textGrey,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 20),

                  // Title
                  Text(
                    _news.title,
                    textAlign: BidiHelper.getTextAlign(_news.title),
                    textDirection: BidiHelper.getDirection(_news.title),
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textDark,
                      height: 1.3,
                    ),
                  ),

                  if (_isOffline) ...[
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(
                          Icons.offline_bolt_rounded,
                          size: 14,
                          color: Colors.orange,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'You are viewing cached content (Offline)',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.orange.shade800,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ],

                  const SizedBox(height: 16),

                  const Divider(height: 32),

                  // Description
                  Text(
                    _news.description,
                    textAlign: BidiHelper.getTextAlign(_news.description),
                    textDirection: BidiHelper.getDirection(_news.description),
                    style: TextStyle(
                      fontSize: 16,
                      color: AppColors.textDark.withValues(alpha: 0.8),
                      height: 1.7,
                    ),
                  ),

                  // Content blocks
                  if (_isLoadingFullNews)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 32),
                      child: Center(child: CircularProgressIndicator()),
                    )
                  else if (_news.blocks.isNotEmpty) ...[
                    const SizedBox(height: 24),
                    ..._renderBlocks(_news.blocks),
                  ],

                  // External links
                  if (_news.links.isNotEmpty) ...[
                    const SizedBox(height: 32),
                    const SizedBox(height: 16),
                    Text(
                      context.translate('resources_links'),
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textDark,
                      ),
                    ),
                    const SizedBox(height: 16),
                    ..._news.links.map(
                      (link) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            onPressed: () => _launchURL(link.url),
                            icon: const Icon(Icons.language_rounded),
                            label: Text(link.label),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.white,
                              foregroundColor: AppColors.primary,
                              elevation: 0,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 20,
                                vertical: 12,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                                side: BorderSide(
                                  color: AppColors.primary.withValues(
                                    alpha: 0.2,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                  const Divider(height: 48),

                  // Rating row (Modernized)
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.amber.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: Colors.amber.withValues(alpha: 0.1),
                      ),
                    ),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '${_news.rating.toStringAsFixed(1)}',
                                  style: const TextStyle(
                                    fontSize: 32,
                                    fontWeight: FontWeight.w900,
                                    color: Colors.amber,
                                  ),
                                ),
                                Text(
                                  '(${_news.viewCount} views)',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: AppColors.textGrey,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                            const Spacer(),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                const Text(
                                  'Did you like this?',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.textDark,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  children: List.generate(5, (i) {
                                    final star = i + 1;
                                    final isActive = star <= _userRating;
                                    return IgnorePointer(
                                      ignoring: _userRating > 0,
                                      child: GestureDetector(
                                        onTap: () => _rateNews(star.toDouble()),
                                        child: Padding(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 2,
                                          ),
                                          child: Opacity(
                                            opacity: _userRating > 0
                                                ? 0.7
                                                : 1.0,
                                            child: Icon(
                                              isActive
                                                  ? Icons.star_rounded
                                                  : Icons.star_border_rounded,
                                              color: Colors.amber,
                                              size: 32,
                                            ),
                                          ),
                                        ),
                                      ),
                                    );
                                  }),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 32),

                  // Comments Section
                  Text(
                    context.translate('comments'),
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textDark,
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Comment Input
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _commentController,
                          decoration: InputDecoration(
                            hintText: context.translate('add_comment_hint'),
                            filled: true,
                            fillColor: AppColors.surfaceLight,
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 12,
                            ),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(24),
                              borderSide: BorderSide.none,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton.filled(
                        onPressed: _postComment,
                        icon: const Icon(Icons.send_rounded),
                        style: IconButton.styleFrom(
                          backgroundColor: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  if (_isLoadingComments)
                    const Center(child: CircularProgressIndicator())
                  else if (_questions.isEmpty)
                    Center(
                      child: Text(
                        context.translate('no_comments_yet'),
                        style: const TextStyle(color: AppColors.textGrey),
                      ),
                    )
                  else
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _questions.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 16),
                      itemBuilder: (context, index) {
                        final q = _questions[index];
                        final senderName = q['senderName'] ?? 'مستخدم دارسي';
                        final text = q['question'] ?? q['text'] ?? '';
                        final isAdmin = q['role'] == 'admin';
                        final questionId =
                            q['_id']?.toString() ?? q['id']?.toString() ?? '';
                        final senderId =
                            q['sender']?.toString() ??
                            q['senderId']?.toString() ??
                            '';
                        final currentUserId =
                            ref.read(authProvider).user?.id ?? '';
                        final isOwn = senderId == currentUserId;

                        return Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            CircleAvatar(
                              radius: 18,
                              backgroundColor: AppColors.primary.withOpacity(
                                0.1,
                              ),
                              child: Icon(
                                Icons.person,
                                size: 20,
                                color: AppColors.primary,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    isAdmin ? 'Darsy Team' : senderName,
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                      color: isAdmin
                                          ? AppColors.primary
                                          : AppColors.textDark,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    text,
                                    textAlign: BidiHelper.getTextAlign(text),
                                    textDirection: BidiHelper.getDirection(
                                      text,
                                    ),
                                    style: const TextStyle(
                                      fontSize: 14,
                                      color: AppColors.textGrey,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            if (isOwn && questionId.isNotEmpty)
                              IconButton(
                                icon: const Icon(
                                  Icons.delete_outline,
                                  size: 18,
                                  color: Colors.red,
                                ),
                                onPressed: () => _deleteComment(questionId),
                                tooltip: 'حذف التعليق',
                              ),
                          ],
                        );
                      },
                    ),
                  const SizedBox(height: 80),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _renderBlocks(List<dynamic> blocks) {
    return blocks.map<Widget>((block) {
      final type = block['type'] as String? ?? '';
      final content = block['content'] ?? block['text'] ?? '';

      switch (type) {
        case 'heading':
          return Padding(
            padding: const EdgeInsets.only(top: 20, bottom: 8),
            child: Text(
              content.toString(),
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppColors.textDark,
              ),
            ),
          );
        case 'text':
        case 'paragraph':
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Text(
              content.toString(),
              textAlign: BidiHelper.getTextAlign(content.toString()),
              textDirection: BidiHelper.getDirection(content.toString()),
              style: TextStyle(
                fontSize: 16,
                color: AppColors.textDark.withValues(alpha: 0.8),
                height: 1.7,
              ),
            ),
          );
        case 'image':
          final src = block['src'] as String? ?? '';
          if (src.isEmpty) return const SizedBox.shrink();
          final blockIndex = blocks.indexOf(block);
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: GestureDetector(
                onTap: () => _showImagePreview(
                  src,
                  tag: 'news_block_image_${_news.id}_$blockIndex',
                ),
                child: Hero(
                  tag: 'news_block_image_${_news.id}_$blockIndex',
                  child: CachedNetworkImage(
                    imageUrl: src,
                    fit: BoxFit.cover,
                    errorWidget: (_, __, ___) => const SizedBox.shrink(),
                  ),
                ),
              ),
            ),
          );
        case 'list':
          final items = (block['items'] as List? ?? []);
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: items
                  .map<Widget>(
                    (item) => Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            '• ',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: AppColors.primary,
                            ),
                          ),
                          Expanded(
                            child: Text(
                              item.toString(),
                              textAlign: BidiHelper.getTextAlign(
                                item.toString(),
                              ),
                              textDirection: BidiHelper.getDirection(
                                item.toString(),
                              ),
                              style: TextStyle(
                                fontSize: 15,
                                color: AppColors.textDark.withValues(
                                  alpha: 0.8,
                                ),
                                height: 1.5,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                  .toList(),
            ),
          );
        case 'link':
          final url = block['url'] ?? block['href'] ?? '';
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: GestureDetector(
              onTap: () => _launchURL(url.toString()),
              child: Text(
                content.toString().isNotEmpty
                    ? content.toString()
                    : url.toString(),
                style: const TextStyle(
                  fontSize: 15,
                  color: AppColors.primary,
                  decoration: TextDecoration.underline,
                  decorationColor: AppColors.primary,
                ),
              ),
            ),
          );
        case 'embed':
        case 'video':
          final url = block['url'] ?? block['src'] ?? '';
          if (url.toString().isEmpty) return const SizedBox.shrink();
          return Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.black87,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  const Icon(
                    Icons.play_circle_fill_rounded,
                    color: Colors.white,
                    size: 48,
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: () => _launchURL(url.toString()),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                    ),
                    child: const Text('Play Video'),
                  ),
                ],
              ),
            ),
          );
        case 'pdf':
        case 'document':
        case 'file':
          final rawUrl = block['url'] ?? block['src'] ?? block['fileUrl'] ?? '';
          final strUrl = rawUrl.toString();
          if (strUrl.isEmpty) return const SizedBox.shrink();
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: InkWell(
              onTap: () {
                if (strUrl.toLowerCase().contains('.pdf') || type == 'pdf') {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => PDFViewerScreen(
                        title: content.toString().isNotEmpty
                            ? content.toString()
                            : 'Document',
                        pdfUrl: strUrl,
                      ),
                    ),
                  );
                } else {
                  _launchURL(strUrl);
                }
              },
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: AppColors.primary.withValues(alpha: 0.2),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      type == 'pdf' || strUrl.toLowerCase().contains('.pdf')
                          ? Icons.picture_as_pdf_rounded
                          : Icons.insert_drive_file_rounded,
                      color: AppColors.primary,
                      size: 32,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            content.toString().isNotEmpty
                                ? content.toString()
                                : 'View Document',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                              color: AppColors.textDark,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            type.toUpperCase(),
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.textGrey,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Icon(
                      Icons.arrow_forward_ios_rounded,
                      size: 16,
                      color: AppColors.primary,
                    ),
                  ],
                ),
              ),
            ),
          );
        default:
          if (content.toString().isNotEmpty) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(
                content.toString(),
                style: TextStyle(
                  fontSize: 15,
                  color: AppColors.textDark.withValues(alpha: 0.7),
                  height: 1.6,
                ),
              ),
            );
          }
          return const SizedBox.shrink();
      }
    }).toList();
  }
}
