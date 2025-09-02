import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    console.log('데이터베이스 디버그 시작...');
    
    const client = await pool.connect();
    console.log('✅ 데이터베이스 연결 성공');
    
    try {
      // 테이블 존재 확인
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'voice_messages'
        );
      `);
      
      // 데이터 조회
      const result = await client.query(`
        SELECT id, filename, file_url, status, transcription, moderated_text, 
               is_approved, created_at 
        FROM voice_messages 
        ORDER BY created_at DESC 
        LIMIT 10
      `);
      
      return NextResponse.json({
        success: true,
        tableExists: tableCheck.rows[0].exists,
        messageCount: result.rows.length,
        messages: result.rows.map(row => ({
          id: row.id,
          filename: row.filename,
          file_url: row.file_url,
          status: row.status,
          hasTranscription: !!row.transcription,
          hasModeratedText: !!row.moderated_text,
          isApproved: row.is_approved,
          created_at: row.created_at
        })),
        dbConfig: {
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
          database: process.env.DB_NAME,
          user: process.env.DB_USER
        }
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('데이터베이스 오류:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      dbConfig: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER
      }
    }, { status: 500 });
  }
}
