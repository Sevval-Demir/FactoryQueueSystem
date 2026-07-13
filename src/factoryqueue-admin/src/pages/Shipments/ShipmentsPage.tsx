import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Alert, Box, Button, Chip, Container, Paper, Snackbar, Stack, Tab, Tabs, TextField, Tooltip, Typography } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { useNavigate, useSearchParams } from "react-router-dom";
import ShipmentDetailDialog from "../../components/shipments/ShipmentDetailDialog";
import { getAdminShipments, type AdminShipment, type ShipmentStatus } from "../../services/adminShipmentService";
import { callVehicle } from "../../services/queueService";

const filters: { label: string; value: "All" | "Active" | ShipmentStatus }[] = [
  { label: "Tümü", value: "All" },
  { label: "Yolda / Transit", value: "OnTheWay" },
  { label: "Kabul Bekliyor", value: "Waiting" },
  { label: "Perona Çağrıldı", value: "Called" },
  { label: "Kantar Tartımında", value: "OnScale" },
  { label: "Boşaltım Alanında", value: "Unloading" },
  { label: "Son Tartım Bekliyor", value: "UnloadCompleted" },
  { label: "Çıkış Yapıldı", value: "Completed" },
];

const activeStatuses = ["OnScale", "Unloading", "UnloadCompleted"];
const weighingStatuses = ["Called", "OnScale", "Unloading", "UnloadCompleted"];
const date = (value: string | null) => (value ? new Date(value).toLocaleString("tr-TR") : "—");
const weight = (value: number | null) => (value === null ? "—" : `${value.toLocaleString("tr-TR")} kg`);

const chipColor = (status: ShipmentStatus) => {
  if (status === "Completed") return "success";
  if (status === "Waiting") return "warning";
  if (status === "Called") return "info";
  if (status === "Unloading") return "error";
  if (status === "OnTheWay") return "default";
  return "primary";
};
const statusLabel = (status: ShipmentStatus) =>
  ({
    OnTheWay: "Yolda / Transit",
    Waiting: "Sırada / Kabul Bekliyor",
    Called: "Perona Çağrıldı / Kantara İlerliyor",
    OnScale: "Kantar Tartımında",
    Unloading: "Boşaltım Alanında",
    UnloadCompleted: "Boşaltım Tamamlandı / Son Tartım Bekliyor",
    Completed: "İşlem Tamamlandı / Çıkış Yapıldı",
  })[status];

export default function ShipmentsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const requestedStatus = params.get("status");
  const initial = requestedStatus === "active" ? "Active" : ((requestedStatus as ShipmentStatus | null) ?? "All");
  const [filter, setFilter] = useState<"All" | "Active" | ShipmentStatus>(initial);
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<AdminShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminShipment | null>(null);
  const [message, setMessage] = useState<{ text: string; severity: "success" | "error" } | null>(null);
  const [calling, setCalling] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      setRows(await getAdminShipments());
    } catch (error) {
      setMessage({
        text: axios.isAxiosError(error) && error.response?.status === 403 ? "Bu işlem için yetkiniz yok." : "Sevkiyatlar yüklenemedi.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        const statusMatch =
          filter === "All" || (filter === "Active" ? activeStatuses.includes(row.status) : row.status === filter);
        const text = `${row.plateNumber} ${row.driverName} ${row.vehicleType}`.toLocaleLowerCase("tr-TR");
        return statusMatch && text.includes(query.toLocaleLowerCase("tr-TR"));
      }),
    [rows, filter, query],
  );

  const firstWaitingId = useMemo(
    () =>
      rows
        .filter((row) => row.status === "Waiting")
        .sort((a, b) => (a.queueNumber ?? Number.MAX_SAFE_INTEGER) - (b.queueNumber ?? Number.MAX_SAFE_INTEGER))[0]?.queueEntryId,
    [rows],
  );

  const activeOperationRow = useMemo(
    () =>
      rows
        .filter((row) => weighingStatuses.includes(row.status))
        .sort((a, b) => (a.queueNumber ?? Number.MAX_SAFE_INTEGER) - (b.queueNumber ?? Number.MAX_SAFE_INTEGER))[0] ?? null,
    [rows],
  );

  const queueBusy = rows.some((row) => weighingStatuses.includes(row.status));

  const call = async (row: AdminShipment) => {
    if (!row.queueEntryId) return;
    setCalling(row.shipmentId);
    try {
      await callVehicle(row.queueEntryId);
      setMessage({ text: "Araç perona çağrıldı.", severity: "success" });
      await refresh();
    } catch (error) {
      setMessage({
        text: axios.isAxiosError(error) && typeof error.response?.data === "string" ? error.response.data : "Araç perona çağrılamadı.",
        severity: "error",
      });
    } finally {
      setCalling(null);
    }
  };

  const columns: GridColDef<AdminShipment>[] = [
    { field: "queueNumber", headerName: "Sıra", width: 78, valueFormatter: (value) => value ?? "—" },
    { field: "plateNumber", headerName: "Plaka", minWidth: 120, flex: 1 },
    { field: "vehicleType", headerName: "Araç Tipi", minWidth: 120, flex: 1 },
    { field: "driverName", headerName: "Sürücü", minWidth: 150, flex: 1 },
    {
      field: "statusName",
      headerName: "Durum",
      width: 175,
      renderCell: ({ row }) => <Chip size="small" label={statusLabel(row.status)} color={chipColor(row.status)} />,
    },
    { field: "arrivalTime", headerName: "Kabul Saati", width: 165, valueFormatter: (value) => date(value) },
    { field: "grossWeight", headerName: "Brüt", width: 120, valueFormatter: (value) => weight(value) },
    { field: "netWeight", headerName: "Net", width: 120, valueFormatter: (value) => weight(value) },
    {
      field: "actions",
      headerName: "İşlem",
      width: 320,
      sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={1}>
          <Button size="small" startIcon={<VisibilityOutlinedIcon />} onClick={() => setSelected(row)}>
            Detay
          </Button>
          {row.status === "Waiting" && (
            <Tooltip title={queueBusy ? "Kantar meşgul" : row.queueEntryId !== firstWaitingId ? "Araç sırası değil" : ""}>
              <span>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  disabled={row.queueEntryId !== firstWaitingId || calling === row.shipmentId || queueBusy}
                  onClick={() => void call(row)}
                >
                  FIFO Çağır
                </Button>
              </span>
            </Tooltip>
          )}
          {activeOperationRow?.shipmentId === row.shipmentId && (
            <Button size="small" variant="contained" onClick={() => navigate(`/weighing?shipmentId=${row.shipmentId}`)}>
              Tartım Operasyonuna Git
            </Button>
          )}
        </Stack>
      ),
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ mb: 3, justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Araç Operasyonları
          </Typography>
          <Typography color="text.secondary">Kabul, peron, kantar, boşaltım ve çıkış süreçlerini takip edin.</Typography>
        </Box>
        <Button startIcon={<RefreshIcon />} onClick={() => void refresh()} disabled={loading}>
          Yenile
        </Button>
      </Stack>
      <Paper sx={{ p: 3, overflow: "hidden" }}>
        <Tabs
          value={filter}
          onChange={(_, value) => {
            setFilter(value);
            setParams(value === "All" ? {} : { status: value === "Active" ? "active" : value });
          }}
          variant="scrollable"
          allowScrollButtonsMobile
          sx={{ mb: 2 }}
        >
          {filters.map((item) => (
            <Tab key={item.value} value={item.value} label={item.label} />
          ))}
        </Tabs>
        <TextField
          fullWidth
          size="small"
          label="Plaka, araç tipi veya sürücü ara"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          sx={{ mb: 2 }}
        />
        {queueBusy && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Kantar meşgul. Yeni araç çağırma geçici olarak kapalı.
          </Alert>
        )}
        <Box sx={{ width: "100%", overflowX: "auto" }}>
          <DataGrid
            rows={filtered}
            columns={columns}
            getRowId={(row) => row.shipmentId}
            loading={loading}
            autoHeight
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25]}
            initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
            sx={{
              border: 0,
              minWidth: 1120,
              "& .MuiDataGrid-columnHeaders": { backgroundColor: "info.light", color: "info.contrastText" },
              "& .MuiDataGrid-row:hover": { backgroundColor: "action.hover" },
            }}
          />
        </Box>
      </Paper>
      <ShipmentDetailDialog shipment={selected} onClose={() => setSelected(null)} />
      <Snackbar open={Boolean(message)} autoHideDuration={2500} onClose={() => setMessage(null)}>
        <Alert severity={message?.severity ?? "success"}>{message?.text}</Alert>
      </Snackbar>
    </Container>
  );
}
