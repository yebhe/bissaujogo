export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

export const downloadPdfResponse = (axiosResponse, filename) => {
  const blob = new Blob([axiosResponse.data], { type: 'application/pdf' });
  downloadBlob(blob, filename);
};
