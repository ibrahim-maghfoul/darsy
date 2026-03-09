import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/app_colors.dart';
import '../../core/services/news_service.dart';
import '../../data/models/news_model.dart';
import '../widgets/news_card.dart';
import '../widgets/shimmer_widgets.dart';
import '../../l10n/app_localizations.dart';

class ExploreScreen extends ConsumerStatefulWidget {
  const ExploreScreen({super.key});

  @override
  ConsumerState<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends ConsumerState<ExploreScreen>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  String _activeTab = 'All';
  final TextEditingController _searchCtrl = TextEditingController();
  String _searchQuery = '';

  final _tabs = [
    {'id': 'All', 'label': 'tab_all'},
    {'id': 'Bac', 'label': 'tab_bac'},
    {'id': 'Etudiant', 'label': 'tab_etudiant'},
    {'id': 'College', 'label': 'tab_college'},
  ];

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  List<NewsModel> _filterNews(List<NewsModel> all) {
    var list = all;
    if (_activeTab != 'All') {
      list = list
          .where((n) => n.category.toLowerCase() == _activeTab.toLowerCase())
          .toList();
    }
    if (_searchQuery.isNotEmpty) {
      final q = _searchQuery.toLowerCase();
      list = list.where((n) => n.title.toLowerCase().contains(q)).toList();
    }
    return list;
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final newsAsync = ref.watch(newsStreamProvider);

    return Scaffold(
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'News',
                    style: Theme.of(context).textTheme.displaySmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Stay updated with the latest in Education',
                    style: TextStyle(fontSize: 16, color: AppColors.textGrey),
                  ),
                ],
              ),
            ),

            // Search Bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: TextField(
                controller: _searchCtrl,
                decoration: InputDecoration(
                  hintText: 'Search news...',
                  prefixIcon: const Icon(Icons.search_rounded),
                  suffixIcon: _searchQuery.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear_rounded),
                          onPressed: () {
                            _searchCtrl.clear();
                            setState(() => _searchQuery = '');
                          },
                        )
                      : null,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide(
                      color: Colors.grey.withValues(alpha: 0.2),
                    ),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide(
                      color: Colors.grey.withValues(alpha: 0.15),
                    ),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: const BorderSide(color: AppColors.primary),
                  ),
                ),
                onChanged: (v) => setState(() => _searchQuery = v),
              ),
            ),

            const SizedBox(height: 12),

            // Filter tabs
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Row(
                children: _tabs.map((tab) {
                  final isActive = _activeTab == tab['id'];
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: GestureDetector(
                      onTap: () =>
                          setState(() => _activeTab = tab['id'] as String),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 220),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 18,
                          vertical: 10,
                        ),
                        decoration: BoxDecoration(
                          color: isActive
                              ? AppColors.primary
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(
                            color: isActive
                                ? AppColors.primary
                                : Colors.grey.withValues(alpha: 0.25),
                          ),
                        ),
                        child: Text(
                          context.translate(tab['label'] as String),
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                            color: isActive ? Colors.white : AppColors.textGrey,
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),

            const SizedBox(height: 12),

            // News list
            Expanded(
              child: RefreshIndicator(
                onRefresh: () async {
                  ref.invalidate(newsStreamProvider);
                  await ref.read(newsStreamProvider.future);
                },
                child: newsAsync.when(
                  data: (newsList) {
                    final filtered = _filterNews(newsList);
                    if (filtered.isEmpty) {
                      return ListView(
                        children: [
                          SizedBox(
                            height: MediaQuery.of(context).size.height * 0.4,
                            child: Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.newspaper_rounded,
                                    size: 64,
                                    color: AppColors.textGrey.withValues(
                                      alpha: 0.3,
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  Text(
                                    _searchQuery.isNotEmpty
                                        ? 'No results for "$_searchQuery"'
                                        : 'No $_activeTab news yet',
                                    style: TextStyle(
                                      fontSize: 18,
                                      color: AppColors.textGrey,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      );
                    }
                    return ListView.separated(
                      key: PageStorageKey('news_$_activeTab'),
                      addAutomaticKeepAlives: true,
                      addRepaintBoundaries: true,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 24,
                        vertical: 8,
                      ),
                      itemCount: filtered.length,
                      itemBuilder: (context, index) =>
                          _buildNewsCard(filtered[index], index),
                      separatorBuilder: (context, index) =>
                          const SizedBox(height: 24),
                    );
                  },
                  loading: () => Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 8,
                    ),
                    child: ShimmerWidgets.newsList(context, count: 4),
                  ),
                  error: (e, st) => ListView(
                    children: [
                      SizedBox(
                        height: MediaQuery.of(context).size.height * 0.6,
                        child: Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.cloud_off_rounded,
                                size: 64,
                                color: AppColors.primary.withOpacity(0.2),
                              ),
                              const SizedBox(height: 16),
                              const Text(
                                'Oops! We couldn\'t load the news.',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textDark,
                                ),
                              ),
                              const SizedBox(height: 8),
                              const Text(
                                'Check your connection and try again.',
                                style: TextStyle(color: AppColors.textGrey),
                              ),
                              const SizedBox(height: 24),
                              ElevatedButton.icon(
                                onPressed: () {
                                  ref.invalidate(newsStreamProvider);
                                },
                                icon: const Icon(Icons.refresh_rounded),
                                label: const Text('Try Again'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.primary,
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNewsCard(NewsModel news, int index) {
    return LiquidNotchCard(news: news)
        .animate()
        .fadeIn(delay: (30 * index).clamp(0, 500).ms)
        .slideY(
          begin: 0.1,
          end: 0,
          duration: 400.ms,
          curve: Curves.easeOutCubic,
        );
  }
}
