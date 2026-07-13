import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import * as signalR from "@microsoft/signalr";
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
import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import CallMadeOutlinedIcon from "@mui/icons-material/CallMadeOutlined";
import FactoryOutlinedIcon from "@mui/icons-material/FactoryOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import RefreshIcon from "@mui/icons-material/Refresh";
import ScaleOutlinedIcon from "@mui/icons-material/ScaleOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import DashboardCard from "../../components/dashboard/DashboardCard";
import WaitingQueueTable from "../../components/dashboard/WaitingQueueTable";
import { getDashboard, type DashboardData } from "../../services/DashboardService";
import { getAdminShipments, type AdminShipment } from "../../services/adminShipmentService";
import { callVehicle } from "../../services/queueService";

const activeStatuses = ["Called", "OnScale", "Unloading", "UnloadCompleted"];
const dataFallback = { waitingCount: 0, totalWaitingCount: 0, calledCount: 0, onScaleCount: 0, completedTodayCount: 0 };
const date = (value: string | null) => (value ? new Date(value).toLocaleString("tr-TR") : "—");
const weight = (value: number | null) => (value === null ? "—" : `${value.toLocaleString("tr-TR")} kg`);
const statusLabel = (status: AdminShipment["status"]) =>
  ({
    OnTheWay: "Yolda / Transit",
    Waiting: "Sırada / Kabul Bekliyor",
    Called: "Perona Çağrıldı / Kantara İlerliyor",
    OnScale: "Kantar Tartımında",
    Unloading: "Boşaltım Alanında",
    UnloadCompleted: "Boşaltım Tamamlandı / Son Tartım Bekliyor",
    Completed: "İşlem Tamamlandı / Çıkış Yapıldı",
  })[status];
const operationStart = (row: AdminShipment | null) => row?.grossTime ?? row?.calledAt ?? row?.arrivalTime ?? null;
const elapsedMinutes = (value: string | null) => (value ? Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000)) : 0);
const formatDuration = (minutes: number) => {
  if (minutes <= 0) return "Yeni Giriş";
  if (minutes < 60) return `${minutes} dk`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} sa` : `${hours} sa ${rest} dk`;
};
const operatorName = () => localStorage.getItem("fullName") || "Operatör";

interface AuditLogItem {
  id: string;
  text: string;
  time: Date;
  severity: "success" | "info" | "warning";
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [shipments, setShipments] = useState<AdminShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [callingId, setCallingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; severity: "success" | "error" } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

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

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5221/hubs/queue", { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .build();

    connection.on("QueueUpdated", () => {
      setAuditLogs((items) => [{ id: crypto.randomUUID(), text: "Kabul sırası güncellendi", time: new Date(), severity: "info" as const }, ...items].slice(0, 6));
      void refresh();
    });

    connection.on("ShipmentUpdated", (shipmentId: string) => {
      setAuditLogs((items) => [{ id: crypto.randomUUID(), text: `Sevkiyat güncellendi: ${shipmentId.slice(0, 8)}`, time: new Date(), severity: "warning" as const }, ...items].slice(0, 6));
      void refresh();
    });

    void connection.start().catch(() => undefined);
    return () => {
      void connection.stop();
    };
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
  const activeOperationRow = activeRows[0] ?? null;
  const queueBusy = activeRows.length > 0;
  const scaleElapsed = now ? elapsedMinutes(operationStart(activeOperationRow)) : 0;

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
      const row = waitingRows.find((item) => item.queueEntryId === id);
      setAuditLogs((items) => [
        { id: crypto.randomUUID(), text: `${operatorName()} ${row?.plateNumber ?? "aracı"} perona çağırdı`, time: new Date(), severity: "success" as const },
        ...items,
      ].slice(0, 6));
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

  const handleArchive = (row: AdminShipment) => {
    setAuditLogs((items) => [
      { id: crypto.randomUUID(), text: `${operatorName()} ${row.plateNumber} aracını arşive kaldırdı`, time: new Date(), severity: "info" as const },
      ...items,
    ].slice(0, 6));
    setMessage({ text: "Araç arşive kaldırıldı.", severity: "success" });
  };

  const data = dashboard ?? dataFallback;

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
      {!dashboard && loading ? (
        <Box sx={{ minHeight: 240, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ mb: 3, justifyContent: "space-between" }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                Lojistik Operasyon Paneli
              </Typography>
              <Typography color="text.secondary">Kabul, peron, kantar ve çıkış akışını tek ekrandan yönetin.</Typography>
            </Box>
            <Button startIcon={<RefreshIcon />} onClick={() => void refresh()} disabled={loading}>
              Yenile
            </Button>
          </Stack>

          <Paper
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 3,
              overflow: "hidden",
              position: "relative",
              color: queueBusy ? "error.contrastText" : "success.contrastText",
              bgcolor: queueBusy ? "error.main" : "success.main",
              boxShadow: queueBusy ? "0 18px 40px rgba(211,47,47,.24)" : "0 18px 40px rgba(46,125,50,.22)",
            }}
          >
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: { md: "center" }, justifyContent: "space-between" }}>
              <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                <Box
                  sx={{
                    width: 58,
                    height: 58,
                    borderRadius: 2,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: "rgba(255,255,255,.18)",
                    boxShadow: queueBusy ? "0 0 0 8px rgba(255,255,255,.10)" : "none",
                  }}
                >
                  <RadioButtonCheckedIcon sx={{ fontSize: 34 }} />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: .2 }}>
                    {queueBusy
                      ? `KANTAR DOLU - ${activeOperationRow?.plateNumber ?? "Araç"} (${statusLabel(activeOperationRow?.status ?? "Called")})`
                      : "KANTAR BOŞ - Araç Alınabilir"}
                  </Typography>
                  <Typography sx={{ opacity: .9, fontWeight: 700 }}>
                    {queueBusy ? (scaleElapsed === 0 ? "Yeni giriş yaptı" : `${formatDuration(scaleElapsed)} kantarda`) : "Sıradaki araç çağrılabilir"}
                  </Typography>
                </Box>
              </Stack>
              <Chip
                label={queueBusy && scaleElapsed === 0 ? "Yeni Giriş" : queueBusy ? "CANLI OPERASYON" : "HAZIR"}
                color={queueBusy && scaleElapsed === 0 ? "success" : undefined}
                sx={{ bgcolor: queueBusy && scaleElapsed === 0 ? "success.main" : "rgba(255,255,255,.22)", color: "inherit", fontWeight: 900, alignSelf: { xs: "flex-start", md: "center" } }}
              />
            </Stack>
          </Paper>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <DashboardCard
                title="Kabul Bekleyen"
                description="Kabul sırasındaki araçlar"
                value={data.waitingCount}
                color="#0288d1"
                icon={<LocalShippingOutlinedIcon />}
                onClick={() => navigate("/shipments?status=Waiting")}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <DashboardCard
                title="Perona Çağrılan"
                description="Kantara ilerleyen araçlar"
                value={data.calledCount}
                color="#2e7d32"
                icon={<CallMadeOutlinedIcon />}
                onClick={() => navigate("/shipments?status=Called")}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <DashboardCard
                title="Aktif Operasyon"
                description="Kantar ve boşaltım süreci"
                value={data.onScaleCount}
                color="#ed6c02"
                icon={<ScaleOutlinedIcon />}
                onClick={() => navigate("/shipments?status=active")}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <DashboardCard
                title="Çıkış Yapılan"
                description="Bugün tamamlanan işlemler"
                value={data.completedTodayCount}
                color="#d32f2f"
                icon={<AssignmentTurnedInOutlinedIcon />}
                onClick={() => navigate("/shipments?status=Completed")}
              />
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mt: 3 }}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <Stack direction="row" sx={{ mb: 2, alignItems: "center", justifyContent: "space-between" }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Kabul Sırası
                </Typography>
              </Stack>
              <WaitingQueueTable rows={waitingRows} onCall={handleCall} callingId={callingId} loading={loading} busy={queueBusy} />
            </Grid>

            <Grid size={{ xs: 12, lg: 5 }}>
              <Paper sx={{ p: 3, minHeight: 330 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                  Peron ve Kantar Operasyonları
                </Typography>
                {queueBusy && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Kantar meşgul. Yeni araç çağırma geçici olarak kapalı.
                  </Alert>
                )}
                {activeRows.length === 0 ? (
                  <Box sx={{ minHeight: 230, display: "grid", placeItems: "center", textAlign: "center", px: 2 }}>
                    <Box>
                      <FactoryOutlinedIcon color="disabled" sx={{ fontSize: 42, mb: 1 }} />
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Aktif operasyon yok
                      </Typography>
                      <Typography color="text.secondary">Perona çağrılan ve kantardaki araçlar burada görünür.</Typography>
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
                          <Chip size="small" label={statusLabel(item.status)} color={item.status === "Called" ? "success" : "info"} />
                          {activeOperationRow?.shipmentId === item.shipmentId && (
                            <Button size="small" variant="contained" onClick={() => navigate(`/weighing?shipmentId=${item.shipmentId}`)}>
                              Tartım Operasyonuna Git
                            </Button>
                          )}
                        </Stack>
                      </Stack>
                    ))}
                  </Stack>
                )}
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, lg: 8 }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                  Son Çıkış İşlemleri
                </Typography>
                {completedRows.length === 0 ? (
                  <Box sx={{ minHeight: 140, display: "grid", placeItems: "center", textAlign: "center" }}>
                    <Box>
                      <AssignmentTurnedInOutlinedIcon color="disabled" sx={{ fontSize: 38, mb: 1 }} />
                      <Typography sx={{ fontWeight: 700 }}>Çıkış yapan araç bulunmuyor</Typography>
                      <Typography color="text.secondary">Son tartımı tamamlanan sevkiyatlar burada listelenir.</Typography>
                    </Box>
                  </Box>
                ) : (
                  <Grid container spacing={1.5}>
                    {completedRows.map((item) => (
                      <Grid key={item.shipmentId} size={{ xs: 12, md: 6, xl: 4 }}>
                        <Box sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                          <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1 }}>
                            <Typography sx={{ fontWeight: 800 }}>{item.plateNumber}</Typography>
                            <Chip size="small" color="success" label="Çıkış Yapıldı" />
                          </Stack>
                          <Typography variant="body2" color="text.secondary">
                            {item.driverName} / Net {weight(item.netWeight)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {date(item.completedTime)}
                          </Typography>
                          <Button
                            size="small"
                            color="warning"
                            variant="outlined"
                            startIcon={<ArchiveOutlinedIcon />}
                            sx={{ mt: 1 }}
                            onClick={() => handleArchive(item)}
                          >
                            Arşive Kaldır / Devre Dışı Bırak
                          </Button>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, lg: 4 }}>
              <Paper sx={{ p: 3, height: "100%" }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
                  <TimelineOutlinedIcon color="primary" />
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    Son Operasyon Logları
                  </Typography>
                </Stack>
                {auditLogs.length === 0 ? (
                  <Box sx={{ minHeight: 180, display: "grid", placeItems: "center", textAlign: "center", color: "text.secondary" }}>
                    Operasyon kaydı bekleniyor.
                  </Box>
                ) : (
                  <Stack spacing={1.25}>
                    {auditLogs.map((log) => (
                      <Box
                        key={log.id}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "divider",
                          bgcolor: log.severity === "success" ? "success.50" : log.severity === "warning" ? "warning.50" : "info.50",
                        }}
                      >
                        <Typography sx={{ fontWeight: 800 }}>{log.text}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {log.time.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
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
