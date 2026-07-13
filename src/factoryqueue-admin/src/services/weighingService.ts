import api from "../api/axios";

export const saveGrossWeight = (shipmentId: string, grossWeight: number, hasLoad = true) =>
  api.post(`/Weighing/${shipmentId}/gross`, { grossWeight, hasLoad });
export const startUnload = (shipmentId: string) => api.post(`/Weighing/${shipmentId}/start-unload`);
export const finishUnload = (shipmentId: string) => api.post(`/Weighing/${shipmentId}/finish-unload`);
export const saveTareWeight = (shipmentId: string, tareWeight: number) => api.post(`/Weighing/${shipmentId}/tare`, { tareWeight });
