import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Box from "@mui/material/Box";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

interface Props {
  onFilesAdded: (files: File[]) => void;
}

const SkuImageDropzone = ({ onFilesAdded }: Props) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesAdded(acceptedFiles);
  }, [onFilesAdded]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": []
    },
    onDrop,
    multiple: true
  });
  
  return (
    <Box
      {...getRootProps()}
      sx={{
        border: "2px dashed #90caf9",
        p: 3,
        borderRadius: 2,
        textAlign: "center",
        cursor: "pointer",
        bgcolor: isDragActive ? "action.hover" : "background.paper",
        transition: "0.2s"
      }}
    >
      <input {...getInputProps()} />
      
      <CloudUploadIcon fontSize="large" sx={{ color: "primary.main", mb: 1 }} />
      
      {isDragActive ? (
        <strong>Drop files here…</strong>
      ) : (
        <div>
          <strong>Click to upload</strong> or drag and drop<br />
          JPG, PNG, WEBP, GIF supported.
        </div>
      )}
    </Box>
  );
};

export default SkuImageDropzone;
