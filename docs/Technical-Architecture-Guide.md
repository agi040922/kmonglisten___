# 마음의 전화 - 기술 아키텍처 및 개념 가이드

이 문서는 마음의 전화 서비스의 기술적 구현과 핵심 개념들을 상세히 설명합니다.

## 📋 목차

1. [시스템 아키텍처 개요](#시스템-아키텍처-개요)
2. [프론트엔드 구조](#프론트엔드-구조)
3. [백엔드 API 설계](#백엔드-api-설계)
4. [GCP 서비스 통합](#gcp-서비스-통합)
5. [데이터베이스 설계](#데이터베이스-설계)
6. [보안 및 인증](#보안-및-인증)
7. [성능 최적화](#성능-최적화)
8. [에러 처리 및 모니터링](#에러-처리-및-모니터링)

---

## 🏗️ 시스템 아키텍처 개요

### 전체 시스템 구조

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   사용자 브라우저   │    │   Next.js 앱     │    │   GCP 서비스     │
│                 │    │                 │    │                 │
│ • 음성 녹음      │◄──►│ • API Routes    │◄──►│ • Cloud Storage │
│ • 실시간 UI     │    │ • 서버 컴포넌트   │    │ • Speech-to-Text│
│ • 반응형 디자인   │    │ • 미들웨어       │    │ • Cloud SQL     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  PostgreSQL DB  │
                    │                 │
                    │ • 메시지 메타데이터│
                    │ • 사용자 세션    │
                    │ • 처리 상태      │
                    └─────────────────┘
```

### 핵심 설계 원칙

1. **서버리스 우선**: Next.js API Routes를 활용한 서버리스 아키텍처
2. **마이크로서비스**: 각 기능별로 독립적인 API 엔드포인트
3. **비동기 처리**: 음성 변환은 백그라운드에서 처리
4. **타입 안전성**: TypeScript를 통한 엔드투엔드 타입 안전성
5. **확장성**: GCP 서비스를 활용한 자동 스케일링

---

## 🎨 프론트엔드 구조

### Next.js App Router 활용

```typescript
// app/layout.tsx - 루트 레이아웃
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
```

### 컴포넌트 구조

```
src/app/
├── page.tsx              # 메인 페이지 (음성 녹음)
├── admin/
│   └── page.tsx          # 관리자 대시보드
├── api/                  # API 라우트
│   ├── upload-audio/
│   └── admin/messages/
└── globals.css           # 전역 스타일
```

### 상태 관리 패턴

**로컬 상태 관리 (useState)**
```typescript
const [isRecording, setIsRecording] = useState(false);
const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
const [isUploading, setIsUploading] = useState(false);
```

**Ref를 활용한 DOM 조작**
```typescript
const mediaRecorderRef = useRef<MediaRecorder | null>(null);
const audioChunksRef = useRef<Blob[]>([]);
```

### Web Audio API 구현

**MediaRecorder API 활용**
```typescript
const startRecording = async () => {
  try {
    // 마이크 권한 요청
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // MediaRecorder 인스턴스 생성
    const mediaRecorder = new MediaRecorder(stream);
    
    // 데이터 수집 이벤트 핸들러
    mediaRecorder.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };
    
    // 녹음 종료 이벤트 핸들러
    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { 
        type: 'audio/wav' 
      });
      setAudioBlob(audioBlob);
      
      // 스트림 정리
      stream.getTracks().forEach(track => track.stop());
    };
    
    mediaRecorder.start();
    setIsRecording(true);
  } catch (error) {
    console.error('녹음 시작 실패:', error);
    // 사용자 친화적 에러 메시지
    alert('마이크 접근 권한이 필요합니다.');
  }
};
```

**브라우저 호환성 고려사항**
- Chrome, Firefox, Safari에서 MediaRecorder API 지원
- iOS Safari에서는 HTTPS 필수
- 일부 브라우저에서 오디오 형식 제한 있음

---

## 🔧 백엔드 API 설계

### Next.js API Routes 구조

**RESTful API 설계**
```
POST /api/upload-audio          # 음성 파일 업로드
GET  /api/admin/messages        # 메시지 목록 조회
GET  /api/admin/messages/[id]   # 특정 메시지 조회
PUT  /api/admin/messages/[id]   # 메시지 수정
DELETE /api/admin/messages/[id] # 메시지 삭제
```

### 타입 안전한 API 구현

**Request/Response 타입 정의**
```typescript
// 요청 타입
interface UploadAudioRequest {
  audio: File;
}

// 응답 타입
interface UploadAudioResponse {
  success: boolean;
  messageId?: number;
  message: string;
}

// API 핸들러 타입 안전성
export async function POST(request: NextRequest): Promise<NextResponse<UploadAudioResponse>> {
  // 구현 로직
}
```

### 에러 처리 패턴

**표준화된 에러 응답**
```typescript
// 에러 응답 타입
interface ErrorResponse {
  error: string;
  code?: string;
  details?: any;
}

// 에러 처리 유틸리티
const handleApiError = (error: unknown, context: string) => {
  console.error(`${context} 오류:`, error);
  
  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
  
  return NextResponse.json(
    { error: '알 수 없는 오류가 발생했습니다.' },
    { status: 500 }
  );
};
```

---

## ☁️ GCP 서비스 통합

### Google Cloud Storage 구현

**파일 업로드 최적화**
```typescript
export const uploadToGCS = async (
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string> => {
  const file = bucket.file(filename);
  
  // 메타데이터와 함께 업로드
  await file.save(buffer, {
    metadata: {
      contentType,
      cacheControl: 'public, max-age=31536000', // 1년 캐시
    },
    // 업로드 옵션
    resumable: false, // 작은 파일의 경우 단순 업로드
    validation: 'crc32c', // 데이터 무결성 검증
  });

  // 공개 URL 생성 (보안상 서명된 URL 권장)
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 1000 * 60 * 60 * 24, // 24시간
  });
  
  return url;
};
```

### Speech-to-Text API 최적화

**음성 인식 설정 최적화**
```typescript
export const transcribeAudio = async (gcsUri: string): Promise<string> => {
  const request = {
    audio: { uri: gcsUri },
    config: {
      // 오디오 인코딩 (브라우저에서 생성되는 형식에 맞춤)
      encoding: 'WEBM_OPUS' as const,
      sampleRateHertz: 48000,
      
      // 언어 설정 (한국어 우선, 영어 대체)
      languageCode: 'ko-KR',
      alternativeLanguageCodes: ['en-US'],
      
      // 음성 인식 향상 옵션
      enableAutomaticPunctuation: true,    // 자동 구두점
      enableWordTimeOffsets: false,        // 단어별 타임스탬프 (불필요)
      enableWordConfidence: true,          // 단어별 신뢰도
      enableSpeakerDiarization: false,     // 화자 분리 (단일 화자)
      
      // 모델 선택 (최신 모델 사용)
      model: 'latest_long',
      useEnhanced: true,                   // 향상된 모델 사용
    },
  };

  try {
    // 긴 오디오 파일을 위한 비동기 처리
    const [operation] = await speechClient.longRunningRecognize(request);
    const [response] = await operation.promise();
    
    if (response.results && response.results.length > 0) {
      // 신뢰도 기반 필터링
      const transcription = response.results
        .filter(result => result.alternatives?.[0]?.confidence > 0.5)
        .map(result => result.alternatives?.[0]?.transcript || '')
        .join(' ')
        .trim();
      
      return transcription;
    }
    
    return '';
  } catch (error) {
    console.error('음성 인식 오류:', error);
    throw new Error('음성을 텍스트로 변환하는 중 오류가 발생했습니다.');
  }
};
```

### 비용 최적화 전략

1. **스토리지 수명 주기 정책**
```json
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {"age": 30}
      }
    ]
  }
}
```

2. **Speech-to-Text 사용량 모니터링**
- 일일 할당량 설정
- 비용 알림 구성
- 캐싱을 통한 중복 요청 방지

---

## 🗄️ 데이터베이스 설계

### PostgreSQL 스키마

**voice_messages 테이블**
```sql
CREATE TABLE voice_messages (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255),
  file_url TEXT NOT NULL,
  transcription TEXT,
  moderated_text TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  is_approved BOOLEAN DEFAULT false,
  confidence_score DECIMAL(3,2), -- 음성 인식 신뢰도
  processing_duration INTEGER,   -- 처리 시간 (초)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 성능 최적화를 위한 인덱스
CREATE INDEX idx_voice_messages_status ON voice_messages(status);
CREATE INDEX idx_voice_messages_created_at ON voice_messages(created_at DESC);
CREATE INDEX idx_voice_messages_approved ON voice_messages(is_approved) WHERE is_approved = true;
```

### 데이터베이스 연결 최적화

**연결 풀링**
```typescript
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  
  // 연결 풀 설정
  max: 20,                    // 최대 연결 수
  idleTimeoutMillis: 30000,   // 유휴 연결 타임아웃
  connectionTimeoutMillis: 2000, // 연결 타임아웃
  
  // SSL 설정 (프로덕션)
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
});

// 연결 상태 모니터링
pool.on('connect', () => {
  console.log('데이터베이스 연결 성공');
});

pool.on('error', (err) => {
  console.error('데이터베이스 연결 오류:', err);
});
```

---

## 🔒 보안 및 인증

### 환경 변수 보안

**민감한 정보 관리**
```typescript
// 환경 변수 검증
const requiredEnvVars = [
  'GCP_PROJECT_ID',
  'GCP_KEY_FILE',
  'GCS_BUCKET_NAME',
  'DB_HOST',
  'DB_PASSWORD'
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`필수 환경 변수가 설정되지 않았습니다: ${envVar}`);
  }
});
```

### API 보안

**Rate Limiting 구현**
```typescript
// 간단한 Rate Limiting (프로덕션에서는 Redis 사용 권장)
const rateLimitMap = new Map();

export const rateLimit = (ip: string, limit: number = 10, windowMs: number = 60000) => {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }
  
  const requests = rateLimitMap.get(ip).filter((time: number) => time > windowStart);
  
  if (requests.length >= limit) {
    return false;
  }
  
  requests.push(now);
  rateLimitMap.set(ip, requests);
  return true;
};
```

### 입력 검증

**데이터 검증 및 새니타이제이션**
```typescript
import { z } from 'zod';

// 스키마 정의
const uploadAudioSchema = z.object({
  audio: z.instanceof(File)
    .refine(file => file.size <= 10 * 1024 * 1024, '파일 크기는 10MB 이하여야 합니다.')
    .refine(file => file.type.startsWith('audio/'), '오디오 파일만 업로드 가능합니다.'),
});

// 검증 함수
export const validateUploadRequest = (data: unknown) => {
  try {
    return uploadAudioSchema.parse(data);
  } catch (error) {
    throw new Error('잘못된 요청 데이터입니다.');
  }
};
```

---

## ⚡ 성능 최적화

### 프론트엔드 최적화

**이미지 최적화**
```typescript
import Image from 'next/image';

// Next.js Image 컴포넌트 활용
<Image
  src="/이음캠페인.png"
  alt="Be:liveU 이음 캠페인 배경"
  fill
  className="object-cover"
  priority // LCP 최적화
  sizes="100vw" // 반응형 이미지
/>
```

**코드 스플리팅**
```typescript
import dynamic from 'next/dynamic';

// 동적 임포트로 번들 크기 최적화
const AdminPanel = dynamic(() => import('./AdminPanel'), {
  loading: () => <div>로딩 중...</div>,
  ssr: false // 클라이언트 사이드에서만 로드
});
```

### 백엔드 최적화

**데이터베이스 쿼리 최적화**
```typescript
// 페이지네이션 최적화
export const getMessages = async (page: number, limit: number, status?: string) => {
  const offset = (page - 1) * limit;
  
  let query = `
    SELECT id, filename, original_filename, file_url, transcription, 
           moderated_text, status, is_approved, created_at, updated_at
    FROM voice_messages
  `;
  
  const params: any[] = [];
  
  if (status) {
    query += ' WHERE status = $1';
    params.push(status);
  }
  
  query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);
  
  // 병렬 쿼리 실행
  const [messagesResult, countResult] = await Promise.all([
    pool.query(query, params),
    pool.query(
      `SELECT COUNT(*) FROM voice_messages${status ? ' WHERE status = $1' : ''}`,
      status ? [status] : []
    )
  ]);
  
  return {
    messages: messagesResult.rows,
    totalCount: parseInt(countResult.rows[0].count)
  };
};
```

---

## 📊 에러 처리 및 모니터링

### 구조화된 로깅

**로그 레벨 관리**
```typescript
enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

class Logger {
  private log(level: LogLevel, message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      meta,
      service: 'kmonglisten-voice-service'
    };
    
    console.log(JSON.stringify(logEntry));
  }
  
  error(message: string, error?: Error) {
    this.log(LogLevel.ERROR, message, { 
      stack: error?.stack,
      name: error?.name 
    });
  }
  
  info(message: string, meta?: any) {
    this.log(LogLevel.INFO, message, meta);
  }
}

export const logger = new Logger();
```

### 헬스체크 엔드포인트

```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    // 데이터베이스 연결 확인
    await pool.query('SELECT 1');
    
    // GCP 서비스 상태 확인
    await storage.bucket(process.env.GCS_BUCKET_NAME!).exists();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'up',
        storage: 'up',
        speechApi: 'up'
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}
```

---

## 🚀 배포 및 운영

### 환경별 설정

**개발/스테이징/프로덕션 환경 분리**
```typescript
// lib/config.ts
export const config = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  database: {
    maxConnections: process.env.NODE_ENV === 'production' ? 20 : 5,
    ssl: process.env.NODE_ENV === 'production'
  },
  
  gcp: {
    projectId: process.env.GCP_PROJECT_ID!,
    bucketName: process.env.GCS_BUCKET_NAME!,
    keyFile: process.env.GCP_KEY_FILE!
  },
  
  features: {
    enableDebugLogs: process.env.NODE_ENV !== 'production',
    enableRateLimit: process.env.NODE_ENV === 'production'
  }
};
```

### 모니터링 및 알림

**GCP Cloud Monitoring 통합**
```typescript
import { Monitoring } from '@google-cloud/monitoring';

const monitoring = new Monitoring.MetricServiceClient();

export const recordMetric = async (metricType: string, value: number) => {
  const request = {
    name: monitoring.projectPath(process.env.GCP_PROJECT_ID!),
    timeSeries: [{
      metric: {
        type: `custom.googleapis.com/${metricType}`,
      },
      resource: {
        type: 'global',
      },
      points: [{
        interval: {
          endTime: {
            seconds: Date.now() / 1000,
          },
        },
        value: {
          doubleValue: value,
        },
      }],
    }],
  };
  
  await monitoring.createTimeSeries(request);
};
```

---

## 📝 결론

이 기술 아키텍처는 다음과 같은 핵심 가치를 제공합니다:

1. **확장성**: GCP 서비스를 활용한 자동 스케일링
2. **신뢰성**: 에러 처리와 모니터링을 통한 안정적인 서비스
3. **보안성**: 다층 보안 체계와 데이터 보호
4. **성능**: 최적화된 데이터베이스 쿼리와 캐싱 전략
5. **유지보수성**: 타입 안전성과 구조화된 코드

이러한 설계를 통해 마음의 전화 서비스는 안정적이고 확장 가능한 플랫폼으로 운영될 수 있습니다.
