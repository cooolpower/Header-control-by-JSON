'use client';

import dynamic from 'next/dynamic';
import styles from './page.module.css';
import Header from './components/Header';
import { useMenuHandlers } from './hooks/useMenuHandlers';

// ResizableHandles 컴포넌트를 동적으로 임포트 (클라이언트 사이드 렌더링)
const ResizableHandles = dynamic(() => import('./components/ResizableHandles'), {
  ssr: false
});

export default function Page() {
  const { setSubMenus } = useMenuHandlers();

  return (
    <div>
      <header className={styles.header}>
        <div className={styles.container}>
          <div className={styles.gnb}>
            <h1>logo</h1>
          </div>
          <Header setSubMenus={setSubMenus} />
        </div>
      </header>
      <ResizableHandles rowHeight={30} />
    </div>
  );
}
