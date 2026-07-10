import { useEffect, useState } from "react";
import { Alert, Box, CircularProgress, Dialog, DialogContent, DialogTitle, Divider, Grid, Typography } from "@mui/material";
import { getAdminShipment, type AdminShipment } from "../../services/adminShipmentService";

const date = (value: string | null) => (value ? new Date(value).toLocaleString("tr-TR") : "—");
const weight = (value: number | null) => (value === null ? "—" : `${value.toLocaleString("tr-TR")} kg`);

export default function ShipmentDetailDialog({ shipment, onClose }: { shipment: AdminShipment | null; onClose: () => void }) {
  const [detail, setDetail] = useState<AdminShipment | null>(shipment);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setDetail(shipment);
    setError("");
    if (!shipment) return;

    let active = true;
    setLoading(true);
    getAdminShipment(shipment.shipmentId)
      .then((data) => {
        if (active) setDetail(data);
      })
      .catch(() => {
        if (active) setError("Detay bilgileri yüklenemedi.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [shipment]);

  const fields = detail
    ? [
        ["Shipment ID", detail.shipmentId],
        ["Queue Entry ID", detail.queueEntryId ?? "—"],
        ["Queue Number", detail.queueNumber ?? "—"],
        ["Plate", detail.plateNumber],
        ["Vehicle Type", detail.vehicleType],
        ["Driver", detail.driverName],
        ["Phone", detail.driverPhone],
        ["Status", detail.statusName],
        ["Arrival", date(detail.arrivalTime)],
        ["Called At", date(detail.calledAt)],
        ["Gross Weight", weight(detail.grossWeight)],
        ["Gross Time", date(detail.grossTime)],
        ["Unload Start", date(detail.unloadStart)],
        ["Unload End", date(detail.unloadEnd)],
        ["Tare Weight", weight(detail.tareWeight)],
        ["Tare Time", date(detail.tareTime)],
        ["Net Weight", weight(detail.netWeight)],
        ["Completed Time", date(detail.completedTime)],
      ]
    : [];

  return (
    <Dialog open={Boolean(shipment)} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Sevkiyat Detayı</DialogTitle>
      <DialogContent dividers>
        {loading && !detail ? (
          <Box sx={{ minHeight: 180, display: "grid", placeItems: "center" }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Grid container spacing={2}>
              {fields.map(([label, value]) => (
                <Grid key={label} size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography sx={{ overflowWrap: "anywhere" }}>{String(value)}</Typography>
                  <Divider sx={{ mt: 1 }} />
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
