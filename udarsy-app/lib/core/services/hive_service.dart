import 'package:hive_flutter/hive_flutter.dart';
import '../../data/models/lesson_model.dart';

class HiveService {
  static const String favoritesBox = 'favorites';
  static const String bookmarksBox = 'bookmarks';
  static const String progressBox = 'progress';
  static const String settingsBox = 'settings';

  // New cache boxes
  static const String newsBox = 'news_cache';
  static const String lessonsBox = 'lessons_cache';
  static const String subjectsBox = 'subjects_cache';
  static const String guidancesBox = 'guidances_cache';
  static const String levelsBox = 'levels_cache';
  static const String schoolsBox = 'schools_cache';
  static const String cacheMetaBox = 'cache_meta';

  Future<void> init() async {
    await Hive.initFlutter();

    // Register Adapters
    if (!Hive.isAdapterRegistered(1)) Hive.registerAdapter(LessonAdapter());
    if (!Hive.isAdapterRegistered(2))
      Hive.registerAdapter(LessonResourceAdapter());

    // Open existing boxes
    await Hive.openBox(favoritesBox);
    await Hive.openBox(bookmarksBox);
    await Hive.openBox(progressBox);
    await Hive.openBox(settingsBox);

    // Open new cache boxes
    await Hive.openBox(newsBox);
    await Hive.openBox(lessonsBox);
    await Hive.openBox(subjectsBox);
    await Hive.openBox(guidancesBox);
    await Hive.openBox(levelsBox);
    await Hive.openBox(schoolsBox);
    await Hive.openBox(cacheMetaBox);
  }

  // ============================================================================
  // GENERIC CACHE OPERATIONS
  // ============================================================================

  /// Cache a list of items as JSON
  Future<void> cacheList(
    String boxName,
    List<dynamic> items,
    String key,
  ) async {
    final box = Hive.box(boxName);
    final jsonList = items.map((item) {
      // If item has toJson method, use it; otherwise store as-is
      if (item is Map) return item;
      try {
        return (item as dynamic).toJson();
      } catch (e) {
        return item;
      }
    }).toList();

    await box.put(key, jsonList);
    await _saveCacheTimestamp(boxName, key);
  }

  /// Get cached list
  List<Map<String, dynamic>>? getCachedList(String boxName, String key) {
    final box = Hive.box(boxName);
    final data = box.get(key);
    if (data == null) return null;

    return (data as List).cast<Map<String, dynamic>>();
  }

  /// Save cache timestamp
  Future<void> _saveCacheTimestamp(String boxName, String key) async {
    final metaBox = Hive.box(cacheMetaBox);
    await metaBox.put(
      '${boxName}_${key}_time',
      DateTime.now().toIso8601String(),
    );
  }

  /// Get last cache time
  DateTime? getLastCacheTime(String boxName, String key) {
    final metaBox = Hive.box(cacheMetaBox);
    final timeStr = metaBox.get('${boxName}_${key}_time');
    if (timeStr == null) return null;
    return DateTime.parse(timeStr as String);
  }

  /// Check if cache is stale
  bool isCacheStale(
    String boxName,
    String key, {
    Duration maxAge = const Duration(hours: 1),
  }) {
    final lastTime = getLastCacheTime(boxName, key);
    if (lastTime == null) return true;

    final age = DateTime.now().difference(lastTime);
    return age > maxAge;
  }

  /// Clear specific cache
  Future<void> clearCache(String boxName, [String? key]) async {
    final box = Hive.box(boxName);
    if (key != null) {
      await box.delete(key);
      final metaBox = Hive.box(cacheMetaBox);
      await metaBox.delete('${boxName}_${key}_time');
    } else {
      await box.clear();
    }
  }

  // ============================================================================
  // LEGACY OPERATIONS (keep for compatibility)
  // ============================================================================

  // Generic Operations
  Future<List<T>> getAll<T>(String boxName) async {
    final box = Hive.box(boxName);
    return box.values.map((e) => e as T).toList();
  }

  Future<void> put<T>(String boxName, dynamic key, T value) async {
    await Hive.box(boxName).put(key, value);
  }

  Future<void> delete(String boxName, dynamic key) async {
    await Hive.box(boxName).delete(key);
  }

  T? get<T>(String boxName, dynamic key) {
    return Hive.box(boxName).get(key) as T?;
  }

  // Favorites (Deprecating in favor of bookmarks but keeping for compat)
  bool isFavorite(String id) => Hive.box(favoritesBox).get(id) != null;

  Future<void> toggleFavorite(String id, Map<String, dynamic> data) async {
    final box = Hive.box(favoritesBox);
    if (isFavorite(id)) {
      await box.delete(id);
    } else {
      await box.put(id, data);
    }
  }

  // Progress
  Future<void> updateProgress(
    String courseId,
    String lessonId,
    bool completed,
  ) async {
    final box = Hive.box(progressBox);
    final progress = box.get(courseId, defaultValue: <String>[]);
    if (completed) {
      if (!progress.contains(lessonId)) progress.add(lessonId);
    } else {
      progress.remove(lessonId);
    }
    await box.put(courseId, progress);
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  /// Clear all cached data (not user data)
  Future<void> clearAllCache() async {
    await Hive.box(newsBox).clear();
    await Hive.box(lessonsBox).clear();
    await Hive.box(subjectsBox).clear();
    await Hive.box(guidancesBox).clear();
    await Hive.box(levelsBox).clear();
    await Hive.box(schoolsBox).clear();
    await Hive.box(cacheMetaBox).clear();
  }

  /// Get cache statistics
  Map<String, int> getCacheStats() {
    return {
      'news': Hive.box(newsBox).length,
      'lessons': Hive.box(lessonsBox).length,
      'subjects': Hive.box(subjectsBox).length,
      'guidances': Hive.box(guidancesBox).length,
      'levels': Hive.box(levelsBox).length,
      'schools': Hive.box(schoolsBox).length,
    };
  }

  // Clear all data (existing method - updated to include cache)
  Future<void> clearAll() async {
    await Hive.box(favoritesBox).clear();
    await Hive.box(bookmarksBox).clear();
    await Hive.box(progressBox).clear();
    await Hive.box(settingsBox).clear();
    await clearAllCache();
  }
}
