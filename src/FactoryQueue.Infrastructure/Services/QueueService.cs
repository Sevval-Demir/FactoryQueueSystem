using System.Data;
using FactoryQueue.Application.DTOs.Queue;
using FactoryQueue.Application.Exceptions;
using FactoryQueue.Application.Interfaces;
using FactoryQueue.Domain.Enums;
using FactoryQueue.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FactoryQueue.Infrastructure.Services;

public class QueueService : IQueueService
{
    private static readonly ShipmentStatus[] ActiveOperationStatuses =
    [
        ShipmentStatus.Called,
        ShipmentStatus.OnScale,
        ShipmentStatus.Unloading,
        ShipmentStatus.UnloadCompleted
    ];

    private readonly FactoryQueueDbContext _context;
    private readonly IQueueNotificationService _notifications;

    public QueueService(FactoryQueueDbContext context, IQueueNotificationService notifications)
    {
        _context = context;
        _notifications = notifications;
    }

    public async Task<List<WaitingQueueResponse>> GetWaitingQueueAsync()
    {
        return await _context.QueueEntries
            .Include(q => q.Shipment)
            .ThenInclude(s => s.Vehicle)
            .Where(q => q.CalledAt == null && q.Shipment.Status == ShipmentStatus.Waiting)
            .OrderBy(q => q.QueueNumber)
            .Select(q => new WaitingQueueResponse
            {
                QueueEntryId = q.Id,
                ShipmentId = q.ShipmentId,
                QueueNumber = q.QueueNumber,
                PlateNumber = q.Shipment.Vehicle.PlateNumber,
                ArrivedAt = q.ArrivedAt
            })
            .ToListAsync();
    }

    public async Task CallVehicleAsync(Guid queueEntryId)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable);

        if (await HasActiveOperationAsync())
            throw new BusinessException("Kantar şu anda meşgul. Mevcut araç işlemini tamamlamadan yeni araç çağrılamaz.");

        var firstWaiting = await _context.QueueEntries
            .Include(q => q.Shipment)
            .Where(q => q.CalledAt == null && q.Shipment.Status == ShipmentStatus.Waiting)
            .OrderBy(q => q.QueueNumber)
            .FirstOrDefaultAsync();

        if (firstWaiting == null)
            throw new NotFoundException("Bekleyen araç bulunamadı.");

        if (firstWaiting.Id != queueEntryId)
            throw new ConflictException("Sadece sıradaki araç çağrılabilir.");

        firstWaiting.CalledAt = DateTime.UtcNow;
        firstWaiting.Shipment.Status = ShipmentStatus.Called;

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();
        await _notifications.QueueUpdatedAsync();
        await _notifications.ShipmentUpdatedAsync(firstWaiting.ShipmentId);
    }

    private Task<bool> HasActiveOperationAsync()
    {
        return _context.Shipments.AnyAsync(s => ActiveOperationStatuses.Contains(s.Status));
    }
}
