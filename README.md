# Grid Layout Manager

그리드 기반의 동적 레이아웃 관리 시스템입니다. React와 Next.js를 사용하여 구현되었습니다.

## 주요 기능

- 드래그 앤 드롭으로 메뉴 아이템 위치 조정
- 실시간 그리드 레이아웃 업데이트
- 그리드 설정 (컬럼 수, 간격) 커스터마이징
- 레이아웃 설정 저장 및 불러오기
- 반응형 그리드 레이아웃 지원
- 메뉴 아이템 리사이징 기능
- 서브메뉴 시스템
- 탭 순서 관리
- 테두리 스타일 커스터마이징

## 핵심 컴포넌트

### ResizableHandles
- 그리드 레이아웃의 핵심 컴포넌트
- react-grid-layout 라이브러리 기반
- 기능:
  - 드래그 앤 드롭 레이아웃 관리
  - 그리드 아이템 리사이징
  - 컬럼 수와 간격 조정
  - 탭 순서 설정
  - 레이아웃 저장

### MenuEditor
- 메뉴 아이템 편집 컴포넌트
- 기능:
  - 메뉴 기본 정보 편집 (이름, ID, 링크 등)
  - 그리드 스타일 설정 (너비, 높이)
  - 테두리 스타일 커스터마이징
  - 서브메뉴 관리
  - 아이콘 설정

### Header
- 메뉴 시스템의 표시 컴포넌트
- 기능:
  - 그리드 기반 메뉴 렌더링
  - 서브메뉴 처리
  - 이벤트 핸들링
  - 동적 그리드 템플릿 생성

## 데이터 구조

### 메뉴 아이템 (MenuItem)
```typescript
interface MenuItem {
  menuId: string;
  menuName: string;
  gridName: string;
  href: string;
  ga: {
    area: string;
    label: string;
    page: string;
  };
  target: boolean;
  subMenu: MenuItem[];
  iconName?: string;
  iconPosition?: string;
  grid?: {
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
  };
}
```

## 데이터 흐름

1. 초기 로드
   - `/data/data.json`에서 메뉴 데이터 로드
   - 그리드 레이아웃 초기화
   - 탭 순서 설정 적용

2. 레이아웃 업데이트
   - 드래그 앤 드롭/리사이징 시 실시간 업데이트
   - 변경사항은 layout 상태로 관리
   - "그리드 설정 확인" 버튼으로 저장

3. 메뉴 편집
   - MenuEditor에서 메뉴 정보 수정
   - 서브메뉴 추가/삭제/수정
   - 스타일 설정 변경

4. 데이터 저장
   ```typescript
   // API 엔드포인트로 데이터 전송
   const response = await fetch('/api/menu', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
     },
     body: JSON.stringify(updatedMenuItems),
   });
   ```

5. 이벤트 전파
   - CustomEvent를 통한 컴포넌트 간 동기화
   ```typescript
   window.dispatchEvent(new CustomEvent('gridLayoutUpdate', { 
     detail: { updatedMenuItems } 
   }));
   ```

## API 엔드포인트

### /api/menu
- GET: 메뉴 데이터 조회
- POST: 메뉴 데이터 업데이트

### /api/updateMenu
- POST: 개별 메뉴 아이템 업데이트

## 스타일링

- CSS Modules 사용
- 반응형 디자인
- 커스텀 테두리 스타일링
- 그리드 레이아웃 스타일 커스터마이징

## 사용 방법

### 1. 그리드 설정
```typescript
<ResizableHandles 
  rowHeight={30}
  initialCols={6}
  initialGap={0}
/>
```

### 2. 메뉴 이벤트 설정
```typescript
const setSubMenus = new Map([
  ['menuId', { 
    handler: () => void, 
    useHref: boolean 
  }]
]);

<Header setSubMenus={setSubMenus} />
```

### 3. 테두리 스타일 설정
```typescript
// MenuEditor에서 설정
const newBorder = `${width}px ${style} ${color}`;
handleChange('grid', {
  ...menu.grid,
  [`gridBorder${direction}`]: newBorder
});
```

## 프로젝트 구조

```
app/
├── components/
│   ├── Header/
│   │   ├── index.tsx
│   │   └── index.module.css
│   ├── MenuEditor/
│   │   ├── index.tsx
│   │   └── index.css
│   └── ResizableHandles/
│       ├── index.tsx
│       └── index.css
├── api/
│   ├── menu/
│   │   └── route.ts
│   └── updateMenu/
│       └── route.ts
├── types/
│   ├── menu.ts
│   ├── menu.d.ts
│   └── react-grid-layout.d.ts
└── hooks/
    └── useMenuHandlers.ts
```

## 주요 기능 상세 설명

### 그리드 레이아웃 관리
- react-grid-layout을 사용한 드래그 앤 드롭
- 리사이즈 핸들로 크기 조정
- 컬럼 수와 간격 실시간 조정
- 레이아웃 변경사항 자동 저장

### 메뉴 에디터
- 탭 기반의 메뉴 편집 인터페이스
- 실시간 미리보기
- 서브메뉴 무제한 추가/삭제
- 테두리 스타일 커스터마이징

### 탭 순서 관리
- 숫자 기반의 탭 순서 지정
- 자동 정렬 기능
- 그리드 위치 기반 보조 정렬

### 이벤트 처리
- 커스텀 이벤트로 컴포넌트 간 동기화
- 메뉴 클릭 이벤트 핸들링
- 페이지 이동 제어

### 데이터 관리
- JSON 파일 기반 데이터 저장
- API 엔드포인트를 통한 CRUD
- 실시간 동기화
