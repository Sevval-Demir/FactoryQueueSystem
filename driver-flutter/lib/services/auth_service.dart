import '../core/api/dio_client.dart';
import '../core/storage/secure_storage_service.dart';
import '../models/login_response.dart';

class AuthService {
  AuthService(this._client, this._storage);

  final DioClient _client;
  final SecureStorageService _storage;

  Future<void> registerDriver({
    required String fullName,
    required String phone,
    required String password,
  }) async {
    await _client.dio.post(
      '/Auth/register/driver',
      data: {
        'fullName': fullName,
        'phone': phone,
        'password': password,
      },
    );
  }

  Future<void> saveVehicleInfo({
    required String plateNumber,
    required String vehicleType,
  }) async {
    await _client.dio.post(
      '/Auth/vehicle',
      data: {
        'plateNumber': plateNumber,
        'vehicleType': vehicleType,
      },
    );
  }

  Future<LoginResponse> login({
    required String phone,
    required String password,
  }) async {
    final response = await _client.dio.post(
      '/Auth/login',
      data: {'phone': phone, 'password': password},
    );
    final login = LoginResponse.fromJson(Map<String, dynamic>.from(response.data as Map));

    if (login.role.toLowerCase() != 'driver') {
      await _storage.clear();
      throw Exception('Bu uygulama yalnızca sürücüler içindir.');
    }

    await _storage.saveSession(
      token: login.token,
      userId: login.userId,
      fullName: login.fullName,
      role: login.role,
    );

    return login;
  }

  Future<void> logout() => _storage.clear();
}
