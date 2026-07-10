import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import CallMadeOutlinedIcon from "@mui/icons-material/CallMadeOutlined";
import FactoryOutlinedIcon from "@mui/icons-material/FactoryOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import ScaleOutlinedIcon from "@mui/icons-material/ScaleOutlined";
import DashboardCard from "../../components/dashboard/DashboardCard";
import WaitingQueueTable from "../../components/dashboard/WaitingQueueTable";
import { getDashboard, type DashboardData } from "../../services/DashboardService";
import { getAdminShipments, type AdminShipment } from "../../services/adminShipmentService";
import { callVehicle } from "../../services/queueService";

const activeStatuses = ["Called", "OnScale", "Unloading", "UnloadCompleted"];
const dataFallback = { waitingCount: 0, calledCount: 0, onScaleCount: 0, completedTodayCount: 0 };
const date = (value: string | null) => (value ? new Date(value).toLocaleString("tr-TR") : "—");
const weight = (value: number | null) => (value === null ? "—" : `${value.toLocaleString("tr-TR")} kg`);

export default function DashboardPage() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [shipments, setShipments] = useState<AdminShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [callingId, setCallingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; severity: "success" | "error" } | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const [summary, list] = await Promise.all([getDashboard(), getAdminShipments()]);
      setDashboard(summary);
      setShipments(list);
    } catch {
      setMessage({ text: "Veriler yüklenemedi.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const waitingRows = useMemo(
    () =>
      shipments
        .filter((item) => item.status === "Waiting")
        .sort((a, b) => (a.queueNumber ?? Number.MAX_SAFE_INTEGER) - (b.queueNumber ?? Number.MAX_SAFE_INTEGER)),
    [shipments],
  );

  const activeRows = useMemo(
    () =>
      shipments
        .filter((item) => activeStatuses.includes(item.status))
        .sort((a, b) => (a.queueNumber ?? Number.MAX_SAFE_INTEGER) - (b.queueNumber ?? Number.MAX_SAFE_INTEGER)),
    [shipments],
  );

  const completedRows = useMemo(
    () =>
      shipments
        .filter((item) => item.status === "Completed")
        .sort((a, b) => new Date(b.completedTime ?? 0).getTime() - new Date(a.completedTime ?? 0).getTime())
        .slice(0, 5),
    [shipments],
  );

  const handleCall = async (id: string) => {
    setCallingId(id);
    try {
      await callVehicle(id);
      setMessage({ text: "Araç başarıyla çağrıldı.", severity: "success" });
      await refresh();
    } catch (error) {
      setMessage({
        text: axios.isAxiosError(error) && typeof error.response?.data === "string" ? error.response.data : "Araç çağrılamadı.",
        severity: "error",
      });
    } finally {
      setCallingId(null);
    }
  };

  const data = dashboard ?? dataFallback;

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 } }}>
      {!dashboard && loading ? (
        <Box sx={{ minHeight: 240, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3, justifyContent: "space-between" }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                Operasyon Özeti
              </Typography>
              <Typography color="text.secondary">Fabrika giriş, çağırma ve kantar akışını tek ekrandan yönetin.</Typography>
            </Box>
            <Button startIcon={<RefreshIcon />} onClick={() => void refresh()} disabled={loading}>
              Yenile
            </Button>
          </Stack>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <DashboardCard
                title="Bekleyen"
                description="FIFO sırasındaki araçlar"
                value={data.waitingCount}
                color="#1e5d8f"
                icon={<LocalShippingOutlinedIcon />}
                onClick={() => navigate("/shipments?status=Waiting")}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <DashboardCard
                title="Çağrılan"
                description="Kantara alınacak araçlar"
                value={data.calledCount}
                color="#2e7d32"
                icon={<CallMadeOutlinedIcon />}
                onClick={() => navigate("/shipments?status=Called")}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <DashboardCard
                title="Aktif İşlemde"
                description="Kantar ve boşaltma süreci"
                value={data.onScaleCount}
                color="#ed6c02"
                icon={<ScaleOutlinedIcon />}
                onClick={() => navigate("/shipments?status=active")}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <DashboardCard
                title="Bugün Tamamlanan"
                description="Kapanan sevkiyatlar"
                value={data.completedTodayCount}
                color="#607d8b"
                icon={<AssignmentTurnedInOutlinedIcon />}
                onClick={() => navigate("/shipments?status=Completed")}
              />
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <Stack direction="row" sx={{ mb: 2, alignItems: "center", justifyContent: "space-between" }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Bekleyen Araçlar
                </Typography>
              </Stack>
              <WaitingQueueTable rows={waitingRows} onCall={handleCall} callingId={callingId} loading={loading} />
            </Grid>

            <Grid size={{ xs: 12, lg: 5 }}>
              <Paper sx={{ p: 2, minHeight: 330 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                  Aktif Operasyonlar
                </Typography>
                {activeRows.length === 0 ? (
                  <Box sx={{ minHeight: 230, display: "grid", placeItems: "center", textAlign: "center", px: 2 }}>
                    <Box>
                      <FactoryOutlinedIcon color="disabled" sx={{ fontSize: 42, mb: 1 }} />
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Aktif operasyon yok
                      </Typography>
                      <Typography color="text.secondary">Çağrılan ve kantardaki araçlar burada görünür.</Typography>
                    </Box>
                  </Box>
                ) : (
                  <Stack spacing={1.25}>
                    {activeRows.map((item) => (
                      <Stack
                        key={item.shipmentId}
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        sx={{
                          p: 1.25,
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 1,
                          alignItems: { sm: "center" },
                          justifyContent: "space-between",
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 700 }}>{item.plateNumber}</Typography>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {item.driverName} / Sıra {item.queueNumber ?? "—"}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                          <Chip size="small" label={item.statusName} color={item.status === "Called" ? "success" : "primary"} />
                          <Button size="small" variant="contained" onClick={() => navigate(`/weighing?shipmentId=${item.shipmentId}`)}>
                            Kantar İşlemlerine Git
                          </Button>
                        </Stack>
                      </Stack>
                    ))}
                  </Stack>
                )}
              </Paper>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                  Son Tamamlanan İşlemler
                </Typography>
                {completedRows.length === 0 ? (
                  <Box sx={{ minHeight: 140, display: "grid", placeItems: "center", textAlign: "center" }}>
                    <Box>
                      <AssignmentTurnedInOutlinedIcon color="disabled" sx={{ fontSize: 38, mb: 1 }} />
                      <Typography sx={{ fontWeight: 700 }}>Tamamlanan işlem bulunmuyor</Typography>
                      <Typography color="text.secondary">Dara tartımı biten sevkiyatlar burada kompakt olarak listelenir.</Typography>
                    </Box>
                  </Box>
                ) : (
                  <Grid container spacing={1.5}>
                    {completedRows.map((item) => (
                      <Grid key={item.shipmentId} size={{ xs: 12, md: 6, xl: 4 }}>
                        <Box sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                          <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1 }}>
                            <Typography sx={{ fontWeight: 800 }}>{item.plateNumber}</Typography>
                            <Chip size="small" color="success" label="Tamamlandı" />
                          </Stack>
                          <Typography variant="body2" color="text.secondary">
                            {item.driverName} / Net {weight(item.netWeight)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {date(item.completedTime)}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
      <Snackbar open={Boolean(message)} autoHideDuration={2500} onClose={() => setMessage(null)}>
        <Alert severity={message?.severity ?? "success"}>{message?.text}</Alert>
      </Snackbar>
    </Container>
  );
}
