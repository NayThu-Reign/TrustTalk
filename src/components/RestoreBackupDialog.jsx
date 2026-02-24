import React, { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Typography, Box
} from "@mui/material";
import { restoreKeyPairFromBase64 } from "../crypto/backup";

export default function RestoreBackupDialog({ open, onClose, onRestoreSuccess }) {
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const api = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  const handleRestore = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${api}/api/backup`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("No backup found");

      const buffer = await res.arrayBuffer();
      const bytes = new Uint8Array(buffer);
const base64 = btoa(String.fromCharCode(...bytes));


      const restored = await restoreKeyPairFromBase64(base64, passphrase);

      onRestoreSuccess(restored);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`${api}/api/backup`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete");

      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Restore Backup</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} width={400}>
          <TextField
            label="Passphrase"
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
          />
          {error && <Typography color="error">{error}</Typography>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDelete}>Delete Backup</Button>
        <Button onClick={onClose}>Cancel</Button>
        <Button disabled={loading} onClick={handleRestore}>
          {loading ? "Restoring..." : "Restore"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
