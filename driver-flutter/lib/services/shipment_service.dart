import 'package:dio/dio.dart';

import '../core/api/dio_client.dart';
import '../models/shipment.dart';

class ShipmentService {
  ShipmentService(this._client);

  final DioClient _client;

  Future<Shipment?> getActiveShipment(String driverId) async {
    try {
      final response = await _client.dio.get('/Shipments/active/$driverId');
      final shipment = Shipment.fromActiveJson(Map<String, dynamic>.from(response.data as Map));
      return getShipmentStatus(shipment);
    } on DioException catch (error) {
      if (error.response?.statusCode == 404) {
        return null;
      }
      rethrow;
    }
  }

  Future<Shipment> getShipmentStatus(Shipment shipment) async {
    final response = await _client.dio.get('/Shipments/status/${shipment.id}');
    return shipment.copyWithStatus(Map<String, dynamic>.from(response.data as Map));
  }

  Future<void> arrive(String shipmentId) async {
    await _client.dio.post('/Shipments/$shipmentId/arrive');
  }
}
