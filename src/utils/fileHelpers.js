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

function slugifyFileName(value) {
  return String(value ?? 'letter')
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 60) || 'letter';
}

/** Export official letter text as a downloadable PDF. */
export async function downloadLetterAsPdf({
  title = 'Official Letter',
  content = '',
  fileName = 'official-letter.pdf',
  ward = '',
  councillorName = '',
  residentName = '',
  letterType = '',
}) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.text('Community Connect Hub', margin, y);
  y += 7;
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text('Madang Urban LLG — Official Correspondence', margin, y);
  y += 10;

  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text(title, margin, y);
  y += 8;

  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  const metaLines = [
    letterType ? `Letter type: ${letterType.replace(/_/g, ' ')}` : null,
    residentName ? `Resident: ${residentName}` : null,
    ward ? `Ward: ${ward}` : null,
    councillorName ? `Prepared by: ${councillorName}` : null,
    `Date: ${new Date().toLocaleDateString('en-PG')}`,
  ].filter(Boolean);

  metaLines.forEach((line) => {
    doc.text(line, margin, y);
    y += 5;
  });
  y += 4;

  const bodyLines = doc.splitTextToSize(String(content || ''), maxWidth);
  bodyLines.forEach((line) => {
    if (y > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += 5;
  });

  doc.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
  return true;
}

export function buildLetterPdfFileName(letter) {
  const type = slugifyFileName(letter?.letterType || letter?.category || 'letter');
  const date = new Date(letter?.sentAt || letter?.createdAt || Date.now())
    .toISOString()
    .slice(0, 10);
  return `${type}-${date}.pdf`;
}
