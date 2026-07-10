using FactoryQueue.Application.DTOs.Dashboard;

namespace FactoryQueue.Application.Interfaces;

public interface IDashboardService
{
    Task<DashboardResponse> GetDashboardAsync();
}