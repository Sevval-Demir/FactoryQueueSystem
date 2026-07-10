using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using FactoryQueue.Application.DTOs.Queue;

namespace FactoryQueue.Application.Interfaces;

public interface IQueueService
{
    Task<List<WaitingQueueResponse>> GetWaitingQueueAsync();

    Task CallVehicleAsync(Guid queueEntryId);
}