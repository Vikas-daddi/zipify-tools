import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Download, SplitSquareHorizontal, FileText, Loader2 } from 'lucide-react';
import DropzoneArea from './DropzoneArea';
import { formatFileSize } from '../utils/formatSize';

const PdfSplitter = () => {
  const [originalFile, setOriginalFile] = useState(null);
  const [isSplitting, setIsSplitting] = useState(false);
  const [zipBlob, setZipBlob] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [customFilename, setCustomFilename] = useState('');

  const handleDrop = async (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setOriginalFile(file);
      setZipBlob(null);
      setCustomFilename(file.name.replace(/\.[^/.]+$/, "") + "_split");
      
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        setPageCount(pdf.getPageCount());
      } catch (err) {
        console.error("Error loading PDF to count pages:", err);
      }
    }
  };

  const handleSplit = async () => {
    if (!originalFile) return;

    setIsSplitting(true);
    try {
      const arrayBuffer = await originalFile.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const numPages = pdf.getPageCount();
      
      const zip = new JSZip();
      const baseName = originalFile.name.replace(/\.[^/.]+$/, "");

      for (let i = 0; i < numPages; i++) {
        const newPdf = await PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(pdf, [i]);
        newPdf.addPage(copiedPage);
        const pdfBytes = await newPdf.save();
        zip.file(`${baseName}_page_${i + 1}.pdf`, pdfBytes);
      }

      const content = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
      setZipBlob(content);
    } catch (error) {
      console.error('Error splitting PDF:', error);
      alert('Failed to split PDF. It might be corrupted or encrypted.');
    } finally {
      setIsSplitting(false);
    }
  };

  const handleDownload = () => {
    if (!zipBlob) return;
    saveAs(zipBlob, (customFilename || 'split') + ".zip");
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
              <div className="stat-item">
                <span>Total Pages</span>
                <span className="stat-value">{pageCount}</span>
              </div>
            </div>
          </div>

          {!zipBlob && (
            <div className="settings-panel" style={{ marginTop: '2rem' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                This tool will extract all {pageCount} pages into individual PDF files and package them into a single ZIP archive for you to download.
              </p>
              <div className="action-row">
                <button className="btn btn-secondary" onClick={() => { setOriginalFile(null); setPageCount(0); }}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSplit} disabled={isSplitting || pageCount === 0}>
                  {isSplitting ? <Loader2 className="loading-spinner" size={20} /> : <SplitSquareHorizontal size={20} />}
                  {isSplitting ? 'Splitting PDF...' : `Split into ${pageCount} PDFs`}
                </button>
              </div>
            </div>
          )}

          {zipBlob && (
            <div className="result-card animate-fade-in">
              <h3 style={{ marginBottom: '1rem' }}>PDF Split Successfully!</h3>
              <div className="file-info" style={{ background: 'rgba(0,0,0,0.3)' }}>
                <div className="file-details">
                  <SplitSquareHorizontal size={24} className="icon" />
                  <span>{originalFile.name.replace(/\.[^/.]+$/, "")}_split.zip</span>
                </div>
                <div className="stat-item">
                  <span>Contains</span>
                  <span className="stat-value">{pageCount} PDF files</span>
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
                <button className="btn btn-secondary" onClick={() => { setOriginalFile(null); setZipBlob(null); setPageCount(0); }}>
                  Split Another
                </button>
                <button className="btn btn-primary" onClick={handleDownload}>
                  <Download size={20} />
                  Download ZIP Archive
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PdfSplitter;
