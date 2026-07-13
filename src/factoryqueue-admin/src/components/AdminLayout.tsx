import { useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Box,
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
import { alpha } from "@mui/material/styles";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import FactoryOutlinedIcon from "@mui/icons-material/FactoryOutlined";
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
  const initials =
    fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "A";

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
          gap: 1.25,
          px: isCollapsed ? 1 : 2.25,
          minHeight: 76,
        }}
      >
        {!isCollapsed && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
            <Avatar
              variant="rounded"
              sx={{
                width: 42,
                height: 42,
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: "primary.main",
              }}
            >
              <FactoryOutlinedIcon />
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" noWrap sx={{ fontWeight: 800, letterSpacing: 0 }}>
                Fabrika Kuyruk
              </Typography>
              <Typography variant="caption" noWrap sx={{ color: "text.secondary", fontWeight: 600 }}>
                Operasyon Paneli
              </Typography>
            </Box>
          </Box>
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
      <List sx={{ px: 1.25, py: 2, flex: 1 }}>
        {navItems.map((item) => {
          const selected = location.pathname === item.path;
          return (
            <Tooltip key={item.path} title={isCollapsed ? item.label : ""} placement="right">
              <ListItemButton
                selected={selected}
                onClick={() => go(item.path)}
                sx={{
                  borderRadius: 2,
                  borderLeft: "3px solid",
                  borderLeftColor: selected ? "primary.main" : "transparent",
                  justifyContent: isCollapsed ? "center" : "flex-start",
                  mb: 0.75,
                  px: isCollapsed ? 1 : 1.75,
                  py: 1.15,
                  color: selected ? "primary.main" : "text.secondary",
                  bgcolor: selected ? alpha(theme.palette.primary.main, 0.1) : "transparent",
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, selected ? 0.14 : 0.08),
                    color: "primary.main",
                  },
                  "&.Mui-selected": {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.14) },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: isCollapsed ? 0 : 40, color: "inherit" }}>{item.icon}</ListItemIcon>
                {!isCollapsed && (
                  <ListItemText
                    primary={
                      <Typography component="span" sx={{ fontWeight: selected ? 800 : 650, fontSize: 14 }}>
                        {item.label}
                      </Typography>
                    }
                  />
                )}
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>
      <Box
        sx={{
          mt: "auto",
          p: isCollapsed ? 1 : 2,
          position: "sticky",
          bottom: 0,
          bgcolor: "background.paper",
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        {!isCollapsed && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              p: 1.25,
              mb: 1,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.text.primary, 0.04),
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Avatar sx={{ width: 40, height: 40, bgcolor: "primary.main", fontWeight: 800 }}>{initials}</Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography noWrap sx={{ fontWeight: 800, fontSize: 14 }}>
                {fullName}
              </Typography>
              <Typography noWrap variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                Sistem Yönetici
              </Typography>
            </Box>
          </Box>
        )}
        {isCollapsed ? (
          <Tooltip title="Çıkış yap" placement="right">
            <IconButton
              color="inherit"
              onClick={logout}
              sx={{
                width: "100%",
                borderRadius: 2,
                color: "error.main",
                "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.1) },
              }}
            >
              <LogoutOutlinedIcon />
            </IconButton>
          </Tooltip>
        ) : (
          <ListItemButton
            onClick={logout}
            sx={{
              borderRadius: 2,
              color: "error.main",
              py: 1.15,
              px: 1.75,
              "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.1) },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
              <LogoutOutlinedIcon />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography component="span" sx={{ fontWeight: 800, fontSize: 14 }}>
                  Çıkış Yap
                </Typography>
              }
            />
          </ListItemButton>
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
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { width: expandedWidth, display: "flex", flexDirection: "column" },
          }}
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
              flexDirection: "column",
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
