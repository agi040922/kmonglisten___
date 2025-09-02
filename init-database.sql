-- 마음의 전화 데이터베이스 초기화 스크립트

-- voice_messages 테이블 생성
CREATE TABLE IF NOT EXISTS voice_messages (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    transcription TEXT,
    moderated_text TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    is_approved BOOLEAN DEFAULT false,
    confidence_score DECIMAL(5,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 업데이트 시간 자동 갱신을 위한 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_voice_messages_updated_at 
    BEFORE UPDATE ON voice_messages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_voice_messages_status ON voice_messages(status);
CREATE INDEX IF NOT EXISTS idx_voice_messages_created_at ON voice_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_messages_approved ON voice_messages(is_approved, created_at DESC);

-- 샘플 데이터 삽입 (테스트용)
INSERT INTO voice_messages (filename, original_filename, file_url, transcription, moderated_text, status, is_approved) 
VALUES 
    ('sample1.wav', '테스트음성1.wav', 'https://storage.googleapis.com/kmonglisten-voice-files/sample1.wav', '안녕하세요. 테스트 메시지입니다.', '안녕하세요. 테스트 메시지입니다.', 'completed', true),
    ('sample2.wav', '테스트음성2.wav', 'https://storage.googleapis.com/kmonglisten-voice-files/sample2.wav', '좋은 하루 되세요.', '좋은 하루 되세요.', 'completed', true)
ON CONFLICT DO NOTHING;

-- 테이블 생성 확인
SELECT 'voice_messages 테이블이 성공적으로 생성되었습니다.' as message;
SELECT COUNT(*) as total_records FROM voice_messages;
