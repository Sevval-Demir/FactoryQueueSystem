import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { registerAdmin } from "../../services/authService";

const getErrorMessage = (error: unknown) => {
  if (!axios.isAxiosError(error)) return "Beklenmeyen bir hata oluştu.";
  if (error.response?.status === 500) return "Beklenmeyen bir hata oluştu.";
  if (typeof error.response?.data === "string") {
    const text = error.response.data;
    if (text.toLocaleLowerCase("tr-TR").includes("zaten kayıtlı")) return "Bu telefon numarası zaten kayıtlı.";
    if (text.includes("<html") || text.includes("System.")) return "Beklenmeyen bir hata oluştu.";
    return text;
  }
  return "Beklenmeyen bir hata oluştu.";
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordAgain, setShowPasswordAgain] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const validate = () => {
    if (!fullName.trim() || !phone.trim() || !password || !passwordAgain) return "Tüm alanlar zorunludur.";
    if (password.length < 6) return "Şifre en az 6 karakter olmalıdır.";
    if (password !== passwordAgain) return "Şifreler eşleşmeli.";
    return "";
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");
    try {
      await registerAdmin(fullName.trim(), phone.trim(), password);
      setSuccess(true);
      window.setTimeout(() => navigate("/login"), 900);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2, bgcolor: "#edf3f7" }}>
      <Paper sx={{ p: { xs: 3, sm: 4 }, width: "100%", maxWidth: 460 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Admin Kayıt
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Factory Queue yönetim paneli için admin hesabı oluşturun.
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
            void handleSubmit();
          }}
        >
          <TextField fullWidth label="Ad Soyad" value={fullName} onChange={(event) => setFullName(event.target.value)} sx={{ mb: 2 }} />
          <TextField fullWidth label="Telefon" value={phone} onChange={(event) => setPhone(event.target.value)} sx={{ mb: 2 }} />
          <TextField
            fullWidth
            label="Şifre"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            sx={{ mb: 2 }}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton edge="end" onClick={() => setShowPassword((value) => !value)} aria-label="Şifreyi göster veya gizle">
                      {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            fullWidth
            label="Şifre Tekrar"
            type={showPasswordAgain ? "text" : "password"}
            value={passwordAgain}
            onChange={(event) => setPasswordAgain(event.target.value)}
            sx={{ mb: 3 }}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton edge="end" onClick={() => setShowPasswordAgain((value) => !value)} aria-label="Şifre tekrarını göster veya gizle">
                      {showPasswordAgain ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <Button fullWidth size="large" variant="contained" type="submit" disabled={loading}>
            {loading ? "Oluşturuluyor" : "Kayıt Ol"}
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: "center" }}>
          Zaten hesabınız var mı?{" "}
          <Link component={RouterLink} to="/login" underline="hover">
            Giriş Yap
          </Link>
        </Typography>
      </Paper>
      <Snackbar open={success} autoHideDuration={2000}>
        <Alert severity="success">Admin hesabınız oluşturuldu. Giriş yapabilirsiniz.</Alert>
      </Snackbar>
    </Box>
  );
}
