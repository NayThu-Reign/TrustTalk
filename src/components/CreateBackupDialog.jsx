import React, { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Typography, Box
} from "@mui/material";
import { createBackupBase64 } from "../crypto/backup";


export default function CreateBackupDialog({ open, onClose, keyPair }) {
  const [passphrase, setPassphrase] = useState("");
  const [confirmPassphrase, setConfirmPassphrase] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const api = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  const handleUpload = async () => {
    if (!passphrase || !confirmPassphrase) {
      setError("Enter and confirm passphrase");
      return;
    }
    if (passphrase !== confirmPassphrase) {
      setError("Passphrases do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const base64 = await createBackupBase64(keyPair, passphrase);
      const byteArray = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
const blob = new Blob([byteArray], { type: "application/octet-stream" });

      const formData = new FormData();
      formData.append("file", blob, "keybackup.txt");

      const res = await fetch(`${api}/api/backup`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData, // ❌ DO NOT set Content-Type
      });

      if (!res.ok) throw new Error("Upload failed");

      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Save Encrypted Key Backup</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} width={400}>
          <TextField
            label="Passphrase"
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
          />
          <TextField
            label="Confirm Passphrase"
            type="password"
            value={confirmPassphrase}
            onChange={(e) => setConfirmPassphrase(e.target.value)}
          />
          {error && <Typography color="error">{error}</Typography>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button disabled={loading} onClick={handleUpload}>
          {loading ? "Uploading..." : "Save Backup"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
