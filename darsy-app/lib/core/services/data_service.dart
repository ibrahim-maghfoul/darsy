import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/school_model.dart';
import '../../data/models/level_model.dart';
import '../../data/models/guidance_model.dart';
import '../../data/models/subject_model.dart';
import '../../data/models/lesson_model.dart';
import 'api_service.dart';

/// REST API-based data service replacing FirebaseService
class DataService {
  final ApiService _api;

  // In-memory caches
  List<School>? _schoolsCache;

  DataService(this._api);

  /// Fetch all schools
  Future<List<School>> fetchSchools() async {
    if (_schoolsCache != null) return _schoolsCache!;

    try {
      final response = await _api.get('/data/schools');
      final List data = response.data;
      _schoolsCache = data.map((json) => School.fromJson(json)).toList();
      return _schoolsCache!;
    } catch (e) {
      debugPrint('Error fetching schools: $e');
      rethrow;
    }
  }

  /// Fetch levels for a specific school
  Future<List<Level>> fetchLevels({String? schoolId}) async {
    try {
      final path = schoolId != null
          ? '/data/levels/$schoolId'
          : '/data/levels/all';
      final response = await _api.get(path);
      final List data = response.data;
      return data.map((json) => Level.fromJson(json)).toList();
    } catch (e) {
      debugPrint('Error fetching levels: $e');
      rethrow;
    }
  }

  /// Fetch guidances for a specific level
  Future<List<Guidance>> fetchGuidances({String? levelId}) async {
    try {
      final path = levelId != null
          ? '/data/guidances/$levelId'
          : '/data/guidances/all';
      final response = await _api.get(path);
      final List data = response.data;
      return data.map((json) => Guidance.fromJson(json)).toList();
    } catch (e) {
      debugPrint('Error fetching guidances: $e');
      rethrow;
    }
  }

  /// Fetch subjects for a specific guidance
  Future<List<Subject>> fetchSubjects({String? guidanceId}) async {
    try {
      final path = guidanceId != null
          ? '/data/subjects/$guidanceId'
          : '/data/subjects/all';
      final response = await _api.get(path);
      final List data = response.data;
      return data.map((json) => Subject.fromJson(json)).toList();
    } catch (e) {
      debugPrint('Error fetching subjects: $e');
      rethrow;
    }
  }

  /// Fetch lessons with pagination
  Future<({List<Lesson> lessons, bool hasMore})> fetchLessons({
    String? subjectId,
    int page = 1,
    int pageSize = 20,
  }) async {
    try {
      final path = subjectId != null
          ? '/data/lessons/$subjectId'
          : '/data/lessons/all';
      final response = await _api.get(
        path,
        queryParameters: {'page': page, 'limit': pageSize},
      );
      final List data = response.data is List
          ? response.data
          : response.data['lessons'] ?? [];
      final lessons = data.map((json) => Lesson.fromJson(json)).toList();
      return (lessons: lessons, hasMore: lessons.length == pageSize);
    } catch (e) {
      debugPrint('Error fetching lessons: $e');
      rethrow;
    }
  }

  /// Fetch a single lesson by ID
  Future<Lesson?> fetchLessonById(String lessonId) async {
    try {
      final response = await _api.get('/data/lesson/$lessonId');
      if (response.data != null) {
        return Lesson.fromJson(response.data);
      }
      return null;
    } catch (e) {
      debugPrint('Error fetching lesson: $e');
      rethrow;
    }
  }

  /// Send feedback / contact message
  Future<void> sendFeedback({
    required String name,
    required String email,
    required String subject,
    required String message,
  }) async {
    try {
      await _api.post(
        '/contact',
        data: {
          'name': name,
          'email': email,
          'subject': subject,
          'message': message,
        },
      );
    } catch (e) {
      debugPrint('Error sending feedback: $e');
      rethrow;
    }
  }

  /// Submit a report
  Future<void> submitReport({
    required String reason,
    required String details,
    String? reportedUserId,
    String? messageId,
  }) async {
    try {
      await _api.post(
        '/user/report',
        data: {
          'reason': reason,
          'details': details,
          if (reportedUserId != null) 'reportedUserId': reportedUserId,
          if (messageId != null) 'messageId': messageId,
        },
      );
    } catch (e) {
      debugPrint('Error submitting report: $e');
      rethrow;
    }
  }

  /// Clear all caches
  void clearCache() {
    _schoolsCache = null;
  }
}

// Provider
final dataServiceProvider = Provider<DataService>((ref) {
  final api = ref.watch(apiServiceProvider);
  return DataService(api);
});
