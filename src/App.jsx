import React, { useState } from 'react';
import { Image, FileText, Images, ArrowLeft, Merge, SplitSquareHorizontal, FileEdit, Maximize, Archive, ShieldCheck, Code2 } from 'lucide-react';
import ImageCompressor from './components/ImageCompressor';
import PdfCompressor from './components/PdfCompressor';
import ImageToPdf from './components/ImageToPdf';
import PdfMerger from './components/PdfMerger';
import PdfSplitter from './components/PdfSplitter';
import ImageConverter from './components/ImageConverter';
import ImageResizer from './components/ImageResizer';
import ZipCreator from './components/ZipCreator';

function App() {
  const [activeTool, setActiveTool] = useState(null);

  const tools = [
    // Image Tools
    {
      id: 'image-compressor',
      category: 'Image Tools',
      title: 'Image Compressor',
      description: 'Reduce image file size significantly without losing quality.',
      icon: <Image size={28} />,
      component: <ImageCompressor />
    },
    {
      id: 'image-converter',
      category: 'Image Tools',
      title: 'Image Converter',
      description: 'Convert images between formats (PNG, JPG, WEBP).',
      icon: <FileEdit size={28} />,
      component: <ImageConverter />
    },
    {
      id: 'image-resizer',
      category: 'Image Tools',
      title: 'Image Resizer',
      description: 'Resize image dimensions maintaining aspect ratio.',
      icon: <Maximize size={28} />,
      component: <ImageResizer />
    },
    {
      id: 'image-to-pdf',
      category: 'Image Tools',
      title: 'Image to PDF',
      description: 'Convert multiple images into a single PDF document.',
      icon: <Images size={28} />,
      component: <ImageToPdf />
    },
    
    // PDF Tools
    {
      id: 'pdf-compressor',
      category: 'PDF Tools',
      title: 'PDF Compressor',
      description: 'Optimize PDF files to reduce size while maintaining readability.',
      icon: <FileText size={28} />,
      component: <PdfCompressor />
    },
    {
      id: 'pdf-merger',
      category: 'PDF Tools',
      title: 'Merge PDFs',
      description: 'Combine multiple PDF files into one single document.',
      icon: <Merge size={28} />,
      component: <PdfMerger />
    },
    {
      id: 'pdf-splitter',
      category: 'PDF Tools',
      title: 'Split PDF',
      description: 'Extract pages from a PDF into separate files.',
      icon: <SplitSquareHorizontal size={28} />,
      component: <PdfSplitter />
    },
    
    // Archive Tools
    {
      id: 'zip-creator',
      category: 'Archive Tools',
      title: 'Create ZIP',
      description: 'Compress multiple files into a single ZIP archive.',
      icon: <Archive size={28} />,
      component: <ZipCreator />
    }
  ];

  const renderContent = () => {
    if (!activeTool) {
      const categories = ['Image Tools', 'PDF Tools', 'Archive Tools'];
      
      return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
          {categories.map(category => (
            <div key={category}>
              <h2 className="category-title">{category}</h2>
              <div className="grid-3">
                {tools.filter(t => t.category === category).map(tool => (
                  <div 
                    key={tool.id} 
                    className="tool-card"
                    onClick={() => setActiveTool(tool.id)}
                  >
                    <div className="icon-wrapper">
                      {tool.icon}
                    </div>
                    <h3>{tool.title}</h3>
                    <p>{tool.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    const currentTool = tools.find(t => t.id === activeTool);
    return (
      <div className="animate-fade-in glass-panel" style={{ padding: '2.5rem' }}>
        <div className="workspace-header">
          <button className="back-btn" onClick={() => setActiveTool(null)}>
            <ArrowLeft size={18} />
            Back to Tools
          </button>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{currentTool.title}</h2>
        </div>
        {currentTool.component}
      </div>
    );
  };

  return (
    <div className="app-container">
      <div className="top-nav animate-fade-in">
        <div className="dev-badge">
          <Code2 size={16} />
          Built with passion by <span>VIKAS DADDI</span>
        </div>
      </div>

      <header className="header animate-fade-in">
        <img src="/logo.jpg" alt="Zipify Logo" style={{ width: '90px', height: '90px', borderRadius: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 10px 30px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)' }} />
        <h1 className="title-gradient">Zipify Tools</h1>
        <p>Premium file compression, conversion, and utilities right in your browser.</p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem', padding: '0.6rem 1.25rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: '999px', fontSize: '0.95rem', border: '1px solid rgba(16, 185, 129, 0.2)', backdropFilter: 'blur(10px)' }}>
          <ShieldCheck size={18} />
          <span><strong>100% Secure & Local:</strong> Your files never leave your device.</span>
        </div>
      </header>
      
      <main>
        {renderContent()}
      </main>

      <footer style={{ textAlign: 'center', padding: '3rem 0', marginTop: '4rem', borderTop: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
        <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
          Created & Designed by <strong style={{ color: 'white', fontWeight: '600' }}>VIKAS DADDI</strong>
        </p>
        <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>
          © {new Date().getFullYear()} Zipify Tools. All rights reserved. 100% Private & Secure.
        </p>
      </footer>
    </div>
  );
}

export default App;
