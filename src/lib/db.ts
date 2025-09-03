import { Pool } from 'pg';

// PostgreSQL 연결 설정
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // Cloud SQL은 항상 SSL 연결 필요
  ssl: { rejectUnauthorized: false },
  // 연결 타임아웃 설정
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

// 데이터베이스 테이블 스키마
export const initializeDatabase = async () => {
  const client = await pool.connect();
  
  try {
    // 음성 메시지 테이블 생성
    await client.query(`
      CREATE TABLE IF NOT EXISTS voice_messages (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        original_filename VARCHAR(255),
        file_url TEXT NOT NULL,
        transcription TEXT,
        moderated_text TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        is_approved BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 전광판 메시지 테이블 생성
    await client.query(`
      CREATE TABLE IF NOT EXISTS display_messages (
        id SERIAL PRIMARY KEY,
        message_text TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 업데이트 시간 자동 갱신을 위한 함수
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // 트리거 생성 (기존 트리거가 있으면 삭제 후 재생성)
    await client.query(`
      DROP TRIGGER IF EXISTS update_voice_messages_updated_at ON voice_messages;
      DROP TRIGGER IF EXISTS update_display_messages_updated_at ON display_messages;
      
      CREATE TRIGGER update_voice_messages_updated_at 
          BEFORE UPDATE ON voice_messages 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();
      
      CREATE TRIGGER update_display_messages_updated_at 
          BEFORE UPDATE ON display_messages 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();
    `);

    // 인덱스 생성
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_voice_messages_status ON voice_messages(status);
      CREATE INDEX IF NOT EXISTS idx_voice_messages_created_at ON voice_messages(created_at);
      CREATE INDEX IF NOT EXISTS idx_display_messages_active ON display_messages(is_active, display_order);
      CREATE INDEX IF NOT EXISTS idx_display_messages_created_at ON display_messages(created_at DESC);
    `);

    console.log('데이터베이스 초기화 완료');
  } catch (error) {
    console.error('데이터베이스 초기화 오류:', error);
  } finally {
    client.release();
  }
};

export default pool;
