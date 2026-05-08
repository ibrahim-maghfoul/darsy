import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'api_service.dart';

class LessonProgressData {
  final String lessonId;
  final String subjectId;
  final bool isFavorite;
  final int totalTimeSpent;
  final List<String> completedResources;
  final int totalResourcesCount;

  LessonProgressData({
    required this.lessonId,
    required this.subjectId,
    this.isFavorite = false,
    this.totalTimeSpent = 0,
    this.completedResources = const [],
    this.totalResourcesCount = 0,
  });

  factory LessonProgressData.fromJson(Map<String, dynamic> json) {
    return LessonProgressData(
      lessonId: json['lessonId'] ?? '',
      subjectId: json['subjectId'] ?? '',
      isFavorite: json['isFavorite'] ?? false,
      totalTimeSpent: json['totalTimeSpent'] ?? 0,
      completedResources: List<String>.from(json['completedResources'] ?? []),
      totalResourcesCount: json['totalResourcesCount'] ?? 0,
    );
  }

  double get completionPercent {
    if (totalResourcesCount == 0) return 0;
    return (completedResources.length / totalResourcesCount).clamp(0.0, 1.0);
  }
}

class SubjectProgressData {
  final String subjectId;
  final int totalLessons;
  final int startedLessons;
  final double avgCompletion;
  final List<LessonProgressData> lessons;

  SubjectProgressData({
    required this.subjectId,
    this.totalLessons = 0,
    this.startedLessons = 0,
    this.avgCompletion = 0,
    this.lessons = const [],
  });

  factory SubjectProgressData.fromJson(Map<String, dynamic> json) {
    return SubjectProgressData(
      subjectId: json['subjectId'] ?? '',
      totalLessons: json['totalLessons'] ?? 0,
      startedLessons: json['startedLessons'] ?? 0,
      avgCompletion: (json['avgCompletion'] ?? 0).toDouble(),
      lessons: (json['lessons'] as List? ?? [])
          .map((l) => LessonProgressData.fromJson(l))
          .toList(),
    );
  }
}

class ProgressService {
  final ApiService _api;

  ProgressService(this._api);

  /// Track that a resource (pdf, video) was viewed
  Future<void> trackResourceView({
    required String lessonId,
    required String subjectId,
    required String resourceId,
    required String resourceType,
  }) async {
    try {
      await _api.post(
        '/progress/track-view',
        data: {
          'lessonId': lessonId,
          'subjectId': subjectId,
          'resourceId': resourceId,
          'resourceType': resourceType,
        },
      );
    } catch (e) {
      debugPrint('Error tracking resource view: $e');
    }
  }

  /// Update time spent on a lesson
  Future<void> updateResourceProgress(
    String lessonId,
    int timeSpentSeconds,
  ) async {
    try {
      await _api.post(
        '/progress/update-progress',
        data: {'lessonId': lessonId, 'timeSpent': timeSpentSeconds},
      );
    } catch (e) {
      debugPrint('Error updating resource progress: $e');
    }
  }

  /// Mark a resource as completed
  Future<void> markResourceComplete({
    required String lessonId,
    required String subjectId,
    required String resourceId,
    required String resourceType,
    bool isCompleted = true,
  }) async {
    try {
      await _api.post(
        '/progress/mark-complete',
        data: {
          'lessonId': lessonId,
          'subjectId': subjectId,
          'resourceId': resourceId,
          'resourceType': resourceType,
          'isCompleted': isCompleted,
        },
      );
    } catch (e) {
      debugPrint('Error marking resource complete: $e');
    }
  }

  /// Toggle a lesson as favorite
  Future<bool> toggleFavorite(String lessonId) async {
    try {
      final response = await _api.post(
        '/progress/toggle-favorite',
        data: {'lessonId': lessonId},
      );
      return response.data['isFavorite'] ?? false;
    } on DioException catch (e) {
      debugPrint('Error toggling favorite: $e');
      rethrow;
    }
  }

  /// Get all favorite lessons
  Future<List<LessonProgressData>> getFavorites() async {
    try {
      final response = await _api.get('/progress/favorites');
      return (response.data as List? ?? [])
          .map((l) => LessonProgressData.fromJson(l))
          .toList();
    } catch (e) {
      debugPrint('Error fetching favorites: $e');
      return [];
    }
  }

  /// Get progress for a specific subject
  Future<SubjectProgressData> getSubjectProgress(String subjectId) async {
    try {
      final response = await _api.get('/progress/subject/$subjectId');
      return SubjectProgressData.fromJson(response.data);
    } catch (e) {
      debugPrint('Error fetching subject progress: $e');
      return SubjectProgressData(subjectId: subjectId);
    }
  }

  /// Get progress for a specific lesson
  Future<LessonProgressData?> getLessonProgress(String lessonId) async {
    try {
      final response = await _api.get('/progress/lesson/$lessonId');
      return LessonProgressData.fromJson(response.data);
    } catch (e) {
      debugPrint('Error fetching lesson progress: $e');
      return null;
    }
  }

  /// Update the total resource count for a lesson
  Future<void> updateResourceCount(String lessonId, int count) async {
    try {
      await _api.post(
        '/progress/update-resource-count',
        data: {'lessonId': lessonId, 'count': count},
      );
    } catch (e) {
      debugPrint('Error updating resource count: $e');
    }
  }
}

final progressServiceProvider = Provider<ProgressService>((ref) {
  final api = ref.watch(apiServiceProvider);
  return ProgressService(api);
});

final subjectProgressProvider =
    FutureProvider.family<SubjectProgressData, String>((ref, subjectId) {
      return ref.read(progressServiceProvider).getSubjectProgress(subjectId);
    });

final favoriteLessonsProvider = FutureProvider<List<LessonProgressData>>((ref) {
  return ref.read(progressServiceProvider).getFavorites();
});
