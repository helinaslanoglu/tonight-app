/**
 * Tonight UI component library — barrel export.
 *
 * Import from this file in screens:
 *   import { AppText, AppButton, AppCard, ScreenContainer } from '@/components/ui';
 */

export { AppButton } from './AppButton';
export type { AppButtonProps, ButtonVariant, ButtonSize } from './AppButton';

export { AppCard } from './AppCard';
export type { AppCardProps, CardVariant, CardPadding } from './AppCard';

export { AppText } from './AppText';
export type { AppTextProps } from './AppText';

export { Badge } from './Badge';
export type { BadgeProps, BadgeSize } from './Badge';

export { Divider } from './Divider';
export type { DividerProps } from './Divider';

export { IconButton } from './IconButton';
export type { IconButtonProps, IconButtonVariant, IconButtonSize } from './IconButton';

export { ScreenContainer } from './ScreenContainer';
export type { ScreenContainerProps } from './ScreenContainer';

// ─── Existing template components (still exported for backward compat) ──────
export { Collapsible } from './collapsible';
