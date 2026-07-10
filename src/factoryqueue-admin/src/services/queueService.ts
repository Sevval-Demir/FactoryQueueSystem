import api from "../api/axios";

export interface WaitingVehicle { queueEntryId: string; shipmentId: string; queueNumber: number; plateNumber: string; arrivedAt: string; }
export const getWaitingQueue = async (): Promise<WaitingVehicle[]> => (await api.get("/Queue/waiting")).data;
export const callVehicle = async (queueEntryId: string): Promise<string> => (await api.post(`/Queue/${queueEntryId}/call`)).data;
