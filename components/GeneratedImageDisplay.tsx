import React, { useState, useEffect, useMemo } from 'react';
import { ApiStatus } from '../types';
import type { GeneratedContent } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';
import { ZoomInIcon } from './icons/ZoomInIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import { EditIcon } from './icons/EditIcon';
import { EmptyState } from './EmptyState';
import { ImageIcon } from './icons/ImageIcon';
import { getMatchedStory } from '../services/storyLibrary';
import { normalizeImageUrl } from '../utils/image';

// 默认加载消息（当没有prompt时使用）
const defaultLoadingMessages = [
  "正在召唤 AI 创作精灵...",
  "正在用像素绘画...",
  "魔法正在发生，请稍候...",
  "正在融合创意与代码...",
  "高品质的艺术创作需要一点耐心！",
];

// 有趣的错误提示消息
const funnyErrorMessages = [
  { emoji: "🐧", title: "哎呀，企鹅滑倒了！", subtitle: "让我们给它一点时间站起来再试" },
  { emoji: "🧙‍♂️", title: "魔法能量不足！", subtitle: "可能需要更多的想象力燃料" },
  { emoji: "🛠️", title: "AI 在摸鱼！", subtitle: "我们已经通知它回来工作了" },
  { emoji: "🌌", title: "宇宙射线干扰！", subtitle: "或者只是网络有点小情绪" },
  { emoji: "🎨", title: "调色板打翻了！", subtitle: "让我们重新整理一下颜料" },
  { emoji: "🚀", title: "火箭发射失败！", subtitle: "但我们会再次尝试升空" },
  { emoji: "🔮", title: "水晶球变得混浊！", subtitle: "请稍等，让它重新清晰" },
  { emoji: "☕", title: "AI 去喝咖啡了！", subtitle: "它很快就会回来继续创作" },
];

// 获取随机的有趣错误消息
const getRandomFunnyError = () => {
  return funnyErrorMessages[Math.floor(Math.random() * funnyErrorMessages.length)];
};

const LoadingSpinner: React.FC<{ prompt?: string; imageSize?: string }> = ({ prompt = '', imageSize = '2K' }) => {
  // 使用 useMemo 确保故事在组件生命周期内保持不变
  const story = useMemo(() => {
    // 只要 prompt 存在（哪怕是空字符串），都尝试匹配故事主题
    // 如果没有匹配到，会使用默认主题 'magic'
    const result = getMatchedStory(prompt || '', imageSize);
    console.log('[Story] 匹配结果:', { 
      prompt: prompt?.slice(0, 50), 
      theme: result.theme.name, 
      messagesCount: result.messages.length 
    });
    return result;
  }, [prompt, imageSize]);

  const messages = story.messages;
  const interval = story.interval;
  const themeEmoji = story.theme.emoji;
  const themeName = story.theme.name;

  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length);
    }, interval);

    return () => clearInterval(intervalId);
  }, [messages.length, interval]);

  return (
    <div className="flex flex-col items-center justify-center gap-5 text-center max-w-md px-6 py-4">
      {/* 主题标识 */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
        <span className="text-lg">{themeEmoji}</span>
        <span>{themeName}主题故事</span>
      </div>
      <div className="w-20 h-20 border-4 border-dashed rounded-full animate-spin border-blue-400"></div>
      <p className="text-xl text-gray-200 font-semibold mt-2">AI 正在思考...</p>
      <p className="text-base text-gray-400 transition-all duration-500 leading-relaxed px-4 min-h-[4rem]">
        {messages[messageIndex]}
      </p>
      {/* 进度指示 */}
      <div className="flex gap-1.5 mt-2">
        {messages.map((_, idx) => (
          <div
            key={idx}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              idx === messageIndex ? 'bg-blue-400 scale-125' : 'bg-gray-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => {
  const [funnyError] = useState(() => getRandomFunnyError());
  
  return (
    <div className="flex flex-col items-center justify-center max-w-md mx-auto text-center">
      {/* 有趣的表情 */}
      <div className="text-6xl mb-4 animate-bounce">
        {funnyError.emoji}
      </div>
      
      {/* 有趣的标题 */}
      <h3 className="text-xl font-bold text-gray-200 mb-2">
        {funnyError.title}
      </h3>
      <p className="text-gray-400 text-sm mb-4">
        {funnyError.subtitle}
      </p>
      
      {/* 实际错误信息 */}
      <div className="p-3 border-l-4 border-gray-500 bg-gray-900/20 rounded-r-lg w-full">
        <p className="text-gray-300 text-xs text-left">
          <span className="font-semibold">技术详情：</span> {message}
        </p>
      </div>
      
      {/* 提示 */}
      <p className="text-[10px] text-gray-500 mt-4">
        💡 小提示：检查网络连接或尝试简化提示词
      </p>
    </div>
  );
};

interface GeneratedImageDisplayProps {
  status: ApiStatus;
  error: string | null;
  content: GeneratedContent | null;
  onPreviewClick: (url: string) => void;
  onEditAgain?: () => void; // 再次编辑：将生成的图片添加到上传列表
  onRegenerate?: () => void; // 重新生成：使用新的随机种子
  prompt?: string; // 用户提示词，用于匹配故事主题
  imageSize?: string; // 分辨率，用于决定故事长度
}

export const GeneratedImageDisplay: React.FC<GeneratedImageDisplayProps> = ({ 
  status, 
  error, 
  content, 
  onPreviewClick,
  onEditAgain,
  onRegenerate,
  prompt,
  imageSize
}) => {
  
  const handleDownload = async () => {
    if (!content?.imageUrl) return;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `ai-generated-${timestamp}.png`;
    
    // 使用 normalizeImageUrl 处理 URL
    const normalizedUrl = normalizeImageUrl(content.imageUrl);
    
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
    } catch (e) {
      // 如果fetch失败（CORS等问题），在新窗口打开
      console.error('下载失败，尝试在新窗口打开:', e);
      window.open(normalizedUrl, '_blank');
    }
  };

  const renderContent = () => {
    switch (status) {
      case ApiStatus.Loading:
        return <LoadingSpinner prompt={prompt} imageSize={imageSize} />;
      case ApiStatus.Error:
        return error ? <ErrorDisplay message={error} /> : null;
      case ApiStatus.Success:
        if (content?.imageUrl) {
          return (
             <div className="flex flex-col items-center gap-5">
                {/* 预览图 - 保持实际比例，占屏幕约一半 */}
                <div 
                  className="relative cursor-pointer rounded-2xl overflow-hidden shadow-2xl hover:scale-[1.01] transition-all duration-300 group"
                  onClick={() => onPreviewClick(content.imageUrl!)}
                >
                    <img 
                        src={normalizeImageUrl(content.imageUrl)} 
                        alt="Generated by AI" 
                        className="w-auto h-auto object-contain"
                        style={{
                            maxWidth: 'min(50vw, 600px)',
                            maxHeight: 'min(50vh, 500px)',
                            minWidth: '280px',
                            minHeight: '200px',
                        }}
                    />
                    {/* 悬浮遮罩 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-5">
                      <span className="text-white text-sm font-medium flex items-center gap-2 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full">
                        <ZoomInIcon className="w-4 h-4"/>
                        点击查看大图
                      </span>
                    </div>
                    {/* 放大标记 */}
                    <div className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <ZoomInIcon className="w-5 h-5 text-white"/>
                    </div>
                </div>
                
                {/* 操作按钮 - 配色：浓琉璃#004097、玄青#3b3c50、荔枝白#feffef */}
                <div className="flex items-center gap-2 flex-wrap justify-center">
                    <button onClick={() => onPreviewClick(content.imageUrl!)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gray-700/80 rounded-lg hover:bg-gray-600 transition-colors" aria-label="预览">
                        <ZoomInIcon className="w-3.5 h-3.5"/>
                        <span>预览</span>
                    </button>
                    <button 
                      onClick={handleDownload} 
                      className="flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg text-xs transition-colors hover:opacity-90" 
                      style={{ backgroundColor: '#004097', color: '#feffef' }}
                      aria-label="下载"
                    >
                        <DownloadIcon className="w-3.5 h-3.5"/>
                        <span>下载</span>
                    </button>
                    {onEditAgain && (
                      <button 
                        onClick={onEditAgain} 
                        className="flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg text-xs transition-colors hover:opacity-90" 
                        style={{ backgroundColor: '#3b3c50', color: '#feffef' }}
                        aria-label="再次编辑"
                      >
                          <EditIcon className="w-3.5 h-3.5"/>
                          <span>再编辑</span>
                      </button>
                    )}
                    {onRegenerate && (
                      <button 
                        onClick={onRegenerate} 
                        className="flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg text-xs transition-colors hover:opacity-90" 
                        style={{ backgroundColor: '#3b3c50', color: '#feffef' }}
                        aria-label="重新生成"
                      >
                          <RefreshIcon className="w-3.5 h-3.5"/>
                          <span>重生成</span>
                      </button>
                    )}
                </div>
            </div>
          );
        }
        return null;
      case ApiStatus.Idle:
      default:
        return (
          <div className="w-full h-full flex items-center justify-center">
            <EmptyState
              icon={<ImageIcon className="w-16 h-16 text-gray-700" />}
              text="您的作品将在这里展示"
              subtext="在右侧输入提示词，点击生成按钮即可创作"
            />
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center">
      {renderContent()}
    </div>
  );
};