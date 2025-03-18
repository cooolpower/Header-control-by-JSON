// import { Grid } from './type'; // 이 줄 제거

export interface MenuItem {
  menuId: string;
  menuName: string;
  gridName?: string;
  href: string;
  ga: {
    area: string;
    label: string;
    page: string;
  };
  target?: boolean;
  subMenu: MenuItem[];
  iconName?: string;
  iconPosition?: string;
  grid?: Grid;  // Grid 타입을 공유
}

export interface EditableMenuFields {
  menuId?: string;
  menuName?: string;
  href?: string;
  gridName?: string;
  iconName?: string;
  iconPosition?: string;
  target?: boolean;
  subMenu?: MenuItem[];
  grid?: Grid;
  isDeleted?: boolean;  // 추가
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
} 