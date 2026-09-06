import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { Download, Images, X, FilePlus2, Loader2 } from 'lucide-react';
import DropzoneArea from './DropzoneArea';

const ImageToPdf = () => {
  const [images, setImages] = useState([]);
  const [isConverting, setIsConverting] = useState(false);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [customFilename, setCustomFilename] = useState('images-converted');

  const handleDrop = (acceptedFiles) => {
    // Read files and generate object URLs
    const newImages = acceptedFiles.map(file => ({
      file,
      url: URL.createObjectURL(file),
      id: Math.random().toString(36).substring(7)
    }));
    
    setImages(prev => [...prev, ...newImages]);
    setPdfBlob(null);
  };

  const removeImage = (idToRemove) => {
    setImages(images.filter(img => img.id !== idToRemove));
    setPdfBlob(null);
  };

  const handleConvert = async () => {
    if (images.length === 0) return;

    setIsConverting(true);
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < images.length; i++) {
        if (i > 0) {
          pdf.addPage();
        }

        const img = images[i];
        
        // We need to load the image to get its dimensions
        const imgObj = new Image();
        imgObj.src = img.url;
        await new Promise((resolve) => {
          imgObj.onload = resolve;
        });

        // Calculate aspect ratio fit
        const imgRatio = imgObj.width / imgObj.height;
        const pageRatio = pageWidth / pageHeight;
        
        let renderWidth = pageWidth;
        let renderHeight = pageHeight;
        let x = 0;
        let y = 0;

        if (imgRatio > pageRatio) {
          // Image is wider than page ratio
          renderHeight = pageWidth / imgRatio;
          y = (pageHeight - renderHeight) / 2;
        } else {
          // Image is taller than page ratio
          renderWidth = pageHeight * imgRatio;
          x = (pageWidth - renderWidth) / 2;
        }

        pdf.addImage(imgObj, 'JPEG', x, y, renderWidth, renderHeight);
      }

      const blob = pdf.output('blob');
      setPdfBlob(blob);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF.');
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (!pdfBlob) return;
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = (customFilename || 'images-converted') + ".pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {!pdfBlob ? (
        <div className="workspace-content animate-fade-in">
          <DropzoneArea 
            onDrop={handleDrop} 
            accept={{ "image/*": [".png", ".jpg", ".jpeg", ".webp"] }} 
            multiple={true}
            title={images.length > 0 ? "Add more images" : "Drag & drop images here, or click to select"}
          />

          {images.length > 0 && (
            <>
              <div className="image-list">
                {images.map((img) => (
                  <div key={img.id} className="image-item animate-fade-in">
                    <img src={img.url} alt="upload preview" />
                    <button className="remove-btn" onClick={() => removeImage(img.id)}>
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="action-row" style={{ marginTop: '2rem' }}>
                <button className="btn btn-secondary" onClick={() => setImages([])}>Clear All</button>
                <button className="btn btn-primary" onClick={handleConvert} disabled={isConverting}>
                  {isConverting ? <Loader2 className="loading-spinner" size={20} /> : <FilePlus2 size={20} />}
                  {isConverting ? 'Generating PDF...' : `Generate PDF (${images.length} images)`}
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="result-card animate-fade-in">
          <h3 style={{ marginBottom: '1rem' }}>PDF Generated Successfully!</h3>
          <div className="file-info" style={{ background: 'rgba(0,0,0,0.3)' }}>
            <div className="file-details">
              <Images size={24} className="icon" />
              <span>images-converted.pdf</span>
            </div>
            <div className="stat-item">
              <span>Pages</span>
              <span className="stat-value">{images.length}</span>
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
            <button className="btn btn-secondary" onClick={() => { setPdfBlob(null); }}>
              Back to Editor
            </button>
            <button className="btn btn-primary" onClick={handleDownload}>
              <Download size={20} />
              Download PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageToPdf;
