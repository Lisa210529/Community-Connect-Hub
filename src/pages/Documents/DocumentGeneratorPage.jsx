import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DOCUMENT_TEMPLATES } from '../../constants';
import { firestoreService, loadHybridCollection } from '../../services/firestoreService';
import {
  buildDocumentPdfFileName,
  DOCUMENT_SIGNATURE_MARKER,
  downloadDocumentAsPdf,
  hasDocumentSignatureMarker,
  insertDocumentSignatureMarker,
  removeDocumentSignatureMarker,
} from '../../utils/fileHelpers';
import { resolveWardId, resolveWdcPositionLabel, WDC_POSITION_LABELS } from '../../utils/wdcHelpers';
import { hasAnyRole } from '../../constants/roleMapping';
import { Navigate } from 'react-router-dom';
import DataSourceIndicator from '../../components/ui/DataSourceIndicator';
import SignaturePad from '../../components/forms/SignaturePad';

export default function DocumentGeneratorPage() {
  const { user } = useAuth();

  if (!hasAnyRole(user?.role, ['wdc-member'])) {
    return <Navigate to="/dashboard/wdc" replace />;
  }

  const wardId = resolveWardId(user);
  const wardLabel = user?.ward ?? 'Madang Urban LLG';
  const signerName = user?.name ?? user?.fullName ?? 'WDC Member';
  const roleTitle = resolveWdcPositionLabel(user);

  const textareaRef = useRef(null);
  const signatureAnchorRef = useRef(0);
  const [signatureCursorSet, setSignatureCursorSet] = useState(false);

  const [template, setTemplate] = useState(DOCUMENT_TEMPLATES[0]);
  const [projects, setProjects] = useState([]);
  const [dataSource, setDataSource] = useState('firestore');
  const [saved, setSaved] = useState(false);
  const [documentContent, setDocumentContent] = useState('');
  const [signatureDataUrl, setSignatureDataUrl] = useState(null);
  const [signedAt, setSignedAt] = useState('');
  const [savedDocumentId, setSavedDocumentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const result = await loadHybridCollection('projects', () => firestoreService.getProjects());
      setProjects(result.data);
      setDataSource(result.dataSource);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const projectStats = useMemo(() => ({
    total: projects.length,
    funded: projects.filter((p) => String(p.status).toLowerCase() === 'funded').length,
    inProgress: projects.filter((p) => String(p.status).toLowerCase().includes('progress')).length,
  }), [projects]);

  const buildTemplateDraft = useCallback((selectedTemplate) => {
    const author = signerName;
    const date = new Date().toLocaleDateString('en-PG');

    const previews = {
      'Meeting Minutes': `MEETING MINUTES\nWard Development Committee (WDC) — ${wardLabel}\nMadang Urban LLG\nDate: ${date}\n\nChairman (Ward Councillor): _______________\nSecretary: _______________\nTreasurer: _______________\n\nAgenda items discussed...\n\nResolutions passed...\n\nPrepared and Submitted By:\nName: ${author}\nPosition: ${roleTitle}\nWard: ${wardLabel}\n\nSignature:`,
      'Project Report': `PROJECT REPORT\nWard Development Committee — ${wardLabel}\nDate: ${date}\n\nTotal Projects: ${projectStats.total}\nFunded: ${projectStats.funded}\nIn Progress: ${projectStats.inProgress}\n\nSummary of ward project delivery and community outcomes.\n\n12. Certification\nPrepared and Submitted By:\nName: _______________\nPosition: ${WDC_POSITION_LABELS.chairman}\nWard: ${wardLabel}\n\nSignature:\n\nDate: _______________\n\nWDC Secretary:\nName: _______________\n\nSignature:`,
      'WDC Resolution': `WDC RESOLUTION\n${wardLabel} — Madang Urban LLG\nDate: ${date}\n\nResolution Title: _______________\nMoved by: ${author}\nSeconded by: _______________\n\nRESOLVED THAT the Ward Development Committee approves...\n\nPrepared and Submitted By:\nName: ${author}\nPosition: ${roleTitle}\nWard: ${wardLabel}\n\nSignature:`,
      'Acquittal Report': `WARD DEVELOPMENT COMMITTEE — ACQUITTAL REPORT\nWard: ${wardLabel}\nMadang Urban LLG\nDate: ${date}\n\nProject Name: _______________\nProject Number: _______________\nPeriod Covered: _______________\n\nPrepared by (Treasurer):\nName: _______________\nPosition: ${WDC_POSITION_LABELS.treasurer}\nWard: ${wardLabel}\n\nSignature:\n\nApproved by (Chairman — Ward Councillor):\nName: _______________\nPosition: ${WDC_POSITION_LABELS.chairman}\nWard: ${wardLabel}\n\nSignature:\n\nNote: Both Treasurer and Chairman signatures are required before submission to LLG & District Administration.`,
    };

    return previews[selectedTemplate] ?? previews['Meeting Minutes'];
  }, [signerName, roleTitle, wardLabel, projectStats]);

  useEffect(() => {
    if (loading) return;
    setDocumentContent(buildTemplateDraft(template));
    setSignatureDataUrl(null);
    setSignedAt('');
    setSaved(false);
    setSavedDocumentId('');
    setSuccessMessage('');
  }, [template, loading, buildTemplateDraft]);

  function selectTemplate(nextTemplate) {
    setTemplate(nextTemplate);
    setError('');
  }

  function trackSignatureCursor() {
    const el = textareaRef.current;
    if (!el) return;
    const index = el.selectionStart ?? 0;
    signatureAnchorRef.current = index;
    setSignatureCursorSet(true);
  }

  function captureSignatureAnchorBeforeSign() {
    const el = textareaRef.current;
    if (!el) return;
    if (typeof el.selectionStart === 'number') {
      signatureAnchorRef.current = el.selectionStart;
      setSignatureCursorSet(true);
    }
  }

  function handleResetDraft() {
    setDocumentContent(buildTemplateDraft(template));
    setSignatureDataUrl(null);
    setSignedAt('');
    setSaved(false);
    setSavedDocumentId('');
    setSuccessMessage('');
    setError('');
    signatureAnchorRef.current = 0;
    setSignatureCursorSet(false);
  }

  function handleSignatureChange(dataUrl) {
    setSignatureDataUrl(dataUrl);
    setSignedAt('');
    setSaved(false);
    setSavedDocumentId('');
    if (successMessage) setSuccessMessage('');

    if (dataUrl) {
      const anchor = signatureAnchorRef.current;
      setDocumentContent((prev) => insertDocumentSignatureMarker(prev, anchor));
    } else {
      setDocumentContent((prev) => removeDocumentSignatureMarker(prev));
    }
  }

  function handleDocumentContentChange(nextContent) {
    setDocumentContent(nextContent);
    if (signatureDataUrl && !hasDocumentSignatureMarker(nextContent)) {
      setSignatureDataUrl(null);
      setSignedAt('');
    }
    invalidateSavedState();
  }

  function invalidateSavedState() {
    setSaved(false);
    setSavedDocumentId('');
    if (successMessage) setSuccessMessage('');
  }

  async function handleGenerate() {
    const content = documentContent.trim();
    if (!content) {
      setError('Please edit the document content before saving.');
      return;
    }
    if (!signatureDataUrl) {
      setError('Please add your electronic signature before saving the document.');
      return;
    }
    if (!hasDocumentSignatureMarker(content)) {
      setError('Click in the document where the signature should appear, then sign below.');
      return;
    }

    setGenerating(true);
    setError('');
    setSuccessMessage('');

    const signedTimestamp = new Date().toISOString();

    try {
      const docId = `doc_${Date.now()}`;
      await firestoreService.createDocument({
        id: docId,
        template,
        title: template,
        content,
        ward: wardLabel,
        wardId,
        createdBy: user?.uid ?? user?.id,
        createdByName: signerName,
        signedBy: user?.uid ?? user?.id,
        signedByName: signerName,
        signedAt: signedTimestamp,
        signatureDataUrl,
        status: 'signed',
        createdAt: signedTimestamp,
      });
      setSavedDocumentId(docId);
      setSignedAt(signedTimestamp);
      setDataSource('firestore');
      setSaved(true);
      setSuccessMessage('Signed document saved to Firestore.');
    } catch (err) {
      setError(err.message || 'Could not save document to Firestore.');
      setSavedDocumentId('');
      setSaved(false);
    } finally {
      setGenerating(false);
    }
  }

  async function handlePdfExport() {
    const content = documentContent.trim();
    if (!content) {
      setError('There is no document content to export.');
      return;
    }
    if (!signatureDataUrl) {
      setError('Please add your electronic signature before downloading the PDF.');
      return;
    }
    if (!hasDocumentSignatureMarker(content)) {
      setError('Click in the document where the signature should appear, then sign below.');
      return;
    }

    setExporting(true);
    setError('');
    try {
      await downloadDocumentAsPdf({
        title: template,
        content: documentContent,
        fileName: buildDocumentPdfFileName(template, user?.name),
        ward: wardLabel,
        authorName: signerName,
        template,
        signatureImageDataUrl: signatureDataUrl,
        signedByName: signerName,
        signedAt: signedAt || new Date().toISOString(),
        roleTitle,
      });
      setSuccessMessage('Signed PDF downloaded successfully.');
    } catch (err) {
      setError(err.message || 'Failed to export PDF.');
    } finally {
      setExporting(false);
    }
  }

  const canSave = documentContent.trim() && signatureDataUrl && hasDocumentSignatureMarker(documentContent);
  const signaturePlaced = hasDocumentSignatureMarker(documentContent);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-1">
        <h1 className="text-2xl font-bold text-cyber-accent">WDC Document Generator</h1>
        <DataSourceIndicator source={dataSource} />
      </div>
      <p className="text-cyber-muted text-sm mb-2">
        Ward Development Committee only — generate and sign official WDC documents (minutes,
        reports, resolutions, and acquittals).
      </p>
      <p className="text-cyber-muted text-xs mb-6">
        The WDC Chairman is the elected Ward Councillor. Committee roles include Deputy Chairman,
        Secretary, Treasurer, and community representatives.
      </p>

      {successMessage && (
        <div className="mb-4 p-3 rounded-lg bg-status-completed/10 border border-status-completed/30 text-status-completed text-sm">
          {successMessage}
          {savedDocumentId && ` (ID: ${savedDocumentId})`}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-status-rejected/10 border border-status-rejected/30 text-status-rejected text-sm">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="cyber-card">
          <h2 className="font-semibold mb-4">Select Template</h2>
          <div className="space-y-2">
            {DOCUMENT_TEMPLATES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => selectTemplate(t)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                  template === t
                    ? 'border-cyber-accent bg-cyber-accent/10 text-cyber-accent'
                    : 'border-slate-border hover:border-cyber-accent/50'
                }`}
              >
                <i className="fas fa-file-alt mr-2" />
                {t}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || loading || !canSave}
            className="cyber-btn-primary w-full mt-4"
          >
            {generating ? 'Saving…' : 'Sign & Save Document'}
          </button>
          <button
            type="button"
            onClick={handlePdfExport}
            disabled={exporting || loading || !canSave || !saved}
            className="cyber-btn-secondary w-full mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fas fa-download mr-2" />
            {exporting ? 'Exporting PDF…' : 'Download Signed PDF'}
          </button>
          {!saved && canSave && (
            <p className="text-xs text-cyber-muted mt-2">
              Save the signed document first, then download the PDF.
            </p>
          )}
        </div>

        <div className="cyber-card">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="font-semibold">Edit Document</h2>
            <button
              type="button"
              onClick={handleResetDraft}
              disabled={loading}
              className="text-sm text-cyber-accent hover:underline disabled:opacity-50"
            >
              Reset to template
            </button>
          </div>
          {loading ? (
            <p className="text-cyber-muted text-sm">Loading ward data…</p>
          ) : (
            <>
              <p className="text-sm text-cyber-muted mb-3">
                Review and edit the text below. Click on the line where the signature should appear
                (for example after <span className="text-cyber-text">Signature:</span>), then draw
                your signature in the pad below.
              </p>
              {signaturePlaced ? (
                <p className="text-xs text-status-completed mb-3">
                  Signature placed in document — shown as {DOCUMENT_SIGNATURE_MARKER} until exported.
                </p>
              ) : signatureCursorSet ? (
                <p className="text-xs text-cyber-accent mb-3">
                  Signature spot selected — draw your signature in the pad below.
                </p>
              ) : null}
              <textarea
                ref={textareaRef}
                className="cyber-input min-h-[280px] font-mono text-sm leading-relaxed resize-y"
                value={documentContent}
                onChange={(e) => handleDocumentContentChange(e.target.value)}
                onClick={trackSignatureCursor}
                onKeyUp={trackSignatureCursor}
                onSelect={trackSignatureCursor}
                onBlur={trackSignatureCursor}
                aria-label={`Edit ${template} document`}
                spellCheck
              />
            </>
          )}
        </div>
      </div>

      <div className="cyber-card mt-6">
        <h2 className="font-semibold mb-2">Electronic Signature</h2>
        <p className="text-sm text-cyber-muted mb-4">
          Place your cursor in the document where the signature belongs, then sign here. To move the
          signature, click a new spot, clear the signature, and sign again.
        </p>
        {!loading && (
          <div onPointerDownCapture={captureSignatureAnchorBeforeSign}>
            <SignaturePad
              key={template}
              signerName={signerName}
              onSignatureChange={handleSignatureChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
