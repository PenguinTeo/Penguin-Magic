import React, { useState, useEffect } from 'react';
import { Key as KeyIcon, CheckCircle2 as CheckCircleIcon, ExternalLink as ExternalLinkIcon, Wallet as WalletIcon, Zap as ZapIcon } from 'lucide-react';
import { ThirdPartyApiConfig } from '../types';
import { getRunningHubConfig, saveRunningHubConfig } from '../services/api/runninghub';

interface ApiKeyManagerProps {
  apiKey: string;
  onApiKeySave: (key: string) => void;
  thirdPartyConfig: ThirdPartyApiConfig;
  onThirdPartyConfigChange: (config: ThirdPartyApiConfig) => void;
}

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ 
  apiKey, 
  onApiKeySave,
  thirdPartyConfig,
  onThirdPartyConfigChange 
}) => {
  const [keyInput, setKeyInput] = useState('');
  const [isKeySet, setIsKeySet] = useState(false);
  
  // 贞贞API配置输入
  const [tpBaseUrl, setTpBaseUrl] = useState(thirdPartyConfig.baseUrl || 'https://ai.t8star.cn');
  const [tpApiKey, setTpApiKey] = useState('');
  const [tpChatModel, setTpChatModel] = useState(thirdPartyConfig.chatModel || 'gemini-2.5-pro');
  const [isTpKeySet, setIsTpKeySet] = useState(false);
  const [balanceInfo, setBalanceInfo] = useState<string | null>(null);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  
  // RunningHub 配置
  const [rhApiKey, setRhApiKey] = useState('');
  const [isRhKeySet, setIsRhKeySet] = useState(false);
  const [rhKeyPreview, setRhKeyPreview] = useState<string | null>(null);
  const [isRhSaving, setIsRhSaving] = useState(false);

  useEffect(() => {
    setIsKeySet(!!apiKey);
  }, [apiKey]);
  
  useEffect(() => {
    setTpBaseUrl(thirdPartyConfig.baseUrl);
    setTpChatModel(thirdPartyConfig.chatModel || 'gemini-2.5-pro');
    setIsTpKeySet(!!thirdPartyConfig.apiKey);
  }, [thirdPartyConfig]);
  
  // 加载 RunningHub 配置状态
  useEffect(() => {
    loadRhConfig();
  }, []);
  
  const loadRhConfig = async () => {
    try {
      const result = await getRunningHubConfig();
      if (result.success && result.data) {
        setIsRhKeySet(result.data.configured);
        setRhKeyPreview(result.data.apiKeyPreview);
      }
    } catch (e) {
      console.error('加载 RunningHub 配置失败:', e);
    }
  };
  
  const handleRhSave = async () => {
    if (!rhApiKey.trim()) return;
    setIsRhSaving(true);
    try {
      const result = await saveRunningHubConfig(rhApiKey.trim());
      if (result.success) {
        setIsRhKeySet(true);
        setRhKeyPreview(result.data?.apiKeyPreview || null);
        setRhApiKey('');
      } else {
        alert(result.error || '保存失败');
      }
    } catch (e) {
      alert('保存失败');
    } finally {
      setIsRhSaving(false);
    }
  };
  
  const handleSave = () => {
    if (!keyInput.trim()) return;
    onApiKeySave(keyInput);
    setKeyInput('');
  };
  
  const handleThirdPartyToggle = (enabled: boolean) => {
    onThirdPartyConfigChange({
      ...thirdPartyConfig,
      enabled
    });
  };
  
  const handleThirdPartySave = () => {
    const newConfig: ThirdPartyApiConfig = {
      ...thirdPartyConfig,
      baseUrl: tpBaseUrl.trim(),
      apiKey: tpApiKey.trim() || thirdPartyConfig.apiKey,
      model: 'nano-banana-2',
      chatModel: tpChatModel.trim() || 'gemini-2.5-pro'
    };
    onThirdPartyConfigChange(newConfig);
    setTpApiKey('');
  };
  
  // 查询余额功能
  const handleCheckBalance = async () => {
    if (!thirdPartyConfig.baseUrl || !thirdPartyConfig.apiKey) {
      alert('请先配置API地址和Key');
      return;
    }
    
    setIsCheckingBalance(true);
    setBalanceInfo(null);
    
    try {
      // 尝试查询余额API（常见端点）
      const baseUrl = thirdPartyConfig.baseUrl.replace(/\/$/, '');
      const balanceEndpoints = [
        '/v1/dashboard/billing/credit_grants',
        '/v1/billing/credit_grants',
        '/dashboard/billing/credit_grants',
        '/v1/me'
      ];
      
      for (const endpoint of balanceEndpoints) {
        try {
          const res = await fetch(`${baseUrl}${endpoint}`, {
            headers: {
              'Authorization': `Bearer ${thirdPartyConfig.apiKey}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (res.ok) {
            const data = await res.json();
            // 尝试解析不同格式的余额信息
            if (data.total_granted !== undefined) {
              setBalanceInfo(`总额: $${data.total_granted?.toFixed(2) || '0'} | 已用: $${data.total_used?.toFixed(2) || '0'}`);
              break;
            } else if (data.balance !== undefined) {
              setBalanceInfo(`余额: $${data.balance?.toFixed(2) || '0'}`);
              break;
            } else if (data.credits !== undefined) {
              setBalanceInfo(`积分: ${data.credits}`);
              break;
            } else {
              setBalanceInfo('查询成功，但无法解析余额格式');
            }
          }
        } catch {
          continue;
        }
      }
      
      if (!balanceInfo) {
        setBalanceInfo('此API不支持余额查询');
      }
    } catch (e) {
      setBalanceInfo('查询失败');
    } finally {
      setIsCheckingBalance(false);
    }
  };
  
  // 跳转到API控制台
  const handleOpenDashboard = () => {
    if (thirdPartyConfig.baseUrl) {
      // 尝试打开管理页面
      const baseUrl = thirdPartyConfig.baseUrl.replace(/\/v1$/, '').replace(/\/$/, '');
      window.open(baseUrl, '_blank');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 贞贞API开关 */}
      <div className="flex items-center justify-between group">
        <label htmlFor="third-party-toggle" className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors flex items-center gap-2 cursor-pointer">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          贞贞API
        </label>
        <div className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            id="third-party-toggle" 
            className="sr-only peer" 
            checked={thirdPartyConfig.enabled} 
            onChange={(e) => handleThirdPartyToggle(e.target.checked)}
          />
          <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-500/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 transition-colors"></div>
        </div>
      </div>
      
      {/* 贞贞API配置区域 */}
      {thirdPartyConfig.enabled && (
        <div className="flex flex-col gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-400">贞贞API配置</span>
            {isTpKeySet && (
              <div className="flex items-center gap-1 text-xs text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded-full">
                <CheckCircleIcon className="w-3.5 h-3.5" />
                <span>已配置</span>
              </div>
            )}
          </div>
          
          {/* Base URL */}
          <div>
            <label className="text-[10px] text-gray-500 mb-1 block">Base URL</label>
            <input
              type="text"
              value={tpBaseUrl}
              onChange={(e) => setTpBaseUrl(e.target.value)}
              placeholder="https://ai.t8star.cn"
              className="w-full p-2 bg-gray-900/80 border border-gray-600 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            />
          </div>
          
          {/* API Key */}
          <div>
            <label className="text-[10px] text-gray-500 mb-1 block">API Key</label>
            <input
              type="password"
              value={tpApiKey}
              onChange={(e) => setTpApiKey(e.target.value)}
              placeholder={isTpKeySet ? "输入新 Key 更新" : "输入贞贞 API Key"}
              className="w-full p-2 bg-gray-900/80 border border-gray-600 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            />
          </div>
          
          {/* Chat Model - 用于BP智能体分析 */}
          <div>
            <label className="text-[10px] text-gray-500 mb-1 block">分析模型 (BP/Smart模式)</label>
            <input
              type="text"
              value={tpChatModel}
              onChange={(e) => setTpChatModel(e.target.value)}
              placeholder="gemini-2.5-pro"
              className="w-full p-2 bg-gray-900/80 border border-gray-600 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            />
          </div>
          
          <button
            onClick={handleThirdPartySave}
            disabled={!tpBaseUrl.trim()}
            className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg text-xs shadow-md hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            保存配置
          </button>
          
          {/* 余额查询和跳转功能 */}
          {isTpKeySet && (
            <div className="flex flex-col gap-2 pt-2 border-t border-blue-500/20">
              <div className="flex gap-2">
                <button
                  onClick={handleCheckBalance}
                  disabled={isCheckingBalance}
                  className="flex-1 py-1.5 bg-gray-700 text-white font-medium rounded-lg text-[10px] hover:bg-gray-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
                >
                  <WalletIcon className="w-3 h-3" />
                  {isCheckingBalance ? '查询中...' : '查询余额'}
                </button>
                <button
                  onClick={handleOpenDashboard}
                  className="flex-1 py-1.5 bg-gray-700 text-white font-medium rounded-lg text-[10px] hover:bg-gray-600 transition-colors flex items-center justify-center gap-1"
                >
                  <ExternalLinkIcon className="w-3 h-3" />
                  控制台
                </button>
              </div>
              {balanceInfo && (
                <p className="text-[10px] text-center text-gray-400 bg-gray-800/50 p-1.5 rounded">
                  {balanceInfo}
                </p>
              )}
            </div>
          )}
          
          <p className="text-[10px] text-gray-500 leading-relaxed">
            图片生成使用 nano-banana-2，BP智能体使用分析模型进行图片理解。
          </p>
          
          {/* 获取API链接 */}
          <a 
            href="https://ai.t8star.cn/register?aff=64350e39653" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[11px] text-center text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
          >
            👉 点击这里获取贞贞API Key
          </a>
        </div>
      )}
      
      {/* Gemini API Key 配置 */}
      {!thirdPartyConfig.enabled && (
        <>
          <div className="flex items-center justify-between">
            <label htmlFor="api-key" className="text-sm font-medium text-gray-300">
              Gemini API Key
            </label>
            {isKeySet && (
              <div className="flex items-center gap-1 text-xs text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded-full">
                <CheckCircleIcon className="w-3.5 h-3.5" />
                <span>已设置</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <input
              id="api-key"
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder={isKeySet ? "输入新 Key 更新" : "在此输入您的 API Key"}
              className="w-full flex-grow p-2 bg-gray-900/80 border border-gray-600 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            />
            <button
              onClick={handleSave}
              disabled={!keyInput}
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg text-sm shadow-md hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              保存
            </button>
          </div>
        </>
      )}
      
      {/* RunningHub API Key 配置 */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            RunningHub API
          </label>
          {isRhKeySet && (
            <div className="flex items-center gap-1 text-xs text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded-full">
              <CheckCircleIcon className="w-3.5 h-3.5" />
              <span>已配置</span>
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-3 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-purple-400">RunningHub 配置</span>
            {rhKeyPreview && (
              <span className="text-[10px] text-gray-500 font-mono">{rhKeyPreview}</span>
            )}
          </div>
          
          {/* API Key */}
          <div>
            <label className="text-[10px] text-gray-500 mb-1 block">API Key</label>
            <input
              type="password"
              value={rhApiKey}
              onChange={(e) => setRhApiKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRhSave()}
              placeholder={isRhKeySet ? "输入新 Key 更新" : "输入 RunningHub API Key"}
              className="w-full p-2 bg-gray-900/80 border border-gray-600 rounded-md text-xs focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200"
            />
          </div>
          
          <button
            onClick={handleRhSave}
            disabled={!rhApiKey.trim() || isRhSaving}
            className="w-full py-2 bg-purple-600 text-white font-semibold rounded-lg text-xs shadow-md hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
          >
            <ZapIcon className="w-3 h-3" />
            {isRhSaving ? '保存中...' : '保存配置'}
          </button>
          
          <p className="text-[10px] text-gray-500 leading-relaxed">
            RunningHub 用于调用 AI 应用和 ComfyUI 工作流，配置后可使用创意库中的 RunningHub 应用。
          </p>
          
          {/* 获取API链接 */}
          <a 
            href="https://www.runninghub.cn" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[11px] text-center text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors"
          >
            👉 点击这里获取 RunningHub API Key
          </a>
        </div>
      </div>
    </div>
  );
};