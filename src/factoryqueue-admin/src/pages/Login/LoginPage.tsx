import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Alert, Box, Button, Link, Paper, TextField, Typography } from "@mui/material";
import { login } from "../../services/authService";

export default function LoginPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      setError("");
      const result = await login(phone, password);
      localStorage.setItem("token", result.token);
      localStorage.setItem("userId", result.userId);
      localStorage.setItem("fullName", result.fullName);
      localStorage.setItem("role", result.role);
      if (result.role.toLowerCase() !== "admin") {
        localStorage.clear();
        setError("Bu hesap admin paneline erişemez.");
        return;
      }
      navigate("/dashboard");
    } catch {
      setError("Giriş başarısız. Bilgilerinizi kontrol edin.");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2, bgcolor: "#edf3f7" }}>
      <Paper sx={{ p: { xs: 3, sm: 4 }, width: "100%", maxWidth: 420 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Factory Queue
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Yönetim paneline giriş yapın.
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box
          component="form"
          onSubmit={(event) => {
            event.preventDefault();
            void handleLogin();
          }}
        >
          <TextField fullWidth label="Telefon" value={phone} onChange={(event) => setPhone(event.target.value)} sx={{ mb: 2 }} />
          <TextField
            fullWidth
            label="Şifre"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            sx={{ mb: 3 }}
          />
          <Button fullWidth size="large" variant="contained" type="submit">
            Giriş Yap
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: "center" }}>
          Hesabınız yok mu?{" "}
          <Link component={RouterLink} to="/register" underline="hover">
            Kayıt Ol
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
