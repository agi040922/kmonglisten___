const { Pool } = require('pg');
const fs = require('fs');

// .env.local 파일 직접 파싱
const envPath = '.env.local';
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');

envLines.forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    process.env[key.trim()] = value.trim();
  }
});

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

async function testDatabase() {
  try {
    console.log('데이터베이스 연결 테스트 중...');
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`User: ${process.env.DB_USER}`);
    console.log(`Database: ${process.env.DB_NAME}`);
    
    const client = await pool.connect();
    console.log('✅ 데이터베이스 연결 성공!');
    
    // 테이블 존재 확인
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'voice_messages'
      );
    `);
    console.log('테이블 존재:', tableCheck.rows[0].exists);
    
    // 데이터 조회
    const result = await client.query(`
      SELECT id, filename, file_url, status, transcription, moderated_text, created_at 
      FROM voice_messages 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('\n📋 최근 메시지 목록:');
    console.log('총', result.rows.length, '개의 메시지');
    
    result.rows.forEach((row, index) => {
      console.log(`\n${index + 1}. ID: ${row.id}`);
      console.log(`   파일명: ${row.filename}`);
      console.log(`   파일 URL: ${row.file_url}`);
      console.log(`   상태: ${row.status}`);
      console.log(`   텍스트: ${row.transcription ? '있음' : '없음'}`);
      console.log(`   검열 텍스트: ${row.moderated_text ? '있음' : '없음'}`);
      console.log(`   생성일: ${row.created_at}`);
    });
    
    client.release();
    
  } catch (error) {
    console.error('❌ 데이터베이스 오류:', error.message);
    console.error('상세 오류:', error);
  } finally {
    await pool.end();
  }
}

testDatabase();
