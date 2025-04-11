export const resolveAndDownloadBlob = (response: any, fileName: string) => {
  const decodedFileName = decodeURI(fileName);
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', decodedFileName);
  document.body.appendChild(link);
  link.click();
  window.URL.revokeObjectURL(url);
  link.remove();
};
