'use client';

type MenuHandler = {
  handler: () => void;
  useHref: boolean;
};

export function useMenuHandlers() {
  const handleLoginCheck = () => {
    confirm('로그인 페이지로 이동하시겠습니까?');
  };
  
  const handlePopup = () => {
    confirm('팝업 페이지로 이동하시겠습니까?');
  };

  const setSubMenus = new Map<string, MenuHandler>([
    ['recruit', { handler: handleLoginCheck, useHref: false}],
    ['recruitLocal', { handler: handlePopup, useHref: true}],
  ]);

  return { setSubMenus };
} 