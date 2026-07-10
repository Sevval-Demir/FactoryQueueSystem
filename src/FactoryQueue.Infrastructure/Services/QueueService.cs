using FactoryQueue.Application.DTOs.Queue;
using FactoryQueue.Application.Exceptions;
using FactoryQueue.Application.Interfaces;
using FactoryQueue.Domain.Enums;
using FactoryQueue.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FactoryQueue.Infrastructure.Services;

public class QueueService : IQueueService
{
    private readonly FactoryQueueDbContext _context;

    public QueueService(FactoryQueueDbContext context)
    {
        _context = context;
    }

    public async Task<List<WaitingQueueResponse>> GetWaitingQueueAsync()
    {
        return await _context.QueueEntries
    .Include(q => q.Shipment)
    .ThenInclude(s => s.Vehicle)
    .Where(q =>
        q.CalledAt == null &&
        q.Shipment.Status == ShipmentStatus.Waiting)
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
        // FIFO'daki ilk bekleyen aracı bul
        var firstWaiting = await _context.QueueEntries
            .Include(q => q.Shipment)
            .Where(q =>
                q.CalledAt == null &&
                q.Shipment.Status == ShipmentStatus.Waiting)
            .OrderBy(q => q.QueueNumber)
            .FirstOrDefaultAsync();

        if (firstWaiting == null)
            throw new NotFoundException("Bekleyen araç bulunamadı.");

        if (firstWaiting.CalledAt != null)
            throw new Exception("Bu araç zaten çağrılmış.");

        // Eğer admin ilk sıradaki aracı değil de başka bir aracı çağırmaya çalışıyorsa engelle
        if (firstWaiting.Id != queueEntryId)
            throw new ConflictException("FIFO kuralı gereği önce sıradaki araç çağrılmalıdır.");

        firstWaiting.CalledAt = DateTime.UtcNow;
        firstWaiting.Shipment.Status = ShipmentStatus.Called;

        await _context.SaveChangesAsync();
    }
}