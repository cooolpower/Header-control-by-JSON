interface MenuItem {
  menuId: string;
  grid: {
    x: number;
    y: number;
    w: number;
    h: number;
    i: string;
    resizeHandles: string[];
    cols: number;
    rows: number;
    gap: number;
    gridWidth: string;
    gridHeight: string;
    gridBorderTop: string;
    gridBorderRight: string;
    gridBorderBottom: string;
    gridBorderLeft: string;
    tabOrder: number;
  };
  href: string;
  ga: {
    area: string;
    label: string;
    page: string;
  };
  menuName: string;
  gridName: string;
  iconName: string;
  iconPosition: string;
  direction?: string;
  subMenu: MenuItem[];
  target: boolean;
  style?: {
    width?: string;
    height?: string;
    position?: 'absolute' | 'relative' | 'fixed';
    left?: string;
    top?: string;
  };
  isDeleted?: boolean;
}

export interface EditableMenuFields {
  menuId: string;
  href: string;
  menuName: string;
  gridName: string;
  iconName: string;
  iconPosition: string;
  target: boolean;
  subMenu: MenuItem[];
}

export interface MenuEditorProps {
  menu: MenuItem;
  onUpdate: (menuId: string, updates: Partial<EditableMenuFields>) => void;
} 