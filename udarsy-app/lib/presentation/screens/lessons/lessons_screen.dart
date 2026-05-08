import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/app_colors.dart';
import '../../providers/lessons_provider.dart';
import '../../providers/auth_provider.dart';
import 'lesson_detail_screen.dart';

class LessonsScreen extends ConsumerStatefulWidget {
  const LessonsScreen({super.key});

  @override
  ConsumerState<LessonsScreen> createState() => _LessonsScreenState();
}

class _LessonsScreenState extends ConsumerState<LessonsScreen> {
  @override
  void initState() {
    super.initState();
    // Load schools on init
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(schoolsProvider);
    });
  }

  @override
  Widget build(BuildContext context) {
    final selectedSchool = ref.watch(selectedSchoolProvider);
    final selectedLevel = ref.watch(selectedLevelProvider);
    final selectedGuidance = ref.watch(selectedGuidanceProvider);
    final selectedSubject = ref.watch(selectedSubjectProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Lessons'), elevation: 0),
      body: Column(
        children: [
          // Filters Card
          Card(
            margin: const EdgeInsets.all(16),
            color: Theme.of(context).cardTheme.color,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _buildSchoolDropdown(),
                  if (selectedSchool != null) ...[
                    const SizedBox(height: 12),
                    _buildLevelDropdown(),
                  ],
                  if (selectedLevel != null) ...[
                    const SizedBox(height: 12),
                    _buildGuidanceDropdown(),
                  ],
                  if (selectedGuidance != null) ...[
                    const SizedBox(height: 12),
                    _buildSubjectDropdown(),
                  ],
                ],
              ),
            ),
          ),

          // Lessons List
          if (selectedSubject != null)
            Expanded(child: _buildLessonsList())
          else
            const Expanded(
              child: Center(
                child: Text(
                  'Please select filters to view lessons',
                  style: TextStyle(color: Colors.grey),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSchoolDropdown() {
    final schoolsAsync = ref.watch(schoolsProvider);
    final selected = ref.watch(selectedSchoolProvider);

    return schoolsAsync.when(
      data: (schools) => DropdownButtonFormField<String>(
        initialValue: selected,
        decoration: const InputDecoration(
          labelText: 'School',
          border: OutlineInputBorder(),
        ),
        items: schools.map((school) {
          return DropdownMenuItem(value: school.id, child: Text(school.title));
        }).toList(),
        onChanged: (value) {
          ref.read(selectedSchoolProvider.notifier).set(value);
          ref.read(selectedLevelProvider.notifier).set(null);
          ref.read(selectedGuidanceProvider.notifier).set(null);
          ref.read(selectedSubjectProvider.notifier).set(null);
        },
      ),
      loading: () => const LinearProgressIndicator(),
      error: (e, _) => Text('Error: $e'),
    );
  }

  Widget _buildLevelDropdown() {
    final levelsAsync = ref.watch(levelsProvider);
    final selected = ref.watch(selectedLevelProvider);

    return levelsAsync.when(
      data: (levels) => DropdownButtonFormField<String>(
        initialValue: selected,
        decoration: const InputDecoration(
          labelText: 'Level',
          border: OutlineInputBorder(),
        ),
        items: levels.map((level) {
          return DropdownMenuItem(value: level.id, child: Text(level.title));
        }).toList(),
        onChanged: (value) {
          ref.read(selectedLevelProvider.notifier).set(value);
          ref.read(selectedGuidanceProvider.notifier).set(null);
          ref.read(selectedSubjectProvider.notifier).set(null);
        },
      ),
      loading: () => const LinearProgressIndicator(),
      error: (e, _) => Text('Error: $e'),
    );
  }

  Widget _buildGuidanceDropdown() {
    final guidancesAsync = ref.watch(guidancesProvider);
    final selected = ref.watch(selectedGuidanceProvider);

    return guidancesAsync.when(
      data: (guidances) {
        // Auto-select "General" for primary/middle school
        if (guidances.length == 1 && guidances.first.title == 'General') {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (selected != guidances.first.id) {
              ref
                  .read(selectedGuidanceProvider.notifier)
                  .set(guidances.first.id);
            }
          });
          return const SizedBox.shrink();
        }

        return DropdownButtonFormField<String>(
          initialValue: selected,
          decoration: const InputDecoration(
            labelText: 'Guidance',
            border: OutlineInputBorder(),
          ),
          items: guidances.map((guidance) {
            return DropdownMenuItem(
              value: guidance.id,
              child: Text(guidance.title),
            );
          }).toList(),
          onChanged: (value) {
            ref.read(selectedGuidanceProvider.notifier).set(value);
            ref.read(selectedSubjectProvider.notifier).set(null);
          },
        );
      },
      loading: () => const LinearProgressIndicator(),
      error: (e, _) => Text('Error: $e'),
    );
  }

  Widget _buildSubjectDropdown() {
    final subjectsAsync = ref.watch(subjectsProvider);
    final selected = ref.watch(selectedSubjectProvider);

    return subjectsAsync.when(
      data: (subjects) => DropdownButtonFormField<String>(
        initialValue: selected,
        decoration: const InputDecoration(
          labelText: 'Subject',
          border: OutlineInputBorder(),
        ),
        items: subjects.map((subject) {
          return DropdownMenuItem(
            value: subject.id,
            child: Text(subject.title),
          );
        }).toList(),
        onChanged: (value) {
          ref.read(selectedSubjectProvider.notifier).set(value);
          if (value != null) {
            // Load lessons when subject is selected
            ref.read(lessonsProvider(value).notifier).loadLessons();
          }
        },
      ),
      loading: () => const LinearProgressIndicator(),
      error: (e, _) => Text('Error: $e'),
    );
  }

  Widget _buildLessonsList() {
    final selectedSubject = ref.watch(selectedSubjectProvider);
    if (selectedSubject == null) return const SizedBox.shrink();

    final lessonsState = ref.watch(lessonsProvider(selectedSubject));
    final lessonsNotifier = ref.read(lessonsProvider(selectedSubject).notifier);

    if (lessonsState.lessons.isEmpty && !lessonsState.isLoading) {
      return const Center(child: Text('No lessons found for this subject'));
    }

    return Column(
      children: [
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: lessonsState.lessons.length,
            itemBuilder: (context, index) {
              final lesson = lessonsState.lessons[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                color: Theme.of(context).cardTheme.color,
                child: Consumer(
                  builder: (context, ref, child) {
                    final user = ref.watch(authProvider).user;
                    // Check if lesson is completed based on progress
                    final lessonProgress = user?.progress?.lessons.firstWhere(
                      (l) => l is Map && l['lessonId'] == lesson.id,
                      orElse: () => null,
                    );

                    bool isLessonCompleted = false;
                    double completionPercent = 0.0;
                    if (lessonProgress != null && lessonProgress is Map) {
                      final completed =
                          (lessonProgress['completedResources'] as List?)
                              ?.length ??
                          0;
                      final total =
                          (lesson.coursesPdf.length +
                          lesson.videos.length +
                          lesson.exercices.length +
                          lesson.exams.length +
                          lesson.resourses.length);
                      if (total > 0) {
                        completionPercent = (completed / total).clamp(0.0, 1.0);
                        isLessonCompleted = completionPercent >= 1.0;
                      }
                    }

                    return ListTile(
                      title: Text(
                        lesson.title,
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                      subtitle: Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Wrap(
                          spacing: 12,
                          children: [
                            if (lesson.coursesPdf.isNotEmpty)
                              Text('📄 ${lesson.coursesPdf.length}'),
                            if (lesson.videos.isNotEmpty)
                              Text('🎥 ${lesson.videos.length}'),
                            if (lesson.exercices.isNotEmpty)
                              Text('✏️ ${lesson.exercices.length}'),
                          ],
                        ),
                      ),
                      trailing: isLessonCompleted
                          ? const Icon(Icons.check_circle, color: Colors.green)
                          : completionPercent > 0
                          ? SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(
                                value: completionPercent,
                                strokeWidth: 3,
                                backgroundColor: Colors.grey.withValues(
                                  alpha: 0.2,
                                ),
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  AppColors.primary,
                                ),
                              ),
                            )
                          : const Icon(Icons.chevron_right_rounded),
                      onTap: () {
                        final subjects = ref.read(subjectsProvider).value;
                        final subjectName =
                            subjects
                                ?.firstWhere((s) => s.id == selectedSubject)
                                .title ??
                            '';
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => LessonDetailScreen(
                              lesson: lesson,
                              subjectName: subjectName,
                            ),
                          ),
                        );
                      },
                    );
                  },
                ),
              );
            },
          ),
        ),
        if (lessonsState.isLoading)
          const Padding(
            padding: EdgeInsets.all(16),
            child: CircularProgressIndicator(),
          ),
        if (lessonsState.hasMore && !lessonsState.isLoading)
          Padding(
            padding: const EdgeInsets.all(16),
            child: ElevatedButton(
              onPressed: () => lessonsNotifier.loadLessons(loadMore: true),
              child: const Text('Load More'),
            ),
          ),
      ],
    );
  }
}
