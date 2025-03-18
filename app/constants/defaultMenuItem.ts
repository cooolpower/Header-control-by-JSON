import { MenuItems } from "../types/type";

export const DEFAULT_MENU_ITEM: Partial<MenuItems> = {
  menuId: '',
  menuName: '',
  gridName: '',
  href: '',
  ga: {
    area: '',
    label: '',
    page: ''
  },
  target: false,
  subMenu: [],
  iconName: '',
  iconPosition: '',
  grid: {
    x: 0,
    y: 0,
    w: 1,
    h: 1,
    i: '',
    resizeHandles: ["s", "w", "e", "n", "sw", "nw", "se", "ne"],
    cols: 6,
    gap: 0,
    gridWidth: '100%',
    gridHeight: '100%',
    gridBorderTop: '0px',
    gridBorderRight: '0px',
    gridBorderBottom: '0px',
    gridBorderLeft: '0px',
    tabOrder: 0
  }
};