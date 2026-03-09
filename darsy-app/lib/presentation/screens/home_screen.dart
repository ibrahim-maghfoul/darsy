import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/app_colors.dart';
import '../../core/subject_icons.dart';
import '../../core/services/api_service.dart';
import '../providers/auth_provider.dart';
import '../providers/lessons_provider.dart';
import '../providers/user_progress_provider.dart';
import '../widgets/glassmorphic_subject_card.dart';
import '../widgets/progress_card.dart';
import '../widgets/shimmer_widgets.dart';
import '../widgets/weekly_calendar.dart';
import 'subjects_screen.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(userProgressProvider.notifier).refreshStats();
    });
  }

  @override
  Widget build(BuildContext context) {
    final userProgress = ref.watch(userProgressProvider);
    final subjectsAsync = ref.watch(subjectsProvider);

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(userProgress),
              const SizedBox(height: 24),
              WeeklyCalendarWidget(
                onDateSelected: (date) {
                  debugPrint('Selected date: $date');
                },
              ),
              const SizedBox(height: 24),
              ProgressCard(data: userProgress),
              const SizedBox(height: 32),
              _buildSubjectsGrid(subjectsAsync),
              const SizedBox(height: 100),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(UserProgressData userProgress) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final apiService = ref.watch(apiServiceProvider);
    final photoUrl = user?.getPhotoURL(apiService.baseUrl);
    final gender = user?.gender ?? userProgress.genre;

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            _buildProfileAvatar(
              localPath: userProgress.profilePicture,
              networkUrl: photoUrl,
              gender: gender,
              userName: userProgress.userName,
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Hello, ${userProgress.userName}!',
                  style: Theme.of(
                    context,
                  ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                ),
                Row(
                  children: [
                    Icon(
                      Icons.stars_rounded,
                      size: 16,
                      color: AppColors.accent,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${userProgress.levelTitle ?? "Primary"} • Student',
                      style: const TextStyle(
                        color: AppColors.textGrey,
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: const Icon(Icons.notifications_none_rounded, size: 24),
        ),
      ],
    ).animate().fadeIn().slideY(begin: -0.2, end: 0);
  }

  /// Build profile avatar with fallback chain: local file → network → gender avatar
  Widget _buildProfileAvatar({
    String? localPath,
    String? networkUrl,
    String? gender,
    required String userName,
  }) {
    // 1. Try local file
    if (localPath != null && localPath.isNotEmpty) {
      final file = File(localPath);
      if (file.existsSync()) {
        return CircleAvatar(
          radius: 28,
          backgroundColor: AppColors.primary,
          backgroundImage: FileImage(file),
        );
      }
    }

    // 2. Try server URL
    if (networkUrl != null && networkUrl.isNotEmpty) {
      return CircleAvatar(
        radius: 28,
        backgroundColor: AppColors.primary,
        child: ClipOval(
          child: CachedNetworkImage(
            imageUrl: networkUrl,
            width: 56,
            height: 56,
            fit: BoxFit.cover,
            errorWidget: (_, __, ___) => _genderAvatar(gender, userName),
          ),
        ),
      );
    }

    // 3. Gender-based avatar
    return _genderAvatar(gender, userName);
  }

  Widget _genderAvatar(String? gender, String userName) {
    final isFemale = gender?.toLowerCase() == 'female';
    return CircleAvatar(
      radius: 28,
      backgroundColor: isFemale
          ? const Color(0xFFF8BBD0)
          : AppColors.primary.withValues(alpha: 0.15),
      child: Icon(
        isFemale ? Icons.face_3_rounded : Icons.face_rounded,
        size: 30,
        color: isFemale ? const Color(0xFFE91E63) : AppColors.primary,
      ),
    );
  }

  /// Calculate per-subject progress from user's lesson progress data.
  double _getSubjectProgress(String subjectId) {
    final user = ref.read(authProvider).user;
    if (user?.progress == null) return 0.0;

    final lessons = user!.progress!.lessons;
    if (lessons.isEmpty) return 0.0;

    int totalResources = 0;
    int completedResources = 0;

    for (final l in lessons) {
      if (l is Map && l['subjectId'] == subjectId) {
        final total = l['totalResourcesCount'] as int? ?? 0;
        final completed = (l['completedResources'] as List?)?.length ?? 0;
        totalResources += total;
        completedResources += completed;
      }
    }

    if (totalResources == 0) return 0.0;
    return (completedResources / totalResources).clamp(0.0, 1.0);
  }

  Widget _buildSubjectsGrid(AsyncValue subjectsAsync) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Your Subjects',
          style: Theme.of(
            context,
          ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        subjectsAsync.when(
          data: (subjects) {
            if (subjects.isEmpty) {
              return const Center(
                child: Padding(
                  padding: EdgeInsets.all(32.0),
                  child: Text('No subjects found'),
                ),
              );
            }
            return GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                childAspectRatio: 1.0,
              ),
              itemCount: subjects.length,
              itemBuilder: (context, index) {
                final subject = subjects[index];
                final icon = SubjectIcons.getIconForSubject(subject.title);
                final gradient = AppColors.blueGradient;
                final progress = _getSubjectProgress(subject.id);

                return RepaintBoundary(
                  child:
                      GlassmorphicSubjectCard(
                            title: subject.title,
                            subtitle: 'View Course',
                            icon: icon,
                            gradient: gradient,
                            progress: progress,
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) =>
                                      SubjectsScreen(subject: subject),
                                ),
                              );
                            },
                          )
                          .animate()
                          .fadeIn(delay: (100 * index).ms)
                          .scale(
                            delay: (100 * index).ms,
                            begin: const Offset(0.9, 0.9),
                          ),
                );
              },
            );
          },
          loading: () => ShimmerWidgets.subjectGrid(context),
          error: (err, stack) => Center(
            child: Padding(
              padding: const EdgeInsets.all(32.0),
              child: Column(
                children: [
                  Icon(
                    Icons.wifi_off_rounded,
                    color: AppColors.primary.withOpacity(0.3),
                    size: 48,
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Could not load subjects.',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: AppColors.textDark,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1, end: 0);
  }
}
