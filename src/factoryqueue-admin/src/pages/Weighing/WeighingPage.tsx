import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  type SelectChangeEvent,
  Snackbar,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from "@mui/material";
import { getAdminShipments, type AdminShipment, type ShipmentStatus } from "../../services/adminShipmentService";
import { finishUnload, saveGrossWeight, saveTareWeight, startUnload } from "../../services/weighingService";

const steps = ["Brüt tartım", "Boşaltmayı başlat", "Boşaltmayı bitir", "Dara tartım"];
const selectableStatuses: ShipmentStatus[] = ["Called", "OnScale", "Unloading", "UnloadCompleted"];

const stepByStatus: Record<ShipmentStatus, number> = {
  OnTheWay: 0,
  Waiting: 0,
  Called: 0,
  OnScale: 1,
  Unloading: 2,
  UnloadCompleted: 3,
  Completed: 4,
};

const formatWeight = (value: number | null) => (value === null ? "—" : `${value.toLocaleString("tr-TR")} kg`);
const formatDate = (value: string | null) => (value ? new Date(value).toLocaleString("tr-TR") : "—");

export default function WeighingPage() {
  const [params, setParams] = useSearchParams();
  const [shipments, setShipments] = useState<AdminShipment[]>([]);
  const [shipmentId, setShipmentId] = useState(params.get("shipmentId") ?? "");
  const [grossWeight, setGrossWeight] = useState("");
  const [tareWeight, setTareWeight] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ text: string; severity: "success" | "error" } | null>(null);

  const selected = useMemo(() => shipments.find((item) => item.shipmentId === shipmentId) ?? null, [shipments, shipmentId]);
  const activeShipments = useMemo(() => shipments.filter((item) => selectableStatuses.includes(item.status)), [shipments]);
  const activeStep = selected ? stepByStatus[selected.status] : 0;
  const gross = Number(grossWeight);
  const tare = Number(tareWeight);
  const grossReady = Number.isFinite(gross) && gross > 0;
  const tareReady = Number.isFinite(tare) && tare > 0 && selected?.grossWeight !== null && selected?.grossWeight !== undefined && tare < selected.grossWeight;
  const calculatedNet =
    selected?.netWeight ?? (selected?.grossWeight !== null && selected?.grossWeight !== undefined && selected?.tareWeight !== null && selected?.tareWeight !== undefined
      ? selected.grossWeight - selected.tareWeight
      : null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAdminShipments();
      const active = data.filter((item) => selectableStatuses.includes(item.status));
      setShipments(data);
      setShipmentId((current) => {
        const currentIsSelectable = active.some((item) => item.shipmentId === current);
        return currentIsSelectable ? current : (active[0]?.shipmentId ?? "");
      });
    } catch (error) {
      setMessage({
        text: axios.isAxiosError(error) && error.response?.status === 403 ? "Bu işlem için yetkiniz yok." : "Kantar verileri yüklenemedi.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (selected && selectableStatuses.includes(selected.status)) {
      setGrossWeight(selected.grossWeight?.toString() ?? "");
      setTareWeight(selected.tareWeight?.toString() ?? "");
      setParams({ shipmentId: selected.shipmentId });
    } else if (!selected) {
      setParams({});
      setGrossWeight("");
      setTareWeight("");
    }
  }, [selected, setParams]);

  const handleShipmentChange = (event: SelectChangeEvent<string>) => {
    setShipmentId(event.target.value);
  };

  const notifyError = (error: unknown, fallback: string) => {
    setMessage({
      text: axios.isAxiosError(error) && typeof error.response?.data === "string" ? error.response.data : fallback,
      severity: "error",
    });
  };

  const execute = async (action: () => Promise<unknown>, success: string) => {
    if (!selected || !selectableStatuses.includes(selected.status)) {
      setMessage({ text: "İşlem yapılacak aktif araç seçin.", severity: "error" });
      return;
    }

    setProcessing(true);
    try {
      await action();
      setMessage({ text: success, severity: "success" });
      await load();
    } catch (error) {
      notifyError(error, "İşlem tamamlanamadı.");
    } finally {
      setProcessing(false);
    }
  };

  const disabledReason = !selected
    ? "İşlem yapılacak aktif araç yok."
    : selected.status === "Called"
      ? "Brüt ağırlığı girerek ilk adımı tamamlayın."
      : selected.status === "UnloadCompleted"
        ? "Dara ağırlığı brütten küçük ve pozitif olmalı."
        : "Sadece mevcut statüye uygun işlem aktif edilir.";

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
        Kantar İşlemleri
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Çağrılmış ve aktif işlemdeki araçların tartım sürecini yönetin.
      </Typography>

      {loading ? (
        <Box sx={{ minHeight: 260, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper sx={{ p: { xs: 2, sm: 3 }, height: "100%" }}>
              <Stack spacing={2.5}>
                <FormControl fullWidth>
                  <InputLabel id="shipment-select-label">İşlem yapılacak araç</InputLabel>
                  <Select
                    labelId="shipment-select-label"
                    label="İşlem yapılacak araç"
                    value={selectableStatuses.includes(selected?.status as ShipmentStatus) ? shipmentId : ""}
                    onChange={handleShipmentChange}
                    disabled={activeShipments.length === 0 || processing}
                  >
                    {activeShipments.map((item) => (
                      <MenuItem key={item.shipmentId} value={item.shipmentId}>
                        {item.plateNumber} - {item.driverName} - {item.statusName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {!selected ? (
                  <Alert severity="info">Kantar işlemi bekleyen çağrılmış veya aktif araç bulunmuyor.</Alert>
                ) : (
                  <Alert severity="info">
                    {selected.plateNumber} / {selected.driverName} / {selected.statusName}
                  </Alert>
                )}

                <TextField
                  fullWidth
                  label="Brüt Ağırlık (kg)"
                  type="number"
                  value={grossWeight}
                  onChange={(event) => setGrossWeight(event.target.value)}
                  disabled={processing || selected?.status !== "Called"}
                  slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
                />
                <TextField
                  fullWidth
                  label="Dara Ağırlığı (kg)"
                  type="number"
                  value={tareWeight}
                  onChange={(event) => setTareWeight(event.target.value)}
                  disabled={processing || selected?.status !== "UnloadCompleted"}
                  helperText={selected?.grossWeight ? `Brüt: ${formatWeight(selected.grossWeight)}` : "Dara için önce brüt tartım tamamlanmalı."}
                  slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
                />

                <Alert severity="warning">{disabledReason}</Alert>

                <Button
                  fullWidth
                  variant="contained"
                  disabled={processing || selected?.status !== "Called" || !grossReady}
                  onClick={() => void execute(() => saveGrossWeight(selected?.shipmentId ?? "", gross), "Brüt tartımı kaydedildi.")}
                >
                  1. Brüt Tartımı Kaydet
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  disabled={processing || selected?.status !== "OnScale"}
                  onClick={() => void execute(() => startUnload(selected?.shipmentId ?? ""), "Boşaltma başlatıldı.")}
                >
                  2. Boşaltmayı Başlat
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  color="warning"
                  disabled={processing || selected?.status !== "Unloading"}
                  onClick={() => void execute(() => finishUnload(selected?.shipmentId ?? ""), "Boşaltma tamamlandı.")}
                >
                  3. Boşaltmayı Bitir
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  color="secondary"
                  disabled={processing || selected?.status !== "UnloadCompleted" || !tareReady}
                  onClick={() => void execute(() => saveTareWeight(selected?.shipmentId ?? "", tare), "Dara tartımı kaydedildi.")}
                >
                  4. Dara Tartımını Kaydet
                </Button>
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Paper sx={{ p: { xs: 2, sm: 3 }, height: "100%" }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Süreç Adımları
              </Typography>
              <Stepper activeStep={activeStep} orientation="vertical" sx={{ mb: 3 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
              <Stack spacing={1.25}>
                <Typography>Geliş: {formatDate(selected?.arrivalTime ?? null)}</Typography>
                <Typography>Çağrılma: {formatDate(selected?.calledAt ?? null)}</Typography>
                <Typography>Brüt: {formatWeight(selected?.grossWeight ?? null)}</Typography>
                <Typography>Dara: {formatWeight(selected?.tareWeight ?? null)}</Typography>
                <Typography>Net: {formatWeight(calculatedNet)}</Typography>
                <Typography>Boşaltma Başlangıç: {formatDate(selected?.unloadStart ?? null)}</Typography>
                <Typography>Boşaltma Bitiş: {formatDate(selected?.unloadEnd ?? null)}</Typography>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      )}

      <Snackbar open={Boolean(message)} autoHideDuration={2500} onClose={() => setMessage(null)}>
        <Alert severity={message?.severity ?? "success"}>{message?.text}</Alert>
      </Snackbar>
    </Container>
  );
}
