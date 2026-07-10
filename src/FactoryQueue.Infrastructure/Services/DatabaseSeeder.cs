using BCrypt.Net;
using FactoryQueue.Domain.Entities;
using FactoryQueue.Domain.Enums;
using FactoryQueue.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FactoryQueue.Infrastructure.Services;

public class DatabaseSeeder
{
    private readonly FactoryQueueDbContext _context;

    public DatabaseSeeder(FactoryQueueDbContext context)
    {
        _context = context;
    }

    public async Task SeedAsync()
    {
        if (await _context.Users.AnyAsync())
            return;

        var driver = new User
        {
            FullName = "Test Driver",
            Phone = "05550000001",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"),
            Role = UserRole.Driver
        };

        var admin = new User
        {
            FullName = "Admin",
            Phone = "05550000000",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"),
            Role = UserRole.Admin
        };

        _context.Users.AddRange(driver, admin);
        await _context.SaveChangesAsync();

        var vehicle = new Vehicle
        {
            PlateNumber = "34ABC123",
            VehicleType = "Truck",
            DriverId = driver.Id
        };

        _context.Vehicles.Add(vehicle);
        await _context.SaveChangesAsync();

        var shipment = new Shipment
        {
            VehicleId = vehicle.Id,
            Status = ShipmentStatus.OnTheWay
        };

        _context.Shipments.Add(shipment);
        await _context.SaveChangesAsync();
    }
}