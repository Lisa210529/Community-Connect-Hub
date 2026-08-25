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

const PDF_MARGIN = 25;
const BODY_FONT_SIZE = 11;
const BODY_LINE_HEIGHT = 6;
const PARAGRAPH_GAP = 5;

/** Visible marker inserted in the document editor at the signature cursor position. */
export const DOCUMENT_SIGNATURE_MARKER = '[ Electronic signature ]';
const DOCUMENT_SIGNATURE_MARKER_LEGACY = '[[SIGNATURE]]';
const SIGNATURE_MARKER_PATTERN = /\n?\[ Electronic signature \]\n?|\n?\[\[SIGNATURE\]\]\n?/g;

export function hasDocumentSignatureMarker(content) {
  return /\[ Electronic signature \]|\[\[SIGNATURE\]\]/.test(String(content ?? ''));
}

export function removeDocumentSignatureMarker(content) {
  return String(content ?? '')
    .replace(SIGNATURE_MARKER_PATTERN, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd();
}

/** Resolve where to insert the signature marker based on cursor position. */
function resolveSignatureInsertIndex(content, cursorIndex) {
  const length = content.length;
  let index = Math.max(0, Math.min(cursorIndex, length));

  const signatureLabel = 'Signature:';
  const labelIndex = content.lastIndexOf(signatureLabel);

  if (index === 0 && labelIndex >= 0) {
    return labelIndex + signatureLabel.length;
  }

  // Cursor at end of document — prefer the Signature: line, not the very last character
  if (index >= length - 1 && labelIndex >= 0) {
    return labelIndex + signatureLabel.length;
  }

  return index;
}

/** Insert signature placeholder at the textarea cursor index (replaces any prior marker). */
export function insertDocumentSignatureMarker(content, cursorIndex) {
  const cleaned = removeDocumentSignatureMarker(content);
  const safeIndex = resolveSignatureInsertIndex(cleaned, cursorIndex);
  const before = cleaned.slice(0, safeIndex);
  const after = cleaned.slice(safeIndex);

  // Keep marker on the same line when cursor is right after "Signature:"
  if (/Signature:\s*$/i.test(before.trimEnd())) {
    const prefix = before.trimEnd().endsWith('Signature:')
      ? `${before.trimEnd()} `
      : before;
    const remainder = after.replace(/^\r?\n/, '');
    if (!remainder) return `${prefix}${DOCUMENT_SIGNATURE_MARKER}`;
    return `${prefix}${DOCUMENT_SIGNATURE_MARKER}\n${remainder}`;
  }

  let result = before;
  if (before.length > 0 && !before.endsWith('\n')) {
    result += '\n';
  }
  result += DOCUMENT_SIGNATURE_MARKER;
  if (after.length > 0) {
    result += after.startsWith('\n') ? after : `\n${after}`;
  }
  return result;
}

function isDocumentSignatureMarker(line) {
  const trimmed = String(line ?? '').trim();
  return trimmed === DOCUMENT_SIGNATURE_MARKER || trimmed === DOCUMENT_SIGNATURE_MARKER_LEGACY;
}

/**
 * Read signatory details typed in the document body (e.g. Name / Position / Ward above Signature:).
 * Uses the last block before the signature marker so certification sections work correctly.
 */
export function extractSignatoryFromDocumentContent(content) {
  const markerIndex = String(content ?? '').indexOf(DOCUMENT_SIGNATURE_MARKER);
  const searchText = markerIndex >= 0
    ? content.slice(0, markerIndex)
    : String(content ?? '');

  const nameMatches = [...searchText.matchAll(/^Name:\s*(.+)$/gim)];
  const positionMatches = [...searchText.matchAll(/^Position:\s*(.+)$/gim)];
  const wardMatches = [...searchText.matchAll(/^Ward:\s*(.+)$/gim)];

  const name = nameMatches.at(-1)?.[1]?.trim() ?? '';
  const position = positionMatches.at(-1)?.[1]?.trim() ?? '';
  const ward = wardMatches.at(-1)?.[1]?.trim() ?? '';

  let roleTitle = '';
  if (position && ward) roleTitle = `${position} – ${ward}`;
  else if (position) roleTitle = position;
  else if (ward) roleTitle = ward;

  return {
    name,
    roleTitle,
    hasDocumentSignatory: Boolean(name || roleTitle),
  };
}

/** Consistent long-form date for official documents. */
export function formatOfficialDate(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleDateString('en-PG', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
  return date.toLocaleDateString('en-PG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Title-case labels such as letter types and categories. */
export function formatDisplayLabel(value) {
  return String(value ?? '')
    .trim()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function drawOfficialLetterhead(doc, { margin, pageWidth, ward, subtitle = 'Official Correspondence' }) {
  const centerX = pageWidth / 2;
  let y = margin;

  doc.setFont('times', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(0, 0, 0);
  doc.text('COMMUNITY CONNECT HUB', centerX, y, { align: 'center' });
  y += 7;

  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(55, 55, 55);
  const organisationLine = ward ? `Madang Urban LLG · ${ward}` : 'Madang Urban LLG';
  doc.text(organisationLine, centerX, y, { align: 'center' });
  y += 5;

  doc.setFontSize(9);
  doc.text(subtitle, centerX, y, { align: 'center' });
  y += 6;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setTextColor(0, 0, 0);
  return y + 10;
}

function renderPdfParagraphs(doc, text, {
  margin,
  maxWidth,
  pageHeight,
  startY,
  reserveBottom = 55,
}) {
  let y = startY;
  const paragraphs = String(text ?? '')
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  doc.setFont('times', 'normal');
  doc.setFontSize(BODY_FONT_SIZE);

  paragraphs.forEach((paragraph, index) => {
    const lines = paragraph.split('\n').flatMap((segment) => {
      const trimmed = segment.trim();
      if (!trimmed) return [];
      return doc.splitTextToSize(trimmed, maxWidth);
    });

    lines.forEach((line) => {
      if (y > pageHeight - reserveBottom) {
        doc.addPage();
        y = PDF_MARGIN;
      }
      doc.text(line, margin, y);
      y += BODY_LINE_HEIGHT;
    });

    if (index < paragraphs.length - 1) {
      y += PARAGRAPH_GAP;
    }
  });

  return y;
}

function renderPdfBodyWithInlineSignatures(doc, text, {
  margin,
  maxWidth,
  pageHeight,
  startY,
  reserveBottom = 55,
  signatureImageDataUrl = '',
  signedByName = '',
  signedAt = '',
  roleTitle = '',
}) {
  let y = startY;
  const lines = String(text ?? '').replace(/\r\n/g, '\n').split('\n');

  doc.setFont('times', 'normal');
  doc.setFontSize(BODY_FONT_SIZE);

  lines.forEach((rawLine) => {
    const trimmed = rawLine.trim();

    if (!trimmed) {
      y += BODY_LINE_HEIGHT / 2;
      return;
    }

    if (isDocumentSignatureMarker(trimmed)) {
      if (signatureImageDataUrl) {
        y = appendPdfSignature(doc, {
          margin,
          pageHeight,
          y,
          signatureImageDataUrl,
          signedByName,
          signedAt,
          roleTitle,
          includeDate: false,
          spacingBefore: 2,
        });
      }
      return;
    }

    // Inline marker embedded inside a line (legacy / manual edits)
    if (trimmed.includes(DOCUMENT_SIGNATURE_MARKER)) {
      const parts = trimmed.split(DOCUMENT_SIGNATURE_MARKER);
      parts.forEach((part, partIndex) => {
        const segment = part.trim();
        if (segment) {
          const wrappedLines = doc.splitTextToSize(segment, maxWidth);
          wrappedLines.forEach((line) => {
            if (y > pageHeight - reserveBottom) {
              doc.addPage();
              y = PDF_MARGIN;
            }
            doc.text(line, margin, y);
            y += BODY_LINE_HEIGHT;
          });
        }
        if (partIndex < parts.length - 1 && signatureImageDataUrl) {
          y = appendPdfSignature(doc, {
            margin,
            pageHeight,
            y,
            signatureImageDataUrl,
            signedByName,
            signedAt,
            roleTitle,
            includeDate: false,
            spacingBefore: 2,
          });
        }
      });
      return;
    }

    const wrappedLines = doc.splitTextToSize(trimmed, maxWidth);
    wrappedLines.forEach((line) => {
      if (y > pageHeight - reserveBottom) {
        doc.addPage();
        y = PDF_MARGIN;
      }
      doc.text(line, margin, y);
      y += BODY_LINE_HEIGHT;
    });
  });

  return y;
}

/** Professional signature block for official PDFs. */
function appendPdfSignature(doc, {
  margin,
  pageHeight,
  y,
  signatureImageDataUrl,
  signedByName = '',
  signedAt = '',
  roleTitle = '',
  includeDate = true,
  spacingBefore = 14,
}) {
  if (!signatureImageDataUrl) return y;

  let cursorY = y + spacingBefore;
  if (cursorY > pageHeight - 50) {
    doc.addPage();
    cursorY = PDF_MARGIN;
  }

  const sigWidth = 70;
  const sigHeight = 18;
  const lineY = cursorY + sigHeight;

  doc.setFillColor(255, 255, 255);
  doc.rect(margin, cursorY, sigWidth, sigHeight, 'F');

  try {
    doc.addImage(signatureImageDataUrl, 'PNG', margin, cursorY, sigWidth, sigHeight);
  } catch {
    doc.setFont('times', 'italic');
    doc.setFontSize(9);
    doc.text('Signature', margin, cursorY + 11);
  }

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);
  doc.line(margin, lineY, margin + sigWidth, lineY);

  cursorY = lineY + 6;
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  if (signedByName) {
    doc.text(signedByName, margin, cursorY);
    cursorY += 5;
  }
  if (roleTitle) {
    doc.setFontSize(10);
    doc.text(roleTitle, margin, cursorY);
    cursorY += 5;
  }
  if (includeDate) {
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(formatOfficialDate(signedAt), margin, cursorY);
    doc.setTextColor(0, 0, 0);
    cursorY += 5;
  }
  return cursorY + 5;
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
  signatureImageDataUrl = '',
  signedByName = '',
  signedAt = '',
  roleTitle = 'Ward Councillor',
}) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const margin = PDF_MARGIN;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - margin * 2;
  const documentDate = signedAt || new Date().toISOString();
  const formattedDate = formatOfficialDate(documentDate);
  const displayLetterType = formatDisplayLabel(title || letterType);
  const signatoryName = signedByName || councillorName;

  let y = drawOfficialLetterhead(doc, { margin, pageWidth, ward });

  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text(formattedDate, pageWidth - margin, y - 2, { align: 'right' });

  const referenceParts = [
    displayLetterType && `Ref: ${displayLetterType}`,
    residentName && `Resident: ${residentName}`,
  ].filter(Boolean);
  if (referenceParts.length) {
    doc.setFontSize(9);
    doc.setTextColor(70, 70, 70);
    doc.text(referenceParts.join('   ·   '), margin, y + 2);
    y += 8;
    doc.setTextColor(0, 0, 0);
  }

  y = renderPdfParagraphs(doc, content, {
    margin,
    maxWidth,
    pageHeight,
    startY: y,
    reserveBottom: 58,
  });

  appendPdfSignature(doc, {
    margin,
    pageHeight,
    y,
    signatureImageDataUrl,
    signedByName: signatoryName,
    signedAt: documentDate,
    roleTitle,
    includeDate: false,
  });

  doc.setFont('times', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  const footer = signatoryName
    ? `Digitally signed and issued via Community Connect Hub · ${signatoryName}`
    : 'Issued via Community Connect Hub';
  doc.text(footer, margin, pageHeight - 12);
  doc.setTextColor(0, 0, 0);

  doc.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
  return true;
}

/** Export generated document text as a downloadable PDF. */
export async function downloadDocumentAsPdf({
  title = 'Document',
  content = '',
  fileName = 'document.pdf',
  ward = '',
  authorName = '',
  template = '',
  signatureImageDataUrl = '',
  signedByName = '',
  signedAt = '',
  roleTitle = '',
}) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const margin = PDF_MARGIN;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - margin * 2;
  const documentDate = signedAt || new Date().toISOString();
  const formattedDate = formatOfficialDate(documentDate);
  const extractedSignatory = extractSignatoryFromDocumentContent(content);
  const displayAuthor = extractedSignatory.name || authorName;

  let y = drawOfficialLetterhead(doc, {
    margin,
    pageWidth,
    ward,
    subtitle: 'Official Document',
  });

  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text(formattedDate, pageWidth - margin, y - 2, { align: 'right' });

  const metaParts = [
    template && `Template: ${formatDisplayLabel(template)}`,
    displayAuthor && `Prepared by: ${displayAuthor}`,
  ].filter(Boolean);
  if (metaParts.length) {
    doc.setFontSize(9);
    doc.setTextColor(70, 70, 70);
    doc.text(metaParts.join('   ·   '), margin, y + 2);
    y += 8;
    doc.setTextColor(0, 0, 0);
  }

  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text(formatDisplayLabel(title), margin, y);
  y += 10;

  const inlineSignature = hasDocumentSignatureMarker(content);

  // When the document already lists Name / Position / Ward above Signature:, only render
  // the signature image — do not repeat (or overwrite with the logged-in account name).
  const inlineSignatureName = extractedSignatory.hasDocumentSignatory
    ? ''
    : (extractedSignatory.name || signedByName);
  const inlineSignatureRole = extractedSignatory.hasDocumentSignatory
    ? ''
    : (extractedSignatory.roleTitle || roleTitle);

  y = renderPdfBodyWithInlineSignatures(doc, content, {
    margin,
    maxWidth,
    pageHeight,
    startY: y,
    reserveBottom: 58,
    signatureImageDataUrl: inlineSignature ? signatureImageDataUrl : '',
    signedByName: inlineSignatureName,
    signedAt: documentDate,
    roleTitle: inlineSignatureRole,
  });

  if (!inlineSignature) {
    appendPdfSignature(doc, {
      margin,
      pageHeight,
      y,
      signatureImageDataUrl,
      signedByName: extractedSignatory.name || signedByName,
      signedAt: documentDate,
      roleTitle: extractedSignatory.roleTitle || roleTitle,
      includeDate: false,
    });
  }

  doc.setFont('times', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  const footer = extractedSignatory.hasDocumentSignatory
    ? 'Digitally signed and issued via Community Connect Hub'
    : signedByName
      ? `Digitally signed and issued via Community Connect Hub · ${signedByName}`
      : 'Issued via Community Connect Hub';
  doc.text(footer, margin, pageHeight - 12);
  doc.setTextColor(0, 0, 0);

  doc.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
  return true;
}

export function buildDocumentPdfFileName(template, authorName) {
  const slug = slugifyFileName(template || authorName || 'document');
  const date = new Date().toISOString().slice(0, 10);
  return `${slug}-${date}.pdf`;
}

export function buildLetterPdfFileName(letter) {
  const type = slugifyFileName(letter?.letterType || letter?.category || 'letter');
  const date = new Date(letter?.sentAt || letter?.createdAt || Date.now())
    .toISOString()
    .slice(0, 10);
  return `${type}-${date}.pdf`;
}
