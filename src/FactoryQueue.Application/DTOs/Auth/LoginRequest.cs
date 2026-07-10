namespace FactoryQueue.Application.DTOs.Auth;

public class LoginRequest
{
    public string Phone { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;
}