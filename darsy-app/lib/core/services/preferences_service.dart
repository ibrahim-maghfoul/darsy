import 'package:shared_preferences/shared_preferences.dart';

class PreferencesService {
  static const String keySelectedSchool = 'selected_school';
  static const String keySelectedLevel = 'selected_level';
  static const String keySelectedGuidance = 'selected_guidance';
  static const String keyOnboardingCompleted = 'onboarding_completed';
  static const String keyUserName = 'user_name';
  static const String keyNickname = 'user_nickname';
  static const String keyAge = 'user_age';
  static const String keyGender = 'user_gender';
  static const String keyCity = 'user_city';
  static const String keyMobile = 'user_mobile';
  static const String keyProfilePicture = 'user_profile_picture';
  static const String keyLevelTitle = 'user_level_title';
  static const String keyGuidanceTitle = 'user_guidance_title';
  static const String keyAdsEnabled = 'ads_enabled';
  static const String keyEyeCareEnabled = 'eye_care_enabled';

  // Progress Stats
  static const String keyVideoCount = 'stats_video_count';
  static const String keyPdfCount = 'stats_pdf_count';
  static const String keyExerciseCount = 'stats_exercise_count';
  static const String keyResourceCount = 'stats_resource_count';
  static const String keyLearningTime = 'stats_learning_time_mins';
  static const String keyVisitHistory = 'visit_history';
  static const String keyTotalPdfCount = 'total_pdf_count';
  static const String keyTotalVideoCount = 'total_video_count';
  static const String keyTotalExerciseCount = 'total_exercise_count';
  static const String keyTotalExamCount = 'total_exam_count';
  static const String keyTotalResourceCount = 'total_resource_count';
  static const String keyTotalLessonCount = 'total_lesson_count';
  static const String keyTotalSubjectCount = 'total_subject_count';
  static const String keyGradesData = 'grades_calculator_data';

  // Goal Tracking
  static const String keySelectedGoal = 'selected_goal';
  static const String keyGoalChecklist = 'goal_checklist';

  final SharedPreferences _prefs;

  PreferencesService(this._prefs);

  static Future<PreferencesService> init() async {
    final prefs = await SharedPreferences.getInstance();
    return PreferencesService(prefs);
  }

  // School
  Future<void> saveSelectedSchool(String schoolId) async {
    await _prefs.setString(keySelectedSchool, schoolId);
  }

  String? getSelectedSchool() {
    return _prefs.getString(keySelectedSchool);
  }

  // Level
  Future<void> saveSelectedLevel(String levelId) async {
    await _prefs.setString(keySelectedLevel, levelId);
  }

  String? getSelectedLevel() {
    return _prefs.getString(keySelectedLevel);
  }

  // Guidance
  Future<void> saveSelectedGuidance(String guidanceId) async {
    await _prefs.setString(keySelectedGuidance, guidanceId);
  }

  String? getSelectedGuidance() {
    return _prefs.getString(keySelectedGuidance);
  }

  // Onboarding
  Future<void> setOnboardingCompleted() async {
    await _prefs.setBool(keyOnboardingCompleted, true);
  }

  bool isOnboardingCompleted() {
    return _prefs.getBool(keyOnboardingCompleted) ?? false;
  }

  Future<void> clearOnboarding() async {
    await _prefs.remove(keyOnboardingCompleted);
    await _prefs.remove(keySelectedSchool);
    await _prefs.remove(keySelectedLevel);
    await _prefs.remove(keySelectedGuidance);
    await _prefs.remove(keyUserName);
    await _prefs.remove(keyNickname);
    await _prefs.remove(keyAge);
    await _prefs.remove(keyGender);
    await _prefs.remove(keyCity);
    await _prefs.remove(keyMobile);
    await _prefs.remove(keyProfilePicture);
    await _prefs.remove(keyLevelTitle);
    await _prefs.remove(keyGuidanceTitle);
  }

  static const String keyLanguage = 'language_code';
  static const String keyIsDarkMode = 'is_dark_mode';

  // ... existing methods ...

  // Language
  Future<void> saveLanguage(String languageCode) async {
    await _prefs.setString(keyLanguage, languageCode);
  }

  String? getLanguage() {
    return _prefs.getString(keyLanguage);
  }

  // Theme
  Future<void> saveIsDarkMode(bool isDark) async {
    await _prefs.setBool(keyIsDarkMode, isDark);
  }

  bool isDarkMode() {
    return _prefs.getBool(keyIsDarkMode) ?? false;
  }

  // User Profile
  Future<void> saveUserName(String name) async =>
      await _prefs.setString(keyUserName, name);
  String? getUserName() => _prefs.getString(keyUserName);

  Future<void> saveNickname(String nickname) async =>
      await _prefs.setString(keyNickname, nickname);
  String? getNickname() => _prefs.getString(keyNickname);

  Future<void> saveAge(String age) async => await _prefs.setString(keyAge, age);
  String? getAge() => _prefs.getString(keyAge);

  Future<void> saveGender(String gender) async =>
      await _prefs.setString(keyGender, gender);
  String? getGender() => _prefs.getString(keyGender);

  Future<void> saveCity(String city) async =>
      await _prefs.setString(keyCity, city);
  String? getCity() => _prefs.getString(keyCity);

  Future<void> saveMobile(String mobile) async =>
      await _prefs.setString(keyMobile, mobile);
  String? getMobile() => _prefs.getString(keyMobile);

  Future<void> saveProfilePicture(String path) async =>
      await _prefs.setString(keyProfilePicture, path);
  String? getProfilePicture() => _prefs.getString(keyProfilePicture);

  Future<void> saveLevelTitle(String title) async =>
      await _prefs.setString(keyLevelTitle, title);
  String? getLevelTitle() => _prefs.getString(keyLevelTitle);

  Future<void> saveGuidanceTitle(String title) async =>
      await _prefs.setString(keyGuidanceTitle, title);
  String? getGuidanceTitle() => _prefs.getString(keyGuidanceTitle);

  // Ads Preference
  Future<void> saveAdsEnabled(bool enabled) async =>
      await _prefs.setBool(keyAdsEnabled, enabled);
  bool isAdsEnabled() => _prefs.getBool(keyAdsEnabled) ?? true;

  // Eye Care Preference
  Future<void> saveEyeCareEnabled(bool enabled) async =>
      await _prefs.setBool(keyEyeCareEnabled, enabled);
  bool isEyeCareEnabled() => _prefs.getBool(keyEyeCareEnabled) ?? true;

  // Stats
  Future<void> saveVideoCount(int count) async =>
      await _prefs.setInt(keyVideoCount, count);
  int getVideoCount() => _prefs.getInt(keyVideoCount) ?? 0;

  Future<void> savePdfCount(int count) async =>
      await _prefs.setInt(keyPdfCount, count);
  int getPdfCount() => _prefs.getInt(keyPdfCount) ?? 0;

  Future<void> saveExerciseCount(int count) async =>
      await _prefs.setInt(keyExerciseCount, count);
  int getExerciseCount() => _prefs.getInt(keyExerciseCount) ?? 0;

  Future<void> saveResourceCount(int count) async =>
      await _prefs.setInt(keyResourceCount, count);
  int getResourceCount() => _prefs.getInt(keyResourceCount) ?? 0;

  Future<void> saveLearningTime(int mins) async =>
      await _prefs.setInt(keyLearningTime, mins);
  int getLearningTime() => _prefs.getInt(keyLearningTime) ?? 0;

  Future<void> saveVisitHistory(List<String> history) async =>
      await _prefs.setStringList(keyVisitHistory, history);
  List<String> getVisitHistory() => _prefs.getStringList(keyVisitHistory) ?? [];

  Future<void> saveTotalPdfCount(int count) async =>
      await _prefs.setInt(keyTotalPdfCount, count);
  int getTotalPdfCount() => _prefs.getInt(keyTotalPdfCount) ?? 0;

  Future<void> saveTotalVideoCount(int count) async =>
      await _prefs.setInt(keyTotalVideoCount, count);
  int getTotalVideoCount() => _prefs.getInt(keyTotalVideoCount) ?? 0;

  Future<void> saveTotalExerciseCount(int count) async =>
      await _prefs.setInt(keyTotalExerciseCount, count);
  int getTotalExerciseCount() => _prefs.getInt(keyTotalExerciseCount) ?? 0;

  Future<void> saveTotalExamCount(int count) async =>
      await _prefs.setInt(keyTotalExamCount, count);
  int getTotalExamCount() => _prefs.getInt(keyTotalExamCount) ?? 0;

  Future<void> saveTotalResourceCount(int count) async =>
      await _prefs.setInt(keyTotalResourceCount, count);
  int getTotalResourceCount() => _prefs.getInt(keyTotalResourceCount) ?? 0;

  Future<void> saveTotalLessonCount(int count) async =>
      await _prefs.setInt(keyTotalLessonCount, count);
  int getTotalLessonCount() => _prefs.getInt(keyTotalLessonCount) ?? 0;

  Future<void> saveTotalSubjectCount(int count) async =>
      await _prefs.setInt(keyTotalSubjectCount, count);
  int getTotalSubjectCount() => _prefs.getInt(keyTotalSubjectCount) ?? 0;

  // Goals
  Future<void> saveSelectedGoal(String? goal) async {
    if (goal == null) {
      await _prefs.remove(keySelectedGoal);
    } else {
      await _prefs.setString(keySelectedGoal, goal);
    }
  }

  String? getSelectedGoal() => _prefs.getString(keySelectedGoal);

  Future<void> saveGoalChecklist(List<String> items) async {
    await _prefs.setStringList(keyGoalChecklist, items);
  }

  List<String> getGoalChecklist() =>
      _prefs.getStringList(keyGoalChecklist) ?? [];

  // Grades Calculator
  Future<void> saveGradesData(String json) async {
    await _prefs.setString(keyGradesData, json);
  }

  String? getGradesData() => _prefs.getString(keyGradesData);

  // Clear all (for testing or reset)
  Future<void> clearAll() async {
    await _prefs.clear();
  }
}
