import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// 특정 메시지 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const messageId = parseInt(resolvedParams.id);
    
    if (isNaN(messageId)) {
      return NextResponse.json({ error: '잘못된 메시지 ID입니다.' }, { status: 400 });
    }

    const client = await pool.connect();
    
    try {
      const result = await client.query(
        `SELECT id, filename, original_filename, file_url, transcription, 
                moderated_text, status, is_approved, created_at, updated_at
         FROM voice_messages WHERE id = $1`,
        [messageId]
      );
      
      if (result.rows.length === 0) {
        return NextResponse.json({ error: '메시지를 찾을 수 없습니다.' }, { status: 404 });
      }
      
      return NextResponse.json({ message: result.rows[0] });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('메시지 조회 오류:', error);
    return NextResponse.json({ 
      error: '메시지를 불러오는 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}

// 메시지 수정 (텍스트 편집)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const messageId = parseInt(resolvedParams.id);
    
    if (isNaN(messageId)) {
      return NextResponse.json({ error: '잘못된 메시지 ID입니다.' }, { status: 400 });
    }

    const { moderatedText, isApproved } = await request.json();
    
    if (!moderatedText) {
      return NextResponse.json({ error: '수정된 텍스트가 필요합니다.' }, { status: 400 });
    }

    const client = await pool.connect();
    
    try {
      const result = await client.query(
        `UPDATE voice_messages 
         SET moderated_text = $1, is_approved = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3 RETURNING *`,
        [moderatedText, isApproved, messageId]
      );
      
      if (result.rows.length === 0) {
        return NextResponse.json({ error: '메시지를 찾을 수 없습니다.' }, { status: 404 });
      }
      
      return NextResponse.json({ 
        success: true, 
        message: result.rows[0],
        info: '메시지가 성공적으로 수정되었습니다.'
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('메시지 수정 오류:', error);
    return NextResponse.json({ 
      error: '메시지 수정 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}

// 메시지 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const messageId = parseInt(resolvedParams.id);
    
    if (isNaN(messageId)) {
      return NextResponse.json({ error: '잘못된 메시지 ID입니다.' }, { status: 400 });
    }

    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'DELETE FROM voice_messages WHERE id = $1 RETURNING *',
        [messageId]
      );
      
      if (result.rows.length === 0) {
        return NextResponse.json({ error: '메시지를 찾을 수 없습니다.' }, { status: 404 });
      }
      
      return NextResponse.json({ 
        success: true,
        info: '메시지가 성공적으로 삭제되었습니다.'
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('메시지 삭제 오류:', error);
    return NextResponse.json({ 
      error: '메시지 삭제 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}
