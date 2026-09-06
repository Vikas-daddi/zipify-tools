import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';

const DropzoneArea = ({ onDrop, accept, multiple = false, title = "Drag & drop files here, or click to select" }) => {
  const onDropCallback = useCallback(acceptedFiles => {
    onDrop(acceptedFiles);
  }, [onDrop]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropCallback,
    accept,
    multiple
  });

  return (
    <div 
      {...getRootProps()} 
      className={`dropzone ${isDragActive ? 'active' : ''}`}
    >
      <input {...getInputProps()} />
      <UploadCloud className="icon" />
      <p>{title}</p>
    </div>
  );
};

export default DropzoneArea;
