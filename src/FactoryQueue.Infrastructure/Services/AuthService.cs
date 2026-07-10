using BCrypt.Net;
using FactoryQueue.Application.DTOs.Auth;
using FactoryQueue.Application.Exceptions;
using FactoryQueue.Application.Interfaces;
using FactoryQueue.Domain.Entities;
using FactoryQueue.Domain.Enums;
using FactoryQueue.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace FactoryQueue.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly FactoryQueueDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(
    FactoryQueueDbContext context,
    IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task RegisterAsync(RegisterRequest request)
    {
        var phone = request.Phone.Trim();
        var plateNumber = request.PlateNumber.Trim().ToUpperInvariant().Replace(" ", string.Empty);
        var vehicleType = request.VehicleType.Trim();
        var fullName = request.FullName.Trim();

        if (string.IsNullOrWhiteSpace(fullName) ||
            string.IsNullOrWhiteSpace(phone) ||
            string.IsNullOrWhiteSpace(request.Password) ||
            string.IsNullOrWhiteSpace(plateNumber) ||
            string.IsNullOrWhiteSpace(vehicleType))
            throw new BusinessException("Tüm alanlar zorunludur.");

        var exists = await _context.Users.AnyAsync(x => x.Phone == phone);

        if (exists)
            throw new BusinessException("Bu telefon numarası zaten kayıtlı.");

        var plateExists = await _context.Vehicles.AnyAsync(x => x.PlateNumber == plateNumber);

        if (plateExists)
            throw new BusinessException("Bu plaka zaten kayıtlı.");

        var user = new User
        {
            FullName = fullName,
            Phone = phone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = UserRole.Driver
        };

        var vehicle = new Vehicle
        {
            PlateNumber = plateNumber,
            VehicleType = vehicleType,
            Driver = user
        };

        var shipment = new Shipment
        {
            Vehicle = vehicle,
            Status = ShipmentStatus.OnTheWay
        };

        _context.Users.Add(user);
        _context.Vehicles.Add(vehicle);
        _context.Shipments.Add(shipment);

        await _context.SaveChangesAsync();
    }

    public async Task RegisterAdminAsync(AdminRegisterRequest request)
    {
        var exists = await _context.Users.AnyAsync(x => x.Phone == request.Phone);

        if (exists)
            throw new BusinessException("Bu telefon numarası zaten kayıtlı.");

        var user = new User
        {
            FullName = request.FullName,
            Phone = request.Phone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = UserRole.Admin
        };

        _context.Users.Add(user);

        await _context.SaveChangesAsync();
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(x => x.Phone == request.Phone);

        if (user is null)
            throw new BusinessException("Telefon numarası veya şifre hatalı.");

        var isPasswordValid = BCrypt.Net.BCrypt.Verify(
            request.Password,
            user.PasswordHash);

        if (!isPasswordValid)
            throw new BusinessException("Telefon numarası veya şifre hatalı.");

        var claims = new List<Claim>
{
    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
    new Claim(ClaimTypes.Name, user.FullName),
    new Claim(ClaimTypes.Role, user.Role.ToString())
};

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));

        var credentials = new SigningCredentials(
            key,
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(
                Convert.ToDouble(_configuration["Jwt:ExpireMinutes"])),
            signingCredentials: credentials);

        return new LoginResponse
        {
            Token = new JwtSecurityTokenHandler().WriteToken(token),
            UserId = user.Id,
            FullName = user.FullName,
            Role = user.Role.ToString()
        };
    }
}
