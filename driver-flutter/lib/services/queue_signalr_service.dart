import 'dart:async';

import 'package:signalr_netcore/signalr_client.dart';

import '../core/constants/api_constants.dart';
import '../core/storage/secure_storage_service.dart';

class QueueSignalRService {
  QueueSignalRService(this._storage);

  final SecureStorageService _storage;
  HubConnection? _connection;

  Future<void> connect({
    required String? Function() currentShipmentId,
    required Future<void> Function() onQueueUpdated,
    required Future<void> Function() onCurrentShipmentUpdated,
  }) async {
    if (_connection != null) return;

    final connection = HubConnectionBuilder()
        .withUrl(
          ApiConstants.queueHubUrl,
          options: HttpConnectionOptions(accessTokenFactory: () async => await _storage.readToken() ?? ''),
        )
        .withAutomaticReconnect()
        .build();

    connection.on('QueueUpdated', (_) => unawaited(onQueueUpdated()));
    connection.on('ShipmentUpdated', (args) {
      final shipmentId = args?.isNotEmpty == true ? args!.first?.toString() : null;
      if (shipmentId == currentShipmentId()) {
        unawaited(onCurrentShipmentUpdated());
      }
    });

    _connection = connection;
    try {
      await connection.start();
    } catch (_) {
      _connection = null;
    }
  }

  Future<void> dispose() async {
    final connection = _connection;
    _connection = null;
    await connection?.stop();
  }
}
