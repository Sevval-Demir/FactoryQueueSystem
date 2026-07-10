namespace FactoryQueue.Application.DTOs.Dashboard;

public class DashboardResponse
{
    public int WaitingCount { get; set; }

    public int CalledCount { get; set; }

    public int OnScaleCount { get; set; }

    public int CompletedTodayCount { get; set; }
}