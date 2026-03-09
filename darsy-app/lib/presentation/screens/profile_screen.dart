import 'dart:io';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/services/hive_service.dart';
import '../../core/services/download_service.dart';
import '../../core/services/api_service.dart';
import '../../core/app_colors.dart';
import '../../l10n/app_localizations.dart';
import '../../data/models/lesson_model.dart';
import '../../data/models/news_model.dart';
import '../providers/user_progress_provider.dart';
import '../providers/auth_provider.dart';
import '../../data/models/user_model.dart';
import 'settings_screen.dart';
import '../providers/bookmarks_provider.dart';
import '../providers/preferences_provider.dart';
import 'onboarding_screen.dart';
import 'package:share_plus/share_plus.dart';
import 'package:in_app_review/in_app_review.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/subject_icons.dart';
import '../../data/models/subject_model.dart';
import '../providers/lessons_provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'subjects_screen.dart';
import 'contribute_screen.dart';
import 'package:image_picker/image_picker.dart';
import 'package:image_cropper/image_cropper.dart';
import 'news_detail_screen.dart';
import 'downloaded_screen.dart';
import '../widgets/styled_snackbar.dart';
import '../widgets/shimmer_widgets.dart';
import 'school_services_screen.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  List<NewsModel> _savedNews = [];
  bool _loadingSavedNews = false;
  bool _hasFetchedSavedNews = false;

  @override
  void initState() {
    super.initState();
    if (!_hasFetchedSavedNews) _fetchSavedNews();
  }

  Future<void> _fetchSavedNews() async {
    final authState = ref.read(authProvider);
    if (!authState.isAuthenticated) return;

    setState(() => _loadingSavedNews = true);
    try {
      final api = ref.read(apiServiceProvider);
      final response = await api.get('/user/saved-news');
      final List data = response.data is List ? response.data : [];
      setState(() {
        _savedNews = data
            .map((j) => NewsModel.fromJson(j as Map<String, dynamic>))
            .toList();
      });
    } catch (_) {
    } finally {
      if (mounted) setState(() => _loadingSavedNews = false);
    }
  }

  Future<void> _updateProfilePicture() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      final croppedFile = await ImageCropper().cropImage(
        sourcePath: pickedFile.path,
        aspectRatio: const CropAspectRatio(ratioX: 1, ratioY: 1),
        uiSettings: [
          AndroidUiSettings(
            toolbarTitle: 'Crop Profile Picture',
            toolbarColor: AppColors.primary,
            toolbarWidgetColor: Colors.white,
            initAspectRatio: CropAspectRatioPreset.square,
            lockAspectRatio: true,
          ),
          IOSUiSettings(
            title: 'Crop Profile Picture',
            aspectRatioLockEnabled: true,
          ),
        ],
      );
      if (croppedFile != null) {
        try {
          // Upload to server
          await ref
              .read(authServiceProvider)
              .uploadProfilePicture(croppedFile.path);

          // Update locally
          final prefs = ref.read(preferencesProvider);
          await prefs.saveProfilePicture(croppedFile.path);
          ref
              .read(userProgressProvider.notifier)
              .updateProfile(profilePicture: croppedFile.path);

          if (mounted) {
            StyledSnackBar.showSuccess(context, 'Profile picture updated');
          }
        } catch (e) {
          if (mounted) {
            StyledSnackBar.showError(context, 'Failed to upload picture: $e');
          }
        }
      }
    }
  }

  double _calculateCompletion(UserProgressData data, UserModel? user) {
    int filled = 0;
    int total = 7;
    if (data.userName.isNotEmpty) filled++;
    if (user != null && user.email.isNotEmpty) filled++;
    if (user?.phone?.isNotEmpty ?? false) filled++;
    if (user?.gender != null) filled++;
    if (user?.city?.isNotEmpty ?? false) filled++;
    if (user?.schoolName?.isNotEmpty ?? false) filled++;
    if (data.profilePicture?.isNotEmpty ?? false) filled++;
    return filled / total;
  }

  @override
  Widget build(BuildContext context) {
    super.build(context); // Required for AutomaticKeepAliveClientMixin
    final userProgress = ref.watch(userProgressProvider);
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final bookmarkedLessons = ref.watch(bookmarksProvider);
    final completionPercent = _calculateCompletion(userProgress, user);
    final currentPlan = user?.subscription?.plan ?? 'free';

    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        title: Text(AppLocalizations.of(context)?.profile ?? 'Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_rounded),
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const SettingsScreen()),
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _fetchSavedNews,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Profile header
              _buildProfileHeader(userProgress, user),
              const SizedBox(height: 16),

              // Profile completion
              if (completionPercent < 1.0) ...[
                _buildCompletionCard(completionPercent),
                const SizedBox(height: 16),
              ],

              // Stats row
              _buildStatsRow(userProgress),
              const SizedBox(height: 24),

              // Premium banner if not premium
              if (currentPlan == 'free') ...[
                _buildPremiumBanner(),
                const SizedBox(height: 24),
              ],

              // Bookmarks
              if (bookmarkedLessons.isNotEmpty) ...[
                _buildSectionTitle(
                  Icons.bookmark_rounded,
                  'Bookmarked Lessons',
                ),
                const SizedBox(height: 12),
                _buildBookmarksSection(context, bookmarkedLessons, ref),
                const SizedBox(height: 24),
              ],

              // Downloads Card
              _buildSectionTitle(CupertinoIcons.cloud_download, 'Downloads'),
              const SizedBox(height: 12),
              _buildDownloadsCard(),
              const SizedBox(height: 24),

              // Saved News
              _buildSectionTitle(Icons.newspaper_rounded, 'Saved News'),
              const SizedBox(height: 12),
              _buildSavedNewsSection(),
              const SizedBox(height: 24),

              // Quick actions
              _buildSectionTitle(Icons.apps_rounded, 'Quick Actions'),
              const SizedBox(height: 12),
              _buildQuickActions(context, ref),
              const SizedBox(height: 24),

              // Logout
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () => _logout(ref, context),
                  icon: const Icon(Icons.logout_rounded, color: Colors.red),
                  label: const Text(
                    'Sign Out',
                    style: TextStyle(color: Colors.red),
                  ),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    side: const BorderSide(color: Colors.red),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildProfileHeader(UserProgressData userProgress, UserModel? user) {
    final baseUrl = ref.watch(apiServiceProvider).baseUrl;
    final photoUrl = user?.getPhotoURL(baseUrl);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: AppColors.greenGradient,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: _updateProfilePicture,
            child: Stack(
              children: [
                Container(
                  width: 75,
                  height: 75,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withOpacity(0.3),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: photoUrl != null
                      ? CachedNetworkImage(
                          imageUrl: photoUrl,
                          fit: BoxFit.cover,
                          placeholder: (context, url) =>
                              const CircularProgressIndicator(strokeWidth: 2),
                          errorWidget: (context, url, error) =>
                              _defaultAvatar(userProgress),
                        )
                      : userProgress.profilePicture?.isNotEmpty == true &&
                            !userProgress.profilePicture!.startsWith('http')
                      ? Image.file(
                          File(userProgress.profilePicture!),
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) =>
                              _defaultAvatar(userProgress),
                        )
                      : _defaultAvatar(userProgress),
                ),
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.camera_alt_rounded,
                      size: 14,
                      color: AppColors.primary,
                    ),
                  ),
                ),
                if (user?.subscription?.isPremium == true)
                  Positioned(
                    top: -2,
                    right: -2,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: Colors.amber,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black26,
                            blurRadius: 4,
                            offset: Offset(0, 2),
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.workspace_premium_rounded,
                        size: 14,
                        color: Colors.white,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  userProgress.userName.isNotEmpty
                      ? userProgress.userName
                      : 'Student',
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                if (user?.nickname?.isNotEmpty == true)
                  Text(
                    '@${user!.nickname}',
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.white.withOpacity(0.85),
                    ),
                  ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(
                      Icons.stars_rounded,
                      size: 16,
                      color: Colors.white70,
                    ),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        '${userProgress.levelTitle ?? "Student"} • ${user?.subscription?.plan.toUpperCase() ?? "FREE"}',
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.white.withOpacity(0.85),
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                if (user?.city?.isNotEmpty == true)
                  Row(
                    children: [
                      const Icon(
                        Icons.location_on_outlined,
                        size: 13,
                        color: Colors.white70,
                      ),
                      const SizedBox(width: 2),
                      Text(
                        user!.city!,
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.white.withOpacity(0.75),
                        ),
                      ),
                    ],
                  ),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms).slideY(begin: -0.1, end: 0);
  }

  Widget _defaultAvatar(UserProgressData d) {
    return Center(
      child: Text(
        d.userName.isNotEmpty ? d.userName[0].toUpperCase() : 'S',
        style: const TextStyle(
          color: Colors.white,
          fontSize: 30,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildCompletionCard(double percent) {
    final pct = (percent * 100).round();
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.primary.withOpacity(0.2)),
        borderRadius: BorderRadius.circular(18),
        color: AppColors.primary.withOpacity(0.04),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.account_circle_outlined,
                color: AppColors.primary,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                'Profile Completion',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
              ),
              const Spacer(),
              Text(
                '$pct%',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: percent,
              minHeight: 8,
              backgroundColor: AppColors.primary.withOpacity(0.1),
              valueColor: const AlwaysStoppedAnimation<Color>(
                AppColors.primary,
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Complete your profile to get the best experience',
            style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
          ),
          const SizedBox(height: 8),
          TextButton.icon(
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const SettingsScreen()),
            ),
            icon: const Icon(Icons.edit_outlined, size: 16),
            label: const Text('Complete Profile'),
            style: TextButton.styleFrom(
              foregroundColor: AppColors.primary,
              padding: EdgeInsets.zero,
            ),
          ),
        ],
      ),
    ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.1);
  }

  Widget _buildStatsRow(UserProgressData progress) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final timeHours = (user?.progress?.learningTime ?? 0) ~/ 60;
    final lessonsStarted = user?.progress?.lessons.length ?? 0;
    final points = user?.points ?? 0;

    return Row(
      children: [
        _statCard(
          'XP Points',
          '$points',
          CupertinoIcons.star_fill,
          Colors.green,
        ),
        const SizedBox(width: 12),
        _statCard(
          'Learning',
          '${timeHours}h',
          CupertinoIcons.clock_fill,
          Colors.green.shade600,
        ),
        const SizedBox(width: 12),
        _statCard(
          'Lessons',
          '$lessonsStarted',
          CupertinoIcons.book_fill,
          Colors.green.shade700,
        ),
      ],
    ).animate().fadeIn(delay: 100.ms);
  }

  Widget _statCard(String label, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.primary.withOpacity(0.15)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.textDark,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: AppColors.textGrey,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPremiumBanner() {
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const SettingsScreen(initialTab: 2)),
      ),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              const Color(0xFFFFD700).withOpacity(0.8), // Gold
              const Color(0xFFDAA520).withOpacity(0.9), // Darker Gold
            ],
          ),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFFDAA520).withOpacity(0.3),
              blurRadius: 15,
              offset: const Offset(0, 5),
            ),
          ],
          border: Border.all(color: Colors.white.withOpacity(0.4), width: 1),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.workspace_premium_rounded,
                color: Colors.white,
                size: 30,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Get Darsy Premium',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      fontSize: 17,
                      letterSpacing: 0.5,
                      shadows: [
                        Shadow(
                          color: Colors.black26,
                          offset: Offset(0, 1),
                          blurRadius: 2,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Unlock live courses & all resources',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.95),
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: const [
                  BoxShadow(
                    color: Colors.black12,
                    blurRadius: 4,
                    offset: Offset(0, 2),
                  ),
                ],
              ),
              child: const Text(
                'UPGRADE',
                style: TextStyle(
                  color: Color(0xFFDAA520),
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                  letterSpacing: 1,
                ),
              ),
            ),
          ],
        ),
      ),
    ).animate().fadeIn(delay: 150.ms).slideY(begin: 0.05);
  }

  Widget _buildSectionTitle(IconData icon, String title) {
    return Row(
      children: [
        Icon(icon, color: AppColors.primary, size: 20),
        const SizedBox(width: 8),
        Text(
          title,
          style: Theme.of(
            context,
          ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
        ),
      ],
    );
  }

  Widget _buildSavedNewsSection() {
    if (_loadingSavedNews) {
      return ShimmerWidgets.listTile(context);
    }
    if (_savedNews.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.grey.withOpacity(0.05),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.withOpacity(0.1)),
        ),
        child: Column(
          children: [
            Icon(
              Icons.bookmark_border_rounded,
              size: 40,
              color: Colors.grey.shade400,
            ),
            const SizedBox(height: 8),
            Text(
              'No saved news yet',
              style: TextStyle(
                color: Colors.grey.shade500,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      );
    }
    return SizedBox(
      height: 140,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: _savedNews.length,
        itemBuilder: (ctx, i) {
          final news = _savedNews[i];
          return GestureDetector(
            onTap: () => Navigator.push(
              ctx,
              MaterialPageRoute(builder: (_) => NewsDetailScreen(news: news)),
            ),
            child: Container(
              width: 200,
              margin: const EdgeInsets.only(right: 12),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(14),
                color: Theme.of(context).colorScheme.surface,
                border: Border.all(
                  color: AppColors.primary.withOpacity(0.3),
                  width: 1.5,
                ),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(14),
                    ),
                    child: CachedNetworkImage(
                      imageUrl: news.imageUrl,
                      height: 70,
                      width: double.infinity,
                      fit: BoxFit.cover,
                      placeholder: (context, url) => Container(
                        color: AppColors.primary.withOpacity(0.05),
                        child: const Center(
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                      ),
                      errorWidget: (context, url, error) => Container(
                        color: AppColors.primary.withOpacity(0.08),
                        child: const Center(
                          child: Icon(
                            Icons.newspaper_rounded,
                            color: AppColors.primary,
                            size: 28,
                          ),
                        ),
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(8),
                    child: Text(
                      news.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ).animate().fadeIn(delay: (80 * i).ms);
        },
      ),
    );
  }

  Widget _buildBookmarksSection(
    BuildContext context,
    List<Lesson> bookmarks,
    WidgetRef ref,
  ) {
    final subjectsAsync = ref.watch(globalSubjectsProvider);
    return subjectsAsync.when(
      data: (allSubjects) {
        return SizedBox(
          height: 170,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: bookmarks.length,
            itemBuilder: (ctx, i) {
              final lesson = bookmarks[i];
              final subject = allSubjects.firstWhere(
                (s) => s.id == lesson.subjectId,
                orElse: () => Subject(id: '', guidanceId: '', title: 'Lesson'),
              );
              final icon = SubjectIcons.getIconForSubject(subject.title);
              final iconColor = SubjectIcons.getColorForSubject(subject.title);

              return GestureDetector(
                onTap: () {
                  if (subject.id.isNotEmpty) {
                    Navigator.push(
                      ctx,
                      MaterialPageRoute(
                        builder: (_) => SubjectsScreen(subject: subject),
                      ),
                    );
                  }
                },
                child: Container(
                  width: 150,
                  margin: const EdgeInsets.only(right: 12),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    color: Theme.of(context).colorScheme.surface,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 8,
                      ),
                    ],
                  ),
                  child: Stack(
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              height: 72,
                              width: double.infinity,
                              decoration: BoxDecoration(
                                color: iconColor.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(icon, color: iconColor, size: 32),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              lesson.title,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                            const Spacer(),
                            Text(
                              subject.title,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 11,
                                color: AppColors.textGrey,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Positioned(
                        top: 4,
                        right: 4,
                        child: IconButton(
                          icon: const Icon(
                            Icons.close_rounded,
                            size: 16,
                            color: Colors.red,
                          ),
                          onPressed: () => ref
                              .read(bookmarksProvider.notifier)
                              .toggleBookmark(lesson),
                          style: IconButton.styleFrom(
                            backgroundColor: Colors.white,
                            padding: EdgeInsets.zero,
                            minimumSize: const Size(28, 28),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        );
      },
      loading: () => const SizedBox(
        height: 170,
        child: Center(child: CircularProgressIndicator()),
      ),
      error: (_, __) => const SizedBox.shrink(),
    );
  }

  Widget _buildQuickActions(BuildContext context, WidgetRef ref) {
    final items = [
      _QuickAction(
        'Share App',
        Icons.share_rounded,
        Colors.blue,
        () async =>
            Share.share('Check out Darsy - The ultimate education platform!'),
      ),
      _QuickAction('Rate Us', Icons.star_rounded, Colors.amber, () async {
        final r = InAppReview.instance;
        if (await r.isAvailable()) r.requestReview();
      }),
      _QuickAction(
        'Report Issue',
        Icons.report_problem_rounded,
        Colors.red,
        () async {
          final uri = Uri(
            scheme: 'mailto',
            path: 'support@darsy.app',
            queryParameters: {'subject': 'Issue Report - Darsy App'},
          );
          try {
            await launchUrl(uri);
          } catch (_) {}
        },
      ),
      _QuickAction(
        'Share Document',
        Icons.upload_file_rounded,
        AppColors.primary,
        () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const ContributeScreen()),
        ),
      ),
      _QuickAction(
        'Services & Info',
        Icons.miscellaneous_services_rounded,
        Colors.teal,
        () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const SchoolServicesScreen()),
        ),
      ),
    ];

    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 2.5,
      children: items
          .map(
            (a) => InkWell(
              onTap: a.onTap,
              borderRadius: BorderRadius.circular(16),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.primary.withOpacity(0.3)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.02),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Icon(a.icon, color: AppColors.primary, size: 22),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        a.label,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          )
          .toList(),
    ).animate().fadeIn(delay: 400.ms);
  }

  // Grades Calculator removed as requested
  Widget _buildDownloadsCard() {
    return InkWell(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const DownloadedScreen()),
      ),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: AppColors.primary.withOpacity(0.5),
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                CupertinoIcons.folder_open,
                color: AppColors.primary,
                size: 32,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'My Downloads',
                    style: TextStyle(
                      color: AppColors.textDark,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Access your offline lessons and PDFs',
                    style: TextStyle(color: AppColors.textGrey, fontSize: 13),
                  ),
                ],
              ),
            ),
            const Icon(
              Icons.arrow_forward_ios_rounded,
              color: AppColors.textGrey,
              size: 16,
            ),
          ],
        ),
      ),
    ).animate().fadeIn(delay: 350.ms).slideY(begin: 0.1);
  }

  Future<void> _logout(WidgetRef ref, BuildContext context) async {
    final prefs = ref.read(preferencesProvider);
    await prefs.clearAll();
    await HiveService().clearAll();
    await DownloadService().deleteAllDownloads();
    if (context.mounted) {
      Navigator.of(context, rootNavigator: true).pushReplacement(
        MaterialPageRoute(builder: (_) => const OnboardingScreen()),
      );
    }
  }
}

// _ContributeDialog removed

class _QuickAction {
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  _QuickAction(this.label, this.icon, this.color, this.onTap);
}
