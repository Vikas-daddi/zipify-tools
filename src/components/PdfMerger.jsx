import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Download, Merge, X, Loader2, FileText } from 'lucide-react';
import DropzoneArea from './DropzoneArea';
import { saveAs } from 'file-saver';

const PdfMerger = () => {
  const [pdfs, setPdfs] = useState([]);
  const [isMerging, setIsMerging] = useState(false);
  const [mergedPdfBlob, setMergedPdfBlob] = useState(null);
  const [customFilename, setCustomFilename] = useState('merged');

  const handleDrop = (acceptedFiles) => {
    const newPdfs = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(7)
    }));
    setPdfs(prev => [...prev, ...newPdfs]);
    setMergedPdfBlob(null);
  };

  const removePdf = (idToRemove) => {
    setPdfs(pdfs.filter(p => p.id !== idToRemove));
    setMergedPdfBlob(null);
  };

  const handleMerge = async () => {
    if (pdfs.length < 2) {
      alert("Please upload at least 2 PDFs to merge.");
      return;
    }

    setIsMerging(true);
    try {
      const mergedPdf = await PDFDocument.create();

      for (const pdfObj of pdfs) {
        const arrayBuffer = await pdfObj.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => {
          mergedPdf.addPage(page);
        });
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      setMergedPdfBlob(blob);
    } catch (error) {
      console.error('Error merging PDFs:', error);
      alert('Failed to merge PDFs. One of the files might be corrupted or encrypted.');
    } finally {
      setIsMerging(false);
    }
  };

  const handleDownload = () => {
    if (!mergedPdfBlob) return;
    saveAs(mergedPdfBlob, (customFilename || 'merged') + ".pdf");
  };

  return (
    <div>
      {!mergedPdfBlob ? (
        <div className="workspace-content animate-fade-in">
          <DropzoneArea 
            onDrop={handleDrop} 
            accept={{ "application/pdf": [".pdf"] }} 
            multiple={true}
            title="Drag & drop PDF files here, or click to select"
          />

          {pdfs.length > 0 && (
            <>
              <div className="file-list" style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {pdfs.map((pdf, index) => (
                  <div key={pdf.id} className="file-info animate-fade-in" style={{ background: 'rgba(0,0,0,0.2)' }}>
                    <div className="file-details">
                      <span style={{ color: 'var(--text-secondary)', width: '20px' }}>{index + 1}.</span>
                      <FileText size={20} className="icon" />
                      <span>{pdf.file.name}</span>
                    </div>
                    <button className="back-btn" onClick={() => removePdf(pdf.id)} style={{ color: 'var(--danger)' }}>
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="action-row" style={{ marginTop: '2rem' }}>
                <button className="btn btn-secondary" onClick={() => setPdfs([])}>Clear All</button>
                <button className="btn btn-primary" onClick={handleMerge} disabled={isMerging || pdfs.length < 2}>
                  {isMerging ? <Loader2 className="loading-spinner" size={20} /> : <Merge size={20} />}
                  {isMerging ? 'Merging PDFs...' : `Merge ${pdfs.length} PDFs`}
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="result-card animate-fade-in">
          <h3 style={{ marginBottom: '1rem' }}>PDFs Merged Successfully!</h3>
          <div className="file-info" style={{ background: 'rgba(0,0,0,0.3)' }}>
            <div className="file-details">
              <Merge size={24} className="icon" />
              <span>merged.pdf</span>
            </div>
            <div className="stat-item">
              <span>Combined from</span>
              <span className="stat-value">{pdfs.length} files</span>
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
              <span style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>.pdf</span>
            </div>
          </div>

          <div className="action-row">
            <button className="btn btn-secondary" onClick={() => { setMergedPdfBlob(null); }}>
              Back to Editor
            </button>
            <button className="btn btn-primary" onClick={handleDownload}>
              <Download size={20} />
              Download Merged PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfMerger;
