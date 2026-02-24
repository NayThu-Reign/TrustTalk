import { Box, IconButton, Typography } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

const FilePreview = ({ file, mediaType, onCancel }) => {
  const previewUrl =
    file && mediaType === "image" ? URL.createObjectURL(file) : null;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        p: 1,
        mb: 1,
        border: "1px solid #ccc",
        borderRadius: "8px",
        backgroundColor: "#f9f9f9",
      }}
    >
      {/* Show image thumbnail if it’s an image */}
      {mediaType === "image" && (
        <img
          src={previewUrl}
          alt={file.name}
          style={{ maxWidth: "80px", maxHeight: "80px", borderRadius: "4px" }}
        />
      )}

      {/* File info */}
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="body2" noWrap>
          {file.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {(file.size / 1024).toFixed(1)} KB
        </Typography>
      </Box>

      {/* Cancel button */}
      <IconButton onClick={onCancel} size="small">
        <CloseIcon />
      </IconButton>
    </Box>
  );
};

export default FilePreview;
