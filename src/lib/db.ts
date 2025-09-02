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

    // 인덱스 생성
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_voice_messages_status ON voice_messages(status);
      CREATE INDEX IF NOT EXISTS idx_voice_messages_created_at ON voice_messages(created_at);
    `);

    console.log('데이터베이스 초기화 완료');
  } catch (error) {
    console.error('데이터베이스 초기화 오류:', error);
  } finally {
    client.release();
  }
};

export default pool;
