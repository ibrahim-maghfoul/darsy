import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import 'package:dio/dio.dart';
import '../../core/app_colors.dart';
import '../../core/services/api_service.dart';
import '../../data/models/lesson_model.dart';
import '../providers/lessons_provider.dart';
import '../widgets/styled_snackbar.dart';

class ContributeScreen extends ConsumerStatefulWidget {
  const ContributeScreen({super.key});

  @override
  ConsumerState<ContributeScreen> createState() => _ContributeScreenState();
}

class _ContributeScreenState extends ConsumerState<ContributeScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  String? _selectedSubjectId;
  String? _selectedLessonId;
  List<Lesson> _lessons = [];
  bool _loadingLessons = false;
  File? _pickedFile;
  bool _isUploading = false;

  @override
  void dispose() {
    _titleController.dispose();
    super.dispose();
  }

  Future<void> _pickFile(String type) async {
    if (type == 'image') {
      final picker = ImagePicker();
      final pickedFile = await picker.pickImage(source: ImageSource.gallery);
      if (pickedFile != null) {
        setState(() => _pickedFile = File(pickedFile.path));
      }
    } else {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf'],
      );
      if (result != null && result.files.single.path != null) {
        setState(() => _pickedFile = File(result.files.single.path!));
      }
    }
  }

  Future<void> _fetchLessons(String subjectId) async {
    setState(() {
      _loadingLessons = true;
      _selectedLessonId = null;
    });
    try {
      final service = ref.read(firebaseServiceProvider);
      final result = await service.fetchLessons(
        subjectId: subjectId,
        pageSize: 100,
      );
      if (mounted) {
        setState(() {
          _lessons = result.lessons;
          _loadingLessons = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loadingLessons = false);
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate() ||
        _pickedFile == null ||
        _selectedSubjectId == null) {
      StyledSnackBar.showError(
        context,
        'Please complete all fields and pick a file',
      );
      return;
    }

    setState(() => _isUploading = true);
    try {
      final api = ref.read(apiServiceProvider);
      final formData = FormData.fromMap({
        'resourceTitle': _titleController.text.trim(),
        'subjectId': _selectedSubjectId,
        'lessonId': _selectedLessonId ?? 'contribution',
        'file': await MultipartFile.fromFile(
          _pickedFile!.path,
          filename: _pickedFile!.path.split(Platform.pathSeparator).last,
        ),
      });

      await api.post('/data/contribute', data: formData);
      if (mounted) {
        StyledSnackBar.showSuccess(
          context,
          'Contribution submitted successfully!',
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        StyledSnackBar.showError(context, 'Upload failed: $e');
      }
    } finally {
      if (mounted) setState(() => _isUploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final subjectsAsync = ref.watch(globalSubjectsProvider);

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text(
          'Contribute Resource',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.transparent,
        foregroundColor: AppColors.textDark,
      ),
      body: subjectsAsync.when(
        data: (subjects) => SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildSectionHeader(
                  'Resource Details',
                  Icons.description_rounded,
                ),
                const SizedBox(height: 20),

                _buildLabel('Subject'),
                _buildDropdown<String>(
                  value: _selectedSubjectId,
                  hint: 'Select a subject',
                  icon: Icons.subject_rounded,
                  items: subjects
                      .map(
                        (s) => DropdownMenuItem(
                          value: s.id,
                          child: Text(s.title, overflow: TextOverflow.ellipsis),
                        ),
                      )
                      .toList(),
                  onChanged: (val) {
                    if (val != null) {
                      setState(() => _selectedSubjectId = val);
                      _fetchLessons(val);
                    }
                  },
                ),

                const SizedBox(height: 20),
                _buildLabel('Lesson (Optional)'),
                _loadingLessons
                    ? const Center(
                        child: Padding(
                          padding: EdgeInsets.all(16.0),
                          child: CircularProgressIndicator(),
                        ),
                      )
                    : _buildDropdown<String>(
                        value: _selectedLessonId,
                        hint: 'Select existing lesson',
                        icon: Icons.book_rounded,
                        items: [
                          const DropdownMenuItem(
                            value: 'new',
                            child: Text('Other / New Lesson'),
                          ),
                          ..._lessons
                              .map(
                                (l) => DropdownMenuItem(
                                  value: l.id,
                                  child: Text(
                                    l.title,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              )
                              .toList(),
                        ],
                        onChanged: (val) =>
                            setState(() => _selectedLessonId = val),
                      ),

                const SizedBox(height: 20),
                _buildLabel('Resource Title'),
                _buildTextField(
                  controller: _titleController,
                  hint: 'e.g. Summary Notes Chapter 1',
                  icon: Icons.title_rounded,
                  validator: (val) =>
                      val == null || val.isEmpty ? 'Title is required' : null,
                ),

                const SizedBox(height: 32),
                _buildSectionHeader('Upload File', Icons.cloud_upload_rounded),
                const SizedBox(height: 16),

                Row(
                  children: [
                    Expanded(
                      child: _buildUploadButton(
                        'Image',
                        Icons.image_rounded,
                        Colors.blue,
                        () => _pickFile('image'),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _buildUploadButton(
                        'PDF',
                        Icons.picture_as_pdf_rounded,
                        Colors.red,
                        () => _pickFile('pdf'),
                      ),
                    ),
                  ],
                ),

                if (_pickedFile != null) ...[
                  const SizedBox(height: 20),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: AppColors.primary.withOpacity(0.2),
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          _pickedFile!.path.toLowerCase().endsWith('.pdf')
                              ? Icons.picture_as_pdf_rounded
                              : Icons.image_rounded,
                          color: AppColors.primary,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            _pickedFile!.path
                                .split(Platform.pathSeparator)
                                .last,
                            style: const TextStyle(fontWeight: FontWeight.w500),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        IconButton(
                          icon: const Icon(
                            Icons.close_rounded,
                            color: Colors.grey,
                          ),
                          onPressed: () => setState(() => _pickedFile = null),
                        ),
                      ],
                    ),
                  ).animate().fadeIn(),
                ],

                const SizedBox(height: 48),
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: _isUploading ? null : _submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      elevation: 0,
                    ),
                    child: _isUploading
                        ? const CircularProgressIndicator(color: Colors.white)
                        : const Text(
                            'Submit Contribution',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                  ),
                ),
              ],
            ),
          ),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('Error: $err')),
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, color: AppColors.primary, size: 24),
        const SizedBox(width: 10),
        Text(
          title,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.textDark,
          ),
        ),
      ],
    );
  }

  Widget _buildLabel(String label) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Text(
        label,
        style: const TextStyle(
          fontWeight: FontWeight.bold,
          fontSize: 13,
          color: Colors.grey,
        ),
      ),
    );
  }

  Widget _buildDropdown<T>({
    required T? value,
    required String hint,
    required IconData icon,
    required List<DropdownMenuItem<T>> items,
    required void Function(T?) onChanged,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: DropdownButtonFormField<T>(
        value: value,
        isExpanded: true,
        decoration: InputDecoration(
          prefixIcon: Icon(icon, color: AppColors.primary.withOpacity(0.7)),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 16,
          ),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: BorderSide.none,
          ),
          hintText: hint,
        ),
        items: items,
        onChanged: onChanged,
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    String? Function(String?)? validator,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: TextFormField(
        controller: controller,
        validator: validator,
        decoration: InputDecoration(
          prefixIcon: Icon(icon, color: AppColors.primary.withOpacity(0.7)),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 16,
          ),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: BorderSide.none,
          ),
          hintText: hint,
        ),
      ),
    );
  }

  Widget _buildUploadButton(
    String label,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withOpacity(0.05),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 32),
            const SizedBox(height: 8),
            Text(
              label,
              style: TextStyle(color: color, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }
}
