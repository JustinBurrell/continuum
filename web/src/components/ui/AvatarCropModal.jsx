import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Button from './Button';

// Accepts either `file` (File object) or `src` (URL string).
export default function AvatarCropModal({ file, src, onSave, onClose }) {
  const CROP_SIZE = 280;
  const [imgSrc, setImgSrc] = useState(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [cropError, setCropError] = useState(false);
  const dragStart = useRef(null);
  const imgEl = useRef(null);
  const containerRef = useRef(null);
  const minScale = useRef(1);

  const initImage = (loadedSrc, img) => {
    const cover = Math.max(CROP_SIZE / img.naturalWidth, CROP_SIZE / img.naturalHeight);
    minScale.current = cover;
    setScale(cover);
    setOffset({ x: 0, y: 0 });
    setImgSrc(loadedSrc);
  };

  useEffect(() => {
    setCropError(false);
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        const dataSrc = e.target.result;
        const img = new Image();
        img.onload = () => { imgEl.current = img; initImage(dataSrc, img); };
        img.src = dataSrc;
      };
      reader.readAsDataURL(file);
    } else if (src) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { imgEl.current = img; initImage(src, img); };
      img.onerror = () => {
        // Retry without crossOrigin — image will be tainted but at least previews correctly.
        // toBlob will surface the error at crop time.
        const fallback = new Image();
        fallback.onload = () => { imgEl.current = fallback; initImage(src, fallback); };
        fallback.src = src;
      };
      img.src = src;
    }
  }, [file, src]);

  // Non-passive wheel listener to allow preventDefault
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      setScale(s => Math.max(minScale.current, Math.min(5, s - e.deltaY * 0.003)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [imgSrc]);

  const handleMouseDown = (e) => {
    setDragging(true);
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };
  const handleMouseMove = (e) => {
    if (!dragging) return;
    setOffset({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };
  const handleMouseUp = () => setDragging(false);

  const handleCrop = () => {
    const canvas = document.createElement('canvas');
    canvas.width = CROP_SIZE;
    canvas.height = CROP_SIZE;
    const ctx = canvas.getContext('2d');
    const img = imgEl.current;
    const imgW = img.naturalWidth * scale;
    const imgH = img.naturalHeight * scale;
    const drawX = (CROP_SIZE - imgW) / 2 + offset.x;
    const drawY = (CROP_SIZE - imgH) / 2 + offset.y;
    try {
      ctx.drawImage(img, drawX, drawY, imgW, imgH);
      canvas.toBlob(blob => {
        if (blob) onSave(new File([blob], 'avatar.png', { type: 'image/png' }));
      }, 'image/png');
    } catch {
      setCropError(true);
    }
  };

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: 24, width: 340,
        boxShadow: '0 20px 60px rgba(107,33,168,0.25)',
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 3px' }}>Adjust photo</h3>
        <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 16px' }}>Drag to reposition · Scroll to zoom</p>
        <div
          ref={containerRef}
          style={{
            width: CROP_SIZE, height: CROP_SIZE, borderRadius: '50%',
            overflow: 'hidden', position: 'relative',
            cursor: dragging ? 'grabbing' : 'grab',
            background: 'rgba(107,33,168,0.08)', margin: '0 auto 16px',
            border: '3px solid #6b21a8', flexShrink: 0,
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {imgSrc && (
            <img
              src={imgSrc}
              alt=""
              draggable={false}
              style={{
                position: 'absolute',
                top: '50%', left: '50%',
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${scale})`,
                transformOrigin: 'center',
                maxWidth: 'none',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>
        {cropError && (
          <p style={{ fontSize: 12, color: '#dc2626', textAlign: 'center', margin: '-8px 0 12px' }}>
            Unable to crop this image. Upload a new photo to adjust.
          </p>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" style={{ flex: 1 }} onClick={onClose}>Cancel</Button>
          <Button style={{ flex: 1 }} onClick={handleCrop} disabled={cropError}>Save photo</Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
