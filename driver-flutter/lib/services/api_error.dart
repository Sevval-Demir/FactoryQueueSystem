import 'package:dio/dio.dart';

String apiErrorMessage(Object error) {
  if (error is! DioException) {
    final message = error.toString().replaceFirst('Exception: ', '');
    return message.isEmpty ? 'Beklenmeyen bir hata oluştu.' : message;
  }

  final statusCode = error.response?.statusCode;
  final data = error.response?.data;

  if (statusCode == 400) {
    if (data is String && !data.trim().startsWith('<')) {
      return data;
    }
    return 'İşlem tamamlanamadı.';
  }

  return switch (statusCode) {
    401 => 'Oturumunuz sona erdi.',
    403 => 'Bu işlem için yetkiniz yok.',
    404 => 'Kayıt bulunamadı.',
    500 => 'Beklenmeyen bir hata oluştu.',
    _ => 'Sunucuya bağlanılamadı. Ağ bağlantınızı ve sunucu adresini kontrol edin.',
  };
}
