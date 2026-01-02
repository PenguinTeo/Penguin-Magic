/**
 * RunningHub 后台任务管理 Context
 * 允许用户在任务运行时返回主页，任务在后台继续执行
 */

import React, { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react';

export interface RunningHubTask {
    id: string;
    ideaTitle: string;
    status: 'uploading' | 'generating' | 'completed' | 'failed';
    progress: string;
    startTime: number;
    imageUrl?: string;
    error?: string;
    cost?: number;
}

type TaskCompletedCallback = (task: RunningHubTask) => void;

interface RunningHubTaskContextType {
    tasks: RunningHubTask[];
    addTask: (id: string, ideaTitle: string, cost?: number) => void;
    updateTask: (id: string, updates: Partial<RunningHubTask>) => void;
    removeTask: (id: string) => void;
    getActiveTask: () => RunningHubTask | undefined;
    onTaskCompleted: (callback: TaskCompletedCallback) => () => void;
}

const RunningHubTaskContext = createContext<RunningHubTaskContextType | null>(null);

export const RunningHubTaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [tasks, setTasks] = useState<RunningHubTask[]>([]);
    const completedCallbacksRef = useRef<Set<TaskCompletedCallback>>(new Set());
    const prevTasksRef = useRef<RunningHubTask[]>([]);

    // 监听任务状态变化，触发完成回调
    useEffect(() => {
        const prevTasks = prevTasksRef.current;

        tasks.forEach(task => {
            const prevTask = prevTasks.find(t => t.id === task.id);

            // 任务从非完成状态变为完成状态
            if (task.status === 'completed' && prevTask?.status !== 'completed') {
                completedCallbacksRef.current.forEach(callback => {
                    try {
                        callback(task);
                    } catch (e) {
                        console.error('Task completed callback error:', e);
                    }
                });
            }
        });

        prevTasksRef.current = [...tasks];
    }, [tasks]);

    const addTask = useCallback((id: string, ideaTitle: string, cost?: number) => {
        setTasks(prev => [...prev, {
            id,
            ideaTitle,
            status: 'uploading',
            progress: '准备上传...',
            startTime: Date.now(),
            cost
        }]);
    }, []);

    const updateTask = useCallback((id: string, updates: Partial<RunningHubTask>) => {
        setTasks(prev => prev.map(task =>
            task.id === id ? { ...task, ...updates } : task
        ));
    }, []);

    const removeTask = useCallback((id: string) => {
        setTasks(prev => prev.filter(task => task.id !== id));
    }, []);

    const getActiveTask = useCallback(() => {
        return tasks.find(t => t.status === 'uploading' || t.status === 'generating');
    }, [tasks]);

    // 注册完成回调
    const onTaskCompleted = useCallback((callback: TaskCompletedCallback) => {
        completedCallbacksRef.current.add(callback);
        return () => {
            completedCallbacksRef.current.delete(callback);
        };
    }, []);

    return (
        <RunningHubTaskContext.Provider value={{ tasks, addTask, updateTask, removeTask, getActiveTask, onTaskCompleted }}>
            {children}
        </RunningHubTaskContext.Provider>
    );
};

export const useRunningHubTasks = () => {
    const context = useContext(RunningHubTaskContext);
    if (!context) {
        throw new Error('useRunningHubTasks must be used within RunningHubTaskProvider');
    }
    return context;
};
