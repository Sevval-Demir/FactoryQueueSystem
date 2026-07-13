import { Box, Card, CardActionArea, CardContent, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface Props {
  title: string;
  description: string;
  value: number;
  color: string;
  icon: ReactNode;
  onClick?: () => void;
}

export default function DashboardCard({ title, description, value, color, icon, onClick }: Props) {
  const content = (
    <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
        <Box>
          <Typography color="text.secondary" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {description}
          </Typography>
        </Box>
        <Box
          sx={{
            display: "grid",
            placeItems: "center",
            width: 42,
            height: 42,
            borderRadius: 1,
            color,
            bgcolor: `${color}18`,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
      </Box>
      <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1 }}>
        {value}
      </Typography>
    </CardContent>
  );

  return (
    <Card
      sx={{
        height: 172,
        border: "1px solid",
        borderColor: "divider",
        borderTop: `5px solid ${color}`,
        borderRadius: 2,
        boxShadow: "0 10px 28px rgba(15,23,42,.08)",
        transition: "transform .15s ease, box-shadow .15s ease",
        "&:hover": { transform: "translateY(-2px)", boxShadow: "0 16px 36px rgba(15,23,42,.14)" },
      }}
    >
      {onClick ? (
        <CardActionArea onClick={onClick} sx={{ height: "100%" }}>
          {content}
        </CardActionArea>
      ) : (
        content
      )}
    </Card>
  );
}
