import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/services/firebase_service.dart';
import '../../data/models/school_model.dart';
import '../../data/models/level_model.dart';
import '../../data/models/guidance_model.dart';
import '../../data/models/subject_model.dart';
import '../../data/models/lesson_model.dart';
import '../providers/preferences_provider.dart';

// Firebase service provider
final firebaseServiceProvider = Provider((ref) => FirebaseService());

// State notifiers for filters
class SelectedSchoolNotifier extends Notifier<String?> {
  @override
  String? build() => null;
  void set(String? value) => state = value;
}

final selectedSchoolProvider =
    NotifierProvider<SelectedSchoolNotifier, String?>(
      SelectedSchoolNotifier.new,
    );

class SelectedLevelNotifier extends Notifier<String?> {
  @override
  String? build() {
    final prefs = ref.watch(preferencesProvider);
    return prefs.getSelectedLevel();
  }

  void set(String? value) => state = value;
}

final selectedLevelProvider = NotifierProvider<SelectedLevelNotifier, String?>(
  SelectedLevelNotifier.new,
);

class SelectedGuidanceNotifier extends Notifier<String?> {
  @override
  String? build() {
    final prefs = ref.watch(preferencesProvider);
    return prefs.getSelectedGuidance();
  }

  void set(String? value) => state = value;
}

final selectedGuidanceProvider =
    NotifierProvider<SelectedGuidanceNotifier, String?>(
      SelectedGuidanceNotifier.new,
    );

class SelectedSubjectNotifier extends Notifier<String?> {
  @override
  String? build() => null;
  void set(String? value) => state = value;
}

final selectedSubjectProvider =
    NotifierProvider<SelectedSubjectNotifier, String?>(
      SelectedSubjectNotifier.new,
    );

// Schools provider
final schoolsProvider = FutureProvider<List<School>>((ref) async {
  final service = ref.read(firebaseServiceProvider);
  return await service.fetchSchools();
});

// Levels provider (filtered by selected school)
final levelsProvider = FutureProvider<List<Level>>((ref) async {
  final service = ref.read(firebaseServiceProvider);
  final selectedSchool = ref.watch(selectedSchoolProvider);
  return await service.fetchLevels(schoolId: selectedSchool);
});

// Guidances provider (filtered by selected level)
final guidancesProvider = FutureProvider<List<Guidance>>((ref) async {
  final service = ref.read(firebaseServiceProvider);
  final selectedLevel = ref.watch(selectedLevelProvider);
  return await service.fetchGuidances(levelId: selectedLevel);
});

final subjectsProvider = FutureProvider<List<Subject>>((ref) async {
  final service = ref.read(firebaseServiceProvider);
  final selectedGuidance = ref.watch(selectedGuidanceProvider);

  if (selectedGuidance == null) return [];

  return await service.fetchSubjects(guidanceId: selectedGuidance);
});

// Global subjects provider for mapping (unfiltered)
final globalSubjectsProvider = FutureProvider<List<Subject>>((ref) async {
  final service = ref.read(firebaseServiceProvider);
  return await service.fetchSubjects();
});

// Lessons state class
class LessonsState {
  final List<Lesson> lessons;
  final DocumentSnapshot? lastDoc;
  final bool hasMore;
  final bool isLoading;

  LessonsState({
    this.lessons = const [],
    this.lastDoc,
    this.hasMore = false,
    this.isLoading = false,
  });

  LessonsState copyWith({
    List<Lesson>? lessons,
    DocumentSnapshot? lastDoc,
    bool? hasMore,
    bool? isLoading,
  }) {
    return LessonsState(
      lessons: lessons ?? this.lessons,
      lastDoc: lastDoc ?? this.lastDoc,
      hasMore: hasMore ?? this.hasMore,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

// Lessons state notifier
class LessonsNotifier extends Notifier<LessonsState> {
  late final FirebaseService _service;
  late final String? subjectId;

  @override
  LessonsState build() {
    _service = ref.read(firebaseServiceProvider);
    // Note: When used as family, subjectId is set by the provider
    return LessonsState();
  }

  void init(String? subId) {
    subjectId = subId;
  }

  Future<void> loadLessons({bool loadMore = false}) async {
    if (state.isLoading) return;

    if (!loadMore) {
      state = LessonsState(isLoading: true);
    } else {
      state = state.copyWith(isLoading: true);
    }

    try {
      final result = await _service.fetchLessons(
        subjectId: subjectId,
        pageSize: 20,
        startAfterDoc: loadMore ? state.lastDoc : null,
      );

      if (loadMore) {
        state = state.copyWith(
          lessons: [...state.lessons, ...result.lessons],
          lastDoc: result.lastDoc,
          hasMore: result.hasMore,
          isLoading: false,
        );
      } else {
        state = LessonsState(
          lessons: result.lessons,
          lastDoc: result.lastDoc,
          hasMore: result.hasMore,
          isLoading: false,
        );
      }
    } catch (e) {
      state = state.copyWith(isLoading: false);
      rethrow;
    }
  }

  void reset() {
    state = LessonsState();
  }
}

// Lessons provider (filtered by selected subject)
final lessonsProvider =
    NotifierProvider.family<LessonsNotifier, LessonsState, String?>((arg) {
      final notifier = LessonsNotifier();
      notifier.init(arg);
      return notifier;
    });

// Single lesson provider
final lessonByIdProvider = FutureProvider.family<Lesson?, String>((
  ref,
  lessonId,
) async {
  final service = ref.read(firebaseServiceProvider);
  return await service.fetchLessonById(lessonId);
});

// Exams provider (filtered by selected subject)
final examsProvider = FutureProvider.family<List<Lesson>, String?>((
  ref,
  subId,
) async {
  final service = ref.read(firebaseServiceProvider);
  if (subId == null) return [];
  return await service.fetchExams(subjectId: subId);
});
