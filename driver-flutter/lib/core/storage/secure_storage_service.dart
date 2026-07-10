import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorageService {
  static const _storage = FlutterSecureStorage();

  static const tokenKey = 'token';
  static const userIdKey = 'userId';
  static const fullNameKey = 'fullName';
  static const roleKey = 'role';

  Future<String?> readToken() => _storage.read(key: tokenKey);
  Future<String?> readUserId() => _storage.read(key: userIdKey);
  Future<String?> readFullName() => _storage.read(key: fullNameKey);
  Future<String?> readRole() => _storage.read(key: roleKey);

  Future<void> saveSession({
    required String token,
    required String userId,
    required String fullName,
    required String role,
  }) async {
    await _storage.write(key: tokenKey, value: token);
    await _storage.write(key: userIdKey, value: userId);
    await _storage.write(key: fullNameKey, value: fullName);
    await _storage.write(key: roleKey, value: role);
  }

  Future<void> clear() => _storage.deleteAll();
}
