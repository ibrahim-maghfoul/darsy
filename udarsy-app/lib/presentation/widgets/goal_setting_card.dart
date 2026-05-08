import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/app_colors.dart';
import '../providers/user_progress_provider.dart';

class GoalSettingCard extends ConsumerWidget {
  const GoalSettingCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userProgress = ref.watch(userProgressProvider);
    final selectedGoal = userProgress.selectedGoal;

    if (selectedGoal == null) {
      return _buildGoalSelection(context, ref);
    }

    return _buildGoalChecklist(context, ref, userProgress);
  }

  Widget _buildGoalSelection(BuildContext context, WidgetRef ref) {
    final goals = [
      {
        'title': 'Read all PDFs',
        'subtitle': 'Master your curriculum document by document',
        'icon': Icons.picture_as_pdf_rounded,
        'color': Colors.red,
      },
      {
        'title': 'Get good grades at school',
        'subtitle': 'Focus on exam preparation and high scores',
        'icon': Icons.school_rounded,
        'color': Colors.amber,
      },
      {
        'title': 'Study 1 hour a day',
        'subtitle': 'Build a consistent daily learning habit',
        'icon': Icons.timer_rounded,
        'color': Colors.blue,
      },
    ];

    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      elevation: 4,
      shadowColor: Colors.black.withOpacity(0.1),
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Set Your Learning Goal',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'What is your main objective in 9eray?',
              style: TextStyle(color: Colors.grey[600], fontSize: 14),
            ),
            const SizedBox(height: 24),
            ...goals.map(
              (goal) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  onTap: () => ref
                      .read(userProgressProvider.notifier)
                      .setGoal(goal['title'] as String),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  tileColor: (goal['color'] as Color).withOpacity(0.05),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                    side: BorderSide(
                      color: (goal['color'] as Color).withOpacity(0.1),
                    ),
                  ),
                  leading: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: (goal['color'] as Color).withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      goal['icon'] as IconData,
                      color: goal['color'] as Color,
                    ),
                  ),
                  title: Text(
                    goal['title'] as String,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  subtitle: Text(
                    goal['subtitle'] as String,
                    style: const TextStyle(fontSize: 12),
                  ),
                  trailing: const Icon(Icons.chevron_right_rounded),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGoalChecklist(
    BuildContext context,
    WidgetRef ref,
    UserProgressData data,
  ) {
    final checklistItems = _getChecklistForGoal(data.selectedGoal!);

    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      elevation: 4,
      shadowColor: Colors.black.withOpacity(0.1),
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Your Current Goal',
                      style: TextStyle(
                        color: AppColors.textGrey,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      data.selectedGoal!,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                TextButton(
                  onPressed: () =>
                      ref.read(userProgressProvider.notifier).setGoal(null),
                  child: const Text('Change'),
                ),
              ],
            ),
            const SizedBox(height: 20),
            ...checklistItems.map((item) {
              final isChecked = data.goalChecklist.contains(item);
              return CheckboxListTile(
                value: isChecked,
                onChanged: (_) => ref
                    .read(userProgressProvider.notifier)
                    .toggleGoalItem(item),
                title: Text(
                  item,
                  style: TextStyle(
                    fontSize: 14,
                    decoration: isChecked ? TextDecoration.lineThrough : null,
                    color: isChecked ? Colors.grey : null,
                  ),
                ),
                controlAffinity: ListTileControlAffinity.leading,
                contentPadding: EdgeInsets.zero,
                dense: true,
                activeColor: AppColors.primary,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              );
            }),
          ],
        ),
      ),
    );
  }

  List<String> _getChecklistForGoal(String goal) {
    switch (goal) {
      case 'Read all PDFs':
        return [
          'Download latest lessons',
          'Review summary documents',
          'Complete reading assignments',
          'Mark PDFs as read',
        ];
      case 'Get good grades at school':
        return [
          'Practice previous exams',
          'Watch video explanations',
          'Take interactive quizzes',
          'Submit exercises for review',
        ];
      case 'Study 1 hour a day':
        return [
          'Morning study session (20m)',
          'Afternoon review session (20m)',
          'Evening practice session (20m)',
          'Review progress daily',
        ];
      default:
        return [];
    }
  }
}
