import React, { useState, useCallback, useEffect } from 'react';
import { XCircle as XCircleIcon, PlusCircle as PlusCircleIcon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ImageUploaderProps {
  files: File[];
  activeFileIndex: number | null;
  onFileChange: (files: FileList | null) => void;
  onFileRemove: (index: number) => void;
  onFileSelect: (index: number) => void;
  onTriggerUpload: () => void;
}

const Thumbnail: React.FC<{
  file: File;
  isActive: boolean;
  onClick: () => void;
  onRemove: (e: React.MouseEvent) => void;
  isLight: boolean;
}> = ({ file, isActive, onClick, onRemove }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div
      onClick={onClick}
      className={`relative group aspect-square rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 ${isActive ? 'ring-2 ring-blue-500' : 'border border-white/10 hover:border-white/20'}`}
    >
      {previewUrl && <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      <button
        onClick={onRemove}
        className="absolute top-1.5 right-1.5 p-1 bg-black/60 text-white hover:bg-gray-500 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
        aria-label={`移除图片 ${file.name}`}
      >
        <XCircleIcon className="w-4 h-4" />
      </button>
    </div>
  );
};


export const ImageUploader: React.FC<ImageUploaderProps> = ({ files, activeFileIndex, onFileChange, onFileRemove, onFileSelect, onTriggerUpload }) => {
  const { themeName, theme } = useTheme();
  const isLight = themeName === 'light';
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEvents = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      onFileChange(e.dataTransfer.files);
    }
  }, [onFileChange]);

  return (
    <div 
      className={`w-full flex-grow flex flex-col border-2 border-dashed rounded-2xl p-4 transition-all duration-200 min-h-0 ${
        isDragging ? 'border-blue-500 bg-blue-500/5' : ''
      }`}
      style={{
        background: isDragging ? undefined : theme.colors.bgSecondary,
        borderColor: isDragging ? undefined : theme.colors.border,
      }}
      onDragEnter={handleDragEvents}
      onDragOver={handleDragEvents}
      onDragLeave={handleDragEvents}
      onDrop={handleDrop}
    >
      {files.length === 0 ? (
        /* 无图片时居中显示上传按钮 */
        <div className="flex-grow flex items-center justify-center">
          <button
            onClick={onTriggerUpload}
            className="w-24 h-24 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 border-2 border-dashed"
            style={{
              backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
              borderColor: theme.colors.border,
              color: theme.colors.textMuted
            }}
            aria-label="上传新图片"
          >
            <PlusCircleIcon className="w-10 h-10"/>
            <span className="text-xs mt-1.5 font-medium">上传图片</span>
          </button>
        </div>
      ) : (
        /* 有图片时使用grid布局 - 根据图片数量调整列数 */
        <div className={`grid gap-3 pr-1 flex-grow ${
          files.length <= 2 ? 'grid-cols-2' : 'grid-cols-3'
        }`}>
          {files.map((file, index) => (
            <Thumbnail 
              key={`${file.name}-${index}`}
              file={file}
              isActive={index === activeFileIndex}
              onClick={() => onFileSelect(index)}
              onRemove={(e) => {
                e.stopPropagation();
                onFileRemove(index);
              }}
              isLight={isLight}
            />
          ))}
          <button
            onClick={onTriggerUpload}
            className="aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
              color: theme.colors.textMuted
            }}
            aria-label="上传新图片"
          >
            <PlusCircleIcon className="w-8 h-8"/>
            <span className="text-xs mt-1">上传</span>
          </button>
        </div>
      )}
      <p className="text-xs mt-3 text-center" style={{ color: theme.colors.textMuted }}>
        {isDragging ? "松开即可上传" : "可拖拽图片到此区域"}
      </p>
    </div>
  );
};