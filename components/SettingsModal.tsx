import React, { useState, useEffect } from 'react';
import { ThirdPartyApiConfig } from '../types';
import { useTheme, ThemeName } from '../contexts/ThemeContext';
import { SoraConfig, getSoraConfig, saveSoraConfig } from '../services/soraService';
import { VeoConfig, getVeoConfig, saveVeoConfig } from '../services/veoService';
import { Plug, Gem, Eye as EyeIcon, EyeOff as EyeOffIcon, Key as KeyIcon, Moon as MoonIcon, Sun as SunIcon, Save as SaveIcon, Cpu as CpuIcon, Info as InfoIcon, Check, X, Video, RefreshCw } from 'lucide-react';

// 应用版本号 - 从vite构建时注入，来源于package.json
declare const __APP_VERSION__: string;
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';

// 主题图标映射 - 只保留深夜和白天
const themeIconMap: Record<ThemeName, React.FC<{ className?: string }>> = {
  dark: MoonIcon,
  light: SunIcon,
};

// 主题颜色预览 - 用于展示主题特色
const themePreviewColors: Record<ThemeName, string[]> = {
  dark: ['#3b82f6', '#1a1a24', '#60a5fa'],
  light: ['#2563eb', '#ffffff', '#3b82f6'],
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // API 配置
  thirdPartyConfig: ThirdPartyApiConfig;
  onThirdPartyConfigChange: (config: ThirdPartyApiConfig) => void;
  geminiApiKey: string;
  onGeminiApiKeySave: (key: string) => void;
  // 自动保存
  autoSaveEnabled: boolean;
  onAutoSaveToggle: (enabled: boolean) => void;
}

type ApiMode = 'local-thirdparty' | 'local-gemini';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  thirdPartyConfig,
  onThirdPartyConfigChange,
  geminiApiKey,
  onGeminiApiKeySave,
  autoSaveEnabled,
  onAutoSaveToggle,
}) => {
  const { themeName, setTheme, allThemes, theme } = useTheme();
  const isLight = themeName === 'light';
  const colors = theme.colors;
  
  // 直接从props判断当前模式
  const activeMode: ApiMode = thirdPartyConfig.enabled ? 'local-thirdparty' : 'local-gemini';
  
  const [localThirdPartyUrl, setLocalThirdPartyUrl] = useState(thirdPartyConfig.baseUrl || '');
  const [localThirdPartyKey, setLocalThirdPartyKey] = useState(thirdPartyConfig.apiKey || '');
  const [localGeminiKey, setLocalGeminiKey] = useState(geminiApiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSoraKey, setShowSoraKey] = useState(false);
  const [showVeoKey, setShowVeoKey] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  
  // Sora 视频 API 配置
  const [soraConfig, setSoraConfig] = useState<SoraConfig>({
    apiKey: '',
    baseUrl: 'https://api.openai.com'
  });
  
  // Veo3.1 视频 API 配置
  const [veoConfig, setVeoConfig] = useState<VeoConfig>({
    apiKey: '',
    baseUrl: 'https://ai.t8star.cn'
  });

  // 更新检查状态
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'up-to-date' | 'error'>('idle');
  const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;

  // 同步本地输入状态
  useEffect(() => {
    setLocalThirdPartyUrl(thirdPartyConfig.baseUrl || '');
    setLocalThirdPartyKey(thirdPartyConfig.apiKey || '');
  }, [thirdPartyConfig.baseUrl, thirdPartyConfig.apiKey]);

  useEffect(() => {
    setLocalGeminiKey(geminiApiKey || '');
  }, [geminiApiKey]);

  // 加载 Sora 配置
  useEffect(() => {
    if (isOpen) {
      const savedSoraConfig = getSoraConfig();
      setSoraConfig(savedSoraConfig);
      const savedVeoConfig = getVeoConfig();
      setVeoConfig(savedVeoConfig);
      setUpdateStatus('idle'); // 重置更新状态
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 切换模式 - 立即更新父组件状态
  const handleModeChange = (mode: ApiMode) => {
    if (mode === 'local-thirdparty') {
      // 切换到贞贞API
      onThirdPartyConfigChange({
        ...thirdPartyConfig,
        enabled: true,
      });
    } else {
      // 切换到Gemini
      onThirdPartyConfigChange({
        ...thirdPartyConfig,
        enabled: false,
      });
    }
  };

  const handleSaveLocalThirdParty = () => {
    onThirdPartyConfigChange({
      ...thirdPartyConfig,
      enabled: true,
      apiKey: localThirdPartyKey,
      baseUrl: localThirdPartyUrl,
    });
    setSaveSuccessMessage('贞贞 API 配置已保存');
    setTimeout(() => setSaveSuccessMessage(null), 2000);
  };

  const handleSaveGeminiKey = () => {
    onGeminiApiKeySave(localGeminiKey);
    setSaveSuccessMessage('Gemini API Key 已保存');
    setTimeout(() => setSaveSuccessMessage(null), 2000);
  };

  const handleSaveSoraConfig = () => {
    saveSoraConfig(soraConfig);
    setSaveSuccessMessage('Sora 视频 API 已保存');
    setTimeout(() => setSaveSuccessMessage(null), 2000);
  };

  const handleSaveVeoConfig = () => {
    saveVeoConfig(veoConfig);
    setSaveSuccessMessage('Veo3.1 视频 API 已保存');
    setTimeout(() => setSaveSuccessMessage(null), 2000);
  };

  // 检查更新
  const handleCheckUpdate = async () => {
    if (!isElectron) {
      setSaveSuccessMessage('请在桌面客户端中检查更新');
      setTimeout(() => setSaveSuccessMessage(null), 3000);
      return;
    }
    setUpdateStatus('checking');
    try {
      const result = await (window as any).electronAPI.checkForUpdates();
      if (result.status === 'dev-mode') {
        setUpdateStatus('idle');
        setSaveSuccessMessage('开发模式下不检查更新');
        setTimeout(() => setSaveSuccessMessage(null), 2000);
      } else if (result.status === 'checking') {
        // 检查中，等待 autoUpdater 事件回调
        setTimeout(() => {
          // 如果 3 秒后还是 checking 状态，说明已是最新
          setUpdateStatus(prev => {
            if (prev === 'checking') {
              setSaveSuccessMessage('已是最新版本');
              setTimeout(() => setSaveSuccessMessage(null), 2000);
              return 'up-to-date';
            }
            return prev;
          });
        }, 3000);
      } else if (result.status === 'error') {
        setUpdateStatus('error');
        setSaveSuccessMessage('检查更新失败');
        setTimeout(() => setSaveSuccessMessage(null), 2000);
      }
    } catch (err) {
      setUpdateStatus('error');
      setSaveSuccessMessage('检查更新失败');
      setTimeout(() => setSaveSuccessMessage(null), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 弹窗内容 */}
      <div 
        className="relative w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden animate-fade-in"
        style={{
          background: `linear-gradient(180deg, rgba(23, 23, 23, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%)`,
          borderColor: 'rgba(255, 255, 255, 0.08)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)'
        }}
      >
        {/* 保存成功提示 */}
        {saveSuccessMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 text-white text-sm font-medium rounded-lg shadow-lg animate-fade-in flex items-center gap-2"
            style={{ background: colors.primary }}>
            <Check className="w-4 h-4" fill="currentColor" />
            {saveSuccessMessage}
          </div>
        )}
        {/* 头部 */}
        <div className="p-6 border-b" style={{ borderColor: colors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold" style={{ color: colors.textPrimary }}>设置</h2>
              <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>配置 API 连接方式</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
              style={{ 
                background: colors.bgTertiary,
                color: colors.textSecondary
              }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {/* API 模式选择 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: colors.textSecondary }}>API 连接方式</h3>
            
            {/* 本地贞贞 API 模式 */}
            <div
              onClick={() => handleModeChange('local-thirdparty')}
              className="relative p-4 rounded-xl border-2 cursor-pointer transition-all"
              style={{
                borderColor: activeMode === 'local-thirdparty' ? colors.primary : colors.border,
                background: activeMode === 'local-thirdparty' ? `${colors.primary}15` : colors.bgTertiary
              }}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: activeMode === 'local-thirdparty' ? colors.primary : colors.bgTertiary }}>
                  <Plug className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold" style={{ color: colors.textPrimary }}>贞贞 API</h4>
                  <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                    使用贞贞 API，支持 nano-banana 等模型
                  </p>
                </div>
              </div>
              {activeMode === 'local-thirdparty' && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: colors.primary }}>
                  <Check className="w-3 h-3 text-white" fill="currentColor" />
                </div>
              )}
            </div>

            {/* 本地贞贞 API 配置表单 */}
            {activeMode === 'local-thirdparty' && (
              <div className="ml-14 space-y-3 animate-fade-in">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: colors.textSecondary }}>API 地址</label>
                  <input
                    type="text"
                    value={localThirdPartyUrl}
                    onChange={(e) => setLocalThirdPartyUrl(e.target.value)}
                    placeholder="https://ai.t8star.cn"
                    className="w-full px-3 py-2 text-sm border rounded-lg transition-all outline-none"
                    style={{
                      background: colors.bgPrimary,
                      borderColor: colors.border,
                      color: colors.textPrimary
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: colors.textSecondary }}>API Key</label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={localThirdPartyKey}
                      onChange={(e) => setLocalThirdPartyKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full px-3 py-2 pr-10 text-sm border rounded-lg transition-all outline-none"
                      style={{
                        background: colors.bgPrimary,
                        borderColor: colors.border,
                        color: colors.textPrimary
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
                      style={{ color: colors.textSecondary }}
                    >
                      {showApiKey ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <a
                  href="https://ai.t8star.cn/register?aff=64350e39653"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 text-xs font-medium text-center rounded-lg transition-all hover:opacity-80 flex items-center justify-center gap-1.5"
                  style={{
                    backgroundColor: colors.bgTertiary,
                    color: colors.primary,
                    border: `1px solid ${colors.border}`
                  }}
                >
                  <KeyIcon className="w-3.5 h-3.5" />
                  <span>获取 Key</span>
                </a>
                <button
                  onClick={handleSaveLocalThirdParty}
                  className="w-full py-2 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90"
                  style={{ background: colors.primary }}
                >
                  保存配置
                </button>
              </div>
            )}

            {/* 本地 Gemini API 模式 */}
            <div
              onClick={() => handleModeChange('local-gemini')}
              className="relative p-4 rounded-xl border-2 cursor-pointer transition-all"
              style={{
                borderColor: activeMode === 'local-gemini' ? colors.primary : colors.border,
                background: activeMode === 'local-gemini' ? `${colors.primary}15` : colors.bgTertiary
              }}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: activeMode === 'local-gemini' ? colors.primary : colors.bgTertiary }}>
                  <Gem className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold" style={{ color: colors.textPrimary }}>Gemini API</h4>
                  <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                    使用 Google Gemini API Key，直接从浏览器请求
                  </p>
                </div>
              </div>
              {activeMode === 'local-gemini' && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: colors.primary }}>
                  <Check className="w-3 h-3 text-white" fill="currentColor" />
                </div>
              )}
            </div>

            {/* 本地 Gemini API 配置表单 */}
            {activeMode === 'local-gemini' && (
              <div className="ml-14 space-y-3 animate-fade-in">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: colors.textSecondary }}>Gemini API Key</label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={localGeminiKey}
                      onChange={(e) => setLocalGeminiKey(e.target.value)}
                      placeholder="AIza..."
                      className="w-full px-3 py-2 pr-10 text-sm border rounded-lg transition-all outline-none"
                      style={{
                        background: colors.bgPrimary,
                        borderColor: colors.border,
                        color: colors.textPrimary
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
                      style={{ color: colors.textSecondary }}
                    >
                      {showApiKey ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleSaveGeminiKey}
                  className="w-full py-2 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90"
                  style={{ background: colors.primary }}
                >
                  保存配置
                </button>
              </div>
            )}
          </div>

          {/* 分割线 */}
          <div style={{ borderTop: `1px solid ${colors.border}` }} />

          {/* 主题设置 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: colors.textSecondary }}>主题外观</h3>
            
            <div className="grid grid-cols-2 gap-3">
              {allThemes.map((t) => {
                const ThemeIcon = themeIconMap[t.name];
                const previewColors = themePreviewColors[t.name];
                const isActive = themeName === t.name;
                
                return (
                  <button
                    key={t.name}
                    onClick={() => setTheme(t.name)}
                    className="relative p-3 rounded-xl border-2 transition-all hover:scale-[1.02] group"
                    style={{
                      borderColor: isActive ? colors.primary : colors.border,
                      background: isActive ? `${colors.primary}10` : colors.bgTertiary
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {/* 图标容器 */}
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110"
                        style={{ 
                          background: isActive 
                            ? `linear-gradient(135deg, ${previewColors[0]}, ${previewColors[2]})`
                            : colors.bgSecondary,
                          boxShadow: isActive ? `0 4px 12px ${previewColors[0]}40` : 'none'
                        }}
                      >
                        <ThemeIcon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                      </div>
                      
                      {/* 主题信息 */}
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                          {t.displayName}
                        </p>
                        {/* 颜色预览条 */}
                        <div className="flex gap-1 mt-1.5">
                          {previewColors.map((color, i) => (
                            <div 
                              key={i}
                              className="h-1.5 rounded-full flex-1 transition-all"
                              style={{ 
                                background: color,
                                opacity: isActive ? 1 : 0.5
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* 选中标记 */}
                    {isActive && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow-lg"
                        style={{ background: colors.primary }}>
                        <Check className="w-3 h-3 text-white" fill="currentColor" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* 圣诞主题特别提示 - 已移除 */}
          </div>

          {/* 分割线 */}
          <div style={{ borderTop: `1px solid ${colors.border}` }} />

          {/* 其他设置 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: colors.textSecondary }}>功能设置</h3>
            
            {/* 自动保存 */}
            <div className="flex items-center justify-between p-3 rounded-xl border"
              style={{ background: colors.bgTertiary, borderColor: colors.border }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: `${colors.primary}15` }}>
                  <SaveIcon className="w-4.5 h-4.5" style={{ color: colors.primary }} />
                </div>
                <div>
                  <h4 className="text-sm font-medium" style={{ color: colors.textPrimary }}>自动保存</h4>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>生成图片后自动下载到本地</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={autoSaveEnabled} 
                  onChange={(e) => onAutoSaveToggle(e.target.checked)}
                />
                <div className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all transition-colors"
                  style={{ background: autoSaveEnabled ? colors.primary : colors.bgSecondary }}></div>
              </label>
            </div>

            {/* 当前模型显示 */}
            <div className="flex items-center justify-between p-3 rounded-xl border"
              style={{ background: colors.bgTertiary, borderColor: colors.border }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: `${colors.accent}15` }}>
                  <CpuIcon className="w-4.5 h-4.5" style={{ color: colors.accent }} />
                </div>
                <div>
                  <h4 className="text-sm font-medium" style={{ color: colors.textPrimary }}>当前模型</h4>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>正在使用的 AI 模型</p>
                </div>
              </div>
              <span className="text-xs font-medium px-3 py-1.5 rounded-lg"
                style={{ background: `${colors.primary}15`, color: colors.primaryLight, border: `1px solid ${colors.primary}25` }}>
                {activeMode === 'local-thirdparty' 
                  ? thirdPartyConfig.model || 'nano-banana-2' 
                  : 'Gemini 3 Pro'}
              </span>
            </div>
          </div>

          {/* 分割线 */}
          <div style={{ borderTop: `1px solid ${colors.border}` }} />

          {/* 视频 API 设置 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: colors.textSecondary }}>视频生成 API</h3>
            
            {/* Sora API */}
            <div className="p-4 rounded-xl border" style={{ background: colors.bgTertiary, borderColor: colors.border }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #9333ea, #ec4899)' }}>
                  <Video className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold" style={{ color: colors.textPrimary }}>Sora 视频生成</h4>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>OpenAI Sora API 或兼容服务</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: colors.textSecondary }}>API 地址</label>
                  <input
                    type="text"
                    value={soraConfig.baseUrl}
                    onChange={(e) => setSoraConfig({ ...soraConfig, baseUrl: e.target.value })}
                    placeholder="https://api.openai.com"
                    className="w-full px-3 py-2 text-sm border rounded-lg transition-all outline-none"
                    style={{
                      background: colors.bgPrimary,
                      borderColor: colors.border,
                      color: colors.textPrimary
                    }}
                  />
                  <p className="text-xs mt-1" style={{ color: colors.textMuted }}>支持 T8star 等第三方代理地址</p>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: colors.textSecondary }}>Sora API Key</label>
                  <div className="relative">
                    <input
                      type={showSoraKey ? 'text' : 'password'}
                      value={soraConfig.apiKey}
                      onChange={(e) => setSoraConfig({ ...soraConfig, apiKey: e.target.value })}
                      placeholder="sk-..."
                      className="w-full px-3 py-2 pr-10 text-sm border rounded-lg transition-all outline-none"
                      style={{
                        background: colors.bgPrimary,
                        borderColor: colors.border,
                        color: colors.textPrimary
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSoraKey(!showSoraKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
                      style={{ color: colors.textSecondary }}
                    >
                      {showSoraKey ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleSaveSoraConfig}
                  className="w-full py-2 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #9333ea, #ec4899)' }}
                >
                  保存 Sora 配置
                </button>
              </div>
            </div>
            
            {/* Veo3.1 API */}
            <div className="p-4 rounded-xl border" style={{ background: colors.bgTertiary, borderColor: colors.border }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4285f4, #34a853)' }}>
                  <Video className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold" style={{ color: colors.textPrimary }}>Veo 3.1 视频生成</h4>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>Google Veo3.1 API，支持文生/图生/多图参考</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: colors.textSecondary }}>API 地址</label>
                  <input
                    type="text"
                    value={veoConfig.baseUrl}
                    onChange={(e) => setVeoConfig({ ...veoConfig, baseUrl: e.target.value })}
                    placeholder="https://ai.t8star.cn"
                    className="w-full px-3 py-2 text-sm border rounded-lg transition-all outline-none"
                    style={{
                      background: colors.bgPrimary,
                      borderColor: colors.border,
                      color: colors.textPrimary
                    }}
                  />
                  <p className="text-xs mt-1" style={{ color: colors.textMuted }}>支持 Veo3.1 API 的第三方服务地址</p>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: colors.textSecondary }}>Veo API Key</label>
                  <div className="relative">
                    <input
                      type={showVeoKey ? 'text' : 'password'}
                      value={veoConfig.apiKey}
                      onChange={(e) => setVeoConfig({ ...veoConfig, apiKey: e.target.value })}
                      placeholder="sk-..."
                      className="w-full px-3 py-2 pr-10 text-sm border rounded-lg transition-all outline-none"
                      style={{
                        background: colors.bgPrimary,
                        borderColor: colors.border,
                        color: colors.textPrimary
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowVeoKey(!showVeoKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
                      style={{ color: colors.textSecondary }}
                    >
                      {showVeoKey ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleSaveVeoConfig}
                  className="w-full py-2 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #4285f4, #34a853)' }}
                >
                  保存 Veo3.1 配置
                </button>
              </div>
            </div>
          </div>

          {/* 分割线 */}
          <div style={{ borderTop: `1px solid ${colors.border}` }} />

          {/* 关于信息 */}
          <div className="flex items-center justify-between p-4 rounded-xl"
            style={{ 
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.02) 100%)', 
              border: '1px solid rgba(59, 130, 246, 0.15)' 
            }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold" style={{ color: '#ffffff' }}>企鹅魔法</h4>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Penguin Magic Creative</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCheckUpdate}
                disabled={updateStatus === 'checking'}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all hover:opacity-80 disabled:opacity-50"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)', 
                  color: '#60a5fa',
                  border: '1px solid rgba(59, 130, 246, 0.3)'
                }}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${updateStatus === 'checking' ? 'animate-spin' : ''}`} />
                {updateStatus === 'checking' ? '检查中...' : '检查更新'}
              </button>
              <span className="text-xs font-mono px-3 py-2 rounded-lg"
                style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  color: 'rgba(255,255,255,0.6)', 
                  border: '1px solid rgba(255,255,255,0.08)' 
                }}>
                v{APP_VERSION}
              </span>
            </div>
          </div>
        </div>

        {/* 底部 */}
        <div className="p-6 border-t" style={{ borderColor: colors.border, background: colors.bgPrimary }}>
          <button
            onClick={onClose}
            className="w-full py-3 text-sm font-semibold text-white rounded-xl transition-all hover:opacity-90"
            style={{ background: colors.primary, boxShadow: `0 4px 14px ${colors.glow}` }}
          >
            完成
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        /* 自定义滚动条 */
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: rgba(255,255,255,0.12); 
          border-radius: 3px; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { 
          background: rgba(255,255,255,0.22); 
        }
      `}</style>
    </div>
  );
};
