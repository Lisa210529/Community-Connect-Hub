import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Rating from '../common/Rating';
import { RATING_CATEGORIES, computeOverallScore } from '../../constants/ratings';
import { readFileAsDataUrl } from '../../utils/fileHelpers';

const MAX_PHOTO_BYTES = 750 * 1024;
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const EMPTY_SCORES = Object.fromEntries(RATING_CATEGORIES.map((c) => [c.key, 0]));

export default function ProjectRatingModal({ open, project, onClose, onSubmit, saving }) {
  const [scores, setScores] = useState(EMPTY_SCORES);
  const [comment, setComment] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoName, setPhotoName] = useState('');
  const [photoData, setPhotoData] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setScores(EMPTY_SCORES);
    setComment('');
    setPhotoPreview('');
    setPhotoName('');
    setPhotoData('');
    setError('');
  }, [open, project?.id]);

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!VALID_IMAGE_TYPES.includes(file.type)) {
      setError('Please upload a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError('Photo must be 750 KB or smaller (Firestore free plan limit).');
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setPhotoData(dataUrl);
      setPhotoPreview(dataUrl);
      setPhotoName(file.name);
      setError('');
    } catch {
      setError('Could not read the selected photo.');
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    const missing = RATING_CATEGORIES.find((c) => !scores[c.key] || scores[c.key] < 1);
    if (missing) {
      setError(`Please rate all categories (1–5 stars). Missing: ${missing.label}`);
      return;
    }
    if (!photoData) {
      setError('Please upload a photo as evidence of the project in your ward.');
      return;
    }

    onSubmit({
      scores,
      overallScore: computeOverallScore(scores),
      comment: comment.trim(),
      evidencePhotoName: photoName,
      evidencePhotoData: photoData,
    });
  }

  if (!project) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Rate Project — ${project.name}`} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-cyber-muted">
          Rate this project once from the mid-date until completion and upload a photo so funding
          stakeholders and provincial government can see implementation progress. WDC handles
          acquittal and formal reports.
        </p>

        {RATING_CATEGORIES.map((category) => (
          <div key={category.key} className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-cyber-text">{category.label}</span>
            <Rating
              value={scores[category.key]}
              onChange={(value) => setScores((prev) => ({ ...prev, [category.key]: value }))}
              size="lg"
            />
          </div>
        ))}

        <div>
          <label className="text-xs text-cyber-muted">Comments (optional)</label>
          <textarea
            className="cyber-input min-h-[80px] mt-1"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share how the project is helping your community…"
          />
        </div>

        <div>
          <label className="text-xs text-cyber-muted">Photo evidence (required)</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="cyber-input mt-1"
            onChange={handlePhotoChange}
          />
          <p className="text-xs text-cyber-muted mt-1">JPG, PNG, or WebP — max 750 KB</p>
          {photoPreview && (
            <img
              src={photoPreview}
              alt="Project evidence preview"
              className="mt-3 max-h-48 rounded-lg border border-slate-border object-cover"
            />
          )}
        </div>

        {error && (
          <p className="text-sm text-status-rejected">{error}</p>
        )}

        <button type="submit" disabled={saving} className="cyber-btn-primary w-full">
          {saving ? 'Submitting…' : 'Submit Rating & Evidence'}
        </button>
      </form>
    </Modal>
  );
}
