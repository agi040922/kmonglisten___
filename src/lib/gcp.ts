import { Storage } from '@google-cloud/storage';
import { SpeechClient } from '@google-cloud/speech';

// Google Cloud Storage 설정
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: process.env.GCP_SERVICE_ACCOUNT_KEY 
    ? JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY)
    : undefined,
  keyFilename: process.env.GCP_KEY_FILE, // 로컬 개발용
});

const bucket = storage.bucket(process.env.GCS_BUCKET_NAME || '');

// Google Cloud Speech-to-Text 설정
const speechClient = new SpeechClient({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: process.env.GCP_SERVICE_ACCOUNT_KEY 
    ? JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY)
    : undefined,
  keyFilename: process.env.GCP_KEY_FILE, // 로컬 개발용
});

// 파일을 GCS에 업로드
export const uploadToGCS = async (
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string> => {
  const file = bucket.file(filename);
  
  await file.save(buffer, {
    metadata: {
      contentType,
    },
  });

  // 서명된 URL 생성 (24시간 유효)
  const [signedUrl] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 24 * 60 * 60 * 1000, // 24시간
  });

  return signedUrl;
};

// 음성을 텍스트로 변환
export const transcribeAudio = async (gcsUri: string): Promise<string> => {
  const request = {
    audio: {
      uri: gcsUri,
    },
    config: {
      // 브라우저 MediaRecorder에서 생성되는 오디오 형식에 맞춤
      encoding: 'WEBM_OPUS' as const,
      sampleRateHertz: 48000,
      
      // 한국어 우선, 영어 대체 언어로 설정
      languageCode: 'ko-KR',
      alternativeLanguageCodes: ['en-US'],
      
      // 음성 인식 품질 향상 옵션
      enableAutomaticPunctuation: true,    // 자동 구두점 삽입
      enableWordTimeOffsets: false,        // 단어별 타임스탬프 (불필요)
      enableWordConfidence: true,          // 단어별 신뢰도 점수
      enableSpeakerDiarization: false,     // 화자 분리 (단일 화자)
      
      // 최신 모델 사용으로 정확도 향상
      model: 'latest_long',
      useEnhanced: true,
    },
  };

  try {
    // 긴 오디오 파일을 위한 비동기 처리
    const [operation] = await speechClient.longRunningRecognize(request);
    const [response] = await operation.promise();
    
    if (response.results && response.results.length > 0) {
      // 신뢰도 기반 필터링으로 품질 향상
      const transcription = response.results
        .filter((result) => {
          const confidence = result.alternatives?.[0]?.confidence || 0;
          return confidence > 0.5; // 50% 이상 신뢰도만 포함
        })
        .map((result) => result.alternatives?.[0]?.transcript || '')
        .join(' ')
        .trim();
      
      return transcription;
    }
    
    return '';
  } catch (error: unknown) {
    console.error('음성 인식 오류:', error);
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 5) {
      throw new Error(`파일을 찾을 수 없습니다: ${gcsUri}`);
    }
    
    throw new Error('음성을 텍스트로 변환하는 중 오류가 발생했습니다.');
  }
};

// 간단한 내용 검열 함수 (실제로는 더 정교한 검열 시스템 필요)
export const moderateContent = (text: string): { isApproved: boolean; moderatedText: string } => {
  // 금지어 목록 (실제 운영시에는 더 포괄적인 목록 필요)
  const bannedWords = ['욕설1', '욕설2', '부적절한단어'];
  
  let moderatedText = text;
  let isApproved = true;
  
  // 금지어 검사 및 마스킹
  bannedWords.forEach(word => {
    if (text.includes(word)) {
      isApproved = false;
      moderatedText = moderatedText.replace(new RegExp(word, 'gi'), '*'.repeat(word.length));
    }
  });
  
  // 텍스트 길이 제한 (예: 500자)
  if (moderatedText.length > 500) {
    moderatedText = moderatedText.substring(0, 500) + '...';
  }
  
  return { isApproved, moderatedText };
};
