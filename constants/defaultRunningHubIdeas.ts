/**
 * 默认的 RunningHub 创意库预设
 * 这些创意库会自动显示在应用中，无需用户手动添加
 */

import { CreativeIdea } from '../types';

export const DEFAULT_RUNNINGHUB_IDEAS: CreativeIdea[] = [
    {
        id: 999001,
        title: '💡 光线参考调整',
        prompt: '上传原图和参考光线图，AI 将根据参考图调整原图的光线效果，让你的照片拥有完美的光影',
        imageUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=400&h=300&fit=crop',
        isRunningHub: true,
        cost: 20,
        order: 999001,
        suggestedAspectRatio: 'Auto',
        suggestedResolution: '2K',
        runningHubConfig: {
            workflowId: '1997622492837646338',
            isAIApp: true,
            inputFields: [
                {
                    id: 'original_image',
                    type: 'image',
                    label: '原图',
                    placeholder: '上传需要调整光线的图片',
                    required: true,
                    nodeId: '31',
                    fieldName: 'image'
                },
                {
                    id: 'reference_light',
                    type: 'image',
                    label: '参考光线',
                    placeholder: '上传具有目标光线效果的参考图',
                    required: true,
                    nodeId: '7',
                    fieldName: 'image'
                }
            ]
        }
    }
];

export default DEFAULT_RUNNINGHUB_IDEAS;
