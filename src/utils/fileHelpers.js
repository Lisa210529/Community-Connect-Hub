/** Trigger browser download from a Base64 data URL (e.g. from FileReader.readAsDataURL). */
export function downloadBase64File(fileData, fileName = 'proposal.pdf') {
  if (!fileData) return false;

  const link = document.createElement('a');
  link.href = fileData;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}

/** Read a File as a Base64 data URL. */
export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}
