import api from "../api/axios";

export interface DashboardData {
  waitingCount: number;
  calledCount: number;
  onScaleCount: number;
  completedTodayCount: number;
}
export const getDashboard = async (): Promise<DashboardData> => (await api.get("/Dashboard")).data;
