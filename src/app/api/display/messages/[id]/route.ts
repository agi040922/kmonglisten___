import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// PUT: 전광판 메시지 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect();
  
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    const { message_text, is_active, display_order } = await request.json();
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 메시지 ID입니다.' },
        { status: 400 }
      );
    }
    
    // 업데이트할 필드들을 동적으로 구성
    const updates: string[] = [];
    const values: (string | number | boolean)[] = [];
    let paramCount = 1;
    
    if (message_text !== undefined) {
      updates.push(`message_text = $${paramCount}`);
      values.push(message_text);
      paramCount++;
    }
    
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }
    
    if (display_order !== undefined) {
      updates.push(`display_order = $${paramCount}`);
      values.push(display_order);
      paramCount++;
    }
    
    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: '수정할 내용이 없습니다.' },
        { status: 400 }
      );
    }
    
    values.push(id);
    
    const query = `
      UPDATE display_messages 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING id, message_text, is_active, display_order, created_at, updated_at
    `;
    
    const result = await client.query(query, values);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: '메시지를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: '메시지가 성공적으로 수정되었습니다.',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('전광판 메시지 수정 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '메시지 수정 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// DELETE: 전광판 메시지 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect();
  
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 메시지 ID입니다.' },
        { status: 400 }
      );
    }
    
    const result = await client.query(
      'DELETE FROM display_messages WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: '메시지를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: '메시지가 성공적으로 삭제되었습니다.'
    });
    
  } catch (error) {
    console.error('전광판 메시지 삭제 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '메시지 삭제 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
