import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/app_colors.dart';
import '../../core/utils/bidi_helper.dart';
import '../../data/models/school_service.dart';
import '../providers/school_services_provider.dart';

class SchoolServicesScreen extends ConsumerWidget {
  const SchoolServicesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final servicesAsync = ref.watch(schoolServicesProvider);

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(title: const Text('Services & Info'), elevation: 0),
      body: servicesAsync.when(
        data: (services) {
          if (services.isEmpty) {
            return const Center(
              child: Text('No services available at the moment.'),
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: services.length,
            itemBuilder: (context, index) {
              final service = services[index];
              return _ServiceCard(service: service);
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('Error: $err')),
      ),
    );
  }
}

class _ServiceCard extends StatelessWidget {
  final SchoolService service;
  const _ServiceCard({required this.service});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 2,
      child: InkWell(
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => SchoolServiceDetailScreen(service: service),
          ),
        ),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  _getIconData(service.icon),
                  color: AppColors.primary,
                  size: 30,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      service.title,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      service.description,
                      style: const TextStyle(
                        fontSize: 14,
                        color: AppColors.textGrey,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const Icon(
                Icons.arrow_forward_ios_rounded,
                size: 16,
                color: AppColors.textGrey,
              ),
            ],
          ),
        ),
      ),
    );
  }

  IconData _getIconData(String iconName) {
    switch (iconName) {
      case 'calendar_today':
        return Icons.calendar_today_rounded;
      case 'school':
        return Icons.school_rounded;
      case 'info':
        return Icons.info_outline_rounded;
      case 'assignment':
        return Icons.assignment_rounded;
      default:
        return Icons.miscellaneous_services_rounded;
    }
  }
}

class SchoolServiceDetailScreen extends StatelessWidget {
  final SchoolService service;
  const SchoolServiceDetailScreen({super.key, required this.service});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              title: Text(
                service.title,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
              background: Container(
                decoration: BoxDecoration(gradient: AppColors.greenGradient),
                child: Center(
                  child: Icon(
                    _getIconData(service.icon),
                    size: 80,
                    color: Colors.white.withOpacity(0.5),
                  ),
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (service.description.isNotEmpty) ...[
                    Text(
                      service.description,
                      style: TextStyle(
                        fontSize: 16,
                        color: AppColors.textGrey.withOpacity(0.8),
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                  ..._renderBlocks(context, service.contentBlocks),
                  const SizedBox(height: 40),
                  if (service.externalUrl != null)
                    Center(
                      child: TextButton.icon(
                        onPressed: () => launchUrl(
                          Uri.parse(service.externalUrl!),
                          mode: LaunchMode.externalApplication,
                        ),
                        icon: const Icon(Icons.language),
                        label: const Text('المصدر الأصلي'),
                      ),
                    ),
                  const SizedBox(height: 80),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  IconData _getIconData(String iconName) {
    switch (iconName) {
      case 'calendar_today':
        return Icons.calendar_today_rounded;
      case 'school':
        return Icons.school_rounded;
      default:
        return Icons.school_rounded;
    }
  }

  List<Widget> _renderBlocks(BuildContext context, List<dynamic> blocks) {
    return blocks.map<Widget>((block) {
      final type = block['type'] as String? ?? '';

      switch (type) {
        case 'text':
          final subtype = block['subtype'] as String? ?? 'p';
          final text = block['text'] as String? ?? '';
          final isBold = block['style']?['is_bold'] == true;
          final isRtl = block['is_arabic'] == true || BidiHelper.isArabic(text);

          if (subtype.startsWith('h')) {
            return Padding(
              padding: const EdgeInsets.only(top: 20, bottom: 8),
              child: InkWell(
                onTap: block['link'] != null
                    ? () => launchUrl(
                        Uri.parse(block['link']),
                        mode: LaunchMode.externalApplication,
                      )
                    : null,
                child: Container(
                  width: double.infinity,
                  child: Text(
                    text,
                    textAlign: isRtl ? TextAlign.right : TextAlign.left,
                    textDirection: isRtl
                        ? TextDirection.rtl
                        : TextDirection.ltr,
                    style: TextStyle(
                      fontSize: subtype == 'h1'
                          ? 24
                          : (subtype == 'h2' ? 20 : 18),
                      fontWeight: FontWeight.bold,
                      color: block['link'] != null
                          ? AppColors.primary
                          : AppColors.textDark,
                      decoration: block['link'] != null
                          ? TextDecoration.underline
                          : null,
                    ),
                  ),
                ),
              ),
            );
          }
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: InkWell(
              onTap: block['link'] != null
                  ? () => launchUrl(
                      Uri.parse(block['link']),
                      mode: LaunchMode.externalApplication,
                    )
                  : null,
              child: Container(
                width: double.infinity,
                child: Text(
                  text,
                  textAlign: isRtl ? TextAlign.right : TextAlign.left,
                  textDirection: isRtl ? TextDirection.rtl : TextDirection.ltr,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
                    color: block['link'] != null
                        ? AppColors.primary
                        : AppColors.textDark.withOpacity(0.9),
                    height: 1.6,
                    decoration: block['link'] != null
                        ? TextDecoration.underline
                        : null,
                  ),
                ),
              ),
            ),
          );

        case 'list':
          final items = block['items'] as List<dynamic>? ?? [];
          final isRtl =
              items.isNotEmpty &&
              (items[0]['is_arabic'] == true ||
                  BidiHelper.isArabic(items[0]['text']));

          return Padding(
            padding: const EdgeInsets.only(bottom: 16, left: 8, right: 8),
            child: Column(
              crossAxisAlignment: isRtl
                  ? CrossAxisAlignment.end
                  : CrossAxisAlignment.start,
              children: items.map((item) {
                final text = item['text'] as String? ?? '';
                final itemIsRtl =
                    item['is_arabic'] == true || BidiHelper.isArabic(text);

                return Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    textDirection: itemIsRtl
                        ? TextDirection.rtl
                        : TextDirection.ltr,
                    children: [
                      Text(
                        '• ',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                        ),
                      ),
                      Expanded(
                        child: Text(
                          text,
                          textAlign: itemIsRtl
                              ? TextAlign.right
                              : TextAlign.left,
                          textDirection: itemIsRtl
                              ? TextDirection.rtl
                              : TextDirection.ltr,
                          style: const TextStyle(fontSize: 15, height: 1.5),
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          );

        case 'image':
          final src = block['src'] as String? ?? '';
          if (src.isEmpty) return const SizedBox.shrink();
          final imgWidget = ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: CachedNetworkImage(
              imageUrl: src,
              placeholder: (_, __) =>
                  const Center(child: CircularProgressIndicator()),
              errorWidget: (_, __, ___) => const Icon(Icons.error),
            ),
          );

          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: block['link'] != null
                ? InkWell(
                    onTap: () => launchUrl(
                      Uri.parse(block['link']),
                      mode: LaunchMode.externalApplication,
                    ),
                    child: imgWidget,
                  )
                : imgWidget,
          );

        case 'link':
          final text = block['text'] as String? ?? 'Open Link';
          final url = block['url'] as String? ?? '';
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: ListTile(
              tileColor: AppColors.primary.withOpacity(0.05),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              leading: const Icon(
                Icons.attachment_rounded,
                color: AppColors.primary,
              ),
              title: Text(
                text,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
              trailing: const Icon(Icons.download_rounded, size: 20),
              onTap: () => launchUrl(
                Uri.parse(url),
                mode: LaunchMode.externalApplication,
              ),
            ),
          );

        case 'table':
          return const Padding(
            padding: EdgeInsets.symmetric(vertical: 8),
            child: Text(
              '[Table Content - View in JSON for now]',
              style: TextStyle(fontStyle: FontStyle.italic, color: Colors.grey),
            ),
          );

        default:
          return const SizedBox.shrink();
      }
    }).toList();
  }
}
