enum ShipmentStatus {
  onTheWay,
  waiting,
  called,
  onScale,
  unloading,
  unloadCompleted,
  completed,
  unknown,
}

class Shipment {
  const Shipment({
    required this.id,
    required this.plateNumber,
    required this.vehicleType,
    required this.status,
    this.queueNumber,
    this.totalWaitingCount = 0,
    this.vehiclesAheadCount = 0,
    this.arrivalTime,
    this.grossWeight,
    this.tareWeight,
    this.netWeight,
    this.completedTime,
  });

  final String id;
  final String plateNumber;
  final String vehicleType;
  final ShipmentStatus status;
  final int? queueNumber;
  final int totalWaitingCount;
  final int vehiclesAheadCount;
  final DateTime? arrivalTime;
  final double? grossWeight;
  final double? tareWeight;
  final double? netWeight;
  final DateTime? completedTime;

  factory Shipment.fromActiveJson(Map<String, dynamic> json) {
    return Shipment(
      id: (json['id'] ?? json['shipmentId'] ?? '').toString(),
      plateNumber: (json['plateNumber'] ?? '').toString(),
      vehicleType: (json['vehicleType'] ?? '—').toString(),
      status: parseShipmentStatus(json['status']),
      arrivalTime: _parseDate(json['arrivalTime']),
    );
  }

  Shipment copyWithStatus(Map<String, dynamic> json) {
    return Shipment(
      id: (json['shipmentId'] ?? id).toString(),
      plateNumber: plateNumber,
      vehicleType: vehicleType,
      status: parseShipmentStatus(json['status']),
      queueNumber: _parseInt(json['queueNumber']),
      totalWaitingCount: _parseInt(json['totalWaitingCount']) ?? 0,
      vehiclesAheadCount: _parseInt(json['vehiclesAheadCount']) ?? 0,
      arrivalTime: arrivalTime,
      grossWeight: _parseDouble(json['grossWeight']),
      tareWeight: _parseDouble(json['tareWeight']),
      netWeight: _parseDouble(json['netWeight']),
      completedTime: _parseDate(json['completedTime']),
    );
  }
}

ShipmentStatus parseShipmentStatus(Object? value) {
  if (value is int) {
    return switch (value) {
      1 => ShipmentStatus.onTheWay,
      2 => ShipmentStatus.waiting,
      3 => ShipmentStatus.called,
      4 => ShipmentStatus.onScale,
      5 => ShipmentStatus.unloading,
      6 => ShipmentStatus.unloadCompleted,
      7 => ShipmentStatus.completed,
      _ => ShipmentStatus.unknown,
    };
  }

  final status = value?.toString().toLowerCase();
  return switch (status) {
    'ontheway' => ShipmentStatus.onTheWay,
    'waiting' => ShipmentStatus.waiting,
    'called' => ShipmentStatus.called,
    'onscale' => ShipmentStatus.onScale,
    'unloading' => ShipmentStatus.unloading,
    'unloadcompleted' => ShipmentStatus.unloadCompleted,
    'completed' => ShipmentStatus.completed,
    _ => ShipmentStatus.unknown,
  };
}

String shipmentStatusText(ShipmentStatus status) {
  return switch (status) {
    ShipmentStatus.onTheWay => 'Yolda / Transit',
    ShipmentStatus.waiting => 'Sırada / Kabul Bekliyor',
    ShipmentStatus.called => 'Perona Çağrıldı / Kantara İlerliyor',
    ShipmentStatus.onScale => 'Kantar Tartımında',
    ShipmentStatus.unloading => 'Boşaltım Alanında',
    ShipmentStatus.unloadCompleted => 'Boşaltım Tamamlandı / Son Tartım Bekliyor',
    ShipmentStatus.completed => 'İşlem Tamamlandı / Çıkış Yapıldı',
    ShipmentStatus.unknown => 'Bilinmiyor',
  };
}

String shipmentStatusDescription(Shipment shipment) {
  return switch (shipment.status) {
    ShipmentStatus.onTheWay => 'Tesise ulaştığınızda kabul kaydınızı başlatın.',
    ShipmentStatus.waiting => 'Kabul sırasındasınız. Önünüzde ${shipment.vehiclesAheadCount} araç var.',
    ShipmentStatus.called => 'Perona çağrıldınız. Kantar/peron alanına ilerleyin.',
    ShipmentStatus.onScale => 'Kantar tartım süreciniz devam ediyor.',
    ShipmentStatus.unloading => 'Boşaltım alanında operasyon devam ediyor.',
    ShipmentStatus.unloadCompleted => 'Boşaltım tamamlandı. Son tartım bekleniyor.',
    ShipmentStatus.completed => 'İşlem tamamlandı. Çıkış yapabilirsiniz.',
    ShipmentStatus.unknown => 'Sevkiyat durumu alınamadı.',
  };
}

int shipmentStepIndex(ShipmentStatus status) {
  return switch (status) {
    ShipmentStatus.onTheWay => 0,
    ShipmentStatus.waiting => 2,
    ShipmentStatus.called => 3,
    ShipmentStatus.onScale => 3,
    ShipmentStatus.unloading => 4,
    ShipmentStatus.unloadCompleted => 4,
    ShipmentStatus.completed => 5,
    ShipmentStatus.unknown => 0,
  };
}

DateTime? _parseDate(Object? value) {
  if (value == null) return null;
  return DateTime.tryParse(value.toString());
}

int? _parseInt(Object? value) {
  if (value == null) return null;
  if (value is int) return value;
  return int.tryParse(value.toString());
}

double? _parseDouble(Object? value) {
  if (value == null) return null;
  if (value is num) return value.toDouble();
  return double.tryParse(value.toString());
}
