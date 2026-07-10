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
        height: 158,
        borderLeft: `6px solid ${color}`,
        boxShadow: "0 8px 24px rgba(26,68,105,.10)",
        transition: "transform .15s ease, box-shadow .15s ease",
        "&:hover": { transform: "translateY(-2px)", boxShadow: "0 12px 30px rgba(26,68,105,.16)" },
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
