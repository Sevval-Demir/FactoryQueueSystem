class LoginResponse {
  const LoginResponse({
    required this.token,
    required this.userId,
    required this.fullName,
    required this.role,
  });

  final String token;
  final String userId;
  final String fullName;
  final String role;

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    return LoginResponse(
      token: (json['token'] ?? '').toString(),
      userId: (json['userId'] ?? '').toString(),
      fullName: (json['fullName'] ?? '').toString(),
      role: (json['role'] ?? '').toString(),
    );
  }
}
