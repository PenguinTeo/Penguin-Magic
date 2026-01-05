import React, { useState, useEffect } from 'react';
import { ThirdPartyApiConfig } from '../types';
import { useTheme, ThemeName } from '../contexts/ThemeContext';
import { Plug, Gem, Eye as EyeIcon, EyeOff as EyeOffIcon, Key as KeyIcon, Moon as MoonIcon, Sun as SunIcon, Save as SaveIcon, Cpu as CpuIcon, Info as InfoIcon, Check, X } from 'lucide-react';

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
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // 同步本地输入状态
  useEffect(() => {
    setLocalThirdPartyUrl(thirdPartyConfig.baseUrl || '');
    setLocalThirdPartyKey(thirdPartyConfig.apiKey || '');
  }, [thirdPartyConfig.baseUrl, thirdPartyConfig.apiKey]);

  useEffect(() => {
    setLocalGeminiKey(geminiApiKey || '');
  }, [geminiApiKey]);

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
          background: colors.bgSecondary,
          borderColor: colors.border
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

          {/* 关于信息 */}
          <div className="flex items-center justify-between p-3 rounded-xl"
            style={{ background: colors.bgTertiary, border: `1px solid ${colors.border}` }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: `${colors.textMuted}15` }}>
                <InfoIcon className="w-4.5 h-4.5" style={{ color: colors.textMuted }} />
              </div>
              <div>
                <h4 className="text-sm font-medium" style={{ color: colors.textPrimary }}>企鹅魔法</h4>
                <p className="text-xs" style={{ color: colors.textSecondary }}>Penguin Magic Creative</p>
              </div>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-md"
              style={{ background: colors.bgSecondary, color: colors.textMuted, border: `1px solid ${colors.border}` }}>
              v{APP_VERSION}
            </span>
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
      `}</style>
    </div>
  );
};
