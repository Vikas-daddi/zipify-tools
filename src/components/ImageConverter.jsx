import React, { useState, useEffect } from 'react';
import { Download, FileEdit, Loader2, Image as ImageIcon } from 'lucide-react';
import DropzoneArea from './DropzoneArea';
import { formatFileSize } from '../utils/formatSize';

const ImageConverter = () => {
  const [originalFile, setOriginalFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [convertedBlob, setConvertedBlob] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [targetFormat, setTargetFormat] = useState('image/png');
  const [customFilename, setCustomFilename] = useState('');

  const formats = [
    { label: 'PNG', value: 'image/png', ext: 'png' },
    { label: 'JPEG', value: 'image/jpeg', ext: 'jpg' },
    { label: 'WEBP', value: 'image/webp', ext: 'webp' }
  ];

  useEffect(() => {
    if (originalFile) {
      const url = URL.createObjectURL(originalFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [originalFile]);

  const handleDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setOriginalFile(acceptedFiles[0]);
      setConvertedBlob(null);
      setCustomFilename(acceptedFiles[0].name.replace(/\.[^/.]+$/, "") + "_converted");
    }
  };

  const handleConvert = async () => {
    if (!originalFile || !previewUrl) return;

    setIsConverting(true);
    try {
      // Create an image object to get its natural dimensions
      const img = new Image();
      img.src = previewUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Create a canvas and draw the image
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      // If converting to JPEG, fill with white background first to avoid black transparent areas
      if (targetFormat === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      ctx.drawImage(img, 0, 0);

      // Convert canvas to blob in the target format
      canvas.toBlob((blob) => {
        if (blob) {
          setConvertedBlob(blob);
        } else {
          alert('Failed to convert image.');
        }
        setIsConverting(false);
      }, targetFormat, 0.95);
    } catch (error) {
      console.error('Error converting image:', error);
      alert('Error converting image.');
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (!convertedBlob) return;
    const url = URL.createObjectURL(convertedBlob);
    const link = document.createElement('a');
    link.href = url;
    
    const ext = formats.find(f => f.value === targetFormat)?.ext || 'img';
    const fileName = (customFilename || 'converted') + `.${ext}`;
    
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
          accept={{"image/*": [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif"]}} 
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
                <span>Size</span>
                <span className="stat-value">{formatFileSize(originalFile.size)}</span>
              </div>
            </div>
          </div>

          {!convertedBlob && (
            <div className="settings-panel" style={{ marginTop: '2rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Convert to format:</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {formats.map(format => (
                    <button 
                      key={format.value}
                      className={`btn ${targetFormat === format.value ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setTargetFormat(format.value)}
                    >
                      {format.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="action-row">
                <button className="btn btn-secondary" onClick={() => setOriginalFile(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleConvert} disabled={isConverting}>
                  {isConverting ? <Loader2 className="loading-spinner" size={20} /> : <FileEdit size={20} />}
                  {isConverting ? 'Converting...' : `Convert to ${formats.find(f => f.value === targetFormat)?.label}`}
                </button>
              </div>
            </div>
          )}

          {convertedBlob && (
            <div className="result-card animate-fade-in">
              <h3 style={{ marginBottom: '1rem' }}>Conversion Successful!</h3>
              <div className="file-info" style={{ background: 'rgba(0,0,0,0.3)' }}>
                <div className="stat-item">
                  <span>New Format</span>
                  <span className="stat-value stat-success">{formats.find(f => f.value === targetFormat)?.label}</span>
                </div>
                <div className="stat-item">
                  <span>New Size</span>
                  <span className="stat-value">{formatFileSize(convertedBlob.size)}</span>
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
                  <span style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>.{formats.find(f => f.value === targetFormat)?.ext || 'img'}</span>
                </div>
              </div>

              <div className="action-row">
                <button className="btn btn-secondary" onClick={() => { setOriginalFile(null); setConvertedBlob(null); }}>
                  Convert Another
                </button>
                <button className="btn btn-primary" onClick={handleDownload}>
                  <Download size={20} />
                  Download Image
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageConverter;
