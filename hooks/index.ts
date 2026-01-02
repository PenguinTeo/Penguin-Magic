/**
 * Hooks 统一导出
 * 用于状态管理和业务逻辑的封装
 */

export { useCreativeIdeas } from './useCreativeIdeas';
export type { UseCreativeIdeasReturn } from './useCreativeIdeas';

export { useGenerationHistory } from './useGenerationHistory';
export type { UseGenerationHistoryReturn, SaveToHistoryParams } from './useGenerationHistory';

export { useDesktopState } from './useDesktopState';
export type { UseDesktopStateReturn } from './useDesktopState';

export { useDesktopLayout, GRID_SIZE, ICON_SIZE, TOP_OFFSET, PADDING } from './useDesktopLayout';
export type { UseDesktopLayoutProps, UseDesktopLayoutReturn } from './useDesktopLayout';

export { useDesktopInteraction } from './useDesktopInteraction';
export type { UseDesktopInteractionProps, UseDesktopInteractionReturn, ClipboardState, ContextMenuState } from './useDesktopInteraction';
