import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

class AppLocalizations {
  final Locale locale;

  AppLocalizations(this.locale);

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates = [
    delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
  ];

  static const List<Locale> supportedLocales = [
    Locale('en'),
    Locale('fr'),
    Locale('ar'),
  ];

  late Map<String, String> _localizedStrings;

  Future<bool> load() async {
    String jsonString = await rootBundle.loadString(
      'assets/translations/${locale.languageCode}.json',
    );
    Map<String, dynamic> jsonMap = json.decode(jsonString);

    _localizedStrings = jsonMap.map((key, value) {
      return MapEntry(key, value.toString());
    });

    return true;
  }

  String translate(String key) {
    return _localizedStrings[key] ?? key;
  }

  // --- Compatibility Getters ---
  String get appName => translate('app_name');
  String get home => translate('home');
  String get explore => translate('explore');
  String get courses => translate('courses');
  String get downloaded => translate('downloaded');
  String get settings => translate('settings');
  String get profile => translate('profile');
  String get exams => translate('exams');
  String get searchData => translate('searchData');
  String get viewAll => translate('viewAll');
  String get noConnection => translate('noConnection');
  String get checkConnection => translate('checkConnection');
  String get retry => translate('retry');
  String get resetSelection => translate('resetSelection');
  String get resetConfirm => translate('resetConfirm');
  String get cancel => translate('cancel');
  String get reset => translate('reset');
  String get school => translate('school');
  String get level => translate('level');
  String get guidance => translate('guidance');
  String get selectSchool => translate('selectSchool');
  String get selectLevel => translate('selectLevel');
  String get selectGuidance => translate('selectGuidance');
  String get continueBtn => translate('continueBtn');
  String get download => translate('download');
  String get downloading => translate('downloading');
  String get downloadComplete => translate('downloadComplete');
  String get downloadError => translate('downloadError');
  String get congratulations => translate('congratulations');
  String get achievementUnlocked => translate('achievementUnlocked');
  String get lessonCompleted => translate('lessonCompleted');
  String get progress => translate('progress');
  String get achievements => translate('achievements');
  String get changeLanguage => translate('changeLanguage');
  String get theme => translate('theme');
  String get darkMode => translate('darkMode');
  String get contactDeveloper => translate('contactDeveloper');
  String get aboutApp => translate('aboutApp');
  String get customizeExperience => translate('customizeExperience');
  String get selectEducationLevel => translate('selectEducationLevel');
  String get noSchoolsAvailable => translate('noSchoolsAvailable');
  String get noLevelsAvailable => translate('noLevelsAvailable');
  String get primarySchool => translate('primarySchool');
  String get middleSchool => translate('middleSchool');
  String get highSchool => translate('highSchool');
  String get learningProgress => translate('learningProgress');
  String get lessonsCompleted => translate('lessonsCompleted');
  String get examsCompleted => translate('examsCompleted');
  String get overallProgress => translate('overallProgress');
  String get noDownloads => translate('noDownloads');
  String get downloadOfflineMessage => translate('downloadOfflineMessage');
  String get delete => translate('delete');
  String get errorDeleting => translate('errorDeleting');
  String get share => translate('share');
  String get pdf => translate('pdf');
  String get misc => translate('misc');
  String get open => translate('open');
  String get items => translate('items');
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) {
    return ['en', 'fr', 'ar'].contains(locale.languageCode);
  }

  @override
  Future<AppLocalizations> load(Locale locale) async {
    AppLocalizations localizations = AppLocalizations(locale);
    await localizations.load();
    return localizations;
  }

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

extension AppLocalizationsExtension on BuildContext {
  String translate(String key) =>
      AppLocalizations.of(this)?.translate(key) ?? key;
}
