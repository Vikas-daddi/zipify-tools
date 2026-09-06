import React, { useState, useEffect } from 'react';
import { Download, Maximize, Loader2, Image as ImageIcon } from 'lucide-react';
import DropzoneArea from './DropzoneArea';
import { formatFileSize } from '../utils/formatSize';

const ImageResizer = () => {
  const [originalFile, setOriginalFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [resizedBlob, setResizedBlob] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  
  const [origDimensions, setOrigDimensions] = useState({ width: 0, height: 0 });
  const [targetWidth, setTargetWidth] = useState(0);
  const [targetHeight, setTargetHeight] = useState(0);
  const [maintainRatio, setMaintainRatio] = useState(true);
  const [customFilename, setCustomFilename] = useState('');

  useEffect(() => {
    if (originalFile) {
      const url = URL.createObjectURL(originalFile);
      setPreviewUrl(url);
      
      const img = new Image();
      img.onload = () => {
        setOrigDimensions({ width: img.width, height: img.height });
        setTargetWidth(img.width);
        setTargetHeight(img.height);
      };
      img.src = url;

      return () => URL.revokeObjectURL(url);
    }
  }, [originalFile]);

  const handleDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setOriginalFile(acceptedFiles[0]);
      setResizedBlob(null);
      setCustomFilename(acceptedFiles[0].name.replace(/\.[^/.]+$/, "") + "_resized");
    }
  };

  const handleWidthChange = (e) => {
    const val = parseInt(e.target.value) || 0;
    setTargetWidth(val);
    if (maintainRatio && origDimensions.width > 0) {
      const ratio = origDimensions.height / origDimensions.width;
      setTargetHeight(Math.round(val * ratio));
    }
  };

  const handleHeightChange = (e) => {
    const val = parseInt(e.target.value) || 0;
    setTargetHeight(val);
    if (maintainRatio && origDimensions.height > 0) {
      const ratio = origDimensions.width / origDimensions.height;
      setTargetWidth(Math.round(val * ratio));
    }
  };

  const handleResize = async () => {
    if (!originalFile || !previewUrl || targetWidth <= 0 || targetHeight <= 0) return;

    setIsResizing(true);
    try {
      const img = new Image();
      img.src = previewUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Preserve original type if possible, fallback to png
      const type = originalFile.type || 'image/png';
      
      canvas.toBlob((blob) => {
        if (blob) {
          setResizedBlob(blob);
        } else {
          alert('Failed to resize image.');
        }
        setIsResizing(false);
      }, type, 0.95);
    } catch (error) {
      console.error('Error resizing image:', error);
      alert('Error resizing image.');
      setIsResizing(false);
    }
  };

  const handleDownload = () => {
    if (!resizedBlob) return;
    const url = URL.createObjectURL(resizedBlob);
    const link = document.createElement('a');
    link.href = url;
    const ext = originalFile.type.split('/')[1] || 'png';
    const fileName = (customFilename || 'resized') + `.${ext}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {!originalFile ? (
        <DropzoneArea 
          onDrop={handleDrop} 
          accept={{"image/*": [".png", ".jpg", ".jpeg", ".webp"]}} 
          title="Drag & drop an image here, or click to select"
        />
      ) : (
        <div className="workspace-content animate-fade-in">
          <div className="file-info">
            <div className="file-details">
              <ImageIcon size={24} className="icon" />
              <span>{originalFile.name}</span>
            </div>
            <div className="file-stats">
              <div className="stat-item">
                <span>Original Size</span>
                <span className="stat-value">{origDimensions.width} x {origDimensions.height} px</span>
              </div>
            </div>
          </div>

          {!resizedBlob && (
            <div className="settings-panel" style={{ marginTop: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Width (px)</label>
                  <input 
                    type="number" 
                    value={targetWidth} 
                    onChange={handleWidthChange}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '1rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Height (px)</label>
                  <input 
                    type="number" 
                    value={targetHeight} 
                    onChange={handleHeightChange}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '1rem' }}
                  />
                </div>
              </div>
              
              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  id="maintainRatio" 
                  checked={maintainRatio} 
                  onChange={(e) => setMaintainRatio(e.target.checked)}
                  style={{ width: '1.2rem', height: '1.2rem' }}
                />
                <label htmlFor="maintainRatio" style={{ cursor: 'pointer' }}>Maintain aspect ratio</label>
              </div>
              
              <div className="action-row">
                <button className="btn btn-secondary" onClick={() => setOriginalFile(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleResize} disabled={isResizing || targetWidth <= 0 || targetHeight <= 0}>
                  {isResizing ? <Loader2 className="loading-spinner" size={20} /> : <Maximize size={20} />}
                  {isResizing ? 'Resizing...' : 'Resize Image'}
                </button>
              </div>
            </div>
          )}

          {resizedBlob && (
            <div className="result-card animate-fade-in">
              <h3 style={{ marginBottom: '1rem' }}>Image Resized Successfully!</h3>
              <div className="file-info" style={{ background: 'rgba(0,0,0,0.3)' }}>
                <div className="stat-item">
                  <span>New Dimensions</span>
                  <span className="stat-value stat-success">{targetWidth} x {targetHeight} px</span>
                </div>
                <div className="stat-item">
                  <span>New File Size</span>
                  <span className="stat-value">{formatFileSize(resizedBlob.size)}</span>
                </div>
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Rename File (optional)</label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    value={customFilename} 
                    onChange={(e) => setCustomFilename(e.target.value)}
                    style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                  />
                  <span style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>.{originalFile.type.split('/')[1] || 'png'}</span>
                </div>
              </div>

              <div className="action-row">
                <button className="btn btn-secondary" onClick={() => { setOriginalFile(null); setResizedBlob(null); }}>
                  Resize Another
                </button>
                <button className="btn btn-primary" onClick={handleDownload}>
                  <Download size={20} />
                  Download Resized Image
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageResizer;
