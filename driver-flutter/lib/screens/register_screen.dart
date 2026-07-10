import 'package:flutter/material.dart';

import '../core/api/dio_client.dart';
import '../core/storage/secure_storage_service.dart';
import '../services/api_error.dart';
import '../services/auth_service.dart';
import '../widgets/primary_button.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key, required this.storage});

  final SecureStorageService storage;

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _plateController = TextEditingController();
  final _vehicleTypeController = TextEditingController();
  bool _obscure = true;
  bool _loading = false;

  late final AuthService _authService;

  @override
  void initState() {
    super.initState();
    _authService = AuthService(DioClient(widget.storage), widget.storage);
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _plateController.dispose();
    _vehicleTypeController.dispose();
    super.dispose();
  }

  String? _required(String? value, String message) {
    return value == null || value.trim().isEmpty ? message : null;
  }

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _loading = true);
    try {
      await _authService.registerDriver(
        fullName: _fullNameController.text.trim(),
        phone: _phoneController.text.trim(),
        password: _passwordController.text,
        plateNumber: _plateController.text.trim(),
        vehicleType: _vehicleTypeController.text.trim(),
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Kaydınız oluşturuldu. Giriş yapabilirsiniz.')),
      );
      Navigator.of(context).pop();
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiErrorMessage(error))));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Sürücü Kaydı')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Yeni sürücü hesabı', style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
                const SizedBox(height: 6),
                Text('Araç ve ilk sevkiyat kaydı otomatik oluşturulur.', style: theme.textTheme.bodyLarge?.copyWith(color: Colors.blueGrey)),
                const SizedBox(height: 24),
                TextFormField(
                  controller: _fullNameController,
                  textInputAction: TextInputAction.next,
                  decoration: const InputDecoration(labelText: 'Ad Soyad', prefixIcon: Icon(Icons.person_rounded)),
                  validator: (value) => _required(value, 'Ad Soyad boş olamaz'),
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  textInputAction: TextInputAction.next,
                  decoration: const InputDecoration(labelText: 'Telefon', prefixIcon: Icon(Icons.phone_rounded)),
                  validator: (value) => _required(value, 'Telefon boş olamaz'),
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _passwordController,
                  obscureText: _obscure,
                  textInputAction: TextInputAction.next,
                  decoration: InputDecoration(
                    labelText: 'Şifre',
                    prefixIcon: const Icon(Icons.lock_rounded),
                    suffixIcon: IconButton(
                      onPressed: () => setState(() => _obscure = !_obscure),
                      icon: Icon(_obscure ? Icons.visibility_rounded : Icons.visibility_off_rounded),
                    ),
                  ),
                  validator: (value) => _required(value, 'Şifre boş olamaz'),
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _confirmPasswordController,
                  obscureText: _obscure,
                  textInputAction: TextInputAction.next,
                  decoration: const InputDecoration(labelText: 'Şifre Tekrar', prefixIcon: Icon(Icons.lock_outline_rounded)),
                  validator: (value) {
                    final requiredMessage = _required(value, 'Şifre tekrar boş olamaz');
                    if (requiredMessage != null) return requiredMessage;
                    return value == _passwordController.text ? null : 'Şifreler eşleşmeli';
                  },
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _plateController,
                  textCapitalization: TextCapitalization.characters,
                  textInputAction: TextInputAction.next,
                  decoration: const InputDecoration(labelText: 'Plaka', prefixIcon: Icon(Icons.pin_rounded)),
                  validator: (value) => _required(value, 'Plaka boş olamaz'),
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _vehicleTypeController,
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => _register(),
                  decoration: const InputDecoration(labelText: 'Araç Tipi', prefixIcon: Icon(Icons.local_shipping_rounded)),
                  validator: (value) => _required(value, 'Araç tipi boş olamaz'),
                ),
                const SizedBox(height: 24),
                PrimaryButton(label: 'Kayıt Ol', loading: _loading, icon: Icons.person_add_rounded, onPressed: _register),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
