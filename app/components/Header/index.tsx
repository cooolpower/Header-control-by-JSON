'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './index.module.css';
import { MenuItems, GridStyle } from '../../types/type';

interface HeaderProps {
  setSubMenus: Map<string, { handler: () => void, useHref: boolean }>;
}

// MenuItem 컴포넌트
const MenuItem: React.FC<MenuItems & { 
  style?: React.CSSProperties;
  setSubMenus: Map<string, { handler: () => void, useHref: boolean }>;
  iconName?: string;
  iconPosition?: string;
  direction?: string;
}> = ({
  menuId,
  menuName,
  href,
  ga,
  target = false,
  subMenu,
  style,
  setSubMenus,
  iconName,
  iconPosition = 'right',
  direction = 'vertical'
}) => {
  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>, itemGa: MenuItems['ga'], menuId?: string) => {
    let menuItem;
    
    if (menuId) {
      menuItem = setSubMenus.get(menuId);
      if (menuItem) {
        menuItem.handler();
        if (!menuItem.useHref) {
          e.preventDefault();
        }
      }
    }

    if (menuItem && !menuItem.useHref) {
      e.preventDefault();
    }
  };

  const showIcon = (position: string, iconName?: string, customPosition?: string) => {
    const positionToUse = customPosition || iconPosition;
    return positionToUse === position && iconName && (
      <i className={iconName}></i>
    );
  };

  return (
    <div 
      style={style} 
      className={styles.menuItem}
      data-menu-id={menuId}
      data-direction={direction}
    >
      <h2 className={styles.menuItemTitle}>
        {href ? (
          <a
            href={href}
            onClick={(e) => handleClick(e, ga, menuId)}
            target={target ? '_blank' : '_self'}
          >
            {showIcon('left', iconName)}
            {menuName}
            {showIcon('right', iconName)}
          </a>
        ) : (
          <p>
            {showIcon('left', iconName)}
            {menuName}
            {showIcon('right', iconName)}
          </p>
        )}
      </h2>
      <ul>
        {subMenu && subMenu.length > 0 && (
          <>
            {subMenu.map((subItem, index) => (
              <li key={`${menuId}-${index}`} data-menu-id={subItem.menuId} className={styles.subMenuItem}>
                <a 
                  href={subItem.href}
                  onClick={(e) => handleClick(e, subItem.ga, subItem.menuId)}
                  target={subItem.target ? '_blank' : '_self'}
                >
                  {showIcon('left', subItem.iconName, subItem.iconPosition)}
                  {subItem.menuName}
                  {showIcon('right', subItem.iconName, subItem.iconPosition)}
                </a>
              </li>
            ))}
          </>
        )}
      </ul>
    </div>
  );
};

const Header = ({ setSubMenus }: HeaderProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [menuItems, setMenuItems] = useState<MenuItems[]>([]);
  const [menuGridStyles, setMenuGridStyles] = useState<GridStyle>({});

  // 데이터 새로 불러오는 함수를 메모이제이션
  const refreshData = useCallback(async () => {
    try {
      //const response = await fetch('/data/data.json', {
      const response = await fetch('/api/menu', {
        cache: 'no-store'
      });
      const data = await response.json();
      
      // 데이터가 배열이 아닌 경우 배열로 변환
      const menuArray = Array.isArray(data) ? data : [data];
      setMenuItems(menuArray);

      const gridStyles: GridStyle = {};
      menuArray.forEach((item: MenuItems) => {
        if (item.grid) {
          gridStyles[item.menuId] = {
            x: item.grid.x,
            y: item.grid.y,
            w: item.grid.w,
            h: item.grid.h,
            i: item.grid.i,
            resizeHandles: item.grid.resizeHandles,
            cols: item.grid.cols,
            gap: item.grid.gap,
            gridWidth: item.grid.gridWidth,
            gridHeight: item.grid.gridHeight,
            gridBorderTop: item.grid.gridBorderTop,
            gridBorderRight: item.grid.gridBorderRight,
            gridBorderBottom: item.grid.gridBorderBottom,
            gridBorderLeft: item.grid.gridBorderLeft
          };
        }
      });
      setMenuGridStyles(gridStyles);
    } catch (error) {
      console.error('Failed to load menu data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 초기 로딩
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // 그리드 레이아웃 업데이트 이벤트 리스너
  useEffect(() => {
    const handleGridUpdate = (event: CustomEvent<{ updatedMenuItems: MenuItems[] }>) => {
      const { updatedMenuItems } = event.detail;
      setMenuItems(updatedMenuItems);
      
      const gridStyles: GridStyle = {};
      updatedMenuItems.forEach((item: MenuItems) => {
        if (item.grid) {
          gridStyles[item.menuId] = {
            x: item.grid.x,
            y: item.grid.y,
            w: item.grid.w,
            h: item.grid.h,
            i: item.grid.i,
            resizeHandles: item.grid.resizeHandles,
            cols: item.grid.cols,
            gap: item.grid.gap,
            gridWidth: item.grid.gridWidth,
            gridHeight: item.grid.gridHeight,
            gridBorderTop: item.grid.gridBorderTop,
            gridBorderRight: item.grid.gridBorderRight,
            gridBorderBottom: item.grid.gridBorderBottom,
            gridBorderLeft: item.grid.gridBorderLeft
          };
        }
      });
      setMenuGridStyles(gridStyles);
    };

    window.addEventListener('gridLayoutUpdate', handleGridUpdate as EventListener);
    return () => {
      window.removeEventListener('gridLayoutUpdate', handleGridUpdate as EventListener);
    };
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const firstItemSettings = menuItems.length > 0 && menuItems[0].menuId 
    ? menuGridStyles[menuItems[0].menuId] 
    : null;

  const generateGridTemplateAreas = () => {
    const cols = firstItemSettings?.cols || 6;
    const maxRows = Math.max(...menuItems.map(item => 
      (menuGridStyles[item.menuId]?.y || 0) + (menuGridStyles[item.menuId]?.h || 1)
    ));

    const grid = Array(maxRows).fill(null).map(() => 
      Array(cols).fill('.')
    );

    menuItems.forEach(item => {
      const gridStyle = menuGridStyles[item.menuId];
      if (gridStyle) {
        const { x, y, w, h } = gridStyle;
        for (let row = y; row < y + h; row++) {
          for (let col = x; col < x + w; col++) {
            if (grid[row] && grid[row][col] !== undefined) {
              grid[row][col] = item.menuId;
            }
          }
        }
      }
    });

    return grid.map(row => 
      `"${row.join(' ')}"`
    ).join('\n');
  };

  return (
    <div className={styles.gnbDetails} style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${firstItemSettings?.cols || 6}, 1fr)`,
      gridTemplateAreas: generateGridTemplateAreas(),
      gap: `${firstItemSettings?.gap || 0}rem`,
      padding: `${firstItemSettings?.gap || 0}rem`
    }}>
      {menuItems.map((item, index) => (
        <MenuItem
          key={item.menuId || `menu-${index}`}
          {...item}
          style={{
            gridArea: item.menuId,
            width: item.grid?.gridWidth ? `${item.grid.gridWidth}px` : undefined,
            height: item.grid?.gridHeight ? `${item.grid.gridHeight}px` : undefined,
            borderTop: item.grid?.gridBorderTop || undefined,
            borderRight: item.grid?.gridBorderRight || undefined,
            borderBottom: item.grid?.gridBorderBottom || undefined,
            borderLeft: item.grid?.gridBorderLeft || undefined
          }}
          setSubMenus={setSubMenus}
        />
      ))}
    </div>
  );
};

export default Header;


          