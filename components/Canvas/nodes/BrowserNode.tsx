import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import type { CanvasNodeData } from '../index';
import { useTheme } from '../../../contexts/ThemeContext';
import { 
  X, 
  Globe, 
  ArrowLeft, 
  ArrowRight, 
  RotateCw, 
  Home, 
  Search,
  ExternalLink,
  Maximize2,
  Minimize2,
  Image as ImageIcon,
  Download,
  GripVertical
} from 'lucide-react';

interface BrowserNodeData extends CanvasNodeData {
  url?: string;
  title?: string;
  onImageDrop?: (imageUrl: string, imageName: string) => void;
}

const BrowserNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const { theme } = useTheme();
  const nodeData = data as BrowserNodeData;
  const webviewRef = useRef<Electron.WebviewTag | null>(null);
  
  // 状态
  const [url, setUrl] = useState(nodeData.url || 'https://www.google.com');
  const [inputUrl, setInputUrl] = useState(nodeData.url || 'https://www.google.com');
  const [pageTitle, setPageTitle] = useState('新标签页');
  const [isLoading, setIsLoading] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [pendingImage, setPendingImage] = useState<{url: string, name: string} | null>(null);

  // 节点尺寸
  const nodeWidth = isExpanded ? 800 : 480;
  const nodeHeight = isExpanded ? 600 : 400;

  // 处理 webview 事件
  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const handleDidStartLoading = () => setIsLoading(true);
    const handleDidStopLoading = () => {
      setIsLoading(false);
      setCanGoBack(webview.canGoBack());
      setCanGoForward(webview.canGoForward());
    };
    const handleDidNavigate = (event: any) => {
      setUrl(event.url);
      setInputUrl(event.url);
      // 更新节点数据
      if (nodeData.onEdit) {
        nodeData.onEdit(id, { url: event.url });
      }
    };
    const handlePageTitleUpdated = (event: any) => {
      setPageTitle(event.title || '新标签页');
      if (nodeData.onEdit) {
        nodeData.onEdit(id, { title: event.title });
      }
    };
    const handleDidFailLoad = (event: any) => {
      console.error('[BrowserNode] 加载失败:', event.errorDescription);
      setIsLoading(false);
    };
    
    // 处理来自 webview 的 IPC 消息（图片点击）
    const handleIpcMessage = (event: any) => {
      if (event.channel === 'image-clicked') {
        const { src, alt } = event.args[0];
        console.log('[BrowserNode] 收到图片点击:', src);
        setPendingImage({ url: src, name: alt || 'browser-image' });
      }
    };

    webview.addEventListener('did-start-loading', handleDidStartLoading);
    webview.addEventListener('did-stop-loading', handleDidStopLoading);
    webview.addEventListener('did-navigate', handleDidNavigate);
    webview.addEventListener('did-navigate-in-page', handleDidNavigate);
    webview.addEventListener('page-title-updated', handlePageTitleUpdated);
    webview.addEventListener('did-fail-load', handleDidFailLoad);
    webview.addEventListener('ipc-message', handleIpcMessage);

    return () => {
      webview.removeEventListener('did-start-loading', handleDidStartLoading);
      webview.removeEventListener('did-stop-loading', handleDidStopLoading);
      webview.removeEventListener('did-navigate', handleDidNavigate);
      webview.removeEventListener('did-navigate-in-page', handleDidNavigate);
      webview.removeEventListener('page-title-updated', handlePageTitleUpdated);
      webview.removeEventListener('did-fail-load', handleDidFailLoad);
      webview.removeEventListener('ipc-message', handleIpcMessage);
    };
  }, [id, nodeData.onEdit]);

  // 注入图片交互脚本到 webview
  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const injectScript = () => {
      // 注入脚本：为图片添加双击事件，点击后通过 IPC 发送给主进程
      webview.executeJavaScript(`
        (function() {
          // 防止重复注入
          if (window.__browserNodeInjected) return;
          window.__browserNodeInjected = true;

          // 样式
          const style = document.createElement('style');
          style.textContent = \`
            img {
              cursor: pointer !important;
              transition: outline 0.2s ease !important;
            }
            img:hover {
              outline: 3px solid #f97316 !important;
              outline-offset: 2px !important;
            }
            .__browser-node-tooltip {
              position: fixed;
              background: rgba(0,0,0,0.8);
              color: white;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              pointer-events: none;
              z-index: 999999;
              white-space: nowrap;
            }
          \`;
          document.head.appendChild(style);

          // 创建提示
          let tooltip = null;
          
          function showTooltip(e, text) {
            if (!tooltip) {
              tooltip = document.createElement('div');
              tooltip.className = '__browser-node-tooltip';
              document.body.appendChild(tooltip);
            }
            tooltip.textContent = text;
            tooltip.style.left = (e.clientX + 10) + 'px';
            tooltip.style.top = (e.clientY + 10) + 'px';
            tooltip.style.display = 'block';
          }
          
          function hideTooltip() {
            if (tooltip) tooltip.style.display = 'none';
          }

          // 监听图片事件
          document.addEventListener('mouseover', function(e) {
            if (e.target.tagName === 'IMG' && e.target.src) {
              showTooltip(e, '双击添加到画布');
            }
          }, true);
          
          document.addEventListener('mouseout', function(e) {
            if (e.target.tagName === 'IMG') {
              hideTooltip();
            }
          }, true);
          
          document.addEventListener('mousemove', function(e) {
            if (e.target.tagName === 'IMG' && tooltip && tooltip.style.display !== 'none') {
              tooltip.style.left = (e.clientX + 10) + 'px';
              tooltip.style.top = (e.clientY + 10) + 'px';
            }
          }, true);

          // 双击图片发送到画布
          document.addEventListener('dblclick', function(e) {
            const img = e.target;
            if (img.tagName === 'IMG' && img.src) {
              e.preventDefault();
              e.stopPropagation();
              
              // 通过 IPC 发送给主进程
              const { ipcRenderer } = require('electron');
              ipcRenderer.sendToHost('image-clicked', {
                src: img.src,
                alt: img.alt || img.title || 'image',
                width: img.naturalWidth,
                height: img.naturalHeight
              });
              
              // 视觉反馈
              img.style.outline = '3px solid #22c55e';
              setTimeout(() => {
                img.style.outline = '';
              }, 500);
            }
          }, true);

          console.log('[BrowserNode] 交互脚本已注入');
        })();
      `).catch(err => console.log('[BrowserNode] 脚本注入失败:', err));
    };

    webview.addEventListener('did-finish-load', injectScript);
    webview.addEventListener('dom-ready', injectScript);

    return () => {
      webview.removeEventListener('did-finish-load', injectScript);
      webview.removeEventListener('dom-ready', injectScript);
    };
  }, []);

  // 处理待添加的图片
  const handleAddPendingImage = useCallback(() => {
    if (pendingImage && nodeData.onImageDrop) {
      nodeData.onImageDrop(pendingImage.url, pendingImage.name);
      setPendingImage(null);
    }
  }, [pendingImage, nodeData.onImageDrop]);

  // 取消待添加的图片
  const handleCancelPendingImage = useCallback(() => {
    setPendingImage(null);
  }, []);

  // 导航操作
  const goBack = () => webviewRef.current?.goBack();
  const goForward = () => webviewRef.current?.goForward();
  const reload = () => webviewRef.current?.reload();
  const goHome = () => {
    setInputUrl('https://www.google.com');
    if (webviewRef.current) {
      webviewRef.current.src = 'https://www.google.com';
    }
  };

  // URL 导航
  const handleNavigate = () => {
    let targetUrl = inputUrl.trim();
    if (!targetUrl) return;
    
    // 自动添加协议
    if (!targetUrl.match(/^https?:\/\//i)) {
      // 检查是否像域名
      if (targetUrl.includes('.') && !targetUrl.includes(' ')) {
        targetUrl = 'https://' + targetUrl;
      } else {
        // 作为搜索词
        targetUrl = `https://www.google.com/search?q=${encodeURIComponent(targetUrl)}`;
      }
    }
    
    setInputUrl(targetUrl);
    if (webviewRef.current) {
      webviewRef.current.src = targetUrl;
    }
  };

  // 在新窗口打开
  const openInExternal = () => {
    if (url && (window as any).electron?.shell) {
      (window as any).electron.shell.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div
      className={`rounded-2xl border-2 overflow-hidden transition-all backdrop-blur-xl`}
      style={{
        width: nodeWidth,
        borderColor: selected ? '#f97316' : 'rgba(249, 115, 22, 0.4)',
        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(249, 115, 22, 0.05))',
        boxShadow: selected ? '0 10px 40px -10px rgba(249, 115, 22, 0.4)' : '0 4px 20px -4px rgba(0,0,0,0.5)',
      }}
    >
      {/* 输入连接点 */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ top: '28px' }}
        className="!w-4 !h-4 !bg-orange-400 !border-2 !border-orange-600 hover:!scale-125 transition-transform"
      />

      {/* 节点头部 - 可拖拽 */}
      <div 
        className="px-4 py-3 flex items-center gap-3 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)' }}
      >
        <GripVertical className="w-4 h-4 text-gray-500 cursor-move" />
        <Globe className="w-5 h-5 text-orange-400" />
        <span className="text-sm font-bold text-orange-300 flex-1 truncate nodrag" title={pageTitle}>
          {pageTitle}
        </span>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-6 h-6 rounded-lg bg-white/10 hover:bg-orange-500/30 flex items-center justify-center text-gray-400 hover:text-orange-300 transition-all nodrag"
          title={isExpanded ? '缩小' : '放大'}
        >
          {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={openInExternal}
          className="w-6 h-6 rounded-lg bg-white/10 hover:bg-orange-500/30 flex items-center justify-center text-gray-400 hover:text-orange-300 transition-all nodrag"
          title="在浏览器中打开"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => nodeData.onDelete?.(id)}
          className="w-6 h-6 rounded-lg bg-white/10 hover:bg-red-500/30 flex items-center justify-center text-gray-400 hover:text-red-300 transition-all nodrag"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 地址栏 */}
      <div 
        className="px-3 py-2 flex items-center gap-2 border-b nodrag"
        style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}
      >
        {/* 导航按钮 */}
        <button
          onClick={goBack}
          disabled={!canGoBack}
          className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="后退"
        >
          <ArrowLeft className="w-4 h-4 text-gray-400" />
        </button>
        <button
          onClick={goForward}
          disabled={!canGoForward}
          className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="前进"
        >
          <ArrowRight className="w-4 h-4 text-gray-400" />
        </button>
        <button
          onClick={reload}
          className={`p-1.5 rounded-lg hover:bg-white/10 transition-all ${isLoading ? 'animate-spin' : ''}`}
          title="刷新"
        >
          <RotateCw className="w-4 h-4 text-gray-400" />
        </button>
        <button
          onClick={goHome}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-all"
          title="主页"
        >
          <Home className="w-4 h-4 text-gray-400" />
        </button>

        {/* URL 输入框 */}
        <div className="flex-1 flex items-center gap-2 bg-black/30 rounded-lg px-3 py-1.5 border border-white/10 focus-within:border-orange-500/50">
          <Search className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNavigate()}
            placeholder="输入网址或搜索..."
            className="flex-1 bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none"
          />
          {isLoading && (
            <div className="w-3 h-3 border-2 border-orange-400/30 border-t-orange-400 rounded-full animate-spin" />
          )}
        </div>
      </div>

      {/* WebView 容器 */}
      <div 
        className="relative nodrag"
        style={{ height: nodeHeight - 110 }}
      >
        <webview
          ref={webviewRef as any}
          src={url}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
          // @ts-ignore
          allowpopups="true"
          // @ts-ignore
          webpreferences="contextIsolation=no"
          // @ts-ignore
          preload=""
        />

        {/* 待添加图片弹窗 */}
        {pendingImage && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-20">
            <div className="bg-gray-900/95 rounded-2xl p-4 border border-orange-500/30 max-w-[280px] shadow-2xl">
              <div className="text-sm text-white font-medium mb-3 text-center">添加图片到画布？</div>
              <div className="mb-3 rounded-lg overflow-hidden border border-white/10">
                <img 
                  src={pendingImage.url} 
                  alt={pendingImage.name}
                  className="w-full h-32 object-contain bg-black/50"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23666">加载失败</text></svg>';
                  }}
                />
              </div>
              <div className="text-xs text-gray-400 truncate mb-3 px-1" title={pendingImage.url}>
                {pendingImage.name}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCancelPendingImage}
                  className="flex-1 px-3 py-2 text-xs bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleAddPendingImage}
                  className="flex-1 px-3 py-2 text-xs bg-orange-500 hover:bg-orange-400 text-white rounded-lg transition-colors font-medium"
                >
                  添加到画布
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 底部提示栏 */}
      <div 
        className="px-3 py-2 flex items-center justify-between border-t nodrag"
        style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}
      >
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          <ImageIcon className="w-3 h-3" />
          <span>双击网页中的图片添加到画布</span>
        </div>
        {isLoading && (
          <span className="text-[10px] text-orange-400">加载中...</span>
        )}
      </div>

      {/* 输出连接点 */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ top: '28px' }}
        className="!w-4 !h-4 !bg-orange-400 !border-2 !border-orange-600 hover:!scale-125 transition-transform"
      />
    </div>
  );
};

export default memo(BrowserNode);
