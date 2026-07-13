using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FactoryQueue.Application.DTOs.Weighing;

public class GrossWeightRequest
{
    public decimal GrossWeight { get; set; }

    public bool? HasLoad { get; set; } = true;
}
