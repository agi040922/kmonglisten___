# Vercel 배포 가이드

## 환경변수 설정

Vercel Dashboard → Project Settings → Environment Variables에서 다음 환경변수들을 설정하세요:

### 1. 일반 환경변수
```
GCP_PROJECT_ID=kmonglisten
GCS_BUCKET_NAME=kmonglisten-voice-files
DB_HOST=34.64.135.113
DB_PORT=5432
DB_NAME=voice_messages_db
DB_USER=app_user
DB_PASSWORD=1)df24-A]C7$)T--
NODE_ENV=production
```

### 2. GCP 서비스 계정 키 설정

**중요**: `GCP_KEY_FILE` 경로 대신 JSON 내용 자체를 환경변수로 설정해야 합니다.

1. 로컬의 `kmonglisten-886e8fa5016f.json` 파일을 열기
2. 전체 JSON 내용을 복사
3. Vercel에서 `GCP_SERVICE_ACCOUNT_KEY` 환경변수로 설정

예시:
```
GCP_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"kmonglisten",...}
```

### 3. 환경별 설정

- **Development**: 로컬 개발 시 `GCP_KEY_FILE` 사용
- **Production**: Vercel 배포 시 `GCP_SERVICE_ACCOUNT_KEY` 사용

코드가 자동으로 환경을 감지하여 적절한 인증 방법을 선택합니다.

## 배포 단계

1. **Git 푸시**: 코드를 GitHub에 푸시
2. **Vercel 연결**: GitHub 리포지토리를 Vercel에 연결
3. **환경변수 설정**: 위의 환경변수들을 모두 설정
4. **배포 실행**: Vercel이 자동으로 빌드 및 배포

## 주의사항

- GCP 서비스 계정 키는 절대 코드에 하드코딩하지 마세요
- 환경변수에 설정할 때 JSON 형식이 올바른지 확인하세요
- PostgreSQL 데이터베이스가 외부 접근을 허용하는지 확인하세요

## 테스트

배포 후 다음 엔드포인트들을 테스트해보세요:

- `/` - 메인 페이지
- `/admin` - 관리자 페이지
- `/api/debug/db` - 데이터베이스 연결 테스트
