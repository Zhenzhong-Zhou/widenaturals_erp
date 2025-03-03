/**
 * Handles file download for exported reports.
 *
 * @param {Blob} blob - The file data as a Blob object.
 * @param {string} fileName - The name of the file to be downloaded.
 */
export const handleDownload = (blob: Blob, fileName: string) => {
  if (!(blob instanceof Blob)) {
    console.error('Error: Invalid Blob data received', blob);
    return;
  }
  
  const fileType = blob.type;
  
  // Ensure valid file types (CSV, PDF, TXT)
  if (!fileType.includes('pdf') && !fileType.includes('csv') && !fileType.includes('plain')) {
    console.error('Error: Received invalid file type', fileType);
    return;
  }
  
  // Create URL for Blob
  const url = window.URL.createObjectURL(blob);
  
  // Create an anchor element for download
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  // Clean up memory
  window.URL.revokeObjectURL(url);
};
