import { MenuItem } from './menu';

export interface MenuItemProps {
  itemKey: string;
  menuId: string;
  menuName: string;
  gridName?: string;
  iconName?: string;
  iconPosition?: string;
  direction?: string;
  href: string;
  ga: {
    area: string;
    label: string;
    page: string;
  };
  target?: boolean;
  subMenu: MenuItems[];
  style?: React.CSSProperties;
  isDeleted?: boolean;
}

export interface Grid {
  x: number;
  y: number;
  w: number;
  h: number;
  i: string;
  resizeHandles: string[];
  cols: number;
  gap: number;
  gridWidth?: string;
  gridHeight?: string;
  gridBorderTop?: string;
  gridBorderRight?: string;
  gridBorderBottom?: string;
  gridBorderLeft?: string;
  tabOrder?: number;
  [key: `gridBorder${string}`]: string | undefined;
}

export interface GridStyle {
  [key: string]: Grid;
}

export type MenuItems = MenuItem;
