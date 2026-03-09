import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/news_model.dart';
import 'api_service.dart';
import 'hive_service.dart';

/// REST API-based news service replacing Firebase Firestore queries
class NewsService {
  final ApiService _api;
  final HiveService _hive;

  NewsService(this._api, this._hive);

  static const _cacheKey = 'all';
  static const _maxCacheAge = Duration(hours: 1);

  /// Get news with cache-first strategy
  Stream<List<NewsModel>> getNewsStream() async* {
    // 1. Try cached news first
    try {
      final cached = await _getCachedNews();
      if (cached.isNotEmpty) {
        debugPrint('📦 Loaded ${cached.length} news from cache');
        yield cached;
      }
    } catch (e) {
      debugPrint('⚠️ Error loading cached news: $e');
    }

    // 2. Fetch from API
    try {
      final news = await getNews(forceRefresh: true);
      yield news;
    } catch (e) {
      debugPrint('❌ Error loading news from API: $e');
      final cached = await _getCachedNews();
      if (cached.isEmpty) {
        yield [];
      }
    }
  }

  /// Get news with optional pagination and category filter
  Future<List<NewsModel>> getNews({
    bool forceRefresh = false,
    int page = 1,
    int limit = 500,
    String? category,
  }) async {
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh && page == 1 && category == null) {
        final isStale = _hive.isCacheStale(
          HiveService.newsBox,
          _cacheKey,
          maxAge: _maxCacheAge,
        );

        if (!isStale) {
          final cached = await _getCachedNews();
          if (cached.isNotEmpty) {
            debugPrint('📦 Returning ${cached.length} news from fresh cache');
            return cached;
          }
        }
      }

      // Fetch from API
      debugPrint('🔄 Fetching news from API...');
      final queryParams = <String, dynamic>{'page': page, 'limit': limit};
      if (category != null && category.isNotEmpty) {
        queryParams['category'] = category;
      }

      final response = await _api.get('/news', queryParameters: queryParams);
      final List data = response.data is List
          ? response.data
          : response.data['news'] ?? response.data['articles'] ?? [];

      final news = data.map((json) {
        final map = json is Map
            ? Map<String, dynamic>.from(json)
            : <String, dynamic>{};
        return NewsModel.fromJson(map);
      }).toList();
      debugPrint('✅ Fetched ${news.length} news from API');

      // Cache the result (only cache first page without filter)
      if (page == 1 && category == null) {
        await _cacheNews(news);
      }

      return news;
    } catch (e) {
      debugPrint('❌ Error fetching news: $e');
      // Return cached data as fallback
      final cached = await _getCachedNews();
      if (cached.isNotEmpty) {
        debugPrint('📦 Returning ${cached.length} cached news as fallback');
        return cached;
      }
      rethrow;
    }
  }

  /// Get a single news article by ID
  Future<NewsModel> getNewsById(String id) async {
    try {
      final response = await _api.get('/news/$id');
      return NewsModel.fromJson(
        Map<String, dynamic>.from(response.data as Map),
      );
    } catch (e) {
      debugPrint('Error fetching news by ID: $e');
      rethrow;
    }
  }

  /// Increment view count for a news article
  Future<void> trackView(String newsId) async {
    try {
      await _api.post('/news/$newsId/view');
    } catch (e) {
      debugPrint('Error tracking news view: $e');
    }
  }

  /// Rate a news article
  Future<Map<String, dynamic>?> rateNews(String newsId, double rating) async {
    try {
      final response = await _api.post(
        '/news/$newsId/rate',
        data: {'rating': rating},
      );
      return response.data as Map<String, dynamic>?;
    } catch (e) {
      debugPrint('Error rating news: $e');
      rethrow;
    }
  }

  /// Get questions for a news article
  Future<List<Map<String, dynamic>>> getQuestions(String newsId) async {
    try {
      final response = await _api.get('/news/$newsId/questions');
      return List<Map<String, dynamic>>.from(response.data);
    } catch (e) {
      debugPrint('Error fetching questions: $e');
      return [];
    }
  }

  /// Ask a question on a news article
  Future<void> askQuestion(String newsId, String question) async {
    try {
      // Matching website payload { question: text }
      await _api.post('/news/$newsId/questions', data: {'question': question});
    } catch (e) {
      debugPrint('Error asking question: $e');
      rethrow;
    }
  }

  /// Delete a question/comment on a news article
  Future<void> deleteQuestion(String newsId, String questionId) async {
    try {
      await _api.delete('/news/$newsId/questions/$questionId');
    } catch (e) {
      debugPrint('Error deleting question: $e');
      rethrow;
    }
  }

  // ─── Cache helpers ──────────────────────────

  Future<List<NewsModel>> _getCachedNews() async {
    final cachedData = _hive.getCachedList(HiveService.newsBox, _cacheKey);
    if (cachedData == null) return [];
    return cachedData
        .map(
          (json) => NewsModel.fromJson(Map<String, dynamic>.from(json as Map)),
        )
        .toList();
  }

  Future<void> _cacheNews(List<NewsModel> news) async {
    await _hive.cacheList(HiveService.newsBox, news, _cacheKey);
    debugPrint('💾 Cached ${news.length} news articles');
  }

  Future<void> clearCache() async {
    await _hive.clearCache(HiveService.newsBox, _cacheKey);
    debugPrint('🗑️ News cache cleared');
  }

  bool isCacheStale() {
    return _hive.isCacheStale(
      HiveService.newsBox,
      _cacheKey,
      maxAge: _maxCacheAge,
    );
  }

  DateTime? getLastCacheTime() {
    return _hive.getLastCacheTime(HiveService.newsBox, _cacheKey);
  }
}

// Providers
final hiveServiceProvider = Provider<HiveService>((ref) {
  throw UnimplementedError('HiveService must be overridden in main.dart');
});

final newsServiceProvider = Provider((ref) {
  final api = ref.watch(apiServiceProvider);
  final hive = ref.watch(hiveServiceProvider);
  return NewsService(api, hive);
});

final newsStreamProvider = StreamProvider<List<NewsModel>>((ref) {
  return ref.watch(newsServiceProvider).getNewsStream();
});

final newsFutureProvider = FutureProvider.family<List<NewsModel>, bool>((
  ref,
  forceRefresh,
) {
  return ref.read(newsServiceProvider).getNews(forceRefresh: forceRefresh);
});

final newsByCategoryProvider = FutureProvider.family<List<NewsModel>, String>((
  ref,
  category,
) {
  return ref
      .read(newsServiceProvider)
      .getNews(category: category == 'All' ? null : category);
});
