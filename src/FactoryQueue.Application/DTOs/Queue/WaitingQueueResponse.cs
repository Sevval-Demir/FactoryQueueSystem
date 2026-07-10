using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FactoryQueue.Application.DTOs.Queue
{
    public class WaitingQueueResponse
    {
        public Guid QueueEntryId { get; set; }
        public Guid ShipmentId { get; set; }

        public int QueueNumber { get; set; }

        public string PlateNumber { get; set; } = string.Empty;

        public DateTime ArrivedAt { get; set; }
    }
}
