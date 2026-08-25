import { useEffect, useRef, useState } from 'react';

const STROKE_COLOR = '#0f172a';
const STROKE_WIDTH = 2;
const CANVAS_BG = '#ffffff';
export default function SignaturePad({ onSignatureChange, signerName = '' }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const hasInkRef = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(rect.width * ratio);
    canvas.height = Math.floor(rect.height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = STROKE_COLOR;
    ctx.lineWidth = STROKE_WIDTH;
    clearCanvas(ctx, rect.width, rect.height);

    return undefined;
  }, []);

  function clearCanvas(ctx, width, height) {
    ctx.fillStyle = CANVAS_BG;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = STROKE_COLOR;
    ctx.lineWidth = STROKE_WIDTH;
  }
  function notifyChange(canvas, signed) {
    hasInkRef.current = signed;
    setHasSignature(signed);
    onSignatureChange?.(signed ? canvas.toDataURL('image/png') : null);
  }

  function getCanvasPoint(event) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }

  function startDrawing(event) {
    event.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    drawingRef.current = true;
    const point = getCanvasPoint(event);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  }

  function draw(event) {
    if (!drawingRef.current) return;
    event.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const point = getCanvasPoint(event);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    if (!hasInkRef.current) {
      notifyChange(canvas, true);
    }
  }

  function stopDrawing(event) {
    if (!drawingRef.current) return;
    event?.preventDefault?.();
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (hasInkRef.current) {
      notifyChange(canvas, true);
    }
  }

  function handleClear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    clearCanvas(ctx, rect.width, rect.height);
    notifyChange(canvas, false);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-cyber-muted">
          Sign as <span className="text-cyber-text font-medium">{signerName || 'Official'}</span>
        </p>
        <button
          type="button"
          onClick={handleClear}
          className="text-sm text-cyber-accent hover:underline"
        >
          Clear signature
        </button>
      </div>
      <div className="rounded-lg border border-slate-border bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-36 touch-none cursor-crosshair bg-white"          aria-label="Draw your electronic signature"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      <p className="text-xs text-cyber-muted">
        {hasSignature
          ? 'Signature captured. It will appear in the document where you placed the cursor.'
          : 'Draw your signature with mouse or finger after clicking the placement spot in the document.'}
      </p>
    </div>
  );
}
