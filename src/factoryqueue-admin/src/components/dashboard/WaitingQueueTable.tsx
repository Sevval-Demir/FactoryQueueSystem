import { Box, Button, Chip, CircularProgress, Paper, Tooltip, Typography } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import type { AdminShipment } from "../../services/adminShipmentService";

interface Props {
  rows: AdminShipment[];
  onCall: (id: string) => void;
  callingId?: string | null;
  loading?: boolean;
  busy?: boolean;
}

const date = (value: string | null) => (value ? new Date(value).toLocaleString("tr-TR") : "—");
const waitingMinutes = (value: string | null) => (value ? Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000)) : 0);
const waitColor = (minutes: number) => (minutes < 30 ? "success" : minutes < 60 ? "warning" : "error");
const formatDuration = (minutes: number) => {
  if (minutes <= 0) return "Yeni Giriş";
  if (minutes < 60) return `${minutes} dk`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} sa` : `${hours} sa ${rest} dk`;
};

export default function WaitingQueueTable({ rows, onCall, callingId, loading = false, busy = false }: Props) {
  const firstQueueEntryId = rows[0]?.queueEntryId;

  const columns: GridColDef<AdminShipment>[] = [
    { field: "queueNumber", headerName: "Sıra", width: 90, valueFormatter: (value) => value ?? "—" },
    { field: "plateNumber", headerName: "Plaka", flex: 1, minWidth: 130 },
    { field: "driverName", headerName: "Sürücü", flex: 1, minWidth: 150 },
    { field: "arrivalTime", headerName: "Kabul Saati", flex: 1, minWidth: 170, valueFormatter: (value) => date(value) },
    {
      field: "waitingTime",
      headerName: "Bekleme Süresi",
      width: 150,
      sortable: false,
      renderCell: ({ row }) => {
        const minutes = waitingMinutes(row.arrivalTime);
        return <Chip size="small" color={minutes === 0 ? "success" : waitColor(minutes)} label={formatDuration(minutes)} sx={{ fontWeight: 800 }} />;
      },
    },
    {
      field: "action",
      headerName: "Operasyon",
      width: 190,
      sortable: false,
      renderCell: ({ row }) => {
        const isFirst = row.queueEntryId === firstQueueEntryId;
        const disabled = !row.queueEntryId || !isFirst || Boolean(callingId) || busy;
        const tooltip = busy ? "Kantar meşgul" : !isFirst ? "Araç sırası değil" : "";

        return (
          <Tooltip title={tooltip}>
            <span>
              <Button
                size="small"
                variant="contained"
                color="success"
                disabled={disabled}
                onClick={() => row.queueEntryId && onCall(row.queueEntryId)}
              >
                {callingId === row.queueEntryId ? "Çağrılıyor" : "ARACI KANTARA Çağır"}
              </Button>
            </span>
          </Tooltip>
        );
      },
    },
  ];

  return (
    <Paper sx={{ p: 2, overflow: "hidden" }}>
      {loading ? (
        <Box sx={{ height: 260, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Box>
      ) : rows.length === 0 ? (
        <Box sx={{ height: 240, display: "grid", placeItems: "center", textAlign: "center", px: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Kabul bekleyen araç yok
            </Typography>
            <Typography color="text.secondary">Kabul alanına alınan araçlar burada FIFO sırasıyla görünür.</Typography>
          </Box>
        </Box>
      ) : (
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.shipmentId}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[5, 10]}
          initialState={{ pagination: { paginationModel: { pageSize: 5, page: 0 } } }}
          sx={{
            border: 0,
            "& .MuiDataGrid-columnHeaders": {
              minHeight: "48px !important",
              backgroundColor: "#eaf3fb",
              color: "#16324f",
              borderBottom: "1px solid",
              borderColor: "divider",
            },
            "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 900 },
            "& .MuiDataGrid-row:hover": { backgroundColor: "action.hover" },
          }}
        />
      )}
    </Paper>
  );
}
