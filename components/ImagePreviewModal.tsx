import React, { useState, useRef, useEffect } from 'react';
import { XCircle as XCircleIcon, ZoomIn as ZoomInIcon, ZoomOut as ZoomOutIcon, RotateCcw as ResetZoomIcon, Download as DownloadIcon } from 'lucide-react';
import { normalizeImageUrl } from '../utils/image';

// 🔧 检测是否为视频URL
const isVideoUrl = (url: string): boolean => {
  if (!url) return false;
  return url.includes('.mp4') || url.includes('.webm') || url.startsWith('data:video');
};


interface ImagePreviewModalProps {
  imageUrl: string;
  onClose: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ imageUrl, onClose }) => {
  // ESC 键关闭 - 使用 capture 模式确保优先捕获
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };
    // 使用 capture 阶段确保模态框优先处理 ESC
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [onClose]);

  const [transform, setTransform] = useState({ scale: 1, posX: 0, posY: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageError, setImageError] = useState(false);

  const handleZoomIn = () => setTransform(t => ({...t, scale: Math.min(t.scale + 0.2, 5)}));
  const handleZoomOut = () => setTransform(t => ({...t, scale: Math.max(t.scale - 0.2, 0.5)}));
  const handleReset = () => setTransform({ scale: 1, posX: 0, posY: 0 });

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setTransform(t => ({...t, scale: Math.max(0.5, Math.min(t.scale + delta, 5))}));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || transform.scale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
        x: e.clientX - transform.posX,
        y: e.clientY - transform.posY,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || transform.scale <= 1) return;
    e.preventDefault();
    setTransform(prev => ({
        ...prev,
        posX: e.clientX - dragStart.x,
        posY: e.clientY - dragStart.y,
    }));
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `ai-generated-${timestamp}.png`;
    
    // 使用 normalizeImageUrl 处理 URL
    const normalizedUrl = normalizeImageUrl(imageUrl);
    
    // 如果是 base64 数据，直接下载
    if (normalizedUrl.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = normalizedUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    
    // 对于外部URL，尝试使用fetch获取blob后下载
    try {
      const response = await fetch(normalizedUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // 如果fetch失败（CORS等问题），在新窗口打开
      console.error('下载失败，尝试在新窗口打开:', err);
      window.open(normalizedUrl, '_blank');
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image Preview"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      
      <div 
        className="relative flex items-center justify-center overflow-hidden rounded-xl"
        style={{ maxWidth: '90vw', maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
      >
        {isVideoUrl(imageUrl) ? (
          /* 🔧 视频预览 */
          <video
            src={imageUrl.startsWith('/files/') ? `http://localhost:8765${imageUrl}` : normalizeImageUrl(imageUrl)}
            controls
            autoPlay
            loop
            className="block rounded-lg shadow-2xl"
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              width: 'auto',
              height: 'auto',
            }}
          />
        ) : imageError ? (
          <div className="flex flex-col items-center justify-center p-8 bg-gray-800/50 rounded-lg">
            <p className="text-gray-400 mb-2">图片加载失败</p>
            <p className="text-xs text-gray-500">第三方图片可能已过期或无法访问</p>
            <a 
              href={normalizeImageUrl(imageUrl)} 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-3 text-xs text-blue-400 hover:text-blue-300 underline"
            >
              在新窗口打开原图
            </a>
          </div>
        ) : (
          <img 
              src={normalizeImageUrl(imageUrl)} 
              alt="Image Preview" 
              className="block rounded-lg shadow-2xl"
              style={{ 
                  maxWidth: '90vw',
                  maxHeight: '90vh',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  transform: `translate(${transform.posX}px, ${transform.posY}px) scale(${transform.scale})`,
                  cursor: transform.scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              }}
              draggable={false}
              onMouseDown={handleMouseDown}
              onError={() => setImageError(true)}
          />
        )}
      </div>

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-gray-900/70 backdrop-blur-sm rounded-full p-2 flex items-center gap-2 shadow-lg z-10">
          <button onClick={handleZoomOut} className="p-2 text-white rounded-full hover:bg-gray-700 transition-colors" aria-label="缩小 / Zoom out"><ZoomOutIcon className="w-6 h-6" /></button>
          <button onClick={handleReset} className="p-2 text-white rounded-full hover:bg-gray-700 transition-colors" aria-label="重置缩放 / Reset zoom"><ResetZoomIcon className="w-6 h-6" /></button>
          <button onClick={handleZoomIn} className="p-2 text-white rounded-full hover:bg-gray-700 transition-colors" aria-label="放大 / Zoom in"><ZoomInIcon className="w-6 h-6" /></button>
          <div className="w-px h-6 bg-gray-600 mx-1"></div>
          <button onClick={handleDownload} className="p-2 text-white rounded-full hover:bg-gray-700 transition-colors" aria-label="下载 / Download"><DownloadIcon className="w-6 h-6" /></button>
      </div>
        
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-white bg-gray-800/70 rounded-full p-1 hover:bg-gray-700 transition-colors z-10"
        aria-label="关闭预览 / Close preview"
      >
        <XCircleIcon className="w-8 h-8" />
      </button>
    </div>
  );
};