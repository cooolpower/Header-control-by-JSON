import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { MenuItem } from '@/app/types/menu';

// GET 요청 처리 - 메뉴 데이터 조회
export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public/data/data.json');
    const data = await fs.readFile(filePath, 'utf-8');
    
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error('Failed to load menu data:', error);
    return NextResponse.json(
      { error: 'Failed to load menu data' },
      { status: 500 }
    );
  }
}

// POST 요청 처리 - 메뉴 업데이트
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const filePath = path.join(process.cwd(), 'public/data/data.json');
    
    // 단일 메뉴 업데이트인 경우 (updateMenu의 기능)
    if ('menu' in data) {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const currentData = JSON.parse(fileContent);
      const updatedData = currentData.map((item: MenuItem) => 
        item.menuId === data.menu.menuId ? data.menu : item
      );
      await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2));
      return NextResponse.json(updatedData);
    }
    
    // 전체 메뉴 업데이트인 경우
    const updatedData = Array.isArray(data) ? data : [data];
    await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2), 'utf8');
    return NextResponse.json(updatedData);
  } catch (error) {
    console.error('Error saving menu data:', error);
    return NextResponse.json(
      { message: 'Failed to save menu data' },
      { status: 500 }
    );
  }
} 