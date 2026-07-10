using FactoryQueue.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FactoryQueue.Infrastructure.Persistence;

public class FactoryQueueDbContext : DbContext
{
    public FactoryQueueDbContext(DbContextOptions<FactoryQueueDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Vehicle> Vehicles => Set<Vehicle>();
    public DbSet<Shipment> Shipments => Set<Shipment>();
    public DbSet<QueueEntry> QueueEntries => Set<QueueEntry>();
    public DbSet<WeighingRecord> WeighingRecords => Set<WeighingRecord>();
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<WeighingRecord>()
            .Property(w => w.GrossWeight)
            .HasPrecision(18, 2);

        modelBuilder.Entity<WeighingRecord>()
            .Property(w => w.TareWeight)
            .HasPrecision(18, 2);

        modelBuilder.Entity<WeighingRecord>()
            .Property(w => w.NetWeight)
            .HasPrecision(18, 2);
        modelBuilder.Entity<User>()
    .HasIndex(u => u.Phone)
    .IsUnique();
        modelBuilder.Entity<Vehicle>()
    .HasIndex(v => v.PlateNumber)
    .IsUnique();
    }
}