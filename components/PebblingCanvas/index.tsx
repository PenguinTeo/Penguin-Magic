
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CanvasNode, Vec2, NodeType, Connection, GenerationConfig, NodeData, CanvasPreset, PresetInput } from '../../types/pebblingTypes';
import { CreativeIdea } from '../../types';
import FloatingInput from './FloatingInput';
import CanvasNodeItem from './CanvasNode';
import Sidebar from './Sidebar';
import ContextMenu from './ContextMenu';
import PresetCreationModal from './PresetCreationModal';
import PresetInstantiationModal from './PresetInstantiationModal';
import { editImageWithThirdPartyApi, chatWithThirdPartyApi, getThirdPartyConfig, ImageEditConfig } from '../../services/geminiService';
import * as canvasApi from '../../services/api/canvas';
import { downloadRemoteToOutput } from '../../services/api/files';
import { Icons } from './Icons';

// === 画布用API适配器，桥接主项目的geminiService ===

// 检查API是否已配置
const isApiConfigured = (): boolean => {
  const config = getThirdPartyConfig();
  return !!(config && config.enabled && config.apiKey);
};

// base64 转 File
const base64ToFile = async (base64: string, filename: string = 'image.png'): Promise<File> => {
  const response = await fetch(base64);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type || 'image/png' });
};

// 生成图片（文生图/图生图）
const generateCreativeImage = async (
  prompt: string, 
  config?: GenerationConfig,
  signal?: AbortSignal
): Promise<string | null> => {
  try {
    const imageConfig: ImageEditConfig = {
      aspectRatio: config?.aspectRatio || '1:1',
      imageSize: config?.resolution || '1K',
    };
    const result = await editImageWithThirdPartyApi([], prompt, imageConfig);
    return result.imageUrl;
  } catch (e) {
    console.error('文生图失败:', e);
    return null;
  }
};

// 编辑图片（图生图）
const editCreativeImage = async (
  images: string[],
  prompt: string,
  config?: GenerationConfig,
  signal?: AbortSignal
): Promise<string | null> => {
  try {
    // 转换base64为File对象
    const files = await Promise.all(images.map((img, i) => base64ToFile(img, `input_${i}.png`)));
    const imageConfig: ImageEditConfig = {
      aspectRatio: config?.aspectRatio || 'Auto',
      imageSize: config?.resolution || '1K',
    };
    const result = await editImageWithThirdPartyApi(files, prompt, imageConfig);
    return result.imageUrl;
  } catch (e) {
    console.error('图生图失败:', e);
    return null;
  }
};

// 生成文本/扩写
const generateCreativeText = async (content: string): Promise<{ title: string; content: string }> => {
  try {
    const systemPrompt = `You are a creative writing assistant. Expand and enhance the following content into a more detailed and vivid description. Output ONLY the enhanced text, no titles or explanations.`;
    const result = await chatWithThirdPartyApi(systemPrompt, content);
    // 提取第一行作为标题
    const lines = result.split('\n').filter(l => l.trim());
    const title = lines[0]?.slice(0, 50) || '扩写内容';
    return { title, content: result };
  } catch (e) {
    console.error('文本生成失败:', e);
    return { title: '错误', content: String(e) };
  }
};

// LLM文本处理
const generateAdvancedLLM = async (
  userPrompt: string,
  systemPrompt?: string,
  images?: string[]
): Promise<string> => {
  try {
    const system = systemPrompt || 'You are a helpful assistant.';
    // 如果有图片，取第一张转换为File
    let imageFile: File | undefined;
    if (images && images.length > 0) {
      imageFile = await base64ToFile(images[0], 'input.png');
    }
    // 使用通用的chat接口（不带图片时传undefined）
    const result = await chatWithThirdPartyApi(system, userPrompt, imageFile);
    return result;
  } catch (e) {
    console.error('LLM处理失败:', e);
    return `错误: ${e}`;
  }
};

// === 画布组件开始 ===

interface PebblingCanvasProps {
  onImageGenerated?: (imageUrl: string, prompt: string) => void; // 回调同步到桌面
  creativeIdeas?: CreativeIdea[]; // 主项目创意库
}

const PebblingCanvas: React.FC<PebblingCanvasProps> = ({ onImageGenerated, creativeIdeas = [] }) => {
  // --- 画布管理状态 ---
  const [currentCanvasId, setCurrentCanvasId] = useState<string | null>(null);
  const [canvasList, setCanvasList] = useState<canvasApi.CanvasListItem[]>([]);
  const [canvasName, setCanvasName] = useState('未命名画布');
  const [isCanvasLoading, setIsCanvasLoading] = useState(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<{ nodes: string; connections: string }>({ nodes: '', connections: '' });

  // --- State ---
  const [showIntro, setShowIntro] = useState(false); // 禁用解锁动画
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  
  // Refs for State (to avoid stale closures in execution logic)
  const nodesRef = useRef<CanvasNode[]>([]);
  const connectionsRef = useRef<Connection[]>([]);

  useEffect(() => {
      nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
      connectionsRef.current = connections;
  }, [connections]);
  
  // Canvas Transform
  const [canvasOffset, setCanvasOffset] = useState<Vec2>({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState<Vec2>({ x: 0, y: 0 });

  // Node Selection & Dragging
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set<string>());
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [isDragOperation, setIsDragOperation] = useState(false); // Tracks if actual movement occurred
  
  // Copy/Paste Buffer
  const clipboardRef = useRef<CanvasNode[]>([]);

  // Abort Controllers for cancelling operations
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  // Dragging Mathematics (Delta based)
  const [dragStartMousePos, setDragStartMousePos] = useState<Vec2>({ x: 0, y: 0 });
  const [initialNodePositions, setInitialNodePositions] = useState<Map<string, Vec2>>(new Map());
  
  // 拖拽优化：使用 ref 存储实时偏移量，避免频繁 setState
  const dragDeltaRef = useRef<Vec2>({ x: 0, y: 0 });
  const canvasDragRef = useRef<Vec2>({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const isCanvasDraggingRef = useRef(false);
  
  // Selection Box
  const [selectionBox, setSelectionBox] = useState<{ start: Vec2, current: Vec2 } | null>(null);

  // Connection Linking
  const [linkingState, setLinkingState] = useState<{
      active: boolean;
      fromNode: string | null;
      startPos: Vec2;
      currPos: Vec2;
  }>({ active: false, fromNode: null, startPos: { x: 0, y: 0 }, currPos: { x: 0, y: 0 } });

  // Generation Global Flag (Floating Input)
  const [isGenerating, setIsGenerating] = useState(false);

  // Presets & Libraries - Load from localStorage
  const [userPresets, setUserPresets] = useState<CanvasPreset[]>(() => {
    try {
      const saved = localStorage.getItem('pebbling_user_presets');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load presets:', e);
      return [];
    }
  });

  // Save presets to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('pebbling_user_presets', JSON.stringify(userPresets));
    } catch (e) {
      console.error('Failed to save presets:', e);
    }
  }, [userPresets]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [nodesForPreset, setNodesForPreset] = useState<CanvasNode[]>([]); // Buffer for preset creation
  
  // Preset Instantiation
  const [instantiatingPreset, setInstantiatingPreset] = useState<CanvasPreset | null>(null);

  // API Settings Modal
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [apiConfigured, setApiConfigured] = useState(false);

  // Check API configuration on mount
  useEffect(() => {
    setApiConfigured(isApiConfigured());
  }, []);

  // --- 画布持久化逻辑 ---
  
  // 加载画布列表
  const loadCanvasList = useCallback(async () => {
    try {
      const result = await canvasApi.getCanvasList();
      if (result.success && result.data) {
        setCanvasList(result.data);
        return result.data;
      }
    } catch (e) {
      console.error('[Canvas] 加载列表失败:', e);
    }
    return [];
  }, []);

  // 加载单个画布
  const loadCanvas = useCallback(async (canvasId: string) => {
    setIsCanvasLoading(true);
    try {
      const result = await canvasApi.getCanvas(canvasId);
      if (result.success && result.data) {
        const loadedNodes = result.data.nodes || [];
        const loadedConnections = result.data.connections || [];
        
        // 同时更新state和ref，确保一致性
        setNodes(loadedNodes);
        setConnections(loadedConnections);
        nodesRef.current = loadedNodes;
        connectionsRef.current = loadedConnections;
        
        setCanvasName(result.data.name);
        setCurrentCanvasId(canvasId);
        // 更新缓存，防止立即触发保存
        lastSaveRef.current = {
          nodes: JSON.stringify(loadedNodes),
          connections: JSON.stringify(loadedConnections)
        };
        console.log('[Canvas] 加载画布:', result.data.name);
      }
    } catch (e) {
      console.error('[Canvas] 加载画布失败:', e);
    }
    setIsCanvasLoading(false);
  }, []);

  // 创建新画布
  const createNewCanvas = useCallback(async (name?: string) => {
    try {
      const result = await canvasApi.createCanvas({ name: name || `画布 ${canvasList.length + 1}` });
      if (result.success && result.data) {
        setCurrentCanvasId(result.data.id);
        setCanvasName(result.data.name);
        setNodes([]);
        setConnections([]);
        lastSaveRef.current = { nodes: '[]', connections: '[]' };
        await loadCanvasList();
        console.log('[Canvas] 创建新画布:', result.data.name);
        return result.data;
      }
    } catch (e) {
      console.error('[Canvas] 创建画布失败:', e);
    }
    return null;
  }, [canvasList.length, loadCanvasList]);

  // 保存当前画布（防抖）- 会自动将图片内容本地化到画布专属文件夹
  const saveCurrentCanvas = useCallback(async () => {
    if (!currentCanvasId) return;
    
    // 获取当前画布名称
    const currentCanvas = canvasList.find(c => c.id === currentCanvasId);
    const currentCanvasName = currentCanvas?.name || canvasName;
    
    // 本地化图片内容：将base64/临时URL转换为本地文件（保存到画布专属文件夹）
    const localizedNodes = await Promise.all(nodesRef.current.map(async (node) => {
      // 只处理有图片内容的节点
      if (!node.content) return node;
      
      // 检查是否是需要本地化的内容
      const isBase64 = node.content.startsWith('data:image');
      const isTempUrl = node.content.startsWith('http') && 
                        !node.content.includes('/files/output/') && 
                        !node.content.includes('/files/input/');
      
      if (!isBase64 && !isTempUrl) {
        // 已经是本地文件URL，无需处理
        return node;
      }
      
      try {
        let result;
        if (isBase64) {
          // Base64 -> 保存到画布专属文件夹
          result = await canvasApi.saveCanvasImage(node.content, currentCanvasName, node.id, currentCanvasId);
        } else if (isTempUrl) {
          // 远程URL -> 下载到本地
          result = await downloadRemoteToOutput(node.content, `canvas_${node.id}_${Date.now()}.png`);
        }
        
        if (result?.success && result.data?.url) {
          console.log(`[Canvas] 图片已本地化: ${node.id.slice(0,8)} -> ${result.data.url}`);
          return { ...node, content: result.data.url };
        }
      } catch (e) {
        console.error(`[Canvas] 图片本地化失败:`, e);
      }
      
      return node;
    }));
    
    const nodesStr = JSON.stringify(localizedNodes);
    const connectionsStr = JSON.stringify(connectionsRef.current);
    
    // 检查是否有变化
    if (nodesStr === lastSaveRef.current.nodes && connectionsStr === lastSaveRef.current.connections) {
      return;
    }
    
    try {
      await canvasApi.updateCanvas(currentCanvasId, {
        nodes: localizedNodes,
        connections: connectionsRef.current,
      });
      // 更新本地节点状态（包含本地化后的URL）
      nodesRef.current = localizedNodes;
      setNodes(localizedNodes);
      lastSaveRef.current = { nodes: nodesStr, connections: connectionsStr };
      console.log('[Canvas] 自动保存');
    } catch (e) {
      console.error('[Canvas] 保存失败:', e);
    }
  }, [currentCanvasId, canvasList, canvasName]);

  // 删除画布
  const deleteCanvasById = useCallback(async (canvasId: string) => {
    try {
      const result = await canvasApi.deleteCanvas(canvasId);
      if (result.success) {
        await loadCanvasList();
        // 如果删除的是当前画布，创建新画布
        if (canvasId === currentCanvasId) {
          await createNewCanvas();
        }
        console.log('[Canvas] 删除画布:', canvasId);
      }
    } catch (e) {
      console.error('[Canvas] 删除画布失败:', e);
    }
  }, [currentCanvasId, loadCanvasList, createNewCanvas]);

  // 重命名画布（同步重命名文件夹）
  const renameCanvas = useCallback(async (newName: string) => {
    if (!currentCanvasId || !newName.trim()) return;
    
    try {
      const result = await canvasApi.updateCanvas(currentCanvasId, { name: newName.trim() });
      if (result.success) {
        setCanvasName(newName.trim());
        await loadCanvasList();
        console.log('[Canvas] 画布已重命名:', newName);
      }
    } catch (e) {
      console.error('[Canvas] 重命名失败:', e);
    }
  }, [currentCanvasId, loadCanvasList]);

  // 初始化：加载最近画布或创建新画布
  useEffect(() => {
    const initCanvas = async () => {
      const list = await loadCanvasList();
      if (list.length > 0) {
        // 加载最近更新的画布
        const sorted = [...list].sort((a, b) => b.updatedAt - a.updatedAt);
        await loadCanvas(sorted[0].id);
      } else {
        // 创建第一个画布
        await createNewCanvas('画布 1');
      }
    };
    initCanvas();
  }, []); // 只在组件挂载时执行一次

  // 自动保存（防抖500ms）
  useEffect(() => {
    if (!currentCanvasId) return;
    
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    
    saveTimerRef.current = setTimeout(() => {
      saveCurrentCanvas();
    }, 500);
    
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [nodes, connections, currentCanvasId, saveCurrentCanvas]);

  // 组件卸载前保存
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      // 同步保存一次
      if (currentCanvasId && nodesRef.current.length > 0) {
        canvasApi.updateCanvas(currentCanvasId, {
          nodes: nodesRef.current,
          connections: connectionsRef.current,
        }).catch(e => console.error('[Canvas] 卸载保存失败:', e));
      }
    };
  }, [currentCanvasId]);

  // Re-check API config when settings modal closes
  const handleCloseApiSettings = () => {
    setShowApiSettings(false);
    setApiConfigured(isApiConfigured());
  };

  const containerRef = useRef<HTMLDivElement>(null);

  // --- Utils ---
  const uuid = () => Math.random().toString(36).substr(2, 9);

  // Helper for Client-Side Resize
  const resizeImageClient = (base64Str: string, mode: 'longest' | 'shortest' | 'width' | 'height' | 'exact', widthVal: number, heightVal: number): Promise<string> => {
      return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
              let currentW = img.width;
              let currentH = img.height;
              let newWidth = currentW;
              let newHeight = currentH;
              const aspectRatio = currentW / currentH;

              if (mode === 'exact') {
                  newWidth = widthVal;
                  newHeight = heightVal;
              } else if (mode === 'width') {
                  newWidth = widthVal;
                  newHeight = widthVal / aspectRatio;
              } else if (mode === 'height') {
                  newHeight = heightVal;
                  newWidth = heightVal * aspectRatio;
              } else if (mode === 'longest') {
                  const target = widthVal; // Use widthVal as the primary 'target' container
                  if (currentW > currentH) {
                      newWidth = target;
                      newHeight = target / aspectRatio;
                  } else {
                      newHeight = target;
                      newWidth = target * aspectRatio;
                  }
              } else if (mode === 'shortest') {
                  const target = widthVal; // Use widthVal as the primary 'target' container
                  if (currentW < currentH) {
                      newWidth = target;
                      newHeight = target / aspectRatio;
                  } else {
                      newHeight = target;
                      newWidth = target * aspectRatio;
                  }
              }

              const canvas = document.createElement('canvas');
              canvas.width = newWidth;
              canvas.height = newHeight;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                  // High quality scaling
                  ctx.imageSmoothingEnabled = true;
                  ctx.imageSmoothingQuality = 'high';
                  ctx.drawImage(img, 0, 0, newWidth, newHeight);
                  resolve(canvas.toDataURL(base64Str.startsWith('data:image/png') ? 'image/png' : 'image/jpeg', 0.92));
              } else {
                  reject("Canvas context error");
              }
          };
          img.onerror = reject;
          img.src = base64Str;
      });
  };

  // --- Color Logic ---
  const resolveEffectiveType = useCallback((nodeId: string, visited: Set<string> = new Set()): string => {
      if (visited.has(nodeId)) return 'default';
      visited.add(nodeId);
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return 'default';
      if (node.type !== 'relay') return node.type;
      const inputConnection = connections.find(c => c.toNode === nodeId);
      if (inputConnection) return resolveEffectiveType(inputConnection.fromNode, visited);
      return 'default';
  }, [nodes, connections]);

  const getLinkColor = (effectiveType: string, isSelected: boolean) => {
      if (isSelected) return '#f97316'; // Orange for selected
      switch (effectiveType) {
          case 'image': case 'edit': case 'remove-bg': case 'upscale': case 'resize': return '#3b82f6';
          case 'llm': return '#a855f7'; // Purple for LLM/Logic
          case 'text': case 'idea': return '#10b981'; // Emerald for Text/Idea
          case 'video': return '#eab308';
          default: return '#71717a';
      }
  };

  // --- Actions ---

  const handleResetView = () => {
    setCanvasOffset({ x: 0, y: 0 });
    setScale(1);
  };

  const deleteSelection = useCallback(() => {
      // 1. Delete Nodes
      if (selectedNodeIds.size > 0) {
          const idsToDelete = new Set<string>(selectedNodeIds);
          setNodes(prev => prev.filter(n => !idsToDelete.has(n.id)));
          setConnections(prev => prev.filter(c => !idsToDelete.has(c.fromNode) && !idsToDelete.has(c.toNode)));
          setSelectedNodeIds(new Set<string>());
      }
      // 2. Delete Connection
      if (selectedConnectionId) {
          setConnections(prev => prev.filter(c => c.id !== selectedConnectionId));
          setSelectedConnectionId(null);
      }
  }, [selectedNodeIds, selectedConnectionId]);

  const handleCopy = useCallback(() => {
      if (selectedNodeIds.size === 0) return;
      const nodesToCopy = nodesRef.current.filter(n => selectedNodeIds.has(n.id));
      // Store deep copy
      clipboardRef.current = JSON.parse(JSON.stringify(nodesToCopy));
  }, [selectedNodeIds]);

  const handlePaste = useCallback(() => {
      if (clipboardRef.current.length === 0) return;
      
      const newNodes: CanvasNode[] = [];
      const idMap = new Map<string, string>(); // Old ID -> New ID

      // Create new nodes
      clipboardRef.current.forEach(node => {
          const newId = uuid();
          idMap.set(node.id, newId);
          newNodes.push({
              ...node,
              id: newId,
              x: node.x + 50, // Offset
              y: node.y + 50,
              status: 'idle' // Reset status
          });
      });

      setNodes(prev => [...prev, ...newNodes]);
      setSelectedNodeIds(new Set(newNodes.map(n => n.id)));
  }, []);

  // Global Key Listener
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          const tag = document.activeElement?.tagName.toLowerCase();
          if (tag === 'input' || tag === 'textarea') return;

          if (e.key === 'Delete' || e.key === 'Backspace') {
              deleteSelection();
          }

          if (e.ctrlKey || e.metaKey) {
              if (e.key === 'c') handleCopy();
              if (e.key === 'v') handlePaste();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelection, handleCopy, handlePaste]);

  const addNode = (type: NodeType, content: string = '', position?: Vec2, title?: string, data?: NodeData) => {
      const container = containerRef.current;
      let x, y;

      if (position) {
          x = position.x;
          y = position.y;
      } else {
          // Use ref for calculation to be safe if multiple nodes added quickly
          const currentNodes = nodesRef.current.length > 0 ? nodesRef.current : nodes;
          const hasNodes = currentNodes.length > 0;
          let targetX = 100;
          let targetY = 100;
          
          if (hasNodes) {
              const maxX = Math.max(...currentNodes.map(n => n.x + n.width));
              const minY = Math.min(...currentNodes.map(n => n.y));
              const maxY = Math.max(...currentNodes.map(n => n.y));
              const avgY = (minY + maxY) / 2;
              targetX = maxX + 100; 
              targetY = avgY; 
          } else {
              targetX = (-canvasOffset.x + (container ? container.clientWidth / 2 : window.innerWidth / 2)) / scale - 150;
              targetY = (-canvasOffset.y + (container ? container.clientHeight / 2 : window.innerHeight / 2)) / scale - 100;
          }
          
          x = targetX;
          y = targetY;
      }
      
      let width = 300; let height = 200;
      if (type === 'image') { 
          width = 300; 
          height = 300; 
          // 1. Aspect Ratio Logic for New Nodes
          if (data?.settings?.aspectRatio && data.settings.aspectRatio !== 'AUTO') {
              const [w, h] = data.settings.aspectRatio.split(':').map(Number);
              if (w && h) {
                  height = (width * h) / w;
              }
          }
      }
      if (type === 'video') { width = 400; height = 225; } // 16:9 default
      if (type === 'relay') { width = 40; height = 40; }
      if (['edit', 'remove-bg', 'upscale', 'llm', 'resize'].includes(type)) { width = 280; height = 250; }
      if (type === 'llm') { width = 320; height = 300; }

      const newNode: CanvasNode = {
          id: uuid(),
          type,
          content,
          x,
          y,
          width,
          height,
          title,
          data: data || {},
          status: 'idle'
      };
      setNodes(prev => [...prev, newNode]);
      return newNode;
  };

  const updateNode = (id: string, updates: Partial<CanvasNode>) => {
      // 先同步更新 ref，确保级联执行时能立即获取最新状态
      const newNodes = nodesRef.current.map(n => n.id === id ? { ...n, ...updates } : n);
      nodesRef.current = newNodes;
      // 再更新 React 状态
      setNodes(newNodes);
  };

  // --- EXECUTION LOGIC ---

  // Helper: 检查是否是有效图片
  const isValidImage = (content: string | undefined): boolean => {
      if (!content) return false;
      return content.startsWith('data:image') || content.startsWith('http://') || content.startsWith('https://');
  };

  // Helper: Recursive Input Resolution - 向上追溯获取输入
  // 就近原则：收集沿途的文本，一旦找到图片就停止这条路径的回溯
  // 例如：图1→文1→图2→文2→图3(RUN) → 结果: images=[图2], texts=[文2]
  const resolveInputs = (nodeId: string, visited = new Set<string>()): { images: string[], texts: string[] } => {
      if (visited.has(nodeId)) return { images: [], texts: [] };
      visited.add(nodeId);

      // Find connections pointing to this node
      const inputConnections = connectionsRef.current.filter(c => c.toNode === nodeId);
      // Find the nodes
      const inputNodes = inputConnections
          .map(c => nodesRef.current.find(n => n.id === c.fromNode))
          .filter((n): n is CanvasNode => !!n);
      
      // Sort by Y for deterministic order
      inputNodes.sort((a, b) => a.y - b.y);

      let images: string[] = [];
      let texts: string[] = [];

      for (const node of inputNodes) {
          let foundImageInThisPath = false;
          
          // 根据节点类型收集输出
          if (node.type === 'image') {
              // 检查这个 Image 节点是否有上游连接（判断是否为容器节点）
              const hasUpstream = connectionsRef.current.some(c => c.toNode === node.id);
              
              console.log(`[resolveInputs] Image节点 ${node.id.slice(0,8)}:`, {
                  hasUpstream,
                  status: node.status,
                  hasContent: isValidImage(node.content),
                  contentPreview: node.content?.slice(0, 50)
              });
              
              // 如果是容器节点（有上游），必须 status === 'completed' 才能使用其 content
              // 如果是源节点（无上游，用户上传的图片），直接使用 content
              if (hasUpstream) {
                  // 容器节点：必须已完成才能使用
                  if (node.status === 'completed' && isValidImage(node.content)) {
                      console.log(`[resolveInputs] ✅ 容器节点已完成，收集图片`);
                      images.push(node.content);
                      foundImageInThisPath = true;
                  } else {
                      console.log(`[resolveInputs] ⚠️ 容器节点未完成或无图片，继续向上追溯`);
                  }
              } else {
                  // 源节点：直接使用（用户上传的图片）
                  if (isValidImage(node.content)) {
                      console.log(`[resolveInputs] ✅ 源节点有图片，收集`);
                      images.push(node.content);
                      foundImageInThisPath = true;
                  }
              }
          } else if (node.type === 'text' || node.type === 'idea') {
              if (node.content) {
                  texts.push(node.content);
              }
              // 文本节点不停止，继续往上找图片
          } else if (node.type === 'llm') {
              if (node.data?.output && node.status === 'completed') {
                  texts.push(node.data.output);
              }
              // LLM节点不停止，继续往上找图片
          } else if (node.type === 'edit') {
              if (node.data?.output && node.status === 'completed' && isValidImage(node.data.output)) {
                  images.push(node.data.output);
                  foundImageInThisPath = true; // 找到图片，这条路径停止
              }
          } else if (node.type === 'remove-bg' || node.type === 'upscale' || node.type === 'resize') {
              // 必须检查 status === 'completed'，确保收集的是完成的输出
              if (node.status === 'completed' && isValidImage(node.content)) {
                  images.push(node.content);
                  foundImageInThisPath = true; // 找到图片，这条路径停止
              }
          } else if (node.type === 'bp') {
              // BP节点：优先从 data.output 获取（有下游连接时），否则从 content 获取
              const bpOutput = node.data?.output;
              if (node.status === 'completed') {
                  if (bpOutput && isValidImage(bpOutput)) {
                      images.push(bpOutput);
                      foundImageInThisPath = true;
                  } else if (isValidImage(node.content)) {
                      images.push(node.content);
                      foundImageInThisPath = true;
                  }
              }
          }
          // relay 节点没有自身输出，继续传递

          // 就近原则：只有当这条路径还没找到图片时，才继续向上追溯
          if (!foundImageInThisPath) {
              const child = resolveInputs(node.id, new Set(visited));
              images.push(...child.images);
              texts.push(...child.texts);
          }
      }
      return { images, texts };
  };

  // --- 批量生成：创建多个结果节点并并发执行 ---
  const handleBatchExecute = async (sourceNodeId: string, sourceNode: CanvasNode, count: number) => {
      console.log(`[批量生成] 开始生成 ${count} 个结果节点`);
      
      // 获取源节点的位置和输入
      const inputs = resolveInputs(sourceNodeId);
      const nodePrompt = sourceNode.data?.prompt || '';
      const inputTexts = inputs.texts.join('\n');
      const combinedPrompt = nodePrompt || inputTexts;
      const inputImages = inputs.images;
      
      // 获取源节点自身的图片
      let imageSource: string[] = [];
      if (inputImages.length > 0) {
          imageSource = inputImages;
      } else if (isValidImage(sourceNode.content)) {
          imageSource = [sourceNode.content];
      }
      
      // 检查是否可以执行
      const hasPrompt = !!combinedPrompt;
      const hasImage = imageSource.length > 0;
      
      if (!hasPrompt && !hasImage) {
          console.warn('[批量生成] 无提示词且无图片，无法执行');
          return;
      }
      
      // 创建结果节点，并自动连接到源节点
      const resultNodeIds: string[] = [];
      const newNodes: CanvasNode[] = [];
      const newConnections: Connection[] = [];
      
      // 计算结果节点的位置（源节点右侧，垂直排列）
      const baseX = sourceNode.x + sourceNode.width + 150; // 距离源节点150px
      const nodeHeight = 300; // 预估节点高度
      const gap = 20; // 节点间距
      const totalHeight = count * nodeHeight + (count - 1) * gap;
      const startY = sourceNode.y + (sourceNode.height / 2) - (totalHeight / 2);
      
      for (let i = 0; i < count; i++) {
          const newId = uuid();
          resultNodeIds.push(newId);
          
          const resultNode: CanvasNode = {
              id: newId,
              type: 'image',
              title: `结果 ${i + 1}`,
              content: '',
              x: baseX,
              y: startY + i * (nodeHeight + gap),
              width: 280,
              height: nodeHeight,
              status: 'running', // 创建时就设为running
              data: {
                  prompt: combinedPrompt, // 继承提示词
                  settings: sourceNode.data?.settings // 继承设置
              }
          };
          newNodes.push(resultNode);
          
          // 创建连接：源节点 -> 结果节点
          newConnections.push({
              id: uuid(),
              fromNode: sourceNodeId,
              toNode: newId
          });
      }
      
      // 添加节点和连接
      setNodes(prev => [...prev, ...newNodes]);
      setConnections(prev => [...prev, ...newConnections]);
      
      // 更新ref
      nodesRef.current = [...nodesRef.current, ...newNodes];
      connectionsRef.current = [...connectionsRef.current, ...newConnections];
      
      console.log(`[批量生成] 已创建 ${count} 个结果节点，开始并发执行`);
      
      // 并发执行所有结果节点的生成
      const execPromises = resultNodeIds.map(async (nodeId, index) => {
          const abortController = new AbortController();
          abortControllersRef.current.set(nodeId, abortController);
          const signal = abortController.signal;
          
          try {
              let result: string | null = null;
              
              if (hasPrompt && !hasImage) {
                  // 文生图
                  const imgAspectRatio = sourceNode.data?.settings?.aspectRatio || 'AUTO';
                  const imgConfig = imgAspectRatio !== 'AUTO' 
                      ? { aspectRatio: imgAspectRatio, resolution: '1K' as const }
                      : { aspectRatio: '1:1', resolution: '1K' as const };
                  result = await generateCreativeImage(combinedPrompt, imgConfig, signal);
              } else if (hasPrompt && hasImage) {
                  // 图生图
                  result = await editCreativeImage(imageSource, combinedPrompt, undefined, signal);
              } else if (!hasPrompt && hasImage) {
                  // 传递图片（容器模式）
                  result = imageSource[0];
              }
              
              if (!signal.aborted) {
                  updateNode(nodeId, { 
                      content: result || '', 
                      status: result ? 'completed' : 'error' 
                  });
                  
                  // 同步到桌面
                  if (result && onImageGenerated) {
                      onImageGenerated(result, combinedPrompt);
                  }
                  
                  console.log(`[批量生成] 结果 ${index + 1} 完成`);
              }
          } catch (err) {
              if (!signal.aborted) {
                  updateNode(nodeId, { status: 'error' });
                  console.error(`[批量生成] 结果 ${index + 1} 失败:`, err);
              }
          } finally {
              abortControllersRef.current.delete(nodeId);
          }
      });
      
      // 等待所有执行完成
      await Promise.all(execPromises);
      
      // 保存画布
      saveCurrentCanvas();
      console.log(`[批量生成] 全部完成`);
  };

  // --- BP/Idea节点批量执行：自动创建图像节点并生成 ---
  const handleBpIdeaBatchExecute = async (sourceNodeId: string, sourceNode: CanvasNode, count: number) => {
      console.log(`[BP/Idea批量] 开始生成 ${count} 个图像节点`);
      
      // 获取输入
      const inputs = resolveInputs(sourceNodeId);
      const inputImages = inputs.images;
      
      // 获取提示词和设置
      let finalPrompt = '';
      let settings: any = {};
      
      if (sourceNode.type === 'bp') {
          // BP节点：处理Agent和模板
          const bpTemplate = sourceNode.data?.bpTemplate;
          const bpInputs = sourceNode.data?.bpInputs || {};
          settings = sourceNode.data?.settings || {};
          
          if (!bpTemplate) {
              console.error('[BP/Idea批量] BP节点无模板配置');
              return;
          }
          
          const bpFields = bpTemplate.bpFields || [];
          const inputFields = bpFields.filter((f: any) => f.type === 'input');
          const agentFields = bpFields.filter((f: any) => f.type === 'agent');
          
          // 收集用户输入值
          const userInputValues: Record<string, string> = {};
          for (const field of inputFields) {
              userInputValues[field.name] = bpInputs[field.id] || bpInputs[field.name] || '';
          }
          
          // 执行Agent
          const agentResults: Record<string, string> = {};
          for (const field of agentFields) {
              if (field.agentConfig) {
                  let instruction = field.agentConfig.instruction;
                  for (const [name, value] of Object.entries(userInputValues)) {
                      instruction = instruction.split(`/${name}`).join(value);
                  }
                  for (const [name, result] of Object.entries(agentResults)) {
                      instruction = instruction.split(`{${name}}`).join(result);
                  }
                  
                  try {
                      const agentResult = await generateAdvancedLLM(
                          instruction,
                          'You are a creative assistant. Generate content based on the given instruction. Output ONLY the requested content, no explanations.',
                          inputImages.length > 0 ? [inputImages[0]] : undefined
                      );
                      agentResults[field.name] = agentResult;
                  } catch (agentErr) {
                      agentResults[field.name] = `[Agent错误: ${agentErr}]`;
                  }
              }
          }
          
          // 替换模板变量
          finalPrompt = bpTemplate.prompt;
          for (const [name, value] of Object.entries(userInputValues)) {
              finalPrompt = finalPrompt.split(`/${name}`).join(value);
          }
          for (const [name, result] of Object.entries(agentResults)) {
              finalPrompt = finalPrompt.split(`{${name}}`).join(result);
          }
      } else if (sourceNode.type === 'idea') {
          // Idea节点：直接使用content作为提示词
          finalPrompt = sourceNode.content || '';
          settings = sourceNode.data?.settings || {};
      }
      
      if (!finalPrompt) {
          console.error('[BP/Idea批量] 无提示词');
          return;
      }
      
      console.log(`[BP/Idea批量] 最终提示词:`, finalPrompt.slice(0, 100));
      
      // 创建结果节点
      const resultNodeIds: string[] = [];
      const newNodes: CanvasNode[] = [];
      const newConnections: Connection[] = [];
      
      const baseX = sourceNode.x + sourceNode.width + 150;
      const nodeHeight = 300;
      const gap = 20;
      const totalHeight = count * nodeHeight + (count - 1) * gap;
      const startY = sourceNode.y + (sourceNode.height / 2) - (totalHeight / 2);
      
      for (let i = 0; i < count; i++) {
          const newId = uuid();
          resultNodeIds.push(newId);
          
          const resultNode: CanvasNode = {
              id: newId,
              type: 'image',
              title: `结果 ${i + 1}`,
              content: '',
              x: baseX,
              y: startY + i * (nodeHeight + gap),
              width: 280,
              height: nodeHeight,
              status: 'running',
              data: {
                  prompt: finalPrompt,
                  settings: settings
              }
          };
          newNodes.push(resultNode);
          
          newConnections.push({
              id: uuid(),
              fromNode: sourceNodeId,
              toNode: newId
          });
      }
      
      // 添加节点和连接
      setNodes(prev => [...prev, ...newNodes]);
      setConnections(prev => [...prev, ...newConnections]);
      nodesRef.current = [...nodesRef.current, ...newNodes];
      connectionsRef.current = [...connectionsRef.current, ...newConnections];
      
      // 标记源节点为完成（因为它的任务已经完成）
      updateNode(sourceNodeId, { status: 'completed' });
      
      console.log(`[BP/Idea批量] 已创建 ${count} 个图像节点，开始并发执行`);
      
      // 并发执行所有结果节点的生成
      const execPromises = resultNodeIds.map(async (nodeId, index) => {
          const abortController = new AbortController();
          abortControllersRef.current.set(nodeId, abortController);
          const signal = abortController.signal;
          
          try {
              let result: string | null = null;
              
              const aspectRatio = settings.aspectRatio || 'AUTO';
              const resolution = settings.resolution || '2K';
              const config: GenerationConfig = aspectRatio !== 'AUTO' 
                  ? { aspectRatio, resolution }
                  : { aspectRatio: '1:1', resolution };
              
              if (inputImages.length > 0) {
                  // 图生图
                  result = await editCreativeImage(inputImages, finalPrompt, config, signal);
              } else {
                  // 文生图
                  result = await generateCreativeImage(finalPrompt, config, signal);
              }
              
              if (!signal.aborted) {
                  updateNode(nodeId, { 
                      content: result || '', 
                      status: result ? 'completed' : 'error' 
                  });
                  
                  if (result && onImageGenerated) {
                      onImageGenerated(result, finalPrompt);
                  }
                  
                  console.log(`[BP/Idea批量] 结果 ${index + 1} 完成`);
              }
          } catch (err) {
              if (!signal.aborted) {
                  updateNode(nodeId, { status: 'error' });
                  console.error(`[BP/Idea批量] 结果 ${index + 1} 失败:`, err);
              }
          } finally {
              abortControllersRef.current.delete(nodeId);
          }
      });
      
      await Promise.all(execPromises);
      saveCurrentCanvas();
      console.log(`[BP/Idea批量] 全部完成`);
  };

  const handleExecuteNode = async (nodeId: string, batchCount: number = 1) => {
      const node = nodesRef.current.find(n => n.id === nodeId);
      if (!node) return;

      // 批量生成：创建多个结果节点
      if (batchCount > 1 && ['image', 'edit'].includes(node.type)) {
          await handleBatchExecute(nodeId, node, batchCount);
          return;
      }
      
      // BP/Idea节点批量执行：自动创建图像节点
      if (batchCount >= 1 && ['bp', 'idea'].includes(node.type)) {
          await handleBpIdeaBatchExecute(nodeId, node, batchCount);
          return;
      }

      // Create abort controller for this execution
      const abortController = new AbortController();
      abortControllersRef.current.set(nodeId, abortController);
      const signal = abortController.signal;

      updateNode(nodeId, { status: 'running' });

      try {
          // 级联执行：先执行上游未完成的节点
          const inputConnections = connectionsRef.current.filter(c => c.toNode === nodeId);
          console.log(`[级联执行] 节点 ${nodeId.slice(0,8)} 有 ${inputConnections.length} 个上游连接`);
          
          for (const conn of inputConnections) {
              const upstreamNode = nodesRef.current.find(n => n.id === conn.fromNode);
              console.log(`[级联执行] 上游节点:`, {
                  id: upstreamNode?.id.slice(0,8),
                  type: upstreamNode?.type,
                  status: upstreamNode?.status
              });
              
              // 如果上游节点需要执行且未完成，先执行上游
              if (upstreamNode && upstreamNode.status !== 'completed') {
                  // 可执行的节点类型：包含 image 以支持容器模式级联执行
                  const executableTypes = ['image', 'llm', 'edit', 'remove-bg', 'upscale', 'resize', 'video', 'bp'];
                  if (executableTypes.includes(upstreamNode.type)) {
                      console.log(`[级联执行] ⤵️ 触发上游节点执行: ${upstreamNode.type} ${upstreamNode.id.slice(0,8)}`);
                      // 递归执行上游节点
                      await handleExecuteNode(upstreamNode.id);
                      console.log(`[级联执行] ✅ 上游节点执行完成`);
                  }
              } else if (upstreamNode) {
                  console.log(`[级联执行] ✅ 上游节点已完成，无需重新执行`);
              }
          }
          
          // 检查是否被中断
          if (signal.aborted) return;

          // Resolve all inputs (recursive for edits/relays) - 向上追溯
          const inputs = resolveInputs(nodeId);
          
          if (node.type === 'image') {
              // 获取节点自身的prompt
              const nodePrompt = node.data?.prompt || '';
              // 上游输入的文本
              const inputTexts = inputs.texts.join('\n');
              // 上游图片
              const inputImages = inputs.images;
              
              // 从上游节点获取设置（支持idea节点）
              let upstreamSettings: any = null;
              let upstreamPrompt = '';
              const inputConnections = connectionsRef.current.filter(c => c.toNode === nodeId);
              for (const conn of inputConnections) {
                  const upstreamNode = nodesRef.current.find(n => n.id === conn.fromNode);
                  if (upstreamNode?.type === 'idea' && upstreamNode.data?.settings) {
                      // 从idea节点继承设置
                      upstreamSettings = upstreamNode.data.settings;
                      if (!nodePrompt && upstreamNode.content) {
                          upstreamPrompt = upstreamNode.content;
                      }
                      break;
                  } else if (upstreamNode?.type === 'image' && upstreamNode.data?.prompt && !nodePrompt) {
                      // 从上游image节点继承prompt
                      upstreamPrompt = upstreamNode.data.prompt;
                  }
              }
              
              // 合并prompt：自身 > 上游节点prompt > 上游文本输入
              const combinedPrompt = nodePrompt || upstreamPrompt || inputTexts;
              
              // 合并设置：自身 > 上游节点设置 > 默认
              const effectiveSettings = node.data?.settings || upstreamSettings || {};
              
              // 获取图片：优先用上游输入，其次用节点自身的图片
              let imageSource: string[] = [];
              if (inputImages.length > 0) {
                  // 有上游图片输入
                  imageSource = inputImages;
              } else if (isValidImage(node.content)) {
                  // 没有上游图片，但节点自身有图片
                  imageSource = [node.content];
              }
              
              // 执行逻辑：
              // 1. 无prompt + 无图片 = 不执行
              // 2. 有prompt + 无图片 = 文生图
              // 3. 无prompt + 有图片 = 传递图片（容器模式）
              // 4. 有prompt + 有图片 = 图生图
              
              if (!combinedPrompt && imageSource.length === 0) {
                  // 无prompt + 无图片 = 不执行
                  updateNode(nodeId, { status: 'error' });
                  console.warn('图片节点执行失败：无提示词且无图片');
              } else if (combinedPrompt && imageSource.length === 0) {
                  // 有prompt + 无图片 = 文生图
                  // 使用effectiveSettings（合并后的设置）
                  const imgAspectRatio = effectiveSettings.aspectRatio || 'AUTO';
                  const imgResolution = effectiveSettings.resolution || '2K';
                  const imgConfig = imgAspectRatio !== 'AUTO' 
                      ? { aspectRatio: imgAspectRatio, resolution: imgResolution as '1K' | '2K' | '4K' }
                      : { aspectRatio: '1:1', resolution: imgResolution as '1K' | '2K' | '4K' }; // 文生图默认1:1
                  
                  const result = await generateCreativeImage(combinedPrompt, imgConfig, signal);
                  if (!signal.aborted) {
                      updateNode(nodeId, { content: result || '', status: result ? 'completed' : 'error' });
                      // 立即保存画布（避免切换TAB时数据丢失）
                      saveCurrentCanvas();
                      // 同步到桌面
                      if (result && onImageGenerated) {
                          onImageGenerated(result, combinedPrompt);
                      }
                  }
              } else if (!combinedPrompt && imageSource.length > 0) {
                  // 无prompt + 有图片 = 传递图片（容器模式）
                  if (!signal.aborted) {
                      updateNode(nodeId, { content: imageSource[0], status: 'completed' });
                  }
              } else {
                  // 有prompt + 有图片 = 图生图
                  // 默认 AUTO，不传递参数，让 API 根据图片自动决定比例
                  const result = await editCreativeImage(imageSource, combinedPrompt, undefined, signal);
                  if (!signal.aborted) {
                      updateNode(nodeId, { content: result || '', status: result ? 'completed' : 'error' });
                      // 立即保存画布（避免切换TAB时数据丢失）
                      saveCurrentCanvas();
                      // 同步到桌面
                      if (result && onImageGenerated) {
                          onImageGenerated(result, combinedPrompt);
                      }
                  }
              }
          }
          else if (node.type === 'edit') {
               // Edit节点执行逻辑 - 执行后保持节点原貌，输出存到 data.output 供下游获取
               // 先清除之前的输出，以便重新执行
               updateNode(nodeId, { data: { ...node.data, output: undefined } });
               
               const nodePrompt = node.data?.prompt || '';
               const inputTexts = inputs.texts.join('\n');
               const combinedPrompt = nodePrompt || inputTexts;
               const inputImages = inputs.images;
               
               // 获取 Edit 节点的设置
               const editAspectRatio = node.data?.settings?.aspectRatio || 'AUTO';
               const editResolution = node.data?.settings?.resolution || 'AUTO';
               
               // AUTO 时不传递参数（不是传空），让 API 根据图片自动决定
               let finalConfig: GenerationConfig | undefined = undefined;
               if (editAspectRatio !== 'AUTO' || editResolution !== 'AUTO') {
                   finalConfig = {
                       aspectRatio: editAspectRatio !== 'AUTO' ? editAspectRatio : '1:1',
                       resolution: editResolution !== 'AUTO' ? editResolution as '1K' | '2K' | '4K' : '1K'
                   };
               }
               
               if (!combinedPrompt && inputImages.length === 0) {
                   // 无prompt + 无图片 = 不执行
                   updateNode(nodeId, { status: 'error' });
               } else if (combinedPrompt && inputImages.length === 0) {
                   // 有prompt + 无图片 = 文生图
                   const result = await generateCreativeImage(combinedPrompt, finalConfig, signal);
                   if (!signal.aborted) {
                       // 输出存到 data.output，不覆盖节点显示
                       updateNode(nodeId, { 
                           data: { ...node.data, output: result },
                           status: result ? 'completed' : 'error' 
                       });
                   }
               } else if (!combinedPrompt && inputImages.length > 0) {
                   // 无prompt + 有图片 = 直接传递图片
                   if (!signal.aborted) {
                       updateNode(nodeId, { 
                           data: { ...node.data, output: inputImages[0] },
                           status: 'completed' 
                       });
                   }
               } else {
                   // 有prompt + 有图片 = 图生图
                   const result = await editCreativeImage(inputImages, combinedPrompt, finalConfig, signal);
                   if (!signal.aborted) {
                       // 输出存到 data.output，不覆盖节点显示
                       updateNode(nodeId, { 
                           data: { ...node.data, output: result },
                           status: result ? 'completed' : 'error' 
                       });
                   }
               }
          }
          else if (node.type === 'video') {
               // Video节点：暂不支持视频生成，显示提示
               updateNode(nodeId, { status: 'error' });
               console.warn('Video节点暂不支持，请在主界面使用视频生成功能');
          }
          else if (node.type === 'idea' || node.type === 'text') {
               // Text/Idea节点：容器模式 - 接收上游文本内容
               // 重新获取输入（因为上游可能刚执行完）
               const freshInputs = resolveInputs(nodeId);
               const inputTexts = freshInputs.texts;
               
               // 检查是否有上游连接
               const hasUpstreamConnection = connectionsRef.current.some(c => c.toNode === nodeId);
               
               // 如果有上游连接，作为纯容器使用
               if (hasUpstreamConnection) {
                   if (inputTexts.length > 0) {
                       // 直接显示上游内容（容器模式）
                       const mergedText = inputTexts.join('\n\n');
                       if (!signal.aborted) {
                           updateNode(nodeId, { 
                               content: mergedText, 
                               status: 'completed' 
                           });
                       }
                   } else {
                       // 上游还没有输出
                       updateNode(nodeId, { status: 'error' });
                       console.warn('上游节点无输出');
                   }
               } else if (node.content) {
                   // 没有上游连接，但有自身内容，使用LLM扩展
                   const result = await generateCreativeText(node.content);
                   if (!signal.aborted) {
                       updateNode(nodeId, { 
                           title: result.title, 
                           content: result.content, 
                           status: 'completed' 
                       });
                   }
               } else {
                   // 无上游输入且无自身内容
                   updateNode(nodeId, { status: 'error' });
                   console.warn('文本节点执行失败：无内容');
               }
          }
          else if (node.type === 'llm') {
              // LLM节点：可以处理图片+文本输入
              // 执行后保持节点原貌，输出存到 data.output 供下游获取
              const nodePrompt = node.data?.prompt || '';
              const inputTexts = inputs.texts.join('\n');
              const userPrompt = nodePrompt || inputTexts;
              const systemPrompt = node.data?.systemInstruction;
              const inputImages = inputs.images;
              
              if (!userPrompt && inputImages.length === 0) {
                  updateNode(nodeId, { status: 'error' });
                  console.warn('LLM节点执行失败：无输入');
              } else {
                  const result = await generateAdvancedLLM(userPrompt, systemPrompt, inputImages);
                  if (!signal.aborted) {
                      // 输出存到 data.output，不覆盖节点显示
                      updateNode(nodeId, { 
                          data: { ...node.data, output: result },
                          status: 'completed' 
                      });
                  }
              }
          }
          else if (node.type === 'resize') {
              // Resize节点：需要上游图片输入
              const inputImages = inputs.images;
              
              if (inputImages.length === 0) {
                  updateNode(nodeId, { status: 'error' });
                  console.warn('Resize节点执行失败：无输入图片');
              } else {
                  const src = inputImages[0];
                  const mode = node.data?.resizeMode || 'longest';
                  const w = node.data?.resizeWidth || 1024;
                  const h = node.data?.resizeHeight || 1024;
                  const resized = await resizeImageClient(src, mode, w, h);
                  if (!signal.aborted) {
                      updateNode(nodeId, { content: resized, status: 'completed' });
                  }
              }
          }
          else if (node.type === 'remove-bg') {
              // Remove-BG节点：需要上游图片输入
              const inputImages = inputs.images;
              
              if (inputImages.length === 0) {
                  updateNode(nodeId, { status: 'error' });
                  console.warn('Remove-BG节点执行失败：无输入图片');
              } else {
                  const prompt = "Remove the background, keep subject on transparent or white background";
                  const result = await editCreativeImage([inputImages[0]], prompt, undefined, signal);
                  if (!signal.aborted) {
                       updateNode(nodeId, { content: result || '', status: result ? 'completed' : 'error' });
                  }
              }
          }
          else if (node.type === 'upscale') {
              // Upscale节点：高清放大处理
              const inputImages = inputs.images;
              
              console.log(`[Upscale] 收集到的输入图片数量: ${inputImages.length}`);
              if (inputImages.length > 0) {
                  console.log(`[Upscale] 图片预览:`, inputImages[0]?.slice(0, 80));
              }
              
              if (inputImages.length === 0) {
                  updateNode(nodeId, { status: 'error' });
                  console.error('❌ Upscale节点执行失败：无输入图片！请检查上游节点是否已执行完成');
              } else {
                  // 固定提示词：保持画面内容不变，高清处理
                  const prompt = "Upscale this image to high resolution while preserving all original details, colors, and composition. Enhance clarity and sharpness without altering the content.";
                  // 获取用户选择的分辨率，默认 2K
                  const upscaleResolution = node.data?.settings?.resolution || '2K';
                  // 配置：只传分辨率，不传比例参数，让API保持原图比例
                  const upscaleConfig: GenerationConfig = {
                      resolution: upscaleResolution as '1K' | '2K' | '4K'
                  };
                  const result = await editCreativeImage([inputImages[0]], prompt, upscaleConfig, signal);
                  if (!signal.aborted) {
                       updateNode(nodeId, { content: result || '', status: result ? 'completed' : 'error' });
                  }
              }
          }
          else if (node.type === 'bp') {
              // BP节点：内置智能体+模板，执行图片生成
              const bpTemplate = node.data?.bpTemplate;
              const bpInputs = node.data?.bpInputs || {};
              const inputImages = inputs.images;
              
              if (!bpTemplate) {
                  updateNode(nodeId, { status: 'error' });
                  console.error('BP节点执行失败：无模板配置');
              } else {
                  try {
                      const bpFields = bpTemplate.bpFields || [];
                      const inputFields = bpFields.filter(f => f.type === 'input');
                      const agentFields = bpFields.filter(f => f.type === 'agent');
                      
                      console.log('[BP节点] 原始输入:', bpInputs);
                      console.log('[BP节点] 字段配置:', bpFields);
                      console.log('[BP节点] Input字段:', inputFields.map(f => f.name));
                      console.log('[BP节点] Agent字段:', agentFields.map(f => f.name));
                      
                      // 1. 收集用户输入值（input字段）
                      const userInputValues: Record<string, string> = {};
                      for (const field of inputFields) {
                          // input字段从bpInputs中取值（可以是field.id或field.name）
                          userInputValues[field.name] = bpInputs[field.id] || bpInputs[field.name] || '';
                          console.log(`[BP节点] Input ${field.name} = "${userInputValues[field.name]}"`);
                      }
                      
                      // 2. 按顺序执行智能体字段（agent字段）
                      const agentResults: Record<string, string> = {};
                      
                      for (const field of agentFields) {
                          if (field.agentConfig) {
                              // 准备agent的instruction：替换其中的变量
                              let instruction = field.agentConfig.instruction;
                              
                              // 替换 /inputName 为用户输入值
                              for (const [name, value] of Object.entries(userInputValues)) {
                                  instruction = instruction.split(`/${name}`).join(value);
                              }
                              
                              // 替换 {agentName} 为已执行的agent结果
                              for (const [name, result] of Object.entries(agentResults)) {
                                  instruction = instruction.split(`{${name}}`).join(result);
                              }
                              
                              console.log(`[BP节点] 执行Agent ${field.name}, instruction:`, instruction.slice(0, 200));
                              
                              // 调用LLM执行agent
                              try {
                                  const agentResult = await generateAdvancedLLM(
                                      instruction, // instruction作为user prompt
                                      'You are a creative assistant. Generate content based on the given instruction. Output ONLY the requested content, no explanations.',
                                      inputImages.length > 0 ? [inputImages[0]] : undefined
                                  );
                                  agentResults[field.name] = agentResult;
                                  console.log(`[BP节点] Agent ${field.name} 返回:`, agentResult.slice(0, 100));
                              } catch (agentErr) {
                                  console.error(`[BP节点] Agent ${field.name} 执行失败:`, agentErr);
                                  agentResults[field.name] = `[Agent错误: ${agentErr}]`;
                              }
                          }
                      }
                      
                      // 3. 替换最终模板中的所有变量
                      let finalPrompt = bpTemplate.prompt;
                      console.log('[BP节点] 原始模板:', finalPrompt);
                      
                      // 替换 /inputName 为用户输入值
                      for (const [name, value] of Object.entries(userInputValues)) {
                          const beforeReplace = finalPrompt;
                          finalPrompt = finalPrompt.split(`/${name}`).join(value);
                          if (beforeReplace !== finalPrompt) {
                              console.log(`[BP节点] 替换 /${name} -> ${value.slice(0, 50)}`);
                          }
                      }
                      
                      // 替换 {agentName} 为agent结果
                      for (const [name, result] of Object.entries(agentResults)) {
                          const beforeReplace = finalPrompt;
                          finalPrompt = finalPrompt.split(`{${name}}`).join(result);
                          if (beforeReplace !== finalPrompt) {
                              console.log(`[BP节点] 替换 {${name}} -> ${result.slice(0, 50)}`);
                          }
                      }
                      
                      console.log('[BP节点] 最终提示词:', finalPrompt.slice(0, 300));
                      
                      // 4. 调用图片生成API
                      const settings = node.data?.settings || {};
                      const config: GenerationConfig = {
                          aspectRatio: settings.aspectRatio || '1:1',
                          resolution: settings.resolution || '2K'
                      };
                      
                      let result: string | null = null;
                      if (inputImages.length > 0) {
                          // 有输入图片 = 图生图
                          console.log('[BP节点] 调用图生图 API');
                          result = await editCreativeImage(inputImages, finalPrompt, config, signal);
                      } else {
                          // 无输入图片 = 文生图
                          console.log('[BP节点] 调用文生图 API');
                          result = await generateCreativeImage(finalPrompt, config, signal);
                      }
                      
                      console.log('[BP节点] API返回结果:', result ? `有图片 (${result.slice(0,50)}...)` : 'null');
                      
                      if (!signal.aborted) {
                          // 检查是否有下游连接
                          const hasDownstream = connectionsRef.current.some(c => c.fromNode === nodeId);
                          console.log('[BP节点] 有下游连接:', hasDownstream);
                          
                          if (hasDownstream) {
                              // 有下游连接：结果存到 data.output，保持节点原貌
                              console.log('[BP节点] 有下游，结果存到 data.output');
                              updateNode(nodeId, {
                                  data: { ...node.data, output: result || '' },
                                  status: result ? 'completed' : 'error'
                              });
                          } else {
                              // 无下游连接：结果存到 content，显示图片
                              console.log('[BP节点] 无下游，结果存到 content');
                              updateNode(nodeId, {
                                  content: result || '',
                                  status: result ? 'completed' : 'error'
                              });
                          }
                          
                          // 保存画布
                          saveCurrentCanvas();
                          
                          // 同步到桌面
                          if (result && onImageGenerated) {
                              onImageGenerated(result, finalPrompt);
                          }
                      }
                  } catch (err) {
                      console.error('BP节点执行失败:', err);
                      updateNode(nodeId, { status: 'error' });
                  }
              }
          }

      } catch (e) {
          if ((e as Error).name !== 'AbortError') {
              console.error(e);
              updateNode(nodeId, { status: 'error' });
          }
      } finally {
          // Clean up abort controller
          abortControllersRef.current.delete(nodeId);
      }
  };

  // Function to cancel/stop a running node execution
  const handleStopNode = (nodeId: string) => {
      const controller = abortControllersRef.current.get(nodeId);
      if (controller) {
          controller.abort();
          abortControllersRef.current.delete(nodeId);
          updateNode(nodeId, { status: 'idle' });
      }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    // 1. Try to get internal node type
    const type = e.dataTransfer.getData('nodeType') as NodeType;
    
    // Calculate drop position relative to canvas
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const x = (e.clientX - rect.left - canvasOffset.x) / scale - 150; // Center node roughly
    const y = (e.clientY - rect.top - canvasOffset.y) / scale - 100;

    if (type) {
        addNode(type, '', { x, y });
        return;
    }

    // 2. Handle File Drop (OS Files)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        Array.from(e.dataTransfer.files).forEach((item, index) => {
            const file = item as File;
            const offsetX = x + (index * 20); // Stagger multiple files slightly
            const offsetY = y + (index * 20);

            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    if (ev.target?.result) {
                        addNode('image', ev.target.result as string, { x: offsetX, y: offsetY });
                    }
                };
                reader.readAsDataURL(file);
            } else if (file.type.startsWith('video/')) {
                 const reader = new FileReader();
                reader.onload = (ev) => {
                    if (ev.target?.result) {
                        addNode('video', ev.target.result as string, { x: offsetX, y: offsetY });
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }
  };

  // --- INTERACTION HANDLERS ---

  const onMouseDownCanvas = (e: React.MouseEvent) => {
      // Logic:
      // Ctrl/Meta + Left Click = Box Selection
      // Left Click on BG (no keys) = Pan Canvas + Deselect All
      // Middle Click = Pan
      
      if (e.button === 0) {
          if (e.ctrlKey || e.metaKey) {
             // START SELECTION BOX
             setSelectionBox({ start: { x: e.clientX, y: e.clientY }, current: { x: e.clientX, y: e.clientY } });
             // Box select usually doesn't deselect immediately, allows adding
          } else {
             // START PANNING & DESELECT
             // Clicked blank space -> Deselect all nodes and connections
             setSelectedNodeIds(new Set());
             setSelectedConnectionId(null);

             setIsDraggingCanvas(true);
             setDragStart({ x: e.clientX - canvasOffset.x, y: e.clientY - canvasOffset.y });
          }
      } else if (e.button === 1) {
          // Middle click pan
          setIsDraggingCanvas(true);
          setDragStart({ x: e.clientX - canvasOffset.x, y: e.clientY - canvasOffset.y });
      }
  };

  const onMouseMove = (e: React.MouseEvent) => {
      const clientX = e.clientX;
      const clientY = e.clientY;
      
      // 1. Pan Canvas - 使用 RAF 批量更新
      if (isDraggingCanvas) {
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          rafRef.current = requestAnimationFrame(() => {
              setCanvasOffset({
                  x: clientX - dragStart.x,
                  y: clientY - dragStart.y
              });
          });
          return;
      }

      // 2. Dragging Nodes - 使用 RAF 批量更新
      if (draggingNodeId && isDragOperation) {
          const deltaX = (clientX - dragStartMousePos.x) / scale;
          const deltaY = (clientY - dragStartMousePos.y) / scale;
          
          // 存储当前 delta
          dragDeltaRef.current = { x: deltaX, y: deltaY };
          
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          rafRef.current = requestAnimationFrame(() => {
              const delta = dragDeltaRef.current;
              setNodes(prev => prev.map(node => {
                  if (selectedNodeIds.has(node.id)) {
                      const initialPos = initialNodePositions.get(node.id);
                      if (initialPos) {
                          return {
                              ...node,
                              x: initialPos.x + delta.x,
                              y: initialPos.y + delta.y
                          };
                      }
                  }
                  return node;
              }));
          });
          return;
      }

      // 3. Selection Box
      if (selectionBox) {
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          rafRef.current = requestAnimationFrame(() => {
              setSelectionBox(prev => prev ? { ...prev, current: { x: clientX, y: clientY } } : null);
          });
          return;
      }

      // 4. Linking - 连线需要即时响应，不使用 RAF
      if (linkingState.active) {
          const container = containerRef.current;
          if (container) {
               const rect = container.getBoundingClientRect();
               setLinkingState(prev => ({
                   ...prev,
                   currPos: {
                       x: (clientX - rect.left - canvasOffset.x) / scale,
                       y: (clientY - rect.top - canvasOffset.y) / scale
                   }
               }));
          }
      }
  };

  const onMouseUp = (e: React.MouseEvent) => {
      // 清理 RAF
      if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
      }
      
      setIsDraggingCanvas(false);
      setDraggingNodeId(null);
      setIsDragOperation(false);
      setLinkingState(prev => ({ ...prev, active: false, fromNode: null }));

      // Resolve Selection Box
      if (selectionBox) {
          const container = containerRef.current;
          if (container) {
              const rect = container.getBoundingClientRect();
              
              // Convert box to canvas space
              const startX = (selectionBox.start.x - rect.left - canvasOffset.x) / scale;
              const startY = (selectionBox.start.y - rect.top - canvasOffset.y) / scale;
              const curX = (selectionBox.current.x - rect.left - canvasOffset.x) / scale;
              const curY = (selectionBox.current.y - rect.top - canvasOffset.y) / scale;

              const minX = Math.min(startX, curX);
              const maxX = Math.max(startX, curX);
              const minY = Math.min(startY, curY);
              const maxY = Math.max(startY, curY);

              // Standard box select behavior: Select what is inside
              const newSelection = new Set<string>();
              // Note: If you want to hold Shift to add to selection, handle e.shiftKey here. 
              // For now, implementing standard replacement selection.
              
              nodes.forEach(node => {
                  const nodeCenterX = node.x + node.width / 2;
                  const nodeCenterY = node.y + node.height / 2;
                  if (nodeCenterX >= minX && nodeCenterX <= maxX && nodeCenterY >= minY && nodeCenterY <= maxY) {
                      newSelection.add(node.id);
                  }
              });
              setSelectedNodeIds(newSelection);
          }
          setSelectionBox(null);
      }
  };

  const onWheel = (e: React.WheelEvent) => {
      // Wheel = Zoom centered on cursor
      e.preventDefault(); 

      const zoomSensitivity = -0.001; 
      const delta = e.deltaY * zoomSensitivity;
      const newScale = Math.min(Math.max(0.1, scale + delta), 5);

      // Calculate Zoom towards Mouse Position
      const container = containerRef.current;
      if (!container) {
          setScale(newScale);
          return;
      }
      
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Math: NewOffset = Mouse - ((Mouse - OldOffset) / OldScale) * NewScale
      const newOffsetX = mouseX - ((mouseX - canvasOffset.x) / scale) * newScale;
      const newOffsetY = mouseY - ((mouseY - canvasOffset.y) / scale) * newScale;

      setScale(newScale);
      setCanvasOffset({ x: newOffsetX, y: newOffsetY });
  };

  const handleNodeDragStart = (e: React.MouseEvent, id: string) => {
      if (e.button !== 0) return; // Only left click
      e.stopPropagation();
      
      const newSelection = new Set(selectedNodeIds);
      if (!newSelection.has(id)) {
          if (!e.shiftKey) newSelection.clear();
          newSelection.add(id);
          setSelectedNodeIds(newSelection);
      }
      
      setDraggingNodeId(id);
      setIsDragOperation(true);
      setDragStartMousePos({ x: e.clientX, y: e.clientY });
      
      // Snapshot positions
      const positions = new Map<string, Vec2>();
      nodes.forEach(n => {
          if (newSelection.has(n.id)) {
              positions.set(n.id, { x: n.x, y: n.y });
          }
      });
      setInitialNodePositions(positions);
  };

  const handleStartConnection = (nodeId: string, portType: 'in' | 'out', pos: Vec2) => {
     if (portType === 'out') {
         setLinkingState({
             active: true,
             fromNode: nodeId,
             startPos: pos, 
             currPos: { x: (pos.x - canvasOffset.x) / scale, y: (pos.y - canvasOffset.y) / scale } 
         });
     }
  };

  const handleEndConnection = (targetNodeId: string) => {
      if (linkingState.active && linkingState.fromNode && linkingState.fromNode !== targetNodeId) {
          const exists = connections.some(c => c.fromNode === linkingState.fromNode && c.toNode === targetNodeId);
          if (!exists) {
              setConnections(prev => [...prev, {
                  id: uuid(),
                  fromNode: linkingState.fromNode!,
                  toNode: targetNodeId
              }]);
          }
      }
  };

  // 处理工具节点创建
  const handleCreateToolNode = (sourceNodeId: string, toolType: NodeType, position: { x: number, y: number }) => {
      // 为扩图工具预设 prompt
      let presetData = {};
      if (toolType === 'edit') {
          presetData = { prompt: "Extend the image naturally, maintaining style and coherence" };
      }
      
      const newNode = addNode(toolType, '', position, undefined, presetData);
      
      // 自动创建连接
      setConnections(prev => [...prev, {
          id: uuid(),
          fromNode: sourceNodeId,
          toNode: newNode.id
      }]);
  };

  // --- FLOATING GENERATOR HANDLER ---
  const handleGenerate = async (type: NodeType, prompt: string, config: GenerationConfig, files?: File[]) => {
      setIsGenerating(true);
      
      let base64Files: string[] = [];
      if (files && files.length > 0) {
          const promises = files.map(file => new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target?.result as string);
              reader.readAsDataURL(file);
          }));
          base64Files = await Promise.all(promises);
      }

      const newNode = addNode(type, '', undefined, undefined, { 
          prompt: prompt,
          settings: config
      });
      
      updateNode(newNode.id, { status: 'running' });

      try {
          if (type === 'image') {
               const result = await generateCreativeImage(prompt, config);
               updateNode(newNode.id, { content: result || '', status: result ? 'completed' : 'error' });
          } 
          else if (type === 'edit') {
               const result = await editCreativeImage(base64Files, prompt, config);
               updateNode(newNode.id, { content: result || '', status: result ? 'completed' : 'error' });
          }
      } catch(e) {
          updateNode(newNode.id, { status: 'error' });
      } finally {
          setIsGenerating(false);
      }
  };

  // --- CONTEXT MENU ---
  const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const contextOptions = [
      { 
          label: "Save as Preset", 
          icon: <Icons.Layers />, 
          action: () => {
              if (selectedNodeIds.size > 0) {
                  setNodesForPreset(nodes.filter(n => selectedNodeIds.has(n.id)));
                  setShowPresetModal(true);
              }
          }
      },
      {
          label: "Delete Selection",
          icon: <Icons.Close />,
          action: deleteSelection,
          danger: true
      }
  ];

  return (
    <div className="w-screen h-screen bg-[#0a0a0f] text-white overflow-hidden relative" onContextMenu={handleContextMenu}>

      <Sidebar 
          onDragStart={(type) => { /* HTML5 drag handled in drop */ }}
          onAdd={addNode}
          userPresets={userPresets}
          onAddPreset={(pid) => {
             const p = userPresets.find(pr => pr.id === pid);
             if (p) setInstantiatingPreset(p);
          }}
          onDeletePreset={(pid) => setUserPresets(prev => prev.filter(p => p.id !== pid))}
          onHome={handleResetView}
          onOpenSettings={() => setShowApiSettings(true)}
          isApiConfigured={apiConfigured}
          canvasList={canvasList}
          currentCanvasId={currentCanvasId}
          canvasName={canvasName}
          isCanvasLoading={isCanvasLoading}
          onCreateCanvas={createNewCanvas}
          onLoadCanvas={loadCanvas}
          onDeleteCanvas={deleteCanvasById}
          onRenameCanvas={renameCanvas}
          creativeIdeas={creativeIdeas}
          onApplyCreativeIdea={(idea) => {
            // 应用创意库到画布
            const baseX = -canvasOffset.x / scale + 200;
            const baseY = -canvasOffset.y / scale + 100;
            
            if (idea.isWorkflow && idea.workflowNodes && idea.workflowConnections) {
              // 工作流类型：添加整个工作流节点
              const offsetX = canvasOffset.x + 200;
              const offsetY = canvasOffset.y + 100;
              const newNodes = idea.workflowNodes.map(n => ({
                ...n,
                id: `${n.id}_${Date.now()}`,
                x: n.x + offsetX,
                y: n.y + offsetY,
              }));
              const idMapping = new Map(idea.workflowNodes.map((n, i) => [n.id, newNodes[i].id]));
              const newConns = idea.workflowConnections.map(c => ({
                ...c,
                id: `${c.id}_${Date.now()}`,
                fromNode: idMapping.get(c.fromNode) || c.fromNode,
                toNode: idMapping.get(c.toNode) || c.toNode,
              }));
              setNodes(prev => [...prev, ...newNodes] as CanvasNode[]);
              setConnections(prev => [...prev, ...newConns]);
            } else if (idea.isBP && idea.bpFields) {
              // BP模式：创建单个BP节点（内置智能体+模板，直接输出图片）
              const bpNodeId = `bp_${Date.now()}`;
              
              // BP节点：包含输入字段和模板，执行后直接显示图片
              const bpNode: CanvasNode = {
                id: bpNodeId,
                type: 'bp' as NodeType,
                title: idea.title,
                content: '', // 执行后存放图片
                x: baseX,
                y: baseY,
                width: 320,
                height: 300,
                data: {
                  bpTemplate: {
                    id: idea.id,
                    title: idea.title,
                    prompt: idea.prompt,
                    bpFields: idea.bpFields,
                    imageUrl: idea.imageUrl,
                  },
                  bpInputs: {}, // 用户输入值
                  settings: {
                    aspectRatio: idea.suggestedAspectRatio || '1:1',
                    resolution: idea.suggestedResolution || '2K',
                  },
                },
              };
              
              setNodes(prev => [...prev, bpNode]);
              // 不创建结果节点，BP节点本身就是输出
            } else {
              // 普通创意：创建Idea节点 + Image节点（类似BP的简化版本）
              const ideaId = `idea_${Date.now()}`;
              const imageId = `image_${Date.now()}`;
              
              // Idea节点：包含提示词和设置
              const ideaNode: CanvasNode = {
                id: ideaId,
                type: 'idea' as NodeType,
                title: idea.title,
                content: idea.prompt,
                x: baseX,
                y: baseY,
                width: 280,
                height: 280,
                data: {
                  settings: {
                    aspectRatio: idea.suggestedAspectRatio || '1:1',
                    resolution: idea.suggestedResolution || '2K',
                  },
                },
              };
              
              // Image节点：用于显示生成结果
              const imageNode: CanvasNode = {
                id: imageId,
                type: 'image' as NodeType,
                title: '生成结果',
                content: '',
                x: baseX + 340,
                y: baseY,
                width: 280,
                height: 280,
              };
              
              setNodes(prev => [...prev, ideaNode, imageNode]);
              setConnections(prev => [...prev, { id: `conn_${Date.now()}`, fromNode: ideaId, toNode: imageId }]);
            }
          }}
      />
      
      <div 
        ref={containerRef}
        className="w-full h-full relative cursor-default"
        onMouseDown={onMouseDownCanvas}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onWheel={onWheel}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      > 
        {/* Background Grid */}
        <div 
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
                backgroundImage: 'radial-gradient(circle, #444 1px, transparent 1px)',
                backgroundSize: `${20 * scale}px ${20 * scale}px`,
                backgroundPosition: `${canvasOffset.x}px ${canvasOffset.y}px`
            }}
        />

        {/* Canvas Content Container */}
        <div 
            style={{ 
                transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${scale})`,
                transformOrigin: '0 0',
                width: '100%',
                height: '100%',
                willChange: isDraggingCanvas || draggingNodeId ? 'transform' : 'auto'
            }}
            className="absolute top-0 left-0"
        >
            {/* Connections */}
            <svg className="absolute top-0 left-0 w-full h-full overflow-visible pointer-events-none z-0">
                {/* 发光滤镜定义 - 黑白光感 */}
                <defs>
                    <filter id="glow-white" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                    <filter id="glow-selected" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                    {/* 黑白渐变 */}
                    <linearGradient id="grad-mono" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#666" stopOpacity="0.4"/>
                        <stop offset="30%" stopColor="#fff" stopOpacity="0.9"/>
                        <stop offset="70%" stopColor="#fff" stopOpacity="0.9"/>
                        <stop offset="100%" stopColor="#666" stopOpacity="0.4"/>
                    </linearGradient>
                    <linearGradient id="grad-selected" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#888" stopOpacity="0.5"/>
                        <stop offset="50%" stopColor="#fff" stopOpacity="1"/>
                        <stop offset="100%" stopColor="#888" stopOpacity="0.5"/>
                    </linearGradient>
                </defs>
                {connections.map(conn => {
                    const from = nodes.find(n => n.id === conn.fromNode);
                    const to = nodes.find(n => n.id === conn.toNode);
                    if (!from || !to) return null;

                    const startX = from.x + from.width;
                    const startY = from.y + from.height / 2;
                    const endX = to.x;
                    const endY = to.y + to.height / 2;
                    
                    const isSelected = selectedConnectionId === conn.id;
                    
                    // 三次贝塞尔曲线 - 标准水平控制点
                    const distance = endX - startX;
                    const ctrl1X = startX + distance / 3;
                    const ctrl1Y = startY;
                    const ctrl2X = endX - distance / 3;
                    const ctrl2Y = endY;
                    
                    // 三次贝塞尔曲线路径
                    const pathD = `M ${startX} ${startY} C ${ctrl1X} ${ctrl1Y}, ${ctrl2X} ${ctrl2Y}, ${endX} ${endY}`;

                    return (
                        <g key={conn.id} onClick={() => setSelectedConnectionId(conn.id)} className="pointer-events-auto cursor-pointer group">
                             {/* 点击区域 */}
                             <path 
                                d={pathD}
                                stroke="transparent"
                                strokeWidth="15"
                                fill="none"
                            />
                            {/* 外层光晕 */}
                            <path 
                                d={pathD}
                                stroke={isSelected ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)'}
                                strokeWidth={isSelected ? 6 : 4}
                                fill="none"
                                filter="url(#glow-white)"
                                strokeLinecap="round"
                                className="transition-all duration-300"
                            />
                            {/* 主线条 */}
                            <path 
                                d={pathD}
                                stroke={isSelected ? 'url(#grad-selected)' : 'url(#grad-mono)'}
                                strokeWidth={isSelected ? 2.5 : 1.5}
                                fill="none"
                                strokeLinecap="round"
                                className="transition-all duration-300"
                            />
                            {/* 端点光球 */}
                            <circle 
                                cx={startX} 
                                cy={startY} 
                                r={isSelected ? 4 : 2.5} 
                                fill={isSelected ? '#fff' : 'rgba(255,255,255,0.7)'}
                                filter="url(#glow-white)"
                                className="transition-all duration-300"
                            />
                            <circle 
                                cx={endX} 
                                cy={endY} 
                                r={isSelected ? 4 : 2.5} 
                                fill={isSelected ? '#fff' : 'rgba(255,255,255,0.7)'}
                                filter="url(#glow-white)"
                                className="transition-all duration-300"
                            />
                        </g>
                    );
                })}
                
                {/* Active Link Line */}
                {linkingState.active && linkingState.fromNode && (() => {
                     const fromNode = nodes.find(n => n.id === linkingState.fromNode);
                     if (!fromNode) return null;
                     const startX = fromNode.x + fromNode.width; 
                     const startY = fromNode.y + fromNode.height / 2;
                     const endX = linkingState.currPos.x;
                     const endY = linkingState.currPos.y;
                     const distance = endX - startX;
                     const ctrl1X = startX + distance / 3;
                     const ctrl1Y = startY;
                     const ctrl2X = endX - distance / 3;
                     const ctrl2Y = endY;
                     return (
                        <>
                            <path 
                                d={`M ${startX} ${startY} C ${ctrl1X} ${ctrl1Y}, ${ctrl2X} ${ctrl2Y}, ${endX} ${endY}`}
                                stroke="rgba(255,255,255,0.4)"
                                strokeWidth="4"
                                fill="none"
                                filter="url(#glow-white)"
                                strokeLinecap="round"
                            />
                            <path 
                                d={`M ${startX} ${startY} C ${ctrl1X} ${ctrl1Y}, ${ctrl2X} ${ctrl2Y}, ${endX} ${endY}`}
                                stroke="url(#grad-mono)"
                                strokeWidth="1.5"
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray="6,4"
                            />
                            <circle cx={startX} cy={startY} r="3" fill="rgba(255,255,255,0.8)" filter="url(#glow-white)" />
                            <circle cx={endX} cy={endY} r="3" fill="rgba(255,255,255,0.6)" filter="url(#glow-white)" />
                        </>
                     )
                })()}
            </svg>

            {/* Nodes */}
            {nodes.map(node => (
                <CanvasNodeItem 
                    key={node.id}
                    node={node}
                    isSelected={selectedNodeIds.has(node.id)}
                    scale={scale}
                    effectiveColor={node.type === 'relay' ? 'stroke-' + resolveEffectiveType(node.id).replace('text', 'emerald').replace('image', 'blue').replace('llm', 'purple') + '-400' : undefined}
                    hasDownstream={connections.some(c => c.fromNode === node.id)}
                    onSelect={(id, multi) => {
                        const newSet = new Set(multi ? selectedNodeIds : []);
                        newSet.add(id);
                        setSelectedNodeIds(newSet);
                    }}
                    onDragStart={handleNodeDragStart}
                    onUpdate={updateNode}
                    onDelete={(id) => setNodes(prev => prev.filter(n => n.id !== id))}
                    onExecute={handleExecuteNode}
                    onStop={handleStopNode}
                    onDownload={(id) => {
                        const n = nodes.find(x => x.id === id);
                        if (n && n.content && n.content.startsWith('data:')) {
                            const link = document.createElement('a');
                            link.href = n.content;
                            link.download = `pebbling-${n.id}.png`;
                            link.click();
                        }
                    }}
                    onStartConnection={(id, type, pos) => {
                        handleStartConnection(id, type, pos);
                    }}
                    onEndConnection={handleEndConnection}
                    onCreateToolNode={handleCreateToolNode}
                />
            ))}
        </div>

        {/* Selection Box Overlay */}
        {selectionBox && (
            <div 
                className="absolute border border-blue-500 bg-blue-500/20 pointer-events-none z-50"
                style={{
                    left: Math.min(selectionBox.start.x, selectionBox.current.x),
                    top: Math.min(selectionBox.start.y, selectionBox.current.y),
                    width: Math.abs(selectionBox.current.x - selectionBox.start.x),
                    height: Math.abs(selectionBox.current.y - selectionBox.start.y)
                }}
            />
        )}
      </div>

      {/* Floating Input Bar */}
      <FloatingInput onGenerate={handleGenerate} isGenerating={isGenerating} />

      {/* Context Menu */}
      {contextMenu && (
          <ContextMenu 
            x={contextMenu.x} 
            y={contextMenu.y} 
            onClose={() => setContextMenu(null)}
            options={contextOptions}
          />
      )}

      {/* Modals */}
      {showPresetModal && (
          <PresetCreationModal 
             selectedNodes={nodesForPreset}
             onCancel={() => setShowPresetModal(false)}
             onSave={(title, desc, inputs) => {
                 const newPreset: CanvasPreset = {
                     id: uuid(),
                     title,
                     description: desc,
                     nodes: JSON.parse(JSON.stringify(nodesForPreset)), // Deep copy
                     connections: connections.filter(c => {
                         const nodeIds = new Set(nodesForPreset.map(n => n.id));
                         return nodeIds.has(c.fromNode) && nodeIds.has(c.toNode);
                     }),
                     inputs
                 };
                 setUserPresets(prev => [...prev, newPreset]);
                 setShowPresetModal(false);
             }}
          />
      )}

      {instantiatingPreset && (
          <PresetInstantiationModal 
             preset={instantiatingPreset}
             onCancel={() => setInstantiatingPreset(null)}
             onConfirm={(inputValues) => {
                 // Clone Nodes
                 const idMap = new Map<string, string>();
                 const newNodes: CanvasNode[] = [];
                 
                 // Center placement
                 const centerX = (-canvasOffset.x + window.innerWidth/2) / scale;
                 const centerY = (-canvasOffset.y + window.innerHeight/2) / scale;
                 
                 // Find centroid of preset
                 const minX = Math.min(...instantiatingPreset.nodes.map(n => n.x));
                 const minY = Math.min(...instantiatingPreset.nodes.map(n => n.y));

                 instantiatingPreset.nodes.forEach(n => {
                     const newId = uuid();
                     idMap.set(n.id, newId);
                     
                     // Apply Inputs
                     let content = n.content;
                     let prompt = n.data?.prompt;
                     let system = n.data?.systemInstruction;

                     // Check overrides
                     instantiatingPreset.inputs.forEach(inp => {
                         if (inp.nodeId === n.id) {
                             const val = inputValues[`${n.id}-${inp.field}`];
                             if (val) {
                                 if (inp.field === 'content') content = val;
                                 if (inp.field === 'prompt') prompt = val;
                                 if (inp.field === 'systemInstruction') system = val;
                             }
                         }
                     });

                     newNodes.push({
                         ...n,
                         id: newId,
                         x: n.x - minX + centerX - 200, // Offset to center
                         y: n.y - minY + centerY - 150,
                         content,
                         data: { ...n.data, prompt, systemInstruction: system },
                         status: 'idle'
                     });
                 });

                 // Clone Connections
                 const newConns = instantiatingPreset.connections.map(c => ({
                     id: uuid(),
                     fromNode: idMap.get(c.fromNode)!,
                     toNode: idMap.get(c.toNode)!
                 }));

                 setNodes(prev => [...prev, ...newNodes]);
                 setConnections(prev => [...prev, ...newConns]);
                 setInstantiatingPreset(null);
             }}
          />
      )}

    </div>
  );
};

export default PebblingCanvas;
