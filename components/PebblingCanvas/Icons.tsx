
import React from 'react';
import { 
  Plus, 
  Minus,
  Type, 
  Image as ImageIcon, 
  Sparkles, 
  Move, 
  Layout, 
  Settings,
  MoreHorizontal,
  X,
  Wand2,
  Check,
  Circle,
  Paperclip,
  Upload,
  GitCommit,
  Video,
  Layers,
  Scissors,
  MonitorUp,
  Play,
  Pause,
  Square,
  Download,
  Maximize,
  Pencil,
  Copy,
  Info,
  Wrench,
  Expand,
  Camera,
  Palette,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  Trash2,
  RefreshCw,
  ExternalLink,
  Globe,
  Columns,
  Package,
  Music,
  UserRoundPlus
} from 'lucide-react';

// 自定义SVG图标: 全能视频S (Video with S badge)
const VideoS: React.FC<{ size?: number; color?: string; className?: string }> = ({ 
  size = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    {/* 视频播放器主体 */}
    <rect x="2" y="4" width="15" height="14" rx="2" />
    {/* 播放三角 */}
    <polygon points="8,8 8,14 13,11" fill={color} stroke="none" />
    {/* S 徽章背景 */}
    <circle cx="19" cy="17" r="4.5" fill={color} stroke="none" />
    {/* S 字母 */}
    <path 
      d="M17.5 15.5c0.8-0.5 1.8-0.3 2.2 0.3s0.2 1.5-0.5 1.8c-1 0.4-1.7 0.6-1.7 1.2 0 0.4 0.4 0.7 1 0.7 0.5 0 1-0.2 1.2-0.4" 
      stroke="#1a1a1a" 
      strokeWidth="1.2" 
      fill="none"
    />
  </svg>
);

export const Icons = {
  Plus,
  Minus,
  Type,
  Image: ImageIcon,
  Sparkles,
  Move,
  Layout,
  Settings,
  More: MoreHorizontal,
  Close: X,
  Magic: Wand2,
  Check,
  Circle,
  Paperclip,
  Upload,
  Relay: GitCommit,
  Video,
  VideoS,
  Layers,
  Scissors,
  Upscale: MonitorUp,
  Play,
  Stop: Square,
  Download,
  Resize: Maximize,
  Edit: Pencil,
  Copy,
  Info,
  Wrench,
  Expand,
  Pause,
  Camera,
  Palette,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  Trash: Trash2,
  Refresh: RefreshCw,
  ExternalLink,
  Globe,
  Columns,
  Package,
  Music,
  CharacterExtract: UserRoundPlus
};
