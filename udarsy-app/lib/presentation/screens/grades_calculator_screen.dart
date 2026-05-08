import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/app_colors.dart';
import '../providers/preferences_provider.dart';

class SubjectEntry {
  final TextEditingController nameCtrl;
  final TextEditingController coeffCtrl;
  final List<TextEditingController> gradesCtrls;

  SubjectEntry()
    : nameCtrl = TextEditingController(),
      coeffCtrl = TextEditingController(text: '1'),
      gradesCtrls = [TextEditingController()];
}

class GradesCalculatorScreen extends ConsumerStatefulWidget {
  const GradesCalculatorScreen({super.key});

  @override
  ConsumerState<GradesCalculatorScreen> createState() =>
      _GradesCalculatorScreenState();
}

class _GradesCalculatorScreenState
    extends ConsumerState<GradesCalculatorScreen> {
  List<SubjectEntry> _subjects = [SubjectEntry()];
  String? _result;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final prefs = ref.read(preferencesProvider);
    final data = prefs.getGradesData();
    if (data != null) {
      try {
        final List<dynamic> decoded = jsonDecode(data);
        final loadedSubjects = decoded.map((s) {
          final entry = SubjectEntry();
          entry.nameCtrl.text = s['name'] ?? '';
          entry.coeffCtrl.text = s['coeff']?.toString() ?? '1';

          final List<dynamic> grades = s['grades'] ?? [];
          entry.gradesCtrls.clear();
          if (grades.isEmpty) {
            entry.gradesCtrls.add(TextEditingController());
          } else {
            for (final g in grades) {
              entry.gradesCtrls.add(
                TextEditingController(text: g?.toString() ?? ''),
              );
            }
          }
          return entry;
        }).toList();

        if (loadedSubjects.isNotEmpty) {
          setState(() {
            _subjects = loadedSubjects;
            _calculate();
          });
        }
      } catch (e) {
        debugPrint('Error loading grades data: $e');
      }
    }
  }

  Future<void> _saveData() async {
    final prefs = ref.read(preferencesProvider);
    final data = _subjects
        .map(
          (s) => {
            'name': s.nameCtrl.text,
            'coeff': s.coeffCtrl.text,
            'grades': s.gradesCtrls.map((c) => c.text).toList(),
          },
        )
        .toList();
    await prefs.saveGradesData(jsonEncode(data));
  }

  double? _subjectAvg(SubjectEntry s) {
    final grades = s.gradesCtrls
        .map((c) => double.tryParse(c.text))
        .whereType<double>()
        .toList();
    if (grades.isEmpty) return null;
    return grades.reduce((a, b) => a + b) / grades.length;
  }

  void _calculate() {
    double totalWeighted = 0;
    double totalCoeff = 0;

    for (final s in _subjects) {
      final coeff = double.tryParse(s.coeffCtrl.text) ?? 1;
      final avg = _subjectAvg(s);
      if (avg != null) {
        totalWeighted += avg * coeff;
        totalCoeff += coeff;
      }
    }

    if (totalCoeff == 0) {
      setState(() => _result = null);
      return;
    }

    final gpa = totalWeighted / totalCoeff;
    setState(() => _result = gpa.toStringAsFixed(2));
    _saveData();
  }

  void _addSubject() {
    setState(() => _subjects.add(SubjectEntry()));
    _saveData();
  }

  void _removeSubject(int i) {
    if (_subjects.length > 1) {
      setState(() {
        _subjects.removeAt(i);
        _calculate();
      });
      _saveData();
    }
  }

  void _setNumExams(int subjectIdx, int num) {
    setState(() {
      final s = _subjects[subjectIdx];
      while (s.gradesCtrls.length < num) {
        s.gradesCtrls.add(TextEditingController());
      }
      while (s.gradesCtrls.length > num) {
        s.gradesCtrls.removeLast().dispose();
      }
      _calculate();
      _saveData();
    });
  }

  Color _gpaColor(double gpa) {
    if (gpa >= 14) return Colors.green;
    if (gpa >= 10) return Colors.orange;
    return Colors.red;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Grades Calculator',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            onPressed: _addSubject,
            icon: const Icon(Icons.add_circle_outline_rounded),
            tooltip: 'Add Subject',
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _subjects.length,
              itemBuilder: (ctx, i) => _buildSubjectCard(i),
            ),
          ),

          // Result & Calculate
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 20,
                  offset: const Offset(0, -5),
                ),
              ],
            ),
            child: Column(
              children: [
                if (_result != null) ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: _gpaColor(
                        double.parse(_result!),
                      ).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: _gpaColor(
                          double.parse(_result!),
                        ).withValues(alpha: 0.3),
                      ),
                    ),
                    child: Column(
                      children: [
                        Text(
                          'Your Weighted Average',
                          style: TextStyle(
                            color: _gpaColor(double.parse(_result!)),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          '$_result / 20',
                          style: TextStyle(
                            fontSize: 40,
                            fontWeight: FontWeight.bold,
                            color: _gpaColor(double.parse(_result!)),
                          ),
                        ),
                      ],
                    ),
                  ).animate().scale().fadeIn(),
                  const SizedBox(height: 12),
                ],
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: _calculate,
                    icon: const Icon(Icons.calculate_rounded),
                    label: const Text(
                      'Calculate Average',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSubjectCard(int i) {
    final s = _subjects[i];
    final numExams = s.gradesCtrls.length;

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Center(
                    child: Text(
                      '${i + 1}',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextField(
                    controller: s.nameCtrl,
                    decoration: const InputDecoration(
                      hintText: 'Subject name (e.g. Mathematics)',
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.zero,
                    ),
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(
                    Icons.delete_outline_rounded,
                    color: Colors.red,
                  ),
                  onPressed: () => _removeSubject(i),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Coefficient and number of exams
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Coefficient',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: Colors.grey,
                        ),
                      ),
                      const SizedBox(height: 4),
                      TextField(
                        controller: s.coeffCtrl,
                        keyboardType: const TextInputType.numberWithOptions(
                          decimal: true,
                        ),
                        decoration: InputDecoration(
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 10,
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        onChanged: (_) => setState(() => _calculate()),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Number of exams',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: Colors.grey,
                        ),
                      ),
                      const SizedBox(height: 4),
                      DropdownButtonFormField<int>(
                        value: numExams,
                        decoration: InputDecoration(
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 10,
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        items: [1, 2, 3, 4]
                            .map(
                              (n) =>
                                  DropdownMenuItem(value: n, child: Text('$n')),
                            )
                            .toList(),
                        onChanged: (n) => _setNumExams(i, n!),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Exam grade fields
            const Text(
              'Exam Grades',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: Colors.grey,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: s.gradesCtrls.asMap().entries.map((e) {
                return Expanded(
                  child: Container(
                    margin: EdgeInsets.only(
                      right: e.key < s.gradesCtrls.length - 1 ? 8 : 0,
                    ),
                    child: TextField(
                      controller: e.value,
                      keyboardType: const TextInputType.numberWithOptions(
                        decimal: true,
                      ),
                      textAlign: TextAlign.center,
                      decoration: InputDecoration(
                        hintText: 'Exam ${e.key + 1}',
                        contentPadding: const EdgeInsets.symmetric(
                          vertical: 10,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      onChanged: (_) => setState(() => _calculate()),
                    ),
                  ),
                );
              }).toList(),
            ),

            // Subject avg preview
            Builder(
              builder: (_) {
                final avg = _subjectAvg(s);
                if (avg == null) return const SizedBox.shrink();
                return Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Text(
                        'Average: ${avg.toStringAsFixed(2)} / 20',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: _gpaColor(avg),
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ),
    ).animate().fadeIn(delay: (80 * i).ms).slideX(begin: 0.05);
  }
}
