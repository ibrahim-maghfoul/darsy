import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/lesson_model.dart';
import '../../core/services/hive_service.dart';

// Provider for HiveService to be used in other providers
final hiveServiceProvider = Provider<HiveService>((ref) => HiveService());

final bookmarksProvider = NotifierProvider<BookmarksNotifier, List<Lesson>>(
  BookmarksNotifier.new,
);

class BookmarksNotifier extends Notifier<List<Lesson>> {
  late final HiveService _hiveService;
  static const String _boxName = 'bookmarks';

  @override
  List<Lesson> build() {
    _hiveService = ref.read(hiveServiceProvider);
    _loadBookmarks();
    return const [];
  }

  Future<void> _loadBookmarks() async {
    final bookmarks = await _hiveService.getAll<Lesson>(_boxName);
    state = bookmarks;
  }

  Future<void> toggleBookmark(Lesson lesson) async {
    final isCurrentlyBookmarked = state.any((l) => l.id == lesson.id);
    if (isCurrentlyBookmarked) {
      await _hiveService.delete(_boxName, lesson.id);
      state = state.where((l) => l.id != lesson.id).toList();
    } else {
      await _hiveService.put(_boxName, lesson.id, lesson);
      state = [...state, lesson];
    }
  }

  bool isBookmarked(String lessonId) {
    return state.any((l) => l.id == lessonId);
  }
}
