import { useEffect, useRef, useState } from 'react';
import Modal from '../ui/Modal';
import { readFileAsDataUrl } from '../../utils/fileHelpers';

const VALID_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const VALID_EXTENSIONS = ['.pdf', '.doc', '.docx'];
/** ~750 KB raw file — Base64 fits within Firestore's 1 MiB document limit */
const MAX_FILE_SIZE = 750 * 1024;

function isValidProposalFile(file) {
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  if (VALID_EXTENSIONS.includes(ext)) return true;
  return VALID_TYPES.has(file.type);
}

function guessMimeType(file) {
  if (file.type) return file.type;
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  const map = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  return map[ext] || 'application/octet-stream';
}

const EMPTY_FORM = {
  startDate: '',
  endDate: '',
  estimatedCost: '',
};

export default function ProposalFormModal({ open, need, ward, wardId, onSubmit, onClose }) {
  const inputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fileError, setFileError] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedFile(null);
    setForm(EMPTY_FORM);
    setFileError('');
  }, [open, need?.id]);

  function handleClose() {
    if (uploading) return;
    setSelectedFile(null);
    setForm(EMPTY_FORM);
    setFileError('');
    onClose();
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isValidProposalFile(file)) {
      setFileError('Please upload a PDF or Word document (.pdf, .doc, .docx).');
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError('File must be 750 KB or smaller to store in Firestore (free plan).');
      setSelectedFile(null);
      return;
    }

    setFileError('');
    setSelectedFile(file);
  }

  async function handleSubmit() {
    if (!selectedFile || !need) {
      setFileError('Please select a proposal document to attach.');
      return;
    }

    if (!form.startDate || !form.endDate) {
      setFileError('Please enter the project start and end dates.');
      return;
    }

    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setFileError('Please enter valid start and end dates.');
      return;
    }
    if (end <= start) {
      setFileError('End date must be after the start date.');
      return;
    }

    const estimatedCost = form.estimatedCost.trim()
      ? Number(form.estimatedCost)
      : null;
    if (form.estimatedCost.trim() && (!estimatedCost || estimatedCost <= 0)) {
      setFileError('Enter a valid estimated cost, or leave it blank.');
      return;
    }

    setUploading(true);
    setFileError('');

    try {
      const proposalFileData = await readFileAsDataUrl(selectedFile);

      await onSubmit({
        communityNeedId: need.id,
        category: need.category,
        zone: need.zone,
        ward: ward || need.ward,
        wardId: wardId || need.wardId,
        residentCount: need.residentCount,
        residentIds: need.residentIds ?? [],
        requestIds: need.requestIds ?? [],
        projectTitle: `${need.category} Project - ${need.zone}, ${ward || need.ward}`,
        startDate: form.startDate,
        endDate: form.endDate,
        estimatedCost,
        amountRequested: estimatedCost,
        proposalFileData,
        proposalFileName: selectedFile.name,
        proposalFileType: guessMimeType(selectedFile),
        fileSize: selectedFile.size,
        status: 'submitted_to_mayor',
        submittedAt: new Date().toISOString(),
      });

      setSelectedFile(null);
      setForm(EMPTY_FORM);
      onClose();
    } catch (err) {
      console.error('Proposal conversion error:', err);
      setFileError(err.message || 'Failed to submit proposal. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  const title = need ? `${need.category} — ${need.zone || 'All Ward'}` : 'Attach Project Proposal';

  return (
    <Modal open={open} onClose={handleClose} title="Attach Project Proposal" wide>
      {need && (
        <div className="mb-4">
          <p className="font-medium text-cyber-text">{title}</p>
          <p className="text-sm text-cyber-muted mt-1">
            {need.residentCount ?? need.residentIds?.length ?? 0} residents · {ward || need.ward}
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-cyber-muted mb-1">Project start date</label>
            <input
              type="date"
              className="cyber-input w-full"
              value={form.startDate}
              onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
              disabled={uploading}
              required
            />
          </div>
          <div>
            <label className="block text-xs text-cyber-muted mb-1">Project end date</label>
            <input
              type="date"
              className="cyber-input w-full"
              value={form.endDate}
              min={form.startDate || undefined}
              onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
              disabled={uploading}
              required
            />
          </div>
          <div>
            <label className="block text-xs text-cyber-muted mb-1">Estimated cost (K)</label>
            <input
              type="number"
              min="1"
              className="cyber-input w-full"
              value={form.estimatedCost}
              onChange={(e) => setForm((prev) => ({ ...prev, estimatedCost: e.target.value }))}
              placeholder="30000"
              disabled={uploading}
            />
          </div>
        </div>
        <p className="text-xs text-cyber-muted">
          Residents can rate this project from the mid-date between start and end until completion,
          with photo evidence for funding stakeholders.
        </p>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full p-8 rounded-lg border-2 border-dashed border-slate-border bg-slate-bg hover:border-cyber-accent/50 transition-colors text-center"
        >
          <i className="fas fa-file-upload text-3xl text-cyber-accent mb-3" aria-hidden="true" />
          <p className="text-sm font-medium text-cyber-text">Click to browse</p>
          <p className="text-xs text-cyber-muted mt-1">PDF, DOC, DOCX — max 750 KB (Firestore free plan)</p>
        </button>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileSelect}
          className="hidden"
        />

        {selectedFile && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-slate-bg border border-slate-border">
            <div className="flex items-center gap-2 min-w-0">
              <i className="fas fa-paperclip text-cyber-accent shrink-0" />
              <span className="text-sm font-medium truncate">{selectedFile.name}</span>
              <span className="text-xs text-cyber-muted shrink-0">
                ({(selectedFile.size / 1024).toFixed(1)} KB)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              disabled={uploading}
              className="text-xs text-status-rejected hover:underline"
            >
              Remove
            </button>
          </div>
        )}

        {fileError && <p className="text-sm text-status-rejected">{fileError}</p>}

        {uploading && (
          <p className="text-sm text-cyber-muted animate-pulse">Converting proposal document…</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={uploading}
            className="cyber-btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedFile || uploading}
            className="cyber-btn-primary flex-1"
          >
            {uploading ? 'Converting…' : 'Submit to Mayor'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
