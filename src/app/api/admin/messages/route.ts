import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// 모든 음성 메시지 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const client = await pool.connect();
    
    try {
      let query = `
        SELECT id, filename, original_filename, file_url, transcription, 
               moderated_text, status, is_approved, created_at, updated_at
        FROM voice_messages
      `;
      let countQuery = 'SELECT COUNT(*) FROM voice_messages';
      const params: (string | number)[] = [];
      
      if (status) {
        query += ' WHERE status = $1';
        countQuery += ' WHERE status = $1';
        params.push(status);
      }
      
      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);
      
      const [messagesResult, countResult] = await Promise.all([
        client.query(query, params),
        client.query(countQuery, status ? [status] : [])
      ]);
      
      const totalCount = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(totalCount / limit);
      
      return NextResponse.json({
        messages: messagesResult.rows,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      });
      
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
