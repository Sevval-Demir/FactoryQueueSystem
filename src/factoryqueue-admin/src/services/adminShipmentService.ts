import api from "../api/axios";
export type ShipmentStatus = "OnTheWay" | "Waiting" | "Called" | "OnScale" | "Unloading" | "UnloadCompleted" | "Completed";
export interface AdminShipment { shipmentId: string; queueEntryId: string | null; queueNumber: number | null; status: ShipmentStatus; statusName: string; plateNumber: string; vehicleType: string; driverId: string; driverName: string; driverPhone: string; arrivalTime: string | null; calledAt: string | null; grossWeight: number | null; grossTime: string | null; unloadStart: string | null; unloadEnd: string | null; tareWeight: number | null; tareTime: string | null; netWeight: number | null; completedTime: string | null; }
export const getAdminShipments = async (): Promise<AdminShipment[]> => (await api.get("/Admin/shipments")).data;
export const getAdminShipment = async (shipmentId: string): Promise<AdminShipment> => (await api.get(`/Admin/shipments/${shipmentId}`)).data;
