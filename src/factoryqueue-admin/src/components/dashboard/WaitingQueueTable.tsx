import { Box, Button, CircularProgress, Paper, Typography } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import type { AdminShipment } from "../../services/adminShipmentService";

interface Props {
  rows: AdminShipment[];
  onCall: (id: string) => void;
  callingId?: string | null;
  loading?: boolean;
}

const date = (value: string | null) => (value ? new Date(value).toLocaleString("tr-TR") : "—");

export default function WaitingQueueTable({ rows, onCall, callingId, loading = false }: Props) {
  const firstQueueEntryId = rows[0]?.queueEntryId;
  const columns: GridColDef<AdminShipment>[] = [
    { field: "queueNumber", headerName: "Sıra", width: 90, valueFormatter: (value) => value ?? "—" },
    { field: "plateNumber", headerName: "Plaka", flex: 1, minWidth: 130 },
    { field: "driverName", headerName: "Sürücü", flex: 1, minWidth: 150 },
    { field: "arrivalTime", headerName: "Geliş", flex: 1, minWidth: 170, valueFormatter: (value) => date(value) },
    {
      field: "action",
      headerName: "İşlem",
      width: 160,
      sortable: false,
      renderCell: ({ row }) => (
        <Button
          size="small"
          variant="contained"
          disabled={!row.queueEntryId || row.queueEntryId !== firstQueueEntryId || Boolean(callingId)}
          onClick={() => row.queueEntryId && onCall(row.queueEntryId)}
        >
          {callingId === row.queueEntryId ? "Çağrılıyor" : "Aracı Çağır"}
        </Button>
      ),
    },
  ];

  return (
    <Paper sx={{ p: 2, overflow: "hidden" }}>
      {loading ? (
        <Box sx={{ height: 260, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Box>
      ) : rows.length === 0 ? (
        <Box sx={{ height: 220, display: "grid", placeItems: "center", textAlign: "center", px: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Bekleyen araç yok
            </Typography>
            <Typography color="text.secondary">Sıraya alınan araçlar burada FIFO sırasıyla görünür.</Typography>
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
          sx={{ border: 0, "& .MuiDataGrid-columnHeaders": { backgroundColor: "#edf3f7" } }}
        />
      )}
    </Paper>
  );
}
