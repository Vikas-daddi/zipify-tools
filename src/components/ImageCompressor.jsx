import React, { useState, useEffect, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { Download, FileImage, Settings, Loader2 } from 'lucide-react';
import DropzoneArea from './DropzoneArea';
import { formatFileSize } from '../utils/formatSize';

const ImageCompressor = () => {
  const [originalFile, setOriginalFile] = useState(null);
  const [compressedFile, setCompressedFile] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [quality, setQuality] = useState(0.8); // 0.1 to 1
  const [estimatedSize, setEstimatedSize] = useState(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [customFilename, setCustomFilename] = useState('');
  const debounceTimer = useRef(null);

  const handleDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setOriginalFile(acceptedFiles[0]);
      setCompressedFile(null);
      setEstimatedSize(null);
      setCustomFilename(acceptedFiles[0].name.replace(/\.[^/.]+$/, "") + "-compressed");
    }
  };

  useEffect(() => {
    if (!originalFile) return;

    setIsEstimating(true);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      try {
        const options = {
          maxSizeMB: 5,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          initialQuality: quality,
        };
        const compressedBlob = await imageCompression(originalFile, options);
        setEstimatedSize(compressedBlob.size);
      } catch (e) {
        console.error("Estimation failed", e);
      } finally {
        setIsEstimating(false);
      }
    }, 500);

    return () => clearTimeout(debounceTimer.current);
  }, [originalFile, quality]);

  const handleCompress = async () => {
    if (!originalFile) return;

    setIsCompressing(true);
    try {
      const options = {
        maxSizeMB: 5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        initialQuality: quality,
      };

      const compressedBlob = await imageCompression(originalFile, options);
      // browser-image-compression returns a File but it's good to keep track
      setCompressedFile(compressedBlob);
    } catch (error) {
      console.error('Error compressing image:', error);
      alert('Failed to compress image.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDownload = () => {
    if (!compressedFile) return;
    const url = URL.createObjectURL(compressedFile);
    const link = document.createElement('a');
    link.href = url;
    // append -compressed to original filename
    const fileName = (customFilename || 'compressed') + ".jpg";
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
              <FileImage size={24} className="icon" />
              <span>{originalFile.name}</span>
            </div>
            <div className="file-stats">
              <div className="stat-item">
                <span>Original Size</span>
                <span className="stat-value">{formatFileSize(originalFile.size)}</span>
              </div>
            </div>
          </div>

          {!compressedFile && (
            <div className="settings-panel" style={{ marginTop: '2rem' }}>
              <div className="slider-container">
                <label>
                  <span>Compression Quality</span>
                  <span>{Math.round(quality * 100)}%</span>
                </label>
                <input 
                  type="range" 
                  min="0.1" max="1" step="0.1" 
                  value={quality} 
                  onChange={(e) => setQuality(parseFloat(e.target.value))} 
                />
              </div>
              
              <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Estimated New Size:</span>
                <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {isEstimating && <Loader2 className="loading-spinner" size={16} />}
                  {estimatedSize ? formatFileSize(estimatedSize) : 'Calculating...'}
                </span>
              </div>
              
              <div className="action-row">
                <button className="btn btn-secondary" onClick={() => setOriginalFile(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleCompress} disabled={isCompressing || isEstimating}>
                  {isCompressing ? <Loader2 className="loading-spinner" size={20} /> : <Settings size={20} />}
                  {isCompressing ? 'Compressing...' : 'Compress Image'}
                </button>
              </div>
            </div>
          )}

          {compressedFile && (
            <div className="result-card animate-fade-in">
              <h3 style={{ marginBottom: '1rem' }}>Result</h3>
              <div className="file-info" style={{ background: 'rgba(0,0,0,0.3)' }}>
                <div className="stat-item">
                  <span>New Size</span>
                  <span className="stat-value stat-success">{formatFileSize(compressedFile.size)}</span>
                </div>
                <div className="stat-item">
                  <span>Saved</span>
                  <span className="stat-value stat-success">
                    {Math.round((1 - (compressedFile.size / originalFile.size)) * 100)}%
                  </span>
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
                  <span style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>.jpg</span>
                </div>
              </div>

              <div className="action-row">
                <button className="btn btn-secondary" onClick={() => { setOriginalFile(null); setCompressedFile(null); }}>
                  Compress Another
                </button>
                <button className="btn btn-primary" onClick={handleDownload}>
                  <Download size={20} />
                  Download Compressed Image
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageCompressor;
