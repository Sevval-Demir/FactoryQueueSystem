using FactoryQueue.Application.DTOs.Auth;

namespace FactoryQueue.Application.Interfaces;

public interface IAuthService
{
    Task RegisterAsync(RegisterRequest request);

    Task RegisterAdminAsync(AdminRegisterRequest request);

    Task<LoginResponse> LoginAsync(LoginRequest request);

    Task SaveVehicleInfoAsync(Guid driverId, SaveVehicleInfoRequest request);
}
