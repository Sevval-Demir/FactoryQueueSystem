using FactoryQueue.Api.Hubs;
using FactoryQueue.Application.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace FactoryQueue.Api.Services;

public class SignalRQueueNotificationService : IQueueNotificationService
{
    private readonly IHubContext<QueueHub> _hubContext;

    public SignalRQueueNotificationService(IHubContext<QueueHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public Task QueueUpdatedAsync() => _hubContext.Clients.All.SendAsync("QueueUpdated");

    public Task ShipmentUpdatedAsync(Guid shipmentId) => _hubContext.Clients.All.SendAsync("ShipmentUpdated", shipmentId);
}
