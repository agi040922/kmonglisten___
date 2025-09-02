# 마음의 전화 - 개발 모범 사례 가이드

이 문서는 마음의 전화 프로젝트 개발 시 따라야 할 모범 사례와 코딩 표준을 제시합니다.

## 📋 목차

1. [코드 품질 표준](#코드-품질-표준)
2. [타입스크립트 활용](#타입스크립트-활용)
3. [에러 처리 전략](#에러-처리-전략)
4. [성능 최적화 기법](#성능-최적화-기법)
5. [보안 모범 사례](#보안-모범-사례)
6. [테스트 전략](#테스트-전략)
7. [코드 리뷰 가이드라인](#코드-리뷰-가이드라인)

---

## 💎 코드 품질 표준

### ESLint 및 Prettier 설정

**`.eslintrc.json` 권장 설정**
```json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

**`.prettierrc` 설정**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### 함수 작성 원칙

**순수 함수 우선**
```typescript
// ❌ 부작용이 있는 함수
let globalCounter = 0;
function incrementCounter() {
  globalCounter++;
  return globalCounter;
}

// ✅ 순수 함수
function increment(counter: number): number {
  return counter + 1;
}
```

**단일 책임 원칙**
```typescript
// ❌ 여러 책임을 가진 함수
function processAudioAndSaveToDatabase(audioBlob: Blob) {
  // 오디오 처리
  const processedAudio = processAudio(audioBlob);
  // 데이터베이스 저장
  saveToDatabase(processedAudio);
  // 이메일 발송
  sendNotificationEmail();
}

// ✅ 단일 책임을 가진 함수들
function processAudio(audioBlob: Blob): ProcessedAudio {
  // 오디오 처리 로직만
}

function saveAudioToDatabase(audio: ProcessedAudio): Promise<void> {
  // 데이터베이스 저장 로직만
}

function sendAudioNotification(): Promise<void> {
  // 알림 발송 로직만
}
```

---

## 🔷 타입스크립트 활용

### 강력한 타입 정의

**도메인 모델 타입**
```typescript
// 음성 메시지 상태 열거형
export enum VoiceMessageStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  ERROR = 'error',
}

// 음성 메시지 인터페이스
export interface VoiceMessage {
  readonly id: number;
  readonly filename: string;
  readonly originalFilename: string;
  readonly fileUrl: string;
  readonly transcription: string | null;
  readonly moderatedText: string | null;
  readonly status: VoiceMessageStatus;
  readonly isApproved: boolean;
  readonly confidenceScore?: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// 생성용 타입 (ID와 타임스탬프 제외)
export type CreateVoiceMessage = Omit<
  VoiceMessage,
  'id' | 'createdAt' | 'updatedAt'
>;

// 업데이트용 타입 (선택적 필드)
export type UpdateVoiceMessage = Partial<
  Pick<VoiceMessage, 'moderatedText' | 'isApproved' | 'status'>
>;
```

### 유니온 타입과 타입 가드

**API 응답 타입**
```typescript
// 성공/실패 응답 유니온 타입
export type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

// 타입 가드 함수
export function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is { success: true; data: T } {
  return response.success === true;
}

// 사용 예시
async function handleApiCall<T>(apiCall: () => Promise<ApiResponse<T>>): Promise<T> {
  const response = await apiCall();
  
  if (isSuccessResponse(response)) {
    return response.data; // 타입이 자동으로 추론됨
  } else {
    throw new Error(response.error);
  }
}
```

### 제네릭 활용

**재사용 가능한 훅**
```typescript
// 제네릭 데이터 페칭 훅
export function useApiData<T>(
  url: string,
  options?: RequestInit
): {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: T = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// 사용 예시
const { data: messages, loading, error } = useApiData<VoiceMessage[]>('/api/admin/messages');
```

---

## 🚨 에러 처리 전략

### 계층별 에러 처리

**도메인 에러 클래스**
```typescript
// 기본 도메인 에러
export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  
  constructor(message: string, public readonly context?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
  }
}

// 구체적인 에러 클래스들
export class AudioProcessingError extends DomainError {
  readonly code = 'AUDIO_PROCESSING_ERROR';
  readonly statusCode = 422;
}

export class SpeechRecognitionError extends DomainError {
  readonly code = 'SPEECH_RECOGNITION_ERROR';
  readonly statusCode = 503;
}

export class DatabaseConnectionError extends DomainError {
  readonly code = 'DATABASE_CONNECTION_ERROR';
  readonly statusCode = 503;
}
```

**에러 처리 미들웨어**
```typescript
// API 라우트용 에러 핸들러
export function withErrorHandling<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('API 에러:', error);
      
      if (error instanceof DomainError) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            code: error.code,
            context: error.context,
          },
          { status: error.statusCode }
        );
      }
      
      // 예상치 못한 에러
      return NextResponse.json(
        {
          success: false,
          error: '내부 서버 오류가 발생했습니다.',
          code: 'INTERNAL_SERVER_ERROR',
        },
        { status: 500 }
      );
    }
  };
}

// 사용 예시
export const POST = withErrorHandling(async (request: NextRequest) => {
  // API 로직
  const result = await processAudioUpload(request);
  return NextResponse.json({ success: true, data: result });
});
```

### 클라이언트 에러 처리

**React Error Boundary**
```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<
  PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('React Error Boundary:', error, errorInfo);
    
    // 에러 리포팅 서비스로 전송
    reportError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              오류가 발생했습니다
            </h2>
            <p className="text-gray-600 mb-4">
              페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              페이지 새로고침
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## ⚡ 성능 최적화 기법

### React 최적화

**메모이제이션 활용**
```typescript
// 컴포넌트 메모이제이션
const VoiceMessageCard = memo(({ message }: { message: VoiceMessage }) => {
  return (
    <div className="border rounded-lg p-4">
      <h3>{message.originalFilename}</h3>
      <p>{message.transcription}</p>
    </div>
  );
});

// 콜백 메모이제이션
const AdminPanel = () => {
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  
  const handleDelete = useCallback((id: number) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  }, []);
  
  const handleUpdate = useCallback((id: number, updates: UpdateVoiceMessage) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    ));
  }, []);
  
  return (
    <div>
      {messages.map(message => (
        <VoiceMessageCard
          key={message.id}
          message={message}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
        />
      ))}
    </div>
  );
};
```

### 데이터베이스 최적화

**인덱스 전략**
```sql
-- 복합 인덱스로 쿼리 성능 향상
CREATE INDEX idx_voice_messages_status_created 
ON voice_messages(status, created_at DESC);

-- 부분 인덱스로 스토리지 절약
CREATE INDEX idx_voice_messages_approved 
ON voice_messages(created_at DESC) 
WHERE is_approved = true;

-- 함수 기반 인덱스
CREATE INDEX idx_voice_messages_filename_lower 
ON voice_messages(LOWER(original_filename));
```

**쿼리 최적화**
```typescript
// 페이지네이션 최적화 (OFFSET 대신 커서 사용)
export async function getMessagesCursor(
  cursor?: number,
  limit: number = 10,
  status?: VoiceMessageStatus
): Promise<{ messages: VoiceMessage[]; nextCursor?: number }> {
  let query = `
    SELECT * FROM voice_messages
    WHERE ($1::int IS NULL OR id < $1)
    ${status ? 'AND status = $3' : ''}
    ORDER BY id DESC
    LIMIT $2
  `;
  
  const params = [cursor, limit + 1]; // +1로 다음 페이지 존재 여부 확인
  if (status) params.push(status);
  
  const result = await pool.query(query, params);
  const messages = result.rows.slice(0, limit);
  const hasNext = result.rows.length > limit;
  
  return {
    messages,
    nextCursor: hasNext ? messages[messages.length - 1].id : undefined,
  };
}
```

---

## 🔒 보안 모범 사례

### 입력 검증

**Zod를 활용한 스키마 검증**
```typescript
import { z } from 'zod';

// 업로드 요청 스키마
const uploadAudioSchema = z.object({
  audio: z.instanceof(File)
    .refine(file => file.size <= 10 * 1024 * 1024, '파일 크기는 10MB 이하여야 합니다.')
    .refine(file => file.type.startsWith('audio/'), '오디오 파일만 업로드 가능합니다.')
    .refine(file => ['audio/wav', 'audio/mp3', 'audio/webm'].includes(file.type), 
            '지원되는 형식: WAV, MP3, WebM'),
});

// 메시지 업데이트 스키마
const updateMessageSchema = z.object({
  moderatedText: z.string()
    .min(1, '내용을 입력해주세요.')
    .max(1000, '내용은 1000자 이하여야 합니다.')
    .refine(text => !containsMaliciousContent(text), '부적절한 내용이 포함되어 있습니다.'),
  isApproved: z.boolean(),
});

// 검증 함수
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => err.message).join(', ');
      throw new ValidationError(`입력 검증 실패: ${messages}`);
    }
    throw error;
  }
}
```

### 인증 및 권한 관리

**JWT 기반 인증**
```typescript
import jwt from 'jsonwebtoken';

interface AuthPayload {
  userId: string;
  role: 'admin' | 'user';
  exp: number;
}

export class AuthService {
  private static readonly SECRET = process.env.JWT_SECRET!;
  private static readonly EXPIRES_IN = '24h';
  
  static generateToken(userId: string, role: 'admin' | 'user'): string {
    return jwt.sign({ userId, role }, this.SECRET, { expiresIn: this.EXPIRES_IN });
  }
  
  static verifyToken(token: string): AuthPayload {
    try {
      return jwt.verify(token, this.SECRET) as AuthPayload;
    } catch (error) {
      throw new AuthenticationError('유효하지 않은 토큰입니다.');
    }
  }
  
  static requireAdmin(token: string): AuthPayload {
    const payload = this.verifyToken(token);
    if (payload.role !== 'admin') {
      throw new AuthorizationError('관리자 권한이 필요합니다.');
    }
    return payload;
  }
}

// 미들웨어 사용
export function requireAuth(handler: (req: NextRequest, auth: AuthPayload) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: '인증 토큰이 필요합니다.' }, { status: 401 });
    }
    
    try {
      const auth = AuthService.verifyToken(token);
      return await handler(req, auth);
    } catch (error) {
      return NextResponse.json({ error: '인증에 실패했습니다.' }, { status: 401 });
    }
  };
}
```

---

## 🧪 테스트 전략

### 단위 테스트

**Jest + Testing Library 설정**
```typescript
// __tests__/lib/gcp.test.ts
import { moderateContent } from '@/lib/gcp';

describe('moderateContent', () => {
  it('정상적인 텍스트는 승인되어야 한다', () => {
    const result = moderateContent('안녕하세요. 좋은 하루 되세요.');
    
    expect(result.isApproved).toBe(true);
    expect(result.moderatedText).toBe('안녕하세요. 좋은 하루 되세요.');
  });
  
  it('금지어가 포함된 텍스트는 마스킹되어야 한다', () => {
    const result = moderateContent('이것은 욕설1이 포함된 텍스트입니다.');
    
    expect(result.isApproved).toBe(false);
    expect(result.moderatedText).toBe('이것은 ***이 포함된 텍스트입니다.');
  });
  
  it('500자를 초과하는 텍스트는 잘려야 한다', () => {
    const longText = 'a'.repeat(600);
    const result = moderateContent(longText);
    
    expect(result.moderatedText).toHaveLength(503); // 500 + '...'
    expect(result.moderatedText.endsWith('...')).toBe(true);
  });
});
```

### 통합 테스트

**API 라우트 테스트**
```typescript
// __tests__/api/upload-audio.test.ts
import { POST } from '@/app/api/upload-audio/route';
import { NextRequest } from 'next/server';

// Mock 설정
jest.mock('@/lib/gcp', () => ({
  uploadToGCS: jest.fn().mockResolvedValue('https://storage.googleapis.com/test/file.wav'),
}));

jest.mock('@/lib/db', () => ({
  default: {
    connect: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue({ rows: [{ id: 1 }] }),
      release: jest.fn(),
    }),
  },
}));

describe('/api/upload-audio', () => {
  it('유효한 오디오 파일 업로드가 성공해야 한다', async () => {
    const formData = new FormData();
    const audioBlob = new Blob(['audio data'], { type: 'audio/wav' });
    formData.append('audio', audioBlob, 'test.wav');
    
    const request = new NextRequest('http://localhost:3000/api/upload-audio', {
      method: 'POST',
      body: formData,
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.messageId).toBeDefined();
  });
  
  it('오디오 파일이 없으면 400 에러를 반환해야 한다', async () => {
    const formData = new FormData();
    const request = new NextRequest('http://localhost:3000/api/upload-audio', {
      method: 'POST',
      body: formData,
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toBe('음성 파일이 없습니다.');
  });
});
```

### E2E 테스트

**Playwright 설정**
```typescript
// e2e/voice-recording.spec.ts
import { test, expect } from '@playwright/test';

test.describe('음성 녹음 기능', () => {
  test('사용자가 음성을 녹음하고 업로드할 수 있다', async ({ page }) => {
    await page.goto('/');
    
    // 녹음 시작
    await page.click('[data-testid="start-recording"]');
    await expect(page.locator('[data-testid="recording-status"]')).toContainText('녹음 중');
    
    // 잠시 대기 (실제 녹음 시뮬레이션)
    await page.waitForTimeout(2000);
    
    // 녹음 정지
    await page.click('[data-testid="stop-recording"]');
    await expect(page.locator('[data-testid="audio-player"]')).toBeVisible();
    
    // 업로드
    await page.click('[data-testid="upload-audio"]');
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();
  });
  
  test('관리자가 업로드된 메시지를 확인할 수 있다', async ({ page }) => {
    await page.goto('/admin');
    
    // 메시지 목록 확인
    await expect(page.locator('[data-testid="message-list"]')).toBeVisible();
    
    // 첫 번째 메시지 편집
    await page.click('[data-testid="edit-message"]:first-child');
    await page.fill('[data-testid="moderated-text"]', '수정된 텍스트');
    await page.click('[data-testid="save-changes"]');
    
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });
});
```

---

## 📝 코드 리뷰 가이드라인

### 체크리스트

**기능성**
- [ ] 요구사항을 정확히 구현했는가?
- [ ] 엣지 케이스를 고려했는가?
- [ ] 에러 처리가 적절한가?

**코드 품질**
- [ ] 함수와 변수명이 명확한가?
- [ ] 코드가 읽기 쉽고 이해하기 쉬운가?
- [ ] 중복 코드가 없는가?
- [ ] 단일 책임 원칙을 따르는가?

**성능**
- [ ] 불필요한 리렌더링이 없는가?
- [ ] 메모리 누수 가능성은 없는가?
- [ ] 데이터베이스 쿼리가 최적화되어 있는가?

**보안**
- [ ] 입력 검증이 적절한가?
- [ ] 민감한 정보가 노출되지 않는가?
- [ ] 인증/권한 검사가 올바른가?

**테스트**
- [ ] 단위 테스트가 작성되어 있는가?
- [ ] 테스트 커버리지가 충분한가?
- [ ] 통합 테스트가 필요한가?

### 리뷰 코멘트 예시

**건설적인 피드백**
```
// ❌ 좋지 않은 코멘트
"이 코드는 잘못되었습니다."

// ✅ 건설적인 코멘트
"이 함수가 너무 많은 책임을 가지고 있는 것 같습니다. 
오디오 처리와 데이터베이스 저장을 분리하는 것은 어떨까요?
예: processAudio()와 saveToDatabase()로 분리"
```

**코드 개선 제안**
```
// ❌ 단순한 지적
"성능이 안 좋을 것 같습니다."

// ✅ 구체적인 개선 제안
"현재 모든 메시지를 한 번에 로드하고 있는데, 
페이지네이션을 적용하면 초기 로딩 성능을 개선할 수 있을 것 같습니다.
React.lazy()와 Intersection Observer를 활용한 무한 스크롤은 어떨까요?"
```

---

## 🎯 결론

이러한 모범 사례들을 따르면:

1. **유지보수성**: 코드를 쉽게 이해하고 수정할 수 있습니다
2. **확장성**: 새로운 기능을 안전하게 추가할 수 있습니다  
3. **안정성**: 버그를 사전에 방지하고 빠르게 발견할 수 있습니다
4. **성능**: 사용자 경험을 향상시킬 수 있습니다
5. **보안**: 데이터와 시스템을 안전하게 보호할 수 있습니다

지속적인 코드 리뷰와 리팩토링을 통해 코드 품질을 계속해서 개선해 나가시기 바랍니다.
