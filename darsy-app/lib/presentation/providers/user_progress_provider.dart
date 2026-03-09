import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'preferences_provider.dart';
import 'lessons_provider.dart';
import 'auth_provider.dart';
import '../../core/services/api_service.dart';

// User progress data model
class UserProgressData {
  final String userName;
  final int level;
  final int xp;
  final int xpToNextLevel;
  final String currentSubject;
  final int totalLessons;
  final int completedLessons;

  final String age;
  final String genre;
  final String? nickname;
  final String? city;
  final String? mobilePhone;
  final String? profilePicture;
  final String? levelTitle;

  // New stats
  final int videoCount;
  final int pdfCount;
  final int exerciseCount;
  final int resourceCount;
  final int learningTimeMins;
  final List<String> history;

  // Total stats from content_stats
  final int totalPdfs;
  final int totalVideos;
  final int totalExercises;
  final int totalExams;
  final int totalResources;
  final int totalSubjects;

  // Goal Tracking
  final String? selectedGoal;
  final List<String> goalChecklist;

  UserProgressData({
    required this.userName,
    required this.level,
    required this.xp,
    required this.xpToNextLevel,
    required this.currentSubject,
    required this.totalLessons,
    required this.completedLessons,
    this.age = '',
    this.genre = '',
    this.nickname,
    this.city,
    this.mobilePhone,
    this.profilePicture,
    this.levelTitle,
    this.videoCount = 0,
    this.pdfCount = 0,
    this.exerciseCount = 0,
    this.resourceCount = 0,
    this.learningTimeMins = 0,
    this.history = const [],
    this.totalPdfs = 0,
    this.totalVideos = 0,
    this.totalExercises = 0,
    this.totalExams = 0,
    this.totalResources = 0,
    this.totalSubjects = 0,
    this.selectedGoal,
    this.goalChecklist = const [],
  });

  double get lessonsProgress =>
      totalLessons > 0 ? completedLessons / totalLessons : 0.0;

  double get globalProgress {
    final total = totalPdfs + totalVideos + totalResources;
    if (total == 0) return 0.0;
    return (pdfCount + videoCount + resourceCount) / total;
  }

  int get itemsRemaining {
    final total = totalPdfs + totalVideos + totalResources;
    final current = pdfCount + videoCount + resourceCount;
    return (total - current).clamp(0, total);
  }

  double get overallProgress => lessonsProgress;

  String get formattedLearningTime {
    final int minutes = learningTimeMins;
    final int jj = minutes ~/ (24 * 60);
    final int hh = (minutes % (24 * 60)) ~/ 60;
    final int min = minutes % 60;

    return '${jj.toString().padLeft(2, '0')}.${hh.toString().padLeft(2, '0')}.${min.toString().padLeft(2, '0')}';
  }

  String get levelDescription {
    if (level < 5) return 'Beginner';
    if (level < 10) return 'Intermediate';
    if (level < 20) return 'Advanced';
    return 'Expert';
  }

  UserProgressData copyWith({
    String? userName,
    int? level,
    int? xp,
    int? xpToNextLevel,
    String? currentSubject,
    int? totalLessons,
    int? completedLessons,
    String? age,
    String? genre,
    String? nickname,
    String? city,
    String? mobilePhone,
    String? profilePicture,
    String? levelTitle,
    int? videoCount,
    int? pdfCount,
    int? exerciseCount,
    int? resourceCount,
    int? learningTimeMins,
    List<String>? history,
    int? totalPdfs,
    int? totalVideos,
    int? totalExercises,
    int? totalExams,
    int? totalResources,
    int? totalSubjects,
    String? selectedGoal,
    List<String>? goalChecklist,
  }) {
    return UserProgressData(
      userName: userName ?? this.userName,
      level: level ?? this.level,
      xp: xp ?? this.xp,
      xpToNextLevel: xpToNextLevel ?? this.xpToNextLevel,
      currentSubject: currentSubject ?? this.currentSubject,
      totalLessons: totalLessons ?? this.totalLessons,
      completedLessons: completedLessons ?? this.completedLessons,
      age: age ?? this.age,
      genre: genre ?? this.genre,
      nickname: nickname ?? this.nickname,
      city: city ?? this.city,
      mobilePhone: mobilePhone ?? this.mobilePhone,
      profilePicture: profilePicture ?? this.profilePicture,
      levelTitle: levelTitle ?? this.levelTitle,
      videoCount: videoCount ?? this.videoCount,
      pdfCount: pdfCount ?? this.pdfCount,
      exerciseCount: exerciseCount ?? this.exerciseCount,
      resourceCount: resourceCount ?? this.resourceCount,
      learningTimeMins: learningTimeMins ?? this.learningTimeMins,
      history: history ?? this.history,
      totalPdfs: totalPdfs ?? this.totalPdfs,
      totalVideos: totalVideos ?? this.totalVideos,
      totalExercises: totalExercises ?? this.totalExercises,
      totalExams: totalExams ?? this.totalExams,
      totalResources: totalResources ?? this.totalResources,
      totalSubjects: totalSubjects ?? this.totalSubjects,
      selectedGoal: selectedGoal ?? this.selectedGoal,
      goalChecklist: goalChecklist ?? this.goalChecklist,
    );
  }
}

// User progress notifier using Riverpod 3.x Notifier
class UserProgressNotifier extends Notifier<UserProgressData> {
  @override
  UserProgressData build() {
    // Watch for selection changes to re-fetch stats
    ref.watch(selectedGuidanceProvider);
    ref.watch(selectedLevelProvider);

    // Watch auth state to update profile details
    final authState = ref.watch(authProvider);

    _loadFromPrefs();

    // If authenticated, override specific fields from AuthState
    if (authState.isAuthenticated && authState.user != null) {
      final user = authState.user!;
      state = state.copyWith(
        userName: user.displayName,
        nickname: user.nickname,
        city: user.city,
        age: user.age,
        genre: user.gender,
        mobilePhone: user.phone,
        profilePicture: user.photoURL,
        levelTitle: user.level?.guidance,
      );
    }

    // Schedule a fetch on next frame
    Future.microtask(() => fetchGlobalStats());

    return state;
  }

  void _loadFromPrefs() {
    final prefs = ref.read(preferencesProvider);
    state = UserProgressData(
      userName: prefs.getUserName() ?? '9ERAY User',
      level: 1, // Calculate based on XP if needed
      xp: 450,
      xpToNextLevel: 1000,
      currentSubject: prefs.getLevelTitle() ?? 'Student',
      totalLessons: prefs.getTotalLessonCount(),
      completedLessons: 0, // Should be fetched from Firestore user record later
      nickname: prefs.getNickname(),
      age: prefs.getAge() ?? '',
      genre: prefs.getGender() ?? '',
      city: prefs.getCity(),
      mobilePhone: prefs.getMobile(),
      profilePicture: prefs.getProfilePicture(),
      levelTitle: prefs.getLevelTitle(),
      videoCount: prefs.getVideoCount(),
      pdfCount: prefs.getPdfCount(),
      exerciseCount: prefs.getExerciseCount(),
      resourceCount: prefs.getResourceCount(),
      learningTimeMins: prefs.getLearningTime(),
      history: prefs.getVisitHistory(),
      totalPdfs: prefs.getTotalPdfCount(),
      totalVideos: prefs.getTotalVideoCount(),
      totalExercises: prefs.getTotalExerciseCount(),
      totalExams: prefs.getTotalExamCount(),
      totalResources: prefs.getTotalResourceCount(),
      totalSubjects: prefs.getTotalSubjectCount(),
      selectedGoal: prefs.getSelectedGoal(),
      goalChecklist: prefs.getGoalChecklist(),
    );
  }

  Future<void> fetchGlobalStats() async {
    final prefs = ref.read(preferencesProvider);
    final guidanceId = prefs.getSelectedGuidance();
    final docId = guidanceId ?? prefs.getSelectedLevel();

    if (docId == null) return;

    try {
      final api = ref.read(apiServiceProvider);
      final response = await api.get('/data/guidance-stats/$docId');

      if (response.statusCode == 200) {
        final Map<String, dynamic> data;

        // Handle both direct guidance stats and consolidated report extraction
        if (response.data is Map && response.data.containsKey('levelsStat')) {
          final levelsList = response.data['levelsStat'] as List;
          data = Map<String, dynamic>.from(
            levelsList.firstWhere(
                  (l) => l['guidanceId'] == docId,
                  orElse: () => <String, dynamic>{},
                )
                as Map,
          );
        } else {
          data = response.data as Map<String, dynamic>;
        }

        if (data.isNotEmpty) {
          state = state.copyWith(
            totalPdfs: data['totalPdfs'] ?? 0,
            totalVideos: data['totalVideos'] ?? 0,
            totalExercises: data['totalExercises'] ?? 0,
            totalExams: data['totalExams'] ?? 0,
            totalResources: data['totalResources'] ?? 0,
            totalSubjects: data['totalSubjects'] ?? 0,
            totalLessons: data['totalLessons'] ?? 0,
          );

          // Update prefs with new totals
          prefs.saveTotalPdfCount(state.totalPdfs);
          prefs.saveTotalVideoCount(state.totalVideos);
          prefs.saveTotalExerciseCount(state.totalExercises);
          prefs.saveTotalExamCount(state.totalExams);
          prefs.saveTotalResourceCount(state.totalResources);
          prefs.saveTotalSubjectCount(state.totalSubjects);
          prefs.saveTotalLessonCount(state.totalLessons);
        }
      }
    } catch (e) {
      debugPrint('Error fetching guidance stats: $e');
    }
  }

  Future<void> refreshStats() async {
    await fetchGlobalStats();
  }

  void updateProfile({
    String? name,
    String? age,
    String? genre,
    String? nickname,
    String? city,
    String? mobilePhone,
    String? profilePicture,
    String? levelTitle,
  }) {
    state = state.copyWith(
      userName: name,
      age: age,
      genre: genre,
      nickname: nickname,
      city: city,
      mobilePhone: mobilePhone,
      profilePicture: profilePicture,
      levelTitle: levelTitle,
    );
  }

  // Method to update progress when a lesson is completed
  void completeLesson() {
    state = state.copyWith(
      xp: state.xp + 50,
      completedLessons: state.completedLessons + 1,
    );
    _checkLevelUp();
  }

  // Check if user should level up
  void _checkLevelUp() {
    if (state.xp >= state.xpToNextLevel) {
      final newLevel = state.level + 1;
      final newXpToNextLevel = state.xpToNextLevel + 500;
      state = state.copyWith(
        level: newLevel,
        xp: state.xp - state.xpToNextLevel,
        xpToNextLevel: newXpToNextLevel,
      );
    }
  }

  // Method to change current subject
  void changeCurrentSubject(String subjectName, int lessons) {
    state = state.copyWith(
      currentSubject: subjectName,
      totalLessons: lessons,
      completedLessons: 0,
    );
  }

  // Increment resource stats
  void incrementVideoCount() {
    state = state.copyWith(videoCount: state.videoCount + 1);
    ref.read(preferencesProvider).saveVideoCount(state.videoCount);
  }

  void incrementPdfCount() {
    state = state.copyWith(pdfCount: state.pdfCount + 1);
    ref.read(preferencesProvider).savePdfCount(state.pdfCount);
  }

  void incrementExerciseCount() {
    state = state.copyWith(exerciseCount: state.exerciseCount + 1);
    ref.read(preferencesProvider).saveExerciseCount(state.exerciseCount);
  }

  void incrementResourceCount() {
    state = state.copyWith(resourceCount: state.resourceCount + 1);
    ref.read(preferencesProvider).saveResourceCount(state.resourceCount);
  }

  // Add learning time
  void addLearningTime(int minutes) {
    state = state.copyWith(learningTimeMins: state.learningTimeMins + minutes);
    ref.read(preferencesProvider).saveLearningTime(state.learningTimeMins);
  }

  // Update history
  void addToHistory(String pageName) {
    final List<String> newHistory = List.from(state.history);

    // Remove if already exists to move it to the front
    newHistory.remove(pageName);

    // Insert at front
    newHistory.insert(0, pageName);

    // Keep only last 3
    if (newHistory.length > 3) {
      newHistory.removeRange(3, newHistory.length);
    }

    state = state.copyWith(history: newHistory);
    ref.read(preferencesProvider).saveVisitHistory(state.history);
  }

  // TODO: Method to load user progress from Firebase
  Future<void> loadUserProgress(String userId) async {
    // Implementation will fetch from Firebase
    // For now, using mock data
  }

  // TODO: Method to save user progress to Firebase
  Future<void> saveUserProgress() async {
    // Implementation will save to Firebase
  }

  void setGoal(String? goal) {
    state = state.copyWith(selectedGoal: goal, goalChecklist: []);
    ref.read(preferencesProvider).saveSelectedGoal(goal);
    ref.read(preferencesProvider).saveGoalChecklist([]);
  }

  void toggleGoalItem(String item) {
    final newList = List<String>.from(state.goalChecklist);
    if (newList.contains(item)) {
      newList.remove(item);
    } else {
      newList.add(item);
    }
    state = state.copyWith(goalChecklist: newList);
    ref.read(preferencesProvider).saveGoalChecklist(newList);
  }

  Future<void> toggleNewsFavorite(String newsId) async {
    try {
      final api = ref.read(apiServiceProvider);
      await api.post('/user/saved-news', data: {'newsId': newsId});
      await ref.read(authProvider.notifier).refreshUser();
    } catch (e) {
      debugPrint('Error toggling news favorite: $e');
    }
  }
}

// Provider for user progress using Riverpod 3.x
final userProgressProvider =
    NotifierProvider<UserProgressNotifier, UserProgressData>(
      UserProgressNotifier.new,
    );
