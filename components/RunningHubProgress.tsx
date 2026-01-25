/**
 * RunningHub 后台任务进度组件
 * 显示在左侧面板免责声明上方
 * 支持旧的 RunningHubTaskContext 和新的 RHTaskQueueContext
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useRunningHubTasks, RunningHubTask } from '../contexts/RunningHubTaskContext';
import { useRHTaskQueue, RHQueuedTask } from '../contexts/RHTaskQueueContext';
import { normalizeImageUrl } from '../utils/image';
import { ChevronUp, ChevronDown, X, Maximize2 } from 'lucide-react';

// 通知提示组件
const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`
      fixed top-20 right-4 z-[9999] animate-slide-in-right
      px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md border
      flex items-center gap-3 min-w-[280px] max-w-[400px]
      ${type === 'success'
                ? 'bg-blue-900/90 border-blue-500/50 text-blue-100'
                : 'bg-gray-900/90 border-gray-500/50 text-gray-100'}
    `}>
            <span className="text-xl">{type === 'success' ? '✅' : '❌'}</span>
            <p className="flex-1 text-sm font-medium">{message}</p>
            <button onClick={onClose} className="text-white/60 hover:text-white text-lg">×</button>
        </div>
    );
};

export const RunningHubProgress: React.FC = () => {
    const { tasks, removeTask } = useRunningHubTasks();
    const rhQueue = useRHTaskQueue();
    const [, forceUpdate] = useState(0);
    const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' }>>([]);
    const [notifiedTasks, setNotifiedTasks] = useState<Set<string>>(new Set());
    const [isMinimized, setIsMinimized] = useState(false); // 最小化状态
    const [isExpanded, setIsExpanded] = useState(false); // 放大状态

    // 每秒更新一次时间显示
    useEffect(() => {
        const hasActiveTasks = tasks.some(t => t.status === 'uploading' || t.status === 'generating');
        if (!hasActiveTasks) return;

        const timer = setInterval(() => {
            forceUpdate(n => n + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [tasks]);

    // 监听任务完成/失败，弹出通知
    useEffect(() => {
        tasks.forEach(task => {
            if (notifiedTasks.has(task.id)) return;

            if (task.status === 'completed') {
                setNotifiedTasks(prev => new Set(prev).add(task.id));
                setToasts(prev => [...prev, {
                    id: `toast_${task.id}`,
                    message: `🎉 "${task.ideaTitle}" 生成完成！`,
                    type: 'success'
                }]);
            } else if (task.status === 'failed') {
                setNotifiedTasks(prev => new Set(prev).add(task.id));
                setToasts(prev => [...prev, {
                    id: `toast_${task.id}`,
                    message: `😢 "${task.ideaTitle}" 生成失败：${task.error || '未知错误'}`,
                    type: 'error'
                }]);
            }
        });
    }, [tasks, notifiedTasks]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // 只显示进行中或刚完成的任务
    const visibleTasks = tasks.filter(t =>
        t.status !== 'completed' || Date.now() - t.startTime < 30000
    );

    return (
        <>
            {/* 通知 Toast */}
            <div className="fixed top-0 right-0 z-[9999] pointer-events-none">
                <div className="pointer-events-auto">
                    {toasts.map((toast, index) => (
                        <div key={toast.id} style={{ marginTop: `${index * 70 + 80}px` }}>
                            <Toast
                                message={toast.message}
                                type={toast.type}
                                onClose={() => removeToast(toast.id)}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* 任务列表 */}
            {visibleTasks.length > 0 && (
                <div className={`mx-3 mb-3 transition-all duration-300 ${isExpanded ? 'fixed inset-4 z-50 m-0' : ''}`}>
                    <div className={`
                        bg-gradient-to-br from-gray-900/80 via-gray-900/70 to-gray-800/80
                        backdrop-blur-xl backdrop-saturate-150
                        rounded-xl 
                        border-2 border-blue-400/40
                        shadow-[0_0_15px_rgba(59,130,246,0.25)]
                        ring-1 ring-blue-500/20 ring-offset-0
                        overflow-hidden
                        ${isExpanded ? 'h-full flex flex-col' : ''}
                    `}>
                        {/* 标题栏 */}
                        <div className="px-3 py-2 border-b border-blue-500/10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                <span className="text-xs font-medium text-blue-300">云端任务</span>
                                <span className="text-[10px] text-blue-400">({visibleTasks.length})</span>
                                {/* 队列状态显示 */}
                                {(rhQueue.runningCount > 0 || rhQueue.queuedCount > 0) && (
                                    <div className="flex items-center gap-1.5 ml-2">
                                        <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>
                                            {rhQueue.runningCount}/3
                                        </span>
                                        {rhQueue.queuedCount > 0 && (
                                            <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                                                +{rhQueue.queuedCount}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                {/* 最小化/展开按钮 */}
                                <button
                                    onClick={() => setIsMinimized(!isMinimized)}
                                    className="w-6 h-6 rounded flex items-center justify-center text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 transition-colors"
                                    title={isMinimized ? '展开任务' : '最小化'}
                                >
                                    {isMinimized ? (
                                        <ChevronUp className="w-3.5 h-3.5" />
                                    ) : (
                                        <ChevronDown className="w-3.5 h-3.5" />
                                    )}
                                </button>
                                {/* 放大/缩小按钮 */}
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="w-6 h-6 rounded flex items-center justify-center text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 transition-colors"
                                    title={isExpanded ? '缩小' : '放大'}
                                >
                                    {isExpanded ? (
                                        <X className="w-3.5 h-3.5" />
                                    ) : (
                                        <Maximize2 className="w-3.5 h-3.5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* 任务列表 - 最小化时隐藏 */}
                        {!isMinimized && (
                            <div className={`p-2 space-y-2 overflow-y-auto custom-scrollbar ${isExpanded ? 'flex-1' : 'max-h-[200px]'}`}>
                                {visibleTasks.map(task => (
                                    <TaskItem
                                        key={task.id}
                                        task={task}
                                        onDismiss={() => removeTask(task.id)}
                                        isExpanded={isExpanded}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                    {/* 放大时的背景遮罩 */}
                    {isExpanded && (
                        <div 
                            className="fixed inset-0 bg-black/50 -z-10"
                            onClick={() => setIsExpanded(false)}
                        />
                    )}
                </div>
            )}

            {/* 动画样式 */}
            <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out forwards;
        }
      `}</style>
        </>
    );
};

const TaskItem: React.FC<{ task: RunningHubTask; onDismiss: () => void; isExpanded?: boolean }> = ({ task, onDismiss, isExpanded = false }) => {
    const [elapsed, setElapsed] = useState(Date.now() - task.startTime);

    // 实时更新运行时间
    useEffect(() => {
        if (task.status !== 'uploading' && task.status !== 'generating') return;

        const timer = setInterval(() => {
            setElapsed(Date.now() - task.startTime);
        }, 1000);

        return () => clearInterval(timer);
    }, [task.status, task.startTime]);

    const formatTime = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        return minutes > 0 ? `${minutes}分${seconds % 60}秒` : `${seconds}秒`;
    };

    const getStatusIcon = () => {
        switch (task.status) {
            case 'uploading':
                return (
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                );
            case 'generating':
                return (
                    <div className="relative">
                        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                        <span className="absolute inset-0 flex items-center justify-center text-[8px]">🎨</span>
                    </div>
                );
            case 'completed':
                return <span className="text-blue-400 text-sm">✓</span>;
            case 'failed':
                return <span className="text-gray-400 text-sm">✗</span>;
        }
    };

    const getStatusColor = () => {
        switch (task.status) {
            case 'uploading': return 'text-blue-300';
            case 'generating': return 'text-blue-300';
            case 'completed': return 'text-blue-300';
            case 'failed': return 'text-gray-300';
        }
    };

    return (
        <div className={`
      p-2 rounded-lg bg-black/20 border transition-all
      ${task.status === 'completed' ? 'border-blue-500/30' :
                task.status === 'failed' ? 'border-gray-500/30' : 'border-white/5'}
      ${isExpanded ? 'p-4' : ''}
    `}>
            <div className="flex items-start gap-2">
                <div className={`mt-0.5 ${isExpanded ? 'scale-125' : ''}`}>{getStatusIcon()}</div>
                <div className="flex-1 min-w-0">
                    <p className={`font-medium text-white truncate ${isExpanded ? 'text-sm' : 'text-xs'}`}>{task.ideaTitle}</p>
                    <p className={`${getStatusColor()} mt-0.5 ${isExpanded ? 'text-xs' : 'text-[10px]'}`}>
                        {task.progress}
                    </p>
                    {(task.status === 'uploading' || task.status === 'generating') && (
                        <p className={`text-gray-500 mt-0.5 ${isExpanded ? 'text-xs' : 'text-[10px]'}`}>
                            已运行 {formatTime(elapsed)}
                        </p>
                    )}
                </div>

                {(task.status === 'completed' || task.status === 'failed') && (
                    <button
                        onClick={onDismiss}
                        className="text-gray-500 hover:text-white text-xs p-1 hover:bg-white/10 rounded transition-colors"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* 进度条 */}
            {(task.status === 'uploading' || task.status === 'generating') && (
                <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ${task.status === 'uploading'
                            ? 'bg-blue-500 w-1/4'
                            : 'bg-blue-400 animate-progress-indeterminate'
                            }`}
                    ></div>
                </div>
            )}

            {/* 完成后显示结果预览 */}
            {task.status === 'completed' && task.imageUrl && (
                <div className="mt-2">
                    <img
                        src={normalizeImageUrl(task.imageUrl)}
                        alt="生成结果"
                        className={`w-full object-cover rounded-md border border-white/10 ${isExpanded ? 'h-48' : 'h-16'}`}
                    />
                </div>
            )}

            {/* 失败显示错误 */}
            {task.status === 'failed' && task.error && (
                <p className="text-[10px] text-gray-400 mt-1 line-clamp-2">{task.error}</p>
            )}
        </div>
    );
};

export default RunningHubProgress;
