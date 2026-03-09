import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/services/download_service.dart';

class DownloadedFilesNotifier extends AsyncNotifier<List<FileSystemEntity>> {
  @override
  Future<List<FileSystemEntity>> build() async {
    final service = DownloadService();
    return service.getDownloadedFiles();
  }

  Future<void> refresh() async {
    state = await AsyncValue.guard(() async {
      final service = DownloadService();
      return service.getDownloadedFiles();
    });
  }

  void deleteEntityLocal(String path) {
    if (state.hasValue) {
      state = AsyncData(state.value!.where((f) => f.path != path).toList());
    }
  }

  void deleteLessonLocal(String subject, String lesson) {
    if (state.hasValue) {
      final subjectPart = '/$subject/';
      final lessonPart = '/$lesson/';
      state = AsyncData(
        state.value!.where((f) {
          final path = f.path.replaceAll('\\', '/');
          return !(path.contains(subjectPart) && path.contains(lessonPart));
        }).toList(),
      );
    }
  }

  void deleteSubjectLocal(String subject) {
    if (state.hasValue) {
      final subjectPart = '/$subject/';
      state = AsyncData(
        state.value!.where((f) {
          final path = f.path.replaceAll('\\', '/');
          return !path.contains(subjectPart);
        }).toList(),
      );
    }
  }
}

final downloadedFilesProvider =
    AsyncNotifierProvider<DownloadedFilesNotifier, List<FileSystemEntity>>(() {
      return DownloadedFilesNotifier();
    });
