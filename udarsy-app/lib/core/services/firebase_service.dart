import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import '../../data/models/school_model.dart';
import '../../data/models/level_model.dart';
import '../../data/models/guidance_model.dart';
import '../../data/models/subject_model.dart';
import '../../data/models/lesson_model.dart';

class FirebaseService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Metadata cache
  List<School>? _schoolsCache;

  Future<void> sendFeedback({
    required String name,
    required String email,
    required String subject,
    required String message,
  }) async {
    try {
      await _firestore.collection('feedback').add({
        'name': name,
        'email': email,
        'subject': subject,
        'message': message,
        'timestamp': FieldValue.serverTimestamp(),
        'platform': defaultTargetPlatform.name,
      });
    } catch (e) {
      debugPrint('Error sending feedback: $e');
      rethrow;
    }
  }

  /// Fetch all schools
  Future<List<School>> fetchSchools() async {
    if (_schoolsCache != null) {
      return _schoolsCache!;
    }

    try {
      final snapshot = await _firestore.collection('schools').get();
      _schoolsCache = snapshot.docs
          .map((doc) => School.fromJson({...doc.data(), 'id': doc.id}))
          .toList();
      return _schoolsCache!;
    } catch (e) {
      debugPrint('Error fetching schools: $e');
      rethrow;
    }
  }

  /// Fetch levels for a specific school
  Future<List<Level>> fetchLevels({String? schoolId}) async {
    try {
      Query query = _firestore.collection('levels');

      if (schoolId != null) {
        query = query.where('schoolId', isEqualTo: schoolId);
      }

      final snapshot = await query.get();
      return snapshot.docs
          .map(
            (doc) => Level.fromJson({
              ...doc.data() as Map<String, dynamic>,
              'id': doc.id,
            }),
          )
          .toList();
    } catch (e) {
      debugPrint('Error fetching levels: $e');
      rethrow;
    }
  }

  /// Fetch guidances for a specific level
  Future<List<Guidance>> fetchGuidances({String? levelId}) async {
    try {
      Query query = _firestore.collection('guidances');

      if (levelId != null) {
        query = query.where('levelId', isEqualTo: levelId);
      }

      final snapshot = await query.get();
      return snapshot.docs
          .map(
            (doc) => Guidance.fromJson({
              ...doc.data() as Map<String, dynamic>,
              'id': doc.id,
            }),
          )
          .toList();
    } catch (e) {
      debugPrint('Error fetching guidances: $e');
      rethrow;
    }
  }

  /// Fetch subjects for a specific guidance
  Future<List<Subject>> fetchSubjects({String? guidanceId}) async {
    try {
      Query query = _firestore.collection('subjects');

      if (guidanceId != null) {
        query = query.where('guidanceId', isEqualTo: guidanceId);
      }

      final snapshot = await query.get();
      return snapshot.docs
          .map(
            (doc) => Subject.fromJson({
              ...doc.data() as Map<String, dynamic>,
              'id': doc.id,
            }),
          )
          .toList();
    } catch (e) {
      debugPrint('Error fetching subjects: $e');
      rethrow;
    }
  }

  /// Fetch lessons with pagination and filtering
  Future<({List<Lesson> lessons, DocumentSnapshot? lastDoc, bool hasMore})>
  fetchLessons({
    String? subjectId,
    int pageSize = 20,
    DocumentSnapshot? startAfterDoc,
  }) async {
    try {
      Query query = _firestore
          .collection('lessons')
          .orderBy('title')
          .limit(pageSize);

      if (subjectId != null) {
        query = _firestore
            .collection('lessons')
            .where('subjectId', isEqualTo: subjectId)
            .orderBy('title')
            .limit(pageSize);
      }

      if (startAfterDoc != null) {
        query = query.startAfterDocument(startAfterDoc);
      }

      final snapshot = await query.get();
      final lessons = snapshot.docs
          .map(
            (doc) => Lesson.fromJson({
              ...doc.data() as Map<String, dynamic>,
              'id': doc.id,
            }),
          )
          .toList();

      return (
        lessons: lessons,
        lastDoc: snapshot.docs.isNotEmpty ? snapshot.docs.last : null,
        hasMore: snapshot.docs.length == pageSize,
      );
    } catch (e) {
      debugPrint('Error fetching lessons: $e');
      rethrow;
    }
  }

  /// Fetch exams with filtering
  Future<List<Lesson>> fetchExams({String? subjectId}) async {
    try {
      Query query = _firestore.collection('exams').orderBy('title');

      if (subjectId != null) {
        query = _firestore
            .collection('exams')
            .where('subjectId', isEqualTo: subjectId);
      }

      final snapshot = await query.get();
      return snapshot.docs
          .map(
            (doc) => Lesson.fromJson({
              ...doc.data() as Map<String, dynamic>,
              'id': doc.id,
            }),
          )
          .toList();
    } catch (e) {
      debugPrint('Error fetching exams: $e');
      rethrow;
    }
  }

  /// Fetch a single lesson by ID
  Future<Lesson?> fetchLessonById(String lessonId) async {
    try {
      final doc = await _firestore.collection('lessons').doc(lessonId).get();

      if (doc.exists) {
        return Lesson.fromJson({...doc.data()!, 'id': doc.id});
      }
      return null;
    } catch (e) {
      debugPrint('Error fetching lesson: $e');
      rethrow;
    }
  }

  /// Clear cache
  void clearCache() {
    _schoolsCache = null;
  }

  // Example method to fetch paginated resources (existing method kept for compatibility)
  Future<QuerySnapshot> getResources(
    String type, {
    DocumentSnapshot? startAfter,
  }) async {
    Query query = _firestore
        .collection('resources')
        .where('type', isEqualTo: type)
        .orderBy('timestamp', descending: true)
        .limit(10);

    if (startAfter != null) {
      query = query.startAfterDocument(startAfter);
    }

    return await query.get();
  }
}
