import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DOCUMENT_TEMPLATES } from '../../constants';
import { firestoreService, loadHybridCollection } from '../../services/firestoreService';
import { buildDocumentPdfFileName, downloadDocumentAsPdf } from '../../utils/fileHelpers';
import { resolveWardId } from '../../utils/wdcHelpers';
import DataSourceIndicator from '../../components/ui/DataSourceIndicator';

export default function DocumentGeneratorPage() {
  const { user } = useAuth();
  const wardId = resolveWardId(user);
  const wardLabel = user?.ward ?? 'Madang Urban LLG';

  const [template, setTemplate] = useState(DOCUMENT_TEMPLATES[0]);
  const [projects, setProjects] = useState([]);
  const [dataSource, setDataSource] = useState('firestore');
  const [generated, setGenerated] = useState(false);
  const [documentContent, setDocumentContent] = useState('');
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

  function buildPreview(selectedTemplate) {
    const author = user?.name ?? user?.fullName ?? 'Official';
    const date = new Date().toLocaleDateString('en-PG');

    const previews = {
      'Meeting Minutes': `MEETING MINUTES\nWard Development Committee — ${wardLabel}\nDate: ${date}\nChairperson: ${author}\n\nAgenda items discussed...\n\nResolutions passed...\n\nSigned: _______________`,
      'Project Reports': `PROJECT REPORT\nPrepared by: ${author}\nWard: ${wardLabel}\nDate: ${date}\n\nTotal Projects: ${projectStats.total}\nFunded: ${projectStats.funded}\nIn Progress: ${projectStats.inProgress}\n\nSummary of ward project delivery and community outcomes.`,
      Resolutions: `WDC RESOLUTION\n${wardLabel} — Madang Urban LLG\nDate: ${date}\n\nResolution Title: _______________\nMoved by: ${author}\nSeconded by: _______________\n\nRESOLVED THAT the Ward Development Committee approves...`,
      'Official Letters': `OFFICIAL LETTER\nMadang Urban LLG\n${wardLabel}\n\nDate: ${date}\n\nTo: _______________\n\nDear Sir/Madam,\n\nRe: _______________\n\nYours faithfully,\n${author}\nWard Councillor`,
    };

    return previews[selectedTemplate] ?? previews['Meeting Minutes'];
  }

  async function handleGenerate() {
    setGenerating(true);
    setError('');
    setSuccessMessage('');
    const content = buildPreview(template);

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
        createdByName: user?.name ?? user?.fullName ?? 'Official',
        status: 'generated',
        createdAt: new Date().toISOString(),
      });
      setSavedDocumentId(docId);
      setDataSource('firestore');
      setSuccessMessage('Document generated and saved to Firestore.');
    } catch (err) {
      setError(err.message || 'Could not save document to Firestore.');
      setSavedDocumentId('');
    }

    setDocumentContent(content);
    setGenerated(true);
    setGenerating(false);
  }

  async function handlePdfExport() {
    if (!documentContent) return;
    setExporting(true);
    setError('');
    try {
      await downloadDocumentAsPdf({
        title: template,
        content: documentContent,
        fileName: buildDocumentPdfFileName(template, user?.name),
        ward: wardLabel,
        authorName: user?.name ?? user?.fullName,
        template,
      });
      setSuccessMessage('PDF downloaded successfully.');
    } catch (err) {
      setError(err.message || 'Failed to export PDF.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-1">
        <h1 className="text-2xl font-bold text-cyber-accent">Document Generator</h1>
        <DataSourceIndicator source={dataSource} />
      </div>
      <p className="text-cyber-muted text-sm mb-6">
        Generate official documents with auto-filled ward data, save to Firestore, and export as PDF
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
                onClick={() => { setTemplate(t); setGenerated(false); setSuccessMessage(''); }}
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
            disabled={generating || loading}
            className="cyber-btn-primary w-full mt-4"
          >
            {generating ? 'Generating…' : 'Generate & Save Document'}
          </button>
          {generated && (
            <button
              type="button"
              onClick={handlePdfExport}
              disabled={exporting}
              className="cyber-btn-secondary w-full mt-2"
            >
              <i className="fas fa-download mr-2" />
              {exporting ? 'Exporting PDF…' : 'Download as PDF'}
            </button>
          )}
        </div>

        <div className="cyber-card">
          <h2 className="font-semibold mb-4">Preview</h2>
          {generated ? (
            <pre className="text-sm text-cyber-muted whitespace-pre-wrap font-mono bg-slate-bg p-4 rounded-lg border border-slate-border min-h-[300px]">
              {documentContent}
            </pre>
          ) : (
            <p className="text-cyber-muted text-sm">
              {loading ? 'Loading ward data…' : 'Select a template and click Generate & Save Document.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
