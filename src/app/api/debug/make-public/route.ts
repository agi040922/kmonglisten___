import { NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GCP_KEY_FILE,
});

const bucket = storage.bucket(process.env.GCS_BUCKET_NAME || '');

export async function POST() {
  try {
    console.log('기존 파일들을 공개로 설정 중...');
    
    // 버킷의 모든 파일 가져오기
    const [files] = await bucket.getFiles();
    
    const results = [];
    
    for (const file of files) {
      try {
        // 파일을 공개로 설정
        await file.makePublic();
        results.push({
          filename: file.name,
          status: 'success',
          publicUrl: `https://storage.googleapis.com/${bucket.name}/${file.name}`
        });
        console.log(`✅ ${file.name} 공개 설정 완료`);
      } catch (error) {
        results.push({
          filename: file.name,
          status: 'error',
          error: (error as Error).message
        });
        console.error(`❌ ${file.name} 공개 설정 실패:`, error);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `${files.length}개 파일 처리 완료`,
      results
    });
    
  } catch (error) {
    console.error('파일 공개 설정 오류:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}
