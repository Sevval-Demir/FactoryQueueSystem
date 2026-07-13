class ApiConstants {
  ApiConstants._();

  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:5221/api',
  );

  static const String queueHubUrl = String.fromEnvironment(
    'QUEUE_HUB_URL',
    defaultValue: 'http://10.0.2.2:5221/hubs/queue',
  );
}