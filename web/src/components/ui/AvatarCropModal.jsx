import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Button from './Button';

export default function AvatarCropModal({ file, onSave, onClose }) {
  const CROP_SIZE = 280;
  const [imgSrc, setImgSrc] = useState(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(null);
  const imgEl = useRef(new Image());
  const containerRef = useRef(null);
  const minScale = useRef(1);

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = e => {
      const src = e.target.result;
      const img = imgEl.current;
      img.onload = () => {
        const cover = Math.max(CROP_SIZE / img.naturalWidth, CROP_SIZE / img.naturalHeight);
        minScale.current = cover;
        setScale(cover);
        setOffset({ x: 0, y: 0 });
      };
      img.src = src;
      setImgSrc(src);
    };
    reader.readAsDataURL(file);
  }, [file]);

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
    ctx.drawImage(img, drawX, drawY, imgW, imgH);
    canvas.toBlob(blob => {
      if (blob) onSave(new File([blob], 'avatar.png', { type: 'image/png' }));
    }, 'image/png');
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
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" style={{ flex: 1 }} onClick={onClose}>Cancel</Button>
          <Button style={{ flex: 1 }} onClick={handleCrop}>Save photo</Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
