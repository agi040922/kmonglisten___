import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import pool from '@/lib/db';
import { uploadToGCS, transcribeAudio, moderateContent } from '@/lib/gcp';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json({ error: '음성 파일이 없습니다.' }, { status: 400 });
    }

    // 파일 정보
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const filename = `voice-messages/${uuidv4()}.wav`;
    const originalFilename = audioFile.name;

    // GCS에 파일 업로드
    const fileUrl = await uploadToGCS(buffer, filename, audioFile.type);

    // 데이터베이스에 초기 레코드 저장
    const client = await pool.connect();
    let messageId: number;
    
    try {
      const result = await client.query(
        `INSERT INTO voice_messages (filename, original_filename, file_url, status) 
         VALUES ($1, $2, $3, 'processing') RETURNING id`,
        [filename, originalFilename, fileUrl]
      );
      messageId = result.rows[0].id;
    } finally {
      client.release();
    }

    // 백그라운드에서 음성 인식 처리
    processAudioTranscription(messageId, fileUrl, filename);

    return NextResponse.json({ 
      success: true, 
      messageId,
      message: '음성 파일이 업로드되었습니다. 텍스트 변환 중입니다.' 
    });

  } catch (error) {
    console.error('업로드 오류:', error);
    return NextResponse.json({ 
      error: '파일 업로드 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}

// 백그라운드 음성 인식 처리
async function processAudioTranscription(messageId: number, fileUrl: string, filename: string) {
  const client = await pool.connect();
  
  try {
    // 서명된 URL에서 파일명 추출하여 올바른 GCS URI 생성
    const gcsUri = `gs://${process.env.GCS_BUCKET_NAME}/${filename}`;
    
    // 음성을 텍스트로 변환
    const transcription = await transcribeAudio(gcsUri);
    
    // 내용 검열
    const { isApproved, moderatedText } = moderateContent(transcription);
    
    // 데이터베이스 업데이트
    await client.query(
      `UPDATE voice_messages 
       SET transcription = $1, moderated_text = $2, is_approved = $3, 
           status = 'completed', updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [transcription, moderatedText, isApproved, messageId]
    );
    
    console.log(`메시지 ${messageId} 처리 완료: ${isApproved ? '승인됨' : '검열됨'}`);
    
  } catch (error) {
    console.error(`메시지 ${messageId} 처리 오류:`, error);
    
    // 오류 상태로 업데이트
    await client.query(
      `UPDATE voice_messages 
       SET status = 'error', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [messageId]
    );
  } finally {
    client.release();
  }
}
