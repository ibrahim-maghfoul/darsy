import 'dart:io';
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';

class DownloadService {
  final Dio _dio = Dio();

  Future<bool> requestPermission() async {
    if (Platform.isAndroid) {
      // Notification permission for Android 13+ to show download progress/completion
      if (await Permission.notification.isDenied) {
        await Permission.notification.request();
      }
    }
    return true;
  }

  Future<String> getFilePath(String fileName, {String? subjectName}) async {
    final dir = await getApplicationDocumentsDirectory();
    if (subjectName != null && subjectName.isNotEmpty) {
      // Allow nested paths by splitting and sanitizing each segment
      final parts = subjectName.split(RegExp(r'[/\\]'));
      final safeParts = parts
          .map((p) => p.replaceAll(RegExp(r'[<>:"|?*]'), ''))
          .where((p) => p.isNotEmpty);
      final safePath = safeParts.join(Platform.pathSeparator);
      return '${dir.path}${Platform.pathSeparator}$safePath${Platform.pathSeparator}$fileName';
    }
    return '${dir.path}${Platform.pathSeparator}$fileName';
  }

  Future<bool> isDownloaded(String fileName, {String? subjectName}) async {
    final path = await getFilePath(fileName, subjectName: subjectName);
    return File(path).exists();
  }

  Future<String?> downloadFile(
    String url,
    String fileName, {
    String? subjectName,
    Function(int, int)? onProgress,
    CancelToken? cancelToken,
  }) async {
    try {
      final savePath = await getFilePath(fileName, subjectName: subjectName);
      final file = File(savePath);

      // Create directory if it doesn't exist
      if (!await file.parent.exists()) {
        await file.parent.create(recursive: true);
      }

      await _dio.download(
        url,
        savePath,
        onReceiveProgress: onProgress,
        cancelToken: cancelToken,
      );

      return savePath;
    } on DioException catch (e) {
      if (CancelToken.isCancel(e)) {
        debugPrint('Download cancelled');
      } else {
        debugPrint('Download error: $e');
      }
      return null;
    } catch (e) {
      debugPrint('General error: $e');
      return null;
    }
  }

  Future<List<FileSystemEntity>> getDownloadedFiles() async {
    final dir = await getApplicationDocumentsDirectory();
    if (!await dir.exists()) return [];
    // List recursively to get files inside subject folders
    // Use async listing to avoid blocking the UI thread
    return await dir.list(recursive: true, followLinks: false).toList();
  }

  Future<void> deleteSubject(String subjectName) async {
    final dir = await getApplicationDocumentsDirectory();
    final parts = subjectName.split(RegExp(r'[/\\]'));
    final safeParts = parts
        .map((p) => p.replaceAll(RegExp(r'[<>:"|?*]'), ''))
        .where((p) => p.isNotEmpty);
    final safePath = safeParts.join(Platform.pathSeparator);

    final subjectDir = Directory(
      '${dir.path}${Platform.pathSeparator}$safePath',
    );
    if (await subjectDir.exists()) {
      await subjectDir.delete(recursive: true);
    }
  }

  Future<void> deleteLesson(String subjectName, String lessonName) async {
    final dir = await getApplicationDocumentsDirectory();
    final parts = '$subjectName/$lessonName'.split(RegExp(r'[/\\]'));
    final safeParts = parts
        .map((p) => p.replaceAll(RegExp(r'[<>:"|?*]'), ''))
        .where((p) => p.isNotEmpty);
    final safePath = safeParts.join(Platform.pathSeparator);

    final lessonDir = Directory(
      '${dir.path}${Platform.pathSeparator}$safePath',
    );
    if (await lessonDir.exists()) {
      await lessonDir.delete(recursive: true);
    }
  }

  Future<void> deleteAllDownloads() async {
    final dir = await getApplicationDocumentsDirectory();
    if (!await dir.exists()) return;

    // List all entities
    final entities = dir.listSync(recursive: true, followLinks: false);

    // Delete all PDF files
    for (final entity in entities) {
      if (entity is File && entity.path.toLowerCase().endsWith('.pdf')) {
        try {
          await entity.delete();
        } catch (e) {
          debugPrint('Error deleting file: ${entity.path}, $e');
        }
      }
    }

    // Clean up empty directories
    // We do this in a separate pass because deleting a file might make a directory empty
    // We need to iterate strictly to check for empty dirs, or just rely on OS.
    // However, iterating recursively and deleting empty dirs bottom-up is tricky with a single list.
    // A simple approach is to list top-level directories and delete them if they are empty or only contain empty dirs.
    // Given the complexity, deleting just the PDFs is the primary goal.
    // But let's try to be cleaner.

    _deleteEmptyDirectories(dir);
  }

  Future<void> _deleteEmptyDirectories(Directory dir) async {
    try {
      final entities = dir.listSync(followLinks: false);
      for (final entity in entities) {
        if (entity is Directory) {
          await _deleteEmptyDirectories(entity);
          if (entity.listSync().isEmpty) {
            try {
              await entity.delete();
            } catch (_) {}
          }
        }
      }
    } catch (_) {}
  }
}
