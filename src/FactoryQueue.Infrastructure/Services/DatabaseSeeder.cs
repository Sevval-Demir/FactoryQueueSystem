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
        if (await _context.Users.AnyAsync(x => x.Role == UserRole.Admin))
            return;

        var admin = new User
        {
            FullName = "Admin",
            Phone = "05550000000",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"),
            Role = UserRole.Admin
        };

        _context.Users.Add(admin);
        await _context.SaveChangesAsync();
    }
}
