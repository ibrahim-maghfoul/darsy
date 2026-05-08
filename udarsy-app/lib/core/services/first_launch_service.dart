import 'package:shared_preferences/shared_preferences.dart';

class FirstLaunchService {
  static const String _keyFirstLaunch = 'is_first_launch';

  Future<bool> isFirstLaunch() async {
    final prefs = await SharedPreferences.getInstance();
    // Default to true if key doesn't exist
    return prefs.getBool(_keyFirstLaunch) ?? true;
  }

  Future<void> setFirstLaunchComplete() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_keyFirstLaunch, false);
  }

  Future<void> resetFirstLaunch() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyFirstLaunch);
  }
}
