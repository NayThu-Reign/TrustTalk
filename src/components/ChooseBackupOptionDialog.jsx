import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardActionArea,
  CardContent,
} from "@mui/material";
import { Key, RefreshCcw } from "lucide-react";

export default function ChooseBackupOptionDialog({ open, onClose, onChoose }) {
  return (
    <Dialog
      open={open}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: { borderRadius: 3, p: 2, backgroundColor: "#fafafa" },
      }}
      onClose={(event, reason) => {
        if (reason === "backdropClick" || reason === "escapeKeyDown") {
          return; 
        }
        onClose();
      }}
    >
      <DialogTitle sx={{ textAlign: "center", fontWeight: "600", mb: 1 }}>
        Secure Your Encryption Keys 🔐
      </DialogTitle>

      <DialogContent>
        <Typography
          align="center"
          sx={{ mb: 3, color: "text.secondary", fontSize: "0.95rem" }}
        >
          You don’t have a local encryption key yet. Choose one of the options below:
        </Typography>

        <Box
          display="flex"
          flexDirection={{ xs: "column", sm: "row" }}
          justifyContent="center"
          gap={3}
        >
          {/* Create new key */}
          <Card
            sx={{
              flex: 1,
              borderRadius: 3,
              boxShadow: 2,
              transition: "0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: 4,
              },
            }}
          >
            <CardActionArea onClick={() => onChoose("create")}>
              <CardContent sx={{ textAlign: "center", py: 3 }}>
                <Key size={40} strokeWidth={1.6} style={{ color: "#1976d2" }} />
                <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }}>
                  Create New Key
                </Typography>
                <Typography sx={{ mt: 1, color: "text.secondary" }}>
                  Generate a new encryption key and start fresh.
                  Recommended for first-time users.
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>

          {/* Restore backup */}
          <Card
            sx={{
              flex: 1,
              borderRadius: 3,
              boxShadow: 2,
              transition: "0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: 4,
              },
            }}
          >
            <CardActionArea onClick={() => onChoose("restore")}>
              <CardContent sx={{ textAlign: "center", py: 3 }}>
                <RefreshCcw size={40} strokeWidth={1.6} style={{ color: "#2e7d32" }} />
                <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }}>
                  Restore from Backup
                </Typography>
                <Typography sx={{ mt: 1, color: "text.secondary" }}>
                  Import your previous encryption key from a backup file.
                  Choose this if you’ve used the app before.
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Box>
      </DialogContent>

      {/* <DialogActions sx={{ justifyContent: "center", mt: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
      </DialogActions> */}
    </Dialog>
  );
}
