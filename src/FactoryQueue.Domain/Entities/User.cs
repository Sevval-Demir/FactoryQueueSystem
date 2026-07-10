using FactoryQueue.Domain.Common;
using FactoryQueue.Domain.Enums;

namespace FactoryQueue.Domain.Entities;

public class User : BaseEntity
{
    public string FullName { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public UserRole Role { get; set; }

    public ICollection<Vehicle> Vehicles { get; set; } = new List<Vehicle>();
}