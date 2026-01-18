import React, { useState, useEffect } from 'react';
import { ThirdPartyApiConfig, getApiConfig, saveApiConfig, checkBalance } from '../../services/pebblingGeminiService';
import { SoraConfig, getSoraConfig, saveSoraConfig } from '../../services/soraService';
import { Icons } from './Icons';

// RunningHub 配置
interface RHConfig {
  apiKey: string;
}

const getRHConfig = (): RHConfig => {
  const stored = localStorage.getItem('runninghub_config');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return { apiKey: '' };
    }
  }
  return { apiKey: '' };
};

const saveRHConfig = (config: RHConfig) => {
  localStorage.setItem('runninghub_config', JSON.stringify(config));
  // 同时保存到后端
  fetch('/api/runninghub/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: config.apiKey })
  }).catch(console.error);
};

interface ApiSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const ApiSettings: React.FC<ApiSettingsProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'gemini' | 'sora' | 'runninghub'>('gemini');
  
  const [config, setConfig] = useState<ThirdPartyApiConfig>({
    enabled: true,
    baseUrl: 'https://ai.t8star.cn',
    apiKey: '',
    model: 'nano-banana-2',
    chatModel: 'gemini-2.5-pro'
  });
  
  const [soraConfig, setSoraConfig] = useState<SoraConfig>({
    apiKey: '',
    baseUrl: 'https://api.openai.com'
  });
  
  const [rhConfig, setRhConfig] = useState<RHConfig>({
    apiKey: ''
  });
  
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSoraKey, setShowSoraKey] = useState(false);
  const [showRHKey, setShowRHKey] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  useEffect(() => {
    if (isOpen) {
      const savedConfig = getApiConfig();
      setConfig(savedConfig);
      const savedSoraConfig = getSoraConfig();
      setSoraConfig(savedSoraConfig);
      const savedRHConfig = getRHConfig();
      setRhConfig(savedRHConfig);
      setSaveStatus('idle');
      setBalance(null);
    }
  }, [isOpen]);

  const handleSave = () => {
    try {
      saveApiConfig(config);
      saveSoraConfig(soraConfig);
      saveRHConfig(rhConfig);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e) {
      setSaveStatus('error');
    }
  };

  const handleCheckBalance = async () => {
    setIsLoading(true);
    saveApiConfig(config);
    const result = await checkBalance();
    setBalance(result || '无法查询余额');
    setIsLoading(false);
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    try {
      saveApiConfig(config);
      const response = await fetch(`${config.baseUrl}/v1/models`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        setBalance('连接成功 ✓');
      } else {
        setBalance(`连接失败: ${response.status}`);
      }
    } catch (e) {
      setBalance('连接失败: 网络错误');
    }
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-[#1a1a24] border border-white/10 rounded-2xl w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Icons.Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">API 设置</h2>
              <p className="text-xs text-white/50">配置 AI 服务接口</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors">
            <Icons.Close className="w-5 h-5 text-white/60" />
          </button>
        </div>
        
        {/* Tab 切换 */}
        <div className="flex border-b border-white/10">
          <button 
            onClick={() => setActiveTab('gemini')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'gemini' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-white/50 hover:text-white/70'}`}
          >
            T8star / Gemini
          </button>
          <button 
            onClick={() => setActiveTab('sora')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'sora' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-white/50 hover:text-white/70'}`}
          >
            Sora 视频
          </button>
          <button 
            onClick={() => setActiveTab('runninghub')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'runninghub' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-white/50 hover:text-white/70'}`}
          >
            RunningHub
          </button>
        </div>

        <div className="p-4 space-y-4">
          {activeTab === 'gemini' ? (
            /* Gemini/T8star 配置 */
            <>
              <div>
                <label className="block text-sm text-white/70 mb-2">API Key</label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={config.apiKey}
                    onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                    placeholder="sk-xxxxxxxxxxxxxxxx"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 pr-12"
                  />
                  <button onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 text-xs">
                    {showApiKey ? '隐藏' : '显示'}
                  </button>
                </div>
                <p className="mt-1 text-xs text-white/40">
                  获取 API Key: <a href="https://ai.t8star.cn/register?aff=64350e39653" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">ai.t8star.cn</a>
                </p>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">API 地址</label>
                <input
                  type="text"
                  value={config.baseUrl}
                  onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                  placeholder="https://ai.t8star.cn"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-white/70 mb-2">图像模型</label>
                  <select value={config.model} onChange={(e) => setConfig({ ...config, model: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer">
                    <option value="nano-banana-2">nano-banana-2</option>
                    <option value="gpt-image-1">gpt-image-1</option>
                    <option value="dall-e-3">dall-e-3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">文本模型</label>
                  <select value={config.chatModel} onChange={(e) => setConfig({ ...config, chatModel: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer">
                    <option value="gemini-2.5-pro">gemini-2.5-pro</option>
                    <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                    <option value="gpt-4o">gpt-4o</option>
                    <option value="claude-sonnet-4-20250514">claude-sonnet-4</option>
                  </select>
                </div>
              </div>
              {balance && (
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  <p className="text-sm text-white/80">{balance}</p>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={handleTestConnection} disabled={isLoading || !config.apiKey} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                  {isLoading ? '测试中...' : '测试连接'}
                </button>
                <button onClick={handleCheckBalance} disabled={isLoading || !config.apiKey} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                  {isLoading ? '查询中...' : '查询余额'}
                </button>
              </div>
            </>
          ) : activeTab === 'sora' ? (
            /* Sora 配置 */
            <>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 mb-2">
                <p className="text-xs text-yellow-300">ℹ️ Sora 视频生成需要 OpenAI API 访问权限，也可以使用第三方代理服务</p>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Sora API Key</label>
                <div className="relative">
                  <input
                    type={showSoraKey ? 'text' : 'password'}
                    value={soraConfig.apiKey}
                    onChange={(e) => setSoraConfig({ ...soraConfig, apiKey: e.target.value })}
                    placeholder="sk-xxxxxxxxxxxxxxxx"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 pr-12"
                  />
                  <button onClick={() => setShowSoraKey(!showSoraKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 text-xs">
                    {showSoraKey ? '隐藏' : '显示'}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Sora API 地址</label>
                <input
                  type="text"
                  value={soraConfig.baseUrl}
                  onChange={(e) => setSoraConfig({ ...soraConfig, baseUrl: e.target.value })}
                  placeholder="https://api.openai.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50"
                />
                <p className="mt-1 text-xs text-white/40">支持第三方代理地址，如 T8star 等</p>
              </div>
            </>
          ) : (
            /* RunningHub 配置 */
            <>
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 mb-2">
                <p className="text-xs text-emerald-300">ℹ️ RunningHub 提供 AI 应用调用服务，请在官网获取 API Key</p>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">RunningHub API Key</label>
                <div className="relative">
                  <input
                    type={showRHKey ? 'text' : 'password'}
                    value={rhConfig.apiKey}
                    onChange={(e) => setRhConfig({ ...rhConfig, apiKey: e.target.value })}
                    placeholder="输入你的 RunningHub API Key"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50 pr-12"
                  />
                  <button onClick={() => setShowRHKey(!showRHKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 text-xs">
                    {showRHKey ? '隐藏' : '显示'}
                  </button>
                </div>
                <p className="mt-1 text-xs text-white/40">
                  获取 API Key: <a href="https://www.runninghub.cn" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">runninghub.cn</a>
                </p>
              </div>
            </>
          )}
        </div>
        <div className="p-4 border-t border-white/10 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all">
            取消
          </button>
          <button onClick={handleSave} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:opacity-90 transition-all">
            {saveStatus === 'saved' ? '已保存 ✓' : saveStatus === 'error' ? '保存失败' : '保存配置'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiSettings;
