'use client';

import React, { useState } from "react";
import RGL, { WidthProvider } from "react-grid-layout";
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
//import './ResizableHandles.css';
import { MenuItems } from '../../types/type';
import { EditableMenuFields } from '../../types/menu';
import menuData from '@/public/data/data.json';
import MenuEditor from "../MenuEditor";
import '../MenuEditor/index.css';

const ReactGridLayout = WidthProvider(RGL);

export interface Layout {
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
  tabOrder?: number;
}

interface ResizableHandlesProps {
  rowHeight: number;
  initialCols?: number;
  initialGap?: number;
  menuItems?: MenuItems[];
  onLayoutChange?: (newLayout: Layout[]) => void;
  onLayoutConfirm?: () => Promise<void>;
  onSettingsChange?: (settings: { cols: number; gap: number }) => void;
}

// 스타일 상수 정의
const EDITOR_STYLES = {
  container: {
    background: '#fff',
    padding: '20px',
    margin: '10px 0',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    position: 'relative' as const,
    zIndex: 100
  },
  wrapper: {
    position: 'relative' as const,
    zIndex: 101,
    display: 'block'
  }
} as const;

export default function ResizableHandles({ 
  rowHeight, 
  initialCols = 6, 
  initialGap = 0, 
  menuItems: initialMenuItems = [], 
  onLayoutChange = () => {}, 
  onLayoutConfirm = async () => {}, 
  onSettingsChange = () => {} 
}: ResizableHandlesProps) {
  const [menuItems, setMenuItems] = React.useState<MenuItems[]>(initialMenuItems);
  const [layout, setLayout] = React.useState<Layout[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [cols, setCols] = useState(initialCols);
  const [gap, setGap] = useState(initialGap);
  const [tabOrders, setTabOrders] = useState<{[key: string]: number | undefined}>({});

  // 초기 데이터 로드
  React.useEffect(() => {
    const data = Array.isArray(menuData) ? menuData : [menuData];
    setMenuItems(data as MenuItems[]);
    
    // 저장된 탭 순서 불러오기
    const savedTabOrders: {[key: string]: number | undefined} = {};
    data.forEach(item => {
      if (item.grid?.tabOrder == undefined) {
        savedTabOrders[item.menuId] = item.grid?.tabOrder || 0;
      }
    });
    setTabOrders(savedTabOrders);
    
    const initialLayout = generateLayout(data as MenuItems[]);
    setLayout(initialLayout);
    setActiveTab(null);
  }, []); 

  const generateLayout = (menuData: MenuItems[]): Layout[] => {
    return menuData
      .filter(item => item.grid)
      .map(item => ({
        x: item.grid!.x,
        y: item.grid!.y,
        w: item.grid!.w,
        h: item.grid!.h,
        i: item.menuId,
        resizeHandles: item.grid!.resizeHandles || ["s", "w", "e", "n", "sw", "nw", "se", "ne"],
        cols: item.grid!.cols,
        gap: item.grid!.gap,
        gridWidth: item.grid!.gridWidth,
        gridHeight: item.grid!.gridHeight,
        tabOrder: item.grid!.tabOrder
      }));
  };

  const generateDOM = () => {
    return menuItems
      .filter(item => item.grid)
      .map((item) => (
        <div key={item.menuId} className="react-grid-item grid-item">
          <div className="menu-item">
            {item.gridName}
          </div>
        </div>
      ));
  };

  const generateGridTemplateAreas = () => {
    const maxRows = Math.max(...layout.map(item => item.y + item.h));
    const grid = Array(maxRows).fill(null).map(() => 
      Array(cols).fill('.')
    );

    layout.forEach(item => {
      const { x, y, w, h, i } = item;
      for (let row = y; row < y + h; row++) {
        for (let col = x; col < x + w; col++) {
          if (grid[row] && grid[row][col] !== undefined) {
            grid[row][col] = i;
          }
        }
      }
    });

    return grid;
  };

  const handleConfirmClick = async () => {
    try {
      const updatedMenuItems = [...menuItems].sort((a, b) => {
        const aOrder = tabOrders[a.menuId] ?? 0;  // 기본값 0
        const bOrder = tabOrders[b.menuId] ?? 0;  // 기본값 0
        
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        
        const aPos = findItemPosition(a.menuId, generateGridTemplateAreas());
        const bPos = findItemPosition(b.menuId, generateGridTemplateAreas());
        
        if (aPos.y === bPos.y) {
          return aPos.x - bPos.x;
        }
        return aPos.y - bPos.y;
      }).map(item => ({
        ...item,
        grid: {
          ...(item.grid || {}),
          x: layout.find(l => l.i === item.menuId)?.x ?? 0,
          y: layout.find(l => l.i === item.menuId)?.y ?? 0,
          w: layout.find(l => l.i === item.menuId)?.w ?? 1,
          h: layout.find(l => l.i === item.menuId)?.h ?? 1,
          i: item.menuId,
          resizeHandles: ["s", "w", "e", "n", "sw", "nw", "se", "ne"],
          cols: cols,
          gap: gap,
          tabOrder: tabOrders[item.menuId] ?? 0  // 기본값 0
        }
      }));

      const response = await fetch('/api/menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedMenuItems),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update menu order');
      }

      alert('그리드 설정이 저장되었습니다.');
      
      // 모든 컴포넌트 업데이트
      window.dispatchEvent(new CustomEvent('gridLayoutUpdate', { 
        detail: { updatedMenuItems } 
      }));

      await onLayoutConfirm?.();
      await refreshData();  // 데이터 새로고침 추가

    } catch (error) {
      console.error('Error updating menu order:', error);
      alert('그리드 설정 저장에 실패했습니다.');
    }
  };

  const findItemPosition = (menuId: string, gridRows: string[][]) => {
    for (let y = 0; y < gridRows.length; y++) {
      for (let x = 0; x < gridRows[y].length; x++) {
        if (gridRows[y][x] === menuId) {
          return { x, y };
        }
      }
    }
    return { x: 0, y: 0 };
  };

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value, 10);
    
    if (!isNaN(numValue)) {
      // 로컬 상태 업데이트
      if (name === 'cols' && numValue >= 1 && numValue <= 12) {
        setCols(numValue);
      } else if (name === 'gap' && numValue >= 0) {
        setGap(numValue);
      }
      
      // 부모 컴포넌트 업데이트
      onSettingsChange?.({
        cols: name === 'cols' ? numValue : cols,
        gap: name === 'gap' ? numValue : gap
      });
    }
  };

  const handleLayoutChange = (newLayout: Layout[]) => {
    setLayout(newLayout);
    onLayoutChange?.(newLayout);
  };

  const handleMenuUpdate = (menuId: string, updates: Partial<EditableMenuFields>) => {
    if (updates.isDeleted) {
      setMenuItems(menuItems.filter(menu => menu.menuId !== menuId));
      setActiveTab(null);
    } else {
      setMenuItems(menuItems.map(menu => 
        menu.menuId === menuId ? { ...menu, ...updates } : menu
      ));
    }
  };

  const refreshData = async () => {
    try {
      //const response = await fetch('/data/data.json', {
      const response = await fetch('/api/menu', {
        cache: 'no-store'
      });
      const data = await response.json();
      setMenuItems(data);
      const initialLayout = generateLayout(data);
      setLayout(initialLayout);

      // Header 컴포넌트 업데이트를 위한 이벤트 발생
      window.dispatchEvent(new CustomEvent('gridLayoutUpdate', { 
        detail: { updatedMenuItems: data } 
      }));
    } catch (error) {
      console.error('Failed to load menu data:', error);
    }
  };

  const handleTabClick = (menuId: string) => {
    // 같은 탭을 클릭하면 에디터를 숨김
    if (activeTab === menuId) {
      setActiveTab(null);
    } else {
      setActiveTab(menuId);
    }
  };

  const handleTabOrderChange = (menuId: string, order: string) => {
    const orderNum = parseInt(order, 10);
    setTabOrders(prev => ({
      ...prev,
      [menuId]: isNaN(orderNum) ? undefined : orderNum
    }));
  };

  const handleAddMenu = () => {
    const newMenuItem = {
      menuId: `menu_${Date.now()}`,
      menuName: '',
      gridName: '',
      href: '',
      ga: {
        area: '',
        label: '',
        page: ''
      },
      target: false,
      iconName: '',
      iconPosition: '',
      direction: '',
      subMenu: [],
      grid: {
        x: 0,
        y: menuItems.length,
        w: 1,
        h: 1,
        i: `menu_${Date.now()}`,
        resizeHandles: ["s", "w", "e", "n", "sw", "nw", "se", "ne"],
        cols: cols,
        gap: gap,
        gridWidth: '',
        gridHeight: '',
        gridBorderTop: '',
        gridBorderRight: '',
        gridBorderBottom: '',
        gridBorderLeft: '',
        tabOrder: menuItems.length + 1
      },
      style: {
        width: '',
        height: '',
        position: '',
        left: '',
        top: ''
      }
    };
    
    setMenuItems([...menuItems, newMenuItem]);
    const newLayout = generateLayout([...menuItems, newMenuItem]);
    setLayout(newLayout);
    setActiveTab(newMenuItem.menuId);
  };

  return (
    <div className="resizable-container">
      <div className="settings-panel">
        <div className="settings-panel-header">
          <h4>메뉴 관리</h4>
          <button
            onClick={handleAddMenu}
            className="addButton"
          >
            새 메뉴 추가
          </button>
        </div>
        <div className="settings-panel-grid">
          <h4>그리드 설정</h4>
          <div>
            <label>Columns: </label>
            <input
              type="number"
              name="cols"
              value={cols}
              onChange={handleSettingsChange}
              min="1"
              max="12"
            />
          </div>
          <div>
            <label>Gap (rem): </label>
            <input
              type="number"
              name="gap"
              value={gap}
              onChange={handleSettingsChange}
              min="0"
              step="1"
            />
          </div>
          <button 
          onClick={handleConfirmClick}
          className="confirm-button"
        >
          그리드 설정 확인
        </button>
        </div>
        <div className="tab-order-settings">
          <h4>탭 순서 설정</h4>
          {menuItems.map(item => (
            <div key={item.menuId} className="tab-order-item">
              <label>{item.gridName}: </label>
              <input
                type="number"
                value={tabOrders[item.menuId] || ''}
                onChange={(e) => handleTabOrderChange(item.menuId, e.target.value)}
                min="1"
                placeholder="순서"
              />
            </div>
          ))}
        </div>
        
      </div>

      <ReactGridLayout
        className="layout"
        layout={layout}
        cols={cols}
        rowHeight={rowHeight}
        containerPadding={[gap * 16, gap * 16]}
        margin={[gap * 16, gap * 16]}
        onLayoutChange={handleLayoutChange}
        isDraggable={true}
        isResizable={true}
      >
        {generateDOM()}
      </ReactGridLayout>
      
      <div className="menu-editors" style={EDITOR_STYLES.container}>
        <div className="menu-tabs">
          {menuItems.map(item => (
            <button 
              key={item.menuId} 
              className={`menu-tab ${activeTab === item.menuId ? 'active' : ''}`}
              onClick={() => handleTabClick(item.menuId)}
            >
              {item.gridName || item.menuId}
            </button>
          ))}
        </div>
        <div className="menu-editors-content" style={EDITOR_STYLES.wrapper}>
          {activeTab && (
            <MenuEditor
              key={`editor-${activeTab}`}
              menu={menuItems.find(m => m.menuId === activeTab)!}
              menuItems={menuItems}
              cols={cols}
              gap={gap}
              onUpdate={handleMenuUpdate}
              refreshData={refreshData}
            />
          )}
        </div>
      </div>
    </div>
  );
}