import React, { useState, useEffect, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import jsPDF from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker?url';
import { Download, FileText, Settings, Loader2 } from 'lucide-react';
import DropzoneArea from './DropzoneArea';
import { formatFileSize } from '../utils/formatSize';

// Set up the pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const PdfCompressor = () => {
  const [originalFile, setOriginalFile] = useState(null);
  const [compressedPdfBytes, setCompressedPdfBytes] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [newSize, setNewSize] = useState(0);
  const [estimatedSize, setEstimatedSize] = useState(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [customFilename, setCustomFilename] = useState('');
  
  const [mode, setMode] = useState('structure'); // 'structure' or 'deep'
  const [quality, setQuality] = useState(0.5); // 0.1 to 1 for deep mode
  
  const debounceTimer = useRef(null);

  const handleDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setOriginalFile(acceptedFiles[0]);
      setCompressedPdfBytes(null);
      setEstimatedSize(null);
      setCustomFilename(acceptedFiles[0].name.replace(/\.[^/.]+$/, "") + "-compressed");
    }
  };

  useEffect(() => {
    if (!originalFile) return;

    const estimatePdf = async () => {
      setIsEstimating(true);
      try {
        const arrayBuffer = await originalFile.arrayBuffer();
        
        if (mode === 'structure') {
          const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
          const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
          setEstimatedSize(pdfBytes.length);
        } else if (mode === 'deep') {
          // Quick estimate: render first page, multiply by total pages
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          const numPages = pdf.numPages;
          
          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 1.5 }); // decent readable scale
          
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          await page.render({ canvasContext: context, viewport }).promise;
          
          canvas.toBlob((blob) => {
            if (blob) {
              setEstimatedSize(blob.size * numPages);
            }
            setIsEstimating(false);
          }, 'image/jpeg', quality);
          return; // don't set isEstimating to false synchronously
        }
      } catch (error) {
        console.error("PDF estimation failed", error);
      } finally {
        if (mode === 'structure') setIsEstimating(false);
      }
    };

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    if (mode === 'deep') {
      // Debounce the heavy rendering estimate
      debounceTimer.current = setTimeout(() => {
        estimatePdf();
      }, 500);
    } else {
      estimatePdf();
    }

    return () => clearTimeout(debounceTimer.current);
  }, [originalFile, mode, quality]);

  const handleCompress = async () => {
    if (!originalFile) return;

    setIsCompressing(true);
    try {
      const arrayBuffer = await originalFile.arrayBuffer();
      
      if (mode === 'structure') {
        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
        setNewSize(pdfBytes.length);
        setCompressedPdfBytes(pdfBytes);
      } else if (mode === 'deep') {
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const numPages = pdf.numPages;
        
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: 'a4'
        });
        
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        for (let i = 1; i <= numPages; i++) {
          if (i > 1) doc.addPage();
          
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2.0 }); // higher scale for rendering, compressed heavily via JPEG
          
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          await page.render({ canvasContext: context, viewport }).promise;
          
          const imgData = canvas.toDataURL('image/jpeg', quality);
          
          // Calculate fit
          const imgRatio = canvas.width / canvas.height;
          const pageRatio = pageWidth / pageHeight;
          
          let renderWidth = pageWidth;
          let renderHeight = pageHeight;
          let x = 0;
          let y = 0;

          if (imgRatio > pageRatio) {
            renderHeight = pageWidth / imgRatio;
            y = (pageHeight - renderHeight) / 2;
          } else {
            renderWidth = pageHeight * imgRatio;
            x = (pageWidth - renderWidth) / 2;
          }

          doc.addImage(imgData, 'JPEG', x, y, renderWidth, renderHeight, undefined, 'FAST');
        }
        
        const blob = doc.output('blob');
        const arrayBuf = await blob.arrayBuffer();
        setNewSize(blob.size);
        setCompressedPdfBytes(new Uint8Array(arrayBuf));
      }
    } catch (error) {
      console.error('Error compressing PDF:', error);
      alert('Failed to compress PDF. It might be encrypted or corrupted.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDownload = () => {
    if (!compressedPdfBytes) return;
    const blob = new Blob([compressedPdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = (customFilename || 'compressed') + ".pdf";
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
          accept={{ "application/pdf": [".pdf"] }} 
          title="Drag & drop a PDF here, or click to select"
        />
      ) : (
        <div className="workspace-content animate-fade-in">
          <div className="file-info">
            <div className="file-details">
              <FileText size={24} className="icon" />
              <span>{originalFile.name}</span>
            </div>
            <div className="file-stats">
              <div className="stat-item">
                <span>Original Size</span>
                <span className="stat-value">{formatFileSize(originalFile.size)}</span>
              </div>
            </div>
          </div>

          {!compressedPdfBytes && (
            <div className="settings-panel" style={{ marginTop: '2rem' }}>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Compression Mode:</label>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button 
                    className={`btn ${mode === 'structure' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setMode('structure')}
                  >
                    Structure Optimization
                  </button>
                  <button 
                    className={`btn ${mode === 'deep' ? 'btn-danger' : 'btn-secondary'}`}
                    onClick={() => setMode('deep')}
                  >
                    Deep Compression (Flatten to Images)
                  </button>
                </div>
                {mode === 'structure' && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                    Removes metadata and unused objects. Preserves text searchability.
                  </p>
                )}
                {mode === 'deep' && (
                  <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                    Warning: This converts your PDF into images to massively reduce file size. Text will no longer be selectable.
                  </p>
                )}
              </div>

              {mode === 'deep' && (
                <div className="slider-container animate-fade-in">
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
              )}

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
                  {isCompressing ? 'Optimizing...' : 'Optimize PDF'}
                </button>
              </div>
            </div>
          )}

          {compressedPdfBytes && (
            <div className="result-card animate-fade-in">
              <h3 style={{ marginBottom: '1rem' }}>Result</h3>
              <div className="file-info" style={{ background: 'rgba(0,0,0,0.3)' }}>
                <div className="stat-item">
                  <span>New Size</span>
                  <span className={`stat-value ${newSize < originalFile.size ? 'stat-success' : ''}`}>
                    {formatFileSize(newSize)}
                  </span>
                </div>
                {newSize < originalFile.size && (
                  <div className="stat-item">
                    <span>Saved</span>
                    <span className="stat-value stat-success">
                      {Math.round((1 - (newSize / originalFile.size)) * 100)}%
                    </span>
                  </div>
                )}
                {newSize >= originalFile.size && (
                  <div className="stat-item">
                    <span>Result</span>
                    <span className="stat-value" style={{ color: 'var(--text-secondary)' }}>
                      Already Optimized
                    </span>
                  </div>
                )}
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
                  <span style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>.pdf</span>
                </div>
              </div>

              <div className="action-row">
                <button className="btn btn-secondary" onClick={() => { setOriginalFile(null); setCompressedPdfBytes(null); }}>
                  Compress Another
                </button>
                <button className="btn btn-primary" onClick={handleDownload}>
                  <Download size={20} />
                  Download PDF
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PdfCompressor;
