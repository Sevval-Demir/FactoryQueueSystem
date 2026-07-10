namespace FactoryQueue.Application.DTOs.Auth;

public class AdminRegisterRequest
{
    public string FullName { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;
}
