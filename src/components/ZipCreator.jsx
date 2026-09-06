import React, { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Download, Archive, X, Loader2, File } from 'lucide-react';
import DropzoneArea from './DropzoneArea';
import { formatFileSize } from '../utils/formatSize';

const ZipCreator = () => {
  const [files, setFiles] = useState([]);
  const [isZipping, setIsZipping] = useState(false);
  const [zipBlob, setZipBlob] = useState(null);
  const [customFilename, setCustomFilename] = useState('archive');

  const handleDrop = (acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(7)
    }));
    setFiles(prev => [...prev, ...newFiles]);
    setZipBlob(null);
  };

  const removeFile = (idToRemove) => {
    setFiles(files.filter(f => f.id !== idToRemove));
    setZipBlob(null);
  };

  const handleZip = async () => {
    if (files.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      
      files.forEach((f) => {
        zip.file(f.file.name, f.file);
      });

      const content = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
      setZipBlob(content);
    } catch (error) {
      console.error('Error creating ZIP:', error);
      alert('Failed to create ZIP archive.');
    } finally {
      setIsZipping(false);
    }
  };

  const handleDownload = () => {
    if (!zipBlob) return;
    saveAs(zipBlob, (customFilename || 'archive') + ".zip");
  };

  const totalSize = files.reduce((acc, f) => acc + f.file.size, 0);

  return (
    <div>
      {!zipBlob ? (
        <div className="workspace-content animate-fade-in">
          <DropzoneArea 
            onDrop={handleDrop} 
            multiple={true}
            title="Drag & drop any files here, or click to select"
          />

          {files.length > 0 && (
            <>
              <div className="file-info" style={{ marginTop: '2rem' }}>
                <div className="stat-item">
                  <span>Total Files</span>
                  <span className="stat-value">{files.length}</span>
                </div>
                <div className="stat-item">
                  <span>Uncompressed Size</span>
                  <span className="stat-value">{formatFileSize(totalSize)}</span>
                </div>
              </div>

              <div className="file-list" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                {files.map((f, index) => (
                  <div key={f.id} className="file-info animate-fade-in" style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem 1rem', marginBottom: '0' }}>
                    <div className="file-details">
                      <File size={16} className="icon" />
                      <span style={{ fontSize: '0.9rem' }}>{f.file.name}</span>
                    </div>
                    <button className="back-btn" onClick={() => removeFile(f.id)} style={{ color: 'var(--danger)', padding: '0.25rem' }}>
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="action-row" style={{ marginTop: '2rem' }}>
                <button className="btn btn-secondary" onClick={() => setFiles([])}>Clear All</button>
                <button className="btn btn-primary" onClick={handleZip} disabled={isZipping || files.length === 0}>
                  {isZipping ? <Loader2 className="loading-spinner" size={20} /> : <Archive size={20} />}
                  {isZipping ? 'Compressing to ZIP...' : `Create ZIP Archive`}
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="result-card animate-fade-in">
          <h3 style={{ marginBottom: '1rem' }}>ZIP Archive Created!</h3>
          <div className="file-info" style={{ background: 'rgba(0,0,0,0.3)' }}>
            <div className="file-details">
              <Archive size={24} className="icon" />
              <span>archive.zip</span>
            </div>
            <div className="stat-item">
              <span>Compressed Size</span>
              <span className="stat-value stat-success">{formatFileSize(zipBlob.size)}</span>
            </div>
          </div>
          
          <div style={{ marginBottom: '1.5rem', marginTop: '1.5rem' }}>
            <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Rename File (optional)</label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input 
                type="text" 
                value={customFilename} 
                onChange={(e) => setCustomFilename(e.target.value)}
                style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
              />
              <span style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>.zip</span>
            </div>
          </div>

          <div className="action-row">
            <button className="btn btn-secondary" onClick={() => { setZipBlob(null); }}>
              Back to Editor
            </button>
            <button className="btn btn-primary" onClick={handleDownload}>
              <Download size={20} />
              Download ZIP
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZipCreator;
