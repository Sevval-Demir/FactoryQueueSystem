using FactoryQueue.Application.DTOs.Dashboard;
using FactoryQueue.Application.Interfaces;
using FactoryQueue.Domain.Enums;
using FactoryQueue.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FactoryQueue.Infrastructure.Services;

public class DashboardService : IDashboardService
{
    private readonly FactoryQueueDbContext _context;

    public DashboardService(FactoryQueueDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardResponse> GetDashboardAsync()
    {
        var totalWaitingCount = await _context.Shipments.CountAsync(x => x.Status == ShipmentStatus.Waiting);

        return new DashboardResponse
        {
            WaitingCount = totalWaitingCount,

            TotalWaitingCount = totalWaitingCount,

            CalledCount = await _context.Shipments.CountAsync(x => x.Status == ShipmentStatus.Called),

            OnScaleCount = await _context.Shipments.CountAsync(x =>
                x.Status == ShipmentStatus.OnScale ||
                x.Status == ShipmentStatus.Unloading ||
                x.Status == ShipmentStatus.UnloadCompleted),

            CompletedTodayCount = await _context.Shipments.CountAsync(x =>
                x.Status == ShipmentStatus.Completed &&
                x.CompletedTime.HasValue &&
                x.CompletedTime.Value.Date == DateTime.UtcNow.Date)
        };
    }
}
