import { useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import ScaleOutlinedIcon from "@mui/icons-material/ScaleOutlined";

const expandedWidth = 260;
const collapsedWidth = 76;

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: <DashboardOutlinedIcon /> },
  { label: "Sevkiyatlar", path: "/shipments", icon: <LocalShippingOutlinedIcon /> },
  { label: "Kantar İşlemleri", path: "/weighing", icon: <ScaleOutlinedIcon /> },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const desktopWidth = collapsed ? collapsedWidth : expandedWidth;
  const fullName = localStorage.getItem("fullName") || "Admin";

  if (!token || role?.toLowerCase() !== "admin") {
    return <Navigate to="/" replace />;
  }

  const go = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("fullName");
    localStorage.removeItem("role");
    navigate("/");
  };

  const drawerContent = (isCollapsed: boolean) => (
    <>
      <Toolbar
        sx={{
          justifyContent: isCollapsed ? "center" : "space-between",
          px: isCollapsed ? 1 : 2,
        }}
      >
        {!isCollapsed && (
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Fabrika Kuyruk
          </Typography>
        )}
        {!isMobile && (
          <Tooltip title={isCollapsed ? "Menüyü aç" : "Menüyü daralt"}>
            <IconButton size="small" onClick={() => setCollapsed((value) => !value)}>
              {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          </Tooltip>
        )}
      </Toolbar>
      <Divider />
      <List sx={{ px: 1 }}>
        {navItems.map((item) => {
          const selected = location.pathname === item.path;
          return (
            <Tooltip key={item.path} title={isCollapsed ? item.label : ""} placement="right">
              <ListItemButton
                selected={selected}
                onClick={() => go(item.path)}
                sx={{
                  borderRadius: 1,
                  justifyContent: isCollapsed ? "center" : "flex-start",
                  mb: 0.5,
                  px: isCollapsed ? 1 : 2,
                }}
              >
                <ListItemIcon sx={{ minWidth: isCollapsed ? 0 : 40, color: selected ? "primary.main" : "inherit" }}>
                  {item.icon}
                </ListItemIcon>
                {!isCollapsed && <ListItemText primary={item.label} />}
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>
      <Box sx={{ mt: "auto", p: isCollapsed ? 1 : 2 }}>
        {isCollapsed ? (
          <Tooltip title="Çıkış yap" placement="right">
            <IconButton color="inherit" onClick={logout} sx={{ width: "100%" }}>
              <LogoutOutlinedIcon />
            </IconButton>
          </Tooltip>
        ) : (
          <Button fullWidth color="inherit" startIcon={<LogoutOutlinedIcon />} onClick={logout}>
            Çıkış Yap
          </Button>
        )}
      </Box>
    </>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", overflowX: "hidden", bgcolor: "background.default" }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (value) => value.zIndex.drawer + 1,
          width: { md: `calc(100% - ${desktopWidth}px)` },
          ml: { md: `${desktopWidth}px` },
          transition: theme.transitions.create(["width", "margin"], { duration: theme.transitions.duration.shorter }),
        }}
      >
        <Toolbar sx={{ minWidth: 0 }}>
          {isMobile && (
            <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" noWrap sx={{ flexGrow: 1, minWidth: 0 }}>
            Factory Queue Yönetim Sistemi
          </Typography>
          <Typography variant="body2" noWrap sx={{ maxWidth: { xs: 140, sm: 260 } }}>
            {fullName}
          </Typography>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { md: desktopWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { width: expandedWidth } }}
        >
          {drawerContent(false)}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              width: desktopWidth,
              boxSizing: "border-box",
              display: "flex",
              overflowX: "hidden",
              transition: theme.transitions.create("width", { duration: theme.transitions.duration.shorter }),
            },
          }}
        >
          {drawerContent(collapsed)}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { xs: "100%", md: `calc(100% - ${desktopWidth}px)` },
          minWidth: 0,
          transition: theme.transitions.create("width", { duration: theme.transitions.duration.shorter }),
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
