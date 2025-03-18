'use client';

import { memo } from "react";

import styles from "./index.module.css";
import Gnb from "../components/Gnb";

export interface LayoutProps {
  children: React.ReactNode;
  permissionType?: 'DEFAULT' | 'PERSONAL' | 'CORPERATE' | 'SEARFIRM';
}

function Layout({ children }: LayoutProps) {
  
  
  return (
    <div>
      <header className={styles.header}>
        <div className={styles.container}>
          <div className={styles.gnb}>
            <h1>logo</h1>
          </div>
          <Gnb />
        </div>
      </header>
      {children}
    </div>
  );
}

export default memo(Layout);
