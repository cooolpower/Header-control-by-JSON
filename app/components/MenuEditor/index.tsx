import './index.css';
import React, { useRef, useState, useCallback, useMemo } from 'react';
import { MenuItem, EditableMenuFields } from '@/app/types/menu';
import { Grid } from '@/app/types/type';
import styles from './index.module.css';
import _ from 'lodash';

type BorderDirection = 'Top' | 'Right' | 'Bottom' | 'Left';
type BorderKey = `gridBorder${BorderDirection}`;

interface MenuEditorProps {
  menu: MenuItem;
  menuItems: MenuItem[];
  cols: number;
  gap: number;
  onUpdate: (menuId: string, updates: Partial<EditableMenuFields>) => void;
}

export default function MenuEditor({ 
  menu, 
  menuItems,
  cols,
  gap,
  onUpdate, 
  refreshData 
}: MenuEditorProps & { refreshData: () => Promise<void> }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [colorInputs, setColorInputs] = useState<{[key: string]: string}>({});

  const handleChange = useCallback((field: string, value: string | boolean | Partial<Grid> | MenuItem[]) => {
    if (field === 'grid' && menu.grid) {
      const borderDirections = ['Top', 'Right', 'Bottom', 'Left'] as const;
      const gridWithBorders = {
        ...menu.grid,
        ...(value as Partial<Grid>),
      } as Grid;

      borderDirections.forEach(direction => {
        const borderKey = `gridBorder${direction}` as keyof Grid;
        if (!(borderKey in gridWithBorders)) {
          (gridWithBorders[borderKey] as string) = '';
        }
      });

      onUpdate(menu.menuId, {
        grid: gridWithBorders
      } as Partial<EditableMenuFields>);
    } else {
      onUpdate(menu.menuId, { [field]: value } as Partial<EditableMenuFields>);
    }
  }, [menu, onUpdate]);

  const handleBorderUpdate = useCallback((direction: Lowercase<BorderDirection>, color: string) => {
    const borderKey = `gridBorder${direction.charAt(0).toUpperCase()}${direction.slice(1)}` as BorderKey;
    const currentBorder = menu?.grid?.[borderKey] || '';
    const width = getBorderWidth(currentBorder);
    const style = getBorderStyle(currentBorder);
    
    const newBorder = `${width ? width + 'px' : '0px'} ${style || 'solid'} ${color}`;
    
    handleChange('grid', {
      ...menu?.grid,
      [borderKey]: newBorder
    });
  }, [menu?.grid, handleChange]);

  const debouncedUpdateBorder = useMemo(
    () => _.debounce(handleBorderUpdate, 100),
    [handleBorderUpdate]
  );

  if (!menu) {
    return null;  // 또는 로딩/에러 UI
  }

  const handleSubMenuChange = (subMenuIndex: number, field: string, value: string | boolean) => {
    const updatedSubMenu = [...menu.subMenu];
    updatedSubMenu[subMenuIndex] = {
      ...updatedSubMenu[subMenuIndex],
      [field]: value
    };
    onUpdate(menu.menuId, { subMenu: updatedSubMenu } as Partial<EditableMenuFields>);
  };

  const handleSave = async () => {
    try {
      const menuToSave = {
        ...menu,
        grid: menu.grid || {
          x: 0,
          y: menuItems.length,
          w: 1,
          h: 1,
          i: menu.menuId,
          resizeHandles: ["s", "w", "e", "n", "sw", "nw", "se", "ne"],
          cols: cols,
          gap: gap
        }
      };

      // 기존 메뉴 아이템들 중 현재 메뉴를 제외한 나머지를 유지
      const updatedMenuItems = menuItems.map(item => 
        item.menuId === menu.menuId ? menuToSave : item
      );

      // 새 메뉴인 경우 배열에 추가
      if (!menuItems.find(item => item.menuId === menu.menuId)) {
        updatedMenuItems.push(menuToSave);
      }

      const response = await fetch('/api/menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedMenuItems),
      });

      if (!response.ok) {
        throw new Error('Failed to save menu');
      }

      const updatedData = await response.json();
      
      window.dispatchEvent(new CustomEvent('gridLayoutUpdate', { 
        detail: { updatedMenuItems: updatedData } 
      }));

      alert('메뉴가 성공적으로 저장되었습니다.');
      await refreshData();
      
    } catch (error) {
      console.error('Error saving menu:', error);
      alert('메뉴 저장에 실패했습니다.');
    }
  };

  const handleDelete = async () => {
    try {
      // 삭제할 메뉴를 제외한 나머지 메뉴 목록 생성
      const updatedMenuItems = menuItems.filter(item => item.menuId !== menu.menuId);

      // API 호출하여 업데이트된 데이터 저장
      const response = await fetch('/api/menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedMenuItems),
      });

      if (!response.ok) {
        throw new Error('Failed to delete menu');
      }

      const result = await response.json();

      // UI 상태 업데이트
      onUpdate(menu.menuId, { isDeleted: true } as Partial<EditableMenuFields>);

      // 전역 이벤트 발생시켜 다른 컴포넌트들 업데이트
      window.dispatchEvent(new CustomEvent('gridLayoutUpdate', { 
        detail: { updatedMenuItems: result } 
      }));

      alert('메뉴가 삭제되었습니다.');
      await refreshData();

    } catch (error) {
      console.error('Error deleting menu:', error);
      alert('메뉴 삭제에 실패했습니다.');
    }
  };

  const getBorderWidth = (border: string = '') => {
    if (!border) return '1';  // 기본값 1
    const match = border.match(/(\d+)px/);
    return match ? match[1] : '1';  // 매치되지 않으면 기본값 1
  };

  const getBorderStyle = (border: string = '') => {
    if (!border) return '';
    const styles = ['solid', 'dashed', 'dotted', 'double'];
    for (const style of styles) {
      if (border.includes(style)) return style;
    }
    return '';
  };

  const getBorderColor = (border: string = '') => {
    if (!border) return '#000000';
    const match = border.match(/#[0-9a-fA-F]{6}/);
    return match ? match[0] : '#000000';
  };

  // 컬러픽커 onChange 핸들러
  const handleColorChange = (direction: Lowercase<BorderDirection>, color: string) => {
    // 입력 상태만 즉시 업데이트
    setColorInputs(prev => ({
      ...prev,
      [`${direction}Color`]: color
    }));
    
    // 실제 border 업데이트는 디바운스 처리
    debouncedUpdateBorder(direction, color);
  };

  const updateBorder = (direction: Lowercase<BorderDirection>, property: string, value: string) => {
    const borderKey = `gridBorder${direction.charAt(0).toUpperCase()}${direction.slice(1)}` as BorderKey;
    const currentBorder = menu.grid?.[borderKey] || '';
    let width = getBorderWidth(currentBorder);
    let style = getBorderStyle(currentBorder);
    let color = getBorderColor(currentBorder);

    switch (property) {
      case 'width':
        width = value || '1';  // 값이 없으면 기본값 1
        break;
      case 'style':
        style = value;
        break;
      case 'color':
        color = value;
        break;
    }

    // 모든 값이 있을 때만 border 문자열 생성
    const newBorder = (width || style || color) 
      ? `${width ? width + 'px' : '1px'} ${style || 'solid'} ${color || '#000000'}`  // width 없으면 1px
      : '';

    handleChange('grid', {
      ...menu.grid,
      [borderKey]: newBorder
    });
  };

  return (
    <div 
      ref={editorRef} 
      className={styles.editorContainer}
    >
      <div className="editorHeader">
        <h3>메뉴 수정: {menu.menuName}</h3>
        <div className="headerButtons">
          <button 
            onClick={handleDelete}
            className="deleteButton"
          >
            메뉴 삭제
          </button>
          <button 
            onClick={handleSave}
            className="saveButton"
          >
            저장
          </button>
        </div>
      </div>
      <div className="editorGrid">
        <h4>메뉴 정보</h4>
        <div className="editorGridInfo">
          <div className="field">
            <label htmlFor={`menuName-${menu.menuId}`}>메뉴명</label>
            <input
              id={`menuName-${menu.menuId}`}
              type="text"
              value={menu.menuName}
              onChange={(e) => handleChange('menuName', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor={`gridName-${menu.menuId}`}>그리드명</label>
            <input
              id={`gridName-${menu.menuId}`}
              type="text"
              value={menu.gridName}
              onChange={(e) => handleChange('gridName', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor={`menuId-${menu.menuId}`}>메뉴 ID</label>
            <input
              id={`menuId-${menu.menuId}`}
              type="text"
              value={menu.menuId}
              onChange={(e) => handleChange('menuId', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor={`href-${menu.menuId}`}>링크 주소</label>
            <input
              id={`href-${menu.menuId}`}
              type="text"
              value={menu.href}
              onChange={(e) => handleChange('href', e.target.value)}
            />
          </div>
          <div className="field">
            <label>
              <input
                type="checkbox"
                checked={menu.target}
                onChange={(e) => handleChange('target', e.target.checked)}
              />
              새 창에서 열기
            </label>
          </div>
        </div>

        <h4>아이콘 정보</h4>
        <div className="editorGridInfo">
          <div className="field">
            <label htmlFor={`iconName-${menu.menuId}`}>아이콘명</label>
            <input
              id={`iconName-${menu.menuId}`}
              type="text"
              value={menu.iconName}
              onChange={(e) => handleChange('iconName', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor={`iconPosition-${menu.menuId}`}>아이콘 위치</label>
            <select
              id={`iconPosition-${menu.menuId}`}
              value={menu.iconPosition}
              onChange={(e) => handleChange('iconPosition', e.target.value)}
            >
              <option value="">선택</option>
              <option value="left">왼쪽</option>
              <option value="right">오른쪽</option>
            </select>
          </div>
        </div>

        <h4>그리드 정보</h4>
        <div className="editorGridInfo">
          <div className="field">
            <label htmlFor={`width-${menu.menuId}`}>그리드 넓이 (px)</label>
            <input
              id={`width-${menu.menuId}`}
              type="number"
              value={menu.grid?.gridWidth || ''}
              onChange={(e) => {
                const gridWidth = e.target.value || '';
                handleChange('grid', {
                  ...menu.grid,
                  gridWidth
                });
              }}
              placeholder="자동"
              min="0"
            />
          </div>
          <div className="field">
            <label htmlFor={`height-${menu.menuId}`}>그리드 높이 (px)</label>
            <input
              id={`height-${menu.menuId}`}
              type="number"
              value={menu.grid?.gridHeight || ''}
              onChange={(e) => {
                const gridHeight = e.target.value || '';
                handleChange('grid', {
                  ...menu.grid,
                  gridHeight
                });
              }}
              placeholder="자동"
              min="0"
            />
          </div>
        </div>
        
        <h4>그리드 스타일</h4>
        <div className="editorGridInfo">
          {(['Top', 'Right', 'Bottom', 'Left'] as BorderDirection[]).map((direction) => (
            <div key={direction} className="borderField">
              <label>{direction} 테두리</label>
              <div className="borderControls">
                <select
                  value={getBorderWidth(menu.grid?.[`gridBorder${direction}`]) || ''}
                  onChange={(e) => updateBorder(direction.toLowerCase() as Lowercase<BorderDirection>, 'width', e.target.value)}
                >
                  <option value="">두께</option>
                  <option value="0">0px</option>
                  <option value="1">1px</option>
                  <option value="2">2px</option>
                  <option value="3">3px</option>
                  <option value="4">4px</option>
                  <option value="5">5px</option>
                </select>

                <select
                  value={getBorderStyle(menu.grid?.[`gridBorder${direction}`]) || ''}
                  onChange={(e) => updateBorder(direction.toLowerCase() as Lowercase<BorderDirection>, 'style', e.target.value)}
                >
                  <option value="">스타일</option>
                  <option value="solid">실선</option>
                  <option value="dashed">점선</option>
                  <option value="dotted">점묶음</option>
                  <option value="double">이중선</option>
                </select>

                <div className="colorControl">
                  <input
                    type="color"
                    value={getBorderColor(menu.grid?.[`gridBorder${direction}`]) || '#000000'}
                    onChange={(e) => handleColorChange(direction.toLowerCase() as Lowercase<BorderDirection>, e.target.value)}
                  />
                  <input
                    type="text"
                    value={(colorInputs[`${direction}Color`] ?? getBorderColor(menu.grid?.[`gridBorder${direction}`])) || '#000000'}
                    onChange={(e) => {
                      let color = e.target.value;
                      // 입력 상태 업데이트
                      setColorInputs(prev => ({
                        ...prev,
                        [`${direction}Color`]: color
                      }));
                      
                      // # 없이 입력하면 자동으로 추가
                      if (color && !color.startsWith('#')) {
                        color = '#' + color;
                      }
                      
                      // 유효한 색상 형식이면 border에 적용
                      if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
                        const borderKey = `gridBorder${direction}` as BorderKey;
                        const currentBorder = menu.grid?.[borderKey] || '';
                        const width = getBorderWidth(currentBorder);
                        const style = getBorderStyle(currentBorder);
                        
                        const newBorder = `${width ? width + 'px' : '0px'} ${style || 'solid'} ${color}`;
                        
                        handleChange('grid', {
                          ...menu.grid,
                          [borderKey]: newBorder
                        });
                      }
                    }}
                    placeholder="#000000"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="subMenuSection">
        <div className="subMenuHeader">
          <h4>서브메뉴 목록</h4>
          <button
            onClick={() => {
              const newSubMenu = {
                menuId: `submenu_${Date.now()}`,
                menuName: '',
                href: '',
                ga: { area: '', label: '', page: '' },
                target: false,
                subMenu: []
              };
              handleChange('subMenu', [...(menu.subMenu || []), newSubMenu]);
            }}
            className="addButton"
          >
            서브메뉴 추가
          </button>
        </div>
        {(!menu.subMenu || menu.subMenu.length === 0) ? (
          <div className="empty-submenu">
            <p>서브메뉴가 없습니다. 서브메뉴를 추가해주세요.</p>
          </div>
        ) : (
          menu.subMenu.map((subItem, index) => (
            <div key={subItem.menuId || index} className="subMenuEditor">
              <div className="subMenuHeader">
                <h5>서브메뉴 {index + 1}</h5>
                <button
                  onClick={() => {
                    const updatedSubMenu = menu.subMenu.filter((_, i) => i !== index);
                    handleChange('subMenu', updatedSubMenu);
                  }}
                  className="deleteButton"
                >
                  삭제
                </button>
              </div>
              <div className="editorSubGrid">
                <div className="field">
                  <label>메뉴명</label>
                  <input
                    type="text"
                    value={subItem.menuName}
                    onChange={(e) => handleSubMenuChange(index, 'menuName', e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>메뉴 ID</label>
                  <input
                    type="text"
                    value={subItem.menuId || ''}
                    onChange={(e) => handleSubMenuChange(index, 'menuId', e.target.value)}
                  />
                </div>
                
                <div className="field">
                  <label>링크</label>
                  <input
                    type="text"
                    value={subItem.href}
                    onChange={(e) => handleSubMenuChange(index, 'href', e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>아이콘명</label>
                  <input
                    type="text"
                    value={subItem.iconName || ''}
                    onChange={(e) => handleSubMenuChange(index, 'iconName', e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>아이콘 위치</label>
                  <select
                    value={subItem.iconPosition || ''}
                    onChange={(e) => handleSubMenuChange(index, 'iconPosition', e.target.value)}
                  >
                    <option value="">선택</option>
                    <option value="left">왼쪽</option>
                    <option value="right">오른쪽</option>
                  </select>
                </div>
                <div className="field">
                  <label>
                    <input
                      type="checkbox"
                      checked={subItem.target || false}
                      onChange={(e) => handleSubMenuChange(index, 'target', e.target.checked)}
                    />
                    새 창에서 열기
                  </label>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 