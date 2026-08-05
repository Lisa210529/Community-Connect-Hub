import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { DOCUMENT_TEMPLATES } from '../../constants';

export default function DocumentGeneratorPage() {
  const { user } = useAuth();
  const { getData } = useData();
  const data = getData();
  const [template, setTemplate] = useState(DOCUMENT_TEMPLATES[0]);
  const [generated, setGenerated] = useState(false);

  const preview = {
    'Meeting Minutes': `MEETING MINUTES\nWard Development Committee — Ward 5 Nabasa\nDate: ${new Date().toLocaleDateString()}\nChairperson: ${user?.name}\n\nAgenda items discussed...\n\nResolutions passed...\n\nSigned: _______________`,
    'Project Reports': `PROJECT REPORT\nPrepared by: ${user?.name}\nWard: Ward 5 Nabasa\n\nTotal Projects: ${data?.projects?.length ?? 0}\nFunded: ${data?.projects?.filter((p) => p.status === 'Funded').length ?? 0}\nIn Progress: ${data?.projects?.filter((p) => p.status === 'In Progress').length ?? 0}`,
    Resolutions: `WDC RESOLUTION\nWard 5 Nabasa — Madang Urban LLG\n\nResolution Title: _______________\nMoved by: ${user?.name}\nSeconded by: _______________\n\nRESOLVED THAT...`,
    'Official Letters': `OFFICIAL LETTER\nMadang Urban LLG\nWard 5 — Nabasa\n\nDate: ${new Date().toLocaleDateString()}\n\nTo: _______________\n\nDear Sir/Madam,\n\nRe: _______________\n\nYours faithfully,\n${user?.name}\nWard Councillor`,
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-cyber-accent mb-2">Document Generator</h1>
      <p className="text-cyber-muted text-sm mb-6">Generate official documents with auto-filled ward data</p>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="cyber-card">
          <h2 className="font-semibold mb-4">Select Template</h2>
          <div className="space-y-2">
            {DOCUMENT_TEMPLATES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setTemplate(t); setGenerated(false); }}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                  template === t ? 'border-cyber-accent bg-cyber-accent/10 text-cyber-accent' : 'border-slate-border hover:border-cyber-accent/50'
                }`}
              >
                <i className="fas fa-file-alt mr-2" />{t}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setGenerated(true)} className="cyber-btn-primary w-full mt-4">
            Generate Document
          </button>
          {generated && (
            <button type="button" onClick={() => alert('PDF download (UI demo)')} className="cyber-btn-secondary w-full mt-2">
              <i className="fas fa-download mr-2" /> Download as PDF
            </button>
          )}
        </div>

        <div className="cyber-card">
          <h2 className="font-semibold mb-4">Preview</h2>
          {generated ? (
            <pre className="text-sm text-cyber-muted whitespace-pre-wrap font-mono bg-slate-bg p-4 rounded-lg border border-slate-border min-h-[300px]">
              {preview[template]}
            </pre>
          ) : (
            <p className="text-cyber-muted text-sm">Select a template and click Generate Document.</p>
          )}
        </div>
      </div>
    </div>
  );
}
