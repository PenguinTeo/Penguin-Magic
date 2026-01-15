import React, { useState, useEffect } from 'react';
import { ThirdPartyApiConfig } from '../types';
import { useTheme, ThemeName } from '../contexts/ThemeContext';
import { SoraConfig, getSoraConfig, saveSoraConfig } from '../services/soraService';
import { VeoConfig, getVeoConfig, saveVeoConfig } from '../services/veoService';
import { Eye as EyeIcon, EyeOff as EyeOffIcon, Check, X, RefreshCw, Moon as MoonIcon, Sun as SunIcon, Save as SaveIcon, Cpu as CpuIcon } from 'lucide-react';

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
  thirdPartyConfig: ThirdPartyApiConfig;
  onThirdPartyConfigChange: (config: ThirdPartyApiConfig) => void;
  geminiApiKey: string;
  onGeminiApiKeySave: (key: string) => void;
  autoSaveEnabled: boolean;
  onAutoSaveToggle: (enabled: boolean) => void;
}

type ApiMode = 'local-thirdparty' | 'local-gemini';

// 统一样式常量 - 冰蓝色系
const styles = {
  // 背景
  modalBg: 'linear-gradient(180deg, rgba(23, 23, 23, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%)',
  // 边框
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.06)',
  // 文字
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.5)',
  textMuted: 'rgba(255, 255, 255, 0.35)',
  // 主色调 - 冰蓝
  primary: '#3b82f6',
  primaryLight: '#60a5fa',
  primaryDark: '#2563eb',
  primaryGlow: 'rgba(59, 130, 246, 0.4)',
  // 输入框
  inputBg: 'rgba(0, 0, 0, 0.3)',
  inputBgFocus: 'rgba(0, 0, 0, 0.4)',
  // 卡片
  cardBg: 'rgba(255, 255, 255, 0.02)',
  cardBgHover: 'rgba(255, 255, 255, 0.04)',
  cardBgActive: 'rgba(59, 130, 246, 0.08)',
};

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
  const { themeName, setTheme, allThemes } = useTheme();
  const activeMode: ApiMode = thirdPartyConfig.enabled ? 'local-thirdparty' : 'local-gemini';
  
  const [localThirdPartyUrl, setLocalThirdPartyUrl] = useState(thirdPartyConfig.baseUrl || 'https://ai.t8star.cn');
  const [localThirdPartyKey, setLocalThirdPartyKey] = useState(thirdPartyConfig.apiKey || '');
  const [localGeminiKey, setLocalGeminiKey] = useState(geminiApiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showSoraKey, setShowSoraKey] = useState(false);
  const [showVeoKey, setShowVeoKey] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  
  const [soraConfig, setSoraConfig] = useState<SoraConfig>({
    apiKey: '',
    baseUrl: 'https://ai.t8star.cn'
  });
  
  const [veoConfig, setVeoConfig] = useState<VeoConfig>({
    apiKey: '',
    baseUrl: 'https://ai.t8star.cn'
  });

  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'up-to-date' | 'error'>('idle');
  const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;

  useEffect(() => {
    setLocalThirdPartyUrl(thirdPartyConfig.baseUrl || 'https://ai.t8star.cn');
    setLocalThirdPartyKey(thirdPartyConfig.apiKey || '');
  }, [thirdPartyConfig.baseUrl, thirdPartyConfig.apiKey]);

  useEffect(() => {
    setLocalGeminiKey(geminiApiKey || '');
  }, [geminiApiKey]);

  useEffect(() => {
    if (isOpen) {
      const savedSoraConfig = getSoraConfig();
      setSoraConfig({ ...savedSoraConfig, baseUrl: savedSoraConfig.baseUrl || 'https://ai.t8star.cn' });
      const savedVeoConfig = getVeoConfig();
      setVeoConfig({ ...savedVeoConfig, baseUrl: savedVeoConfig.baseUrl || 'https://ai.t8star.cn' });
      setUpdateStatus('idle');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleModeChange = (mode: ApiMode) => {
    onThirdPartyConfigChange({
      ...thirdPartyConfig,
      enabled: mode === 'local-thirdparty',
    });
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
        setTimeout(() => {
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
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      {/* 弹窗 */}
      <div 
        className="settings-modal relative w-full max-w-[480px] rounded-[20px] overflow-hidden animate-fade-in flex flex-col"
        style={{
          background: styles.modalBg,
          border: `1px solid ${styles.border}`,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          maxHeight: '85vh'
        }}
      >
        {/* 保存成功提示 */}
        {saveSuccessMessage && (
          <div 
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 text-sm font-medium rounded-lg shadow-lg animate-fade-in flex items-center gap-2"
            style={{ background: `linear-gradient(135deg, ${styles.primary}, ${styles.primaryDark})`, color: 'white' }}
          >
            <Check className="w-4 h-4" />
            {saveSuccessMessage}
          </div>
        )}

        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-lg flex items-center justify-center transition-all z-10"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <X className="w-4 h-4" style={{ color: styles.textSecondary }} />
        </button>

        {/* 头部 */}
        <div className="px-6 pt-6 pb-5 text-center border-b" style={{ borderColor: styles.borderLight }}>
          <div 
            className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${styles.primary}, ${styles.primaryDark})` }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold" style={{ color: styles.textPrimary }}>设置</h2>
          <p className="text-sm mt-1" style={{ color: styles.textSecondary }}>配置 API 连接与偏好</p>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 custom-scrollbar">
          
          {/* API CONNECTION */}
          <div>
            <div className="section-title">API CONNECTION</div>
            
            {/* 贞贞 API */}
            <div
              onClick={() => handleModeChange('local-thirdparty')}
              className="option-card"
              style={{
                borderColor: activeMode === 'local-thirdparty' ? 'rgba(59, 130, 246, 0.5)' : styles.border,
                background: activeMode === 'local-thirdparty' ? styles.cardBgActive : styles.cardBg,
              }}
            >
              <div className="flex items-center gap-3">
                <div className="option-icon" style={{ background: `linear-gradient(135deg, ${styles.primary}, ${styles.primaryDark})` }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M12 2v6m0 8v6m-6-9H2m20 0h-4m-2.5-6.5L13 9m-2 6l-2.5 2.5m11-11L17 9m-2 6l2.5 2.5"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold" style={{ color: styles.textPrimary }}>贞贞 API</div>
                  <div className="text-xs" style={{ color: styles.textSecondary }}>支持 nano-banana 等模型</div>
                </div>
                <div 
                  className="option-check"
                  style={{ opacity: activeMode === 'local-thirdparty' ? 1 : 0 }}
                >
                  <Check className="w-3 h-3 text-white" />
                </div>
              </div>
              
              {activeMode === 'local-thirdparty' && (
                <div className="form-area" onClick={e => e.stopPropagation()}>
                  <div className="form-group">
                    <label className="form-label">API 地址</label>
                    <input
                      type="text"
                      className="form-input"
                      value={localThirdPartyUrl}
                      onChange={(e) => setLocalThirdPartyUrl(e.target.value)}
                      placeholder="https://ai.t8star.cn"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">API Key</label>
                    <div className="input-with-btn">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        className="form-input"
                        value={localThirdPartyKey}
                        onChange={(e) => setLocalThirdPartyKey(e.target.value)}
                        placeholder="sk-..."
                      />
                      <button className="input-btn" onClick={() => setShowApiKey(!showApiKey)}>
                        {showApiKey ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href="https://ai.t8star.cn/register?aff=64350e39653"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-link flex-1"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                      </svg>
                      获取 Key
                    </a>
                    <button className="btn btn-primary flex-1" onClick={handleSaveLocalThirdParty}>
                      保存配置
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Gemini API */}
            <div
              onClick={() => handleModeChange('local-gemini')}
              className="option-card"
              style={{
                borderColor: activeMode === 'local-gemini' ? 'rgba(59, 130, 246, 0.5)' : styles.border,
                background: activeMode === 'local-gemini' ? styles.cardBgActive : styles.cardBg,
              }}
            >
              <div className="flex items-center gap-3">
                <div className="option-icon" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                    <polyline points="2 17 12 22 22 17"/>
                    <polyline points="2 12 12 17 22 12"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold" style={{ color: styles.textPrimary }}>Gemini API</div>
                  <div className="text-xs" style={{ color: styles.textSecondary }}>使用 Google Gemini API Key</div>
                </div>
                <div 
                  className="option-check"
                  style={{ opacity: activeMode === 'local-gemini' ? 1 : 0 }}
                >
                  <Check className="w-3 h-3 text-white" />
                </div>
              </div>
              
              {activeMode === 'local-gemini' && (
                <div className="form-area" onClick={e => e.stopPropagation()}>
                  <div className="form-group">
                    <label className="form-label">Gemini API Key</label>
                    <div className="input-with-btn">
                      <input
                        type={showGeminiKey ? 'text' : 'password'}
                        className="form-input"
                        value={localGeminiKey}
                        onChange={(e) => setLocalGeminiKey(e.target.value)}
                        placeholder="AIza..."
                      />
                      <button className="input-btn" onClick={() => setShowGeminiKey(!showGeminiKey)}>
                        {showGeminiKey ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button className="btn btn-primary w-full" onClick={handleSaveGeminiKey}>
                    保存配置
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* VIDEO API */}
          <div>
            <div className="section-title">VIDEO API</div>
            
            {/* Sora */}
            <div className="config-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="option-icon" style={{ background: `linear-gradient(135deg, ${styles.primary}, #1e40af)` }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <polygon points="23 7 16 12 23 17 23 7"/>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold" style={{ color: styles.textPrimary }}>Sora 视频生成</h4>
                  <p className="text-xs" style={{ color: styles.textSecondary }}>OpenAI Sora API 或兼容服务</p>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">API 地址</label>
                <input
                  type="text"
                  className="form-input"
                  value={soraConfig.baseUrl}
                  onChange={(e) => setSoraConfig({ ...soraConfig, baseUrl: e.target.value })}
                  placeholder="https://ai.t8star.cn"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Sora API Key</label>
                <div className="input-with-btn">
                  <input
                    type={showSoraKey ? 'text' : 'password'}
                    className="form-input"
                    value={soraConfig.apiKey}
                    onChange={(e) => setSoraConfig({ ...soraConfig, apiKey: e.target.value })}
                    placeholder="sk-..."
                  />
                  <button className="input-btn" onClick={() => setShowSoraKey(!showSoraKey)}>
                    {showSoraKey ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button className="btn btn-primary w-full" onClick={handleSaveSoraConfig}>
                保存 Sora 配置
              </button>
            </div>

            {/* Veo */}
            <div className="config-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="option-icon" style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <polygon points="23 7 16 12 23 17 23 7"/>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold" style={{ color: styles.textPrimary }}>Veo 3.1 视频生成</h4>
                  <p className="text-xs" style={{ color: styles.textSecondary }}>Google Veo3.1 API，支持文生/图生</p>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">API 地址</label>
                <input
                  type="text"
                  className="form-input"
                  value={veoConfig.baseUrl}
                  onChange={(e) => setVeoConfig({ ...veoConfig, baseUrl: e.target.value })}
                  placeholder="https://ai.t8star.cn"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Veo API Key</label>
                <div className="input-with-btn">
                  <input
                    type={showVeoKey ? 'text' : 'password'}
                    className="form-input"
                    value={veoConfig.apiKey}
                    onChange={(e) => setVeoConfig({ ...veoConfig, apiKey: e.target.value })}
                    placeholder="sk-..."
                  />
                  <button className="input-btn" onClick={() => setShowVeoKey(!showVeoKey)}>
                    {showVeoKey ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button className="btn btn-primary w-full" onClick={handleSaveVeoConfig}>
                保存 Veo3.1 配置
              </button>
            </div>
          </div>

          {/* THEME */}
          <div>
            <div className="section-title">THEME</div>
            <div className="grid grid-cols-2 gap-3">
              {allThemes.map((t) => {
                const ThemeIcon = themeIconMap[t.name];
                const previewColors = themePreviewColors[t.name];
                const isActive = themeName === t.name;
                
                return (
                  <button
                    key={t.name}
                    onClick={() => setTheme(t.name)}
                    className="option-card text-left"
                    style={{
                      borderColor: isActive ? 'rgba(59, 130, 246, 0.5)' : styles.border,
                      background: isActive ? styles.cardBgActive : styles.cardBg,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ 
                          background: isActive 
                            ? `linear-gradient(135deg, ${previewColors[0]}, ${previewColors[2]})`
                            : 'rgba(255,255,255,0.06)',
                        }}
                      >
                        <ThemeIcon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} style={{ color: isActive ? 'white' : styles.textSecondary }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ color: styles.textPrimary }}>{t.displayName}</p>
                        <div className="flex gap-1 mt-1.5">
                          {previewColors.map((color, i) => (
                            <div key={i} className="h-1.5 rounded-full flex-1" style={{ background: color, opacity: isActive ? 1 : 0.5 }} />
                          ))}
                        </div>
                      </div>
                    </div>
                    {isActive && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${styles.primary}, ${styles.primaryDark})` }}>
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* FEATURES */}
          <div>
            <div className="section-title">FEATURES</div>
            
            {/* 自动保存 */}
            <div className="config-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="option-icon" style={{ background: 'rgba(59, 130, 246, 0.15)' }}>
                  <SaveIcon className="w-5 h-5" style={{ color: styles.primaryLight }} />
                </div>
                <div>
                  <h4 className="text-sm font-medium" style={{ color: styles.textPrimary }}>自动保存</h4>
                  <p className="text-xs" style={{ color: styles.textSecondary }}>生成图片后自动下载</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={autoSaveEnabled} onChange={(e) => onAutoSaveToggle(e.target.checked)} />
                <div 
                  className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
                  style={{ background: autoSaveEnabled ? `linear-gradient(135deg, ${styles.primary}, ${styles.primaryDark})` : 'rgba(255,255,255,0.1)' }}
                />
              </label>
            </div>

            {/* 当前模型 */}
            <div className="config-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="option-icon" style={{ background: 'rgba(59, 130, 246, 0.15)' }}>
                  <CpuIcon className="w-5 h-5" style={{ color: styles.primaryLight }} />
                </div>
                <div>
                  <h4 className="text-sm font-medium" style={{ color: styles.textPrimary }}>当前模型</h4>
                  <p className="text-xs" style={{ color: styles.textSecondary }}>正在使用的 AI 模型</p>
                </div>
              </div>
              <span 
                className="text-xs font-medium px-3 py-1.5 rounded-lg"
                style={{ background: 'rgba(59, 130, 246, 0.15)', color: styles.primaryLight, border: '1px solid rgba(59, 130, 246, 0.25)' }}
              >
                {activeMode === 'local-thirdparty' ? thirdPartyConfig.model || 'nano-banana-2' : 'Gemini 3 Pro'}
              </span>
            </div>
          </div>
        </div>

        {/* 底部固定区 */}
        <div className="flex-shrink-0 px-6 py-4 border-t" style={{ borderColor: styles.borderLight, background: 'rgba(10, 10, 10, 0.95)' }}>
          {/* 关于信息 */}
          <div className="footer-info mb-4">
            <div className="flex items-center gap-3">
              <div className="footer-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                </svg>
              </div>
              <div>
                <h5 className="text-sm font-semibold" style={{ color: styles.textPrimary }}>企鹅魔法</h5>
                <span className="text-xs" style={{ color: styles.textSecondary }}>Penguin Magic Creative</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCheckUpdate}
                disabled={updateStatus === 'checking'}
                className="update-btn"
              >
                <RefreshCw className={`w-3 h-3 ${updateStatus === 'checking' ? 'animate-spin' : ''}`} />
                {updateStatus === 'checking' ? '检查中...' : '检查更新'}
              </button>
              <span className="version-badge">v{APP_VERSION}</span>
            </div>
          </div>
          
          {/* 完成按钮 */}
          <button
            onClick={onClose}
            className="btn btn-primary w-full py-3.5"
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
        
        /* 滚动条 */
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 2px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        
        /* 分区标题 */
        .section-title {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 12px;
        }
        
        /* 选项卡片 */
        .option-card {
          padding: 14px;
          border-radius: 12px;
          border: 2px solid rgba(255, 255, 255, 0.06);
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 10px;
          position: relative;
        }
        .option-card:hover { border-color: rgba(255, 255, 255, 0.12); }
        
        .option-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .option-check {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.2s;
        }
        
        /* 表单 */
        .form-area {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .form-group { margin-bottom: 12px; }
        .form-label {
          font-size: 11px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 6px;
          display: block;
        }
        .form-input {
          width: 100%;
          padding: 10px 12px;
          font-size: 13px;
          color: #ffffff;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          outline: none;
          transition: all 0.2s;
        }
        .form-input:focus {
          border-color: rgba(59, 130, 246, 0.5);
          background: rgba(0, 0, 0, 0.4);
        }
        .form-input::placeholder { color: rgba(255, 255, 255, 0.3); }
        
        .input-with-btn { position: relative; }
        .input-with-btn .form-input { padding-right: 40px; }
        .input-btn {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.4);
          padding: 4px;
        }
        .input-btn:hover { color: rgba(255, 255, 255, 0.7); }
        
        /* 按钮 */
        .btn {
          padding: 10px 16px;
          font-size: 13px;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .btn-primary {
          color: white;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
        }
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
        }
        .btn-link {
          color: #60a5fa;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
        }
        .btn-link:hover { background: rgba(59, 130, 246, 0.15); }
        .btn:active { transform: translateY(0) scale(0.98); }
        
        /* 配置卡片 */
        .config-card {
          padding: 14px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          margin-bottom: 10px;
        }
        
        /* 底部信息 */
        .footer-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          border-radius: 10px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(59, 130, 246, 0.02));
          border: 1px solid rgba(59, 130, 246, 0.12);
        }
        .footer-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .version-badge {
          font-size: 11px;
          font-weight: 500;
          font-family: 'Monaco', 'Menlo', monospace;
          padding: 6px 10px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .update-btn {
          font-size: 11px;
          font-weight: 500;
          padding: 6px 10px;
          border-radius: 6px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.1));
          color: #60a5fa;
          border: 1px solid rgba(59, 130, 246, 0.25);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all 0.2s;
        }
        .update-btn:hover { background: linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(59, 130, 246, 0.15)); }
        .update-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
};
