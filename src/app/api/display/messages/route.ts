import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: 전광판 메시지 목록 조회
export async function GET(request: NextRequest) {
  const client = await pool.connect();
  
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';
    
    let query = `
      SELECT id, message_text, is_active, display_order, created_at, updated_at
      FROM display_messages
    `;
    
    if (activeOnly) {
      query += ' WHERE is_active = true';
    }
    
    query += ' ORDER BY display_order ASC, created_at DESC';
    
    const result = await client.query(query);
    
    return NextResponse.json({
      success: true,
      messages: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    console.error('전광판 메시지 조회 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '메시지를 불러오는 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// POST: 새 전광판 메시지 추가
export async function POST(request: NextRequest) {
  const client = await pool.connect();
  
  try {
    const { message_text, display_order = 0 } = await request.json();
    
    if (!message_text) {
      return NextResponse.json(
        { success: false, error: '메시지 내용이 필요합니다.' },
        { status: 400 }
      );
    }
    
    const result = await client.query(
      `INSERT INTO display_messages (message_text, display_order) 
       VALUES ($1, $2) 
       RETURNING id, message_text, is_active, display_order, created_at, updated_at`,
      [message_text, display_order]
    );
    
    return NextResponse.json({
      success: true,
      message: '메시지가 성공적으로 추가되었습니다.',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('전광판 메시지 추가 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '메시지 추가 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
