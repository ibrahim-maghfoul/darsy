import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/services/api_service.dart';
import '../../data/models/school_service.dart';

class SchoolServicesNotifier extends AsyncNotifier<List<SchoolService>> {
  @override
  FutureOr<List<SchoolService>> build() {
    return _fetchServices();
  }

  Future<List<SchoolService>> _fetchServices() async {
    final api = ref.read(apiServiceProvider);
    try {
      final response = await api.get('/data/school-services');
      final List<dynamic> data = response.data;
      return data.map((e) => SchoolService.fromJson(e)).toList();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _fetchServices());
  }
}

final schoolServicesProvider =
    AsyncNotifierProvider<SchoolServicesNotifier, List<SchoolService>>(
      SchoolServicesNotifier.new,
    );
