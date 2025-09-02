# 마음의 전화 - GCP 설정 가이드

이 가이드는 마음의 전화 서비스를 위한 Google Cloud Platform (GCP) 설정 방법을 단계별로 설명합니다.

## 📋 필요한 GCP 서비스

1. **Google Cloud Storage** - 음성 파일 저장
2. **Google Cloud SQL (PostgreSQL)** - 메타데이터 및 텍스트 저장
3. **Google Cloud Speech-to-Text** - 음성을 텍스트로 변환

## 🚀 1단계: GCP 프로젝트 생성

### 1.1 Google Cloud Console 접속
1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. Google 계정으로 로그인

### 1.2 새 프로젝트 생성
1. 상단의 프로젝트 선택 드롭다운 클릭
2. "새 프로젝트" 클릭
3. 프로젝트 이름 입력: `kmonglisten-voice-service`
4. "만들기" 클릭

### 1.3 결제 계정 연결
1. 좌측 메뉴에서 "결제" 선택
2. 결제 계정 연결 (무료 크레딧 사용 가능)

## 🗄️ 2단계: Google Cloud Storage 설정

### 2.1 Storage API 활성화
1. 좌측 메뉴에서 "API 및 서비스" > "라이브러리" 선택
2. "Cloud Storage API" 검색 후 선택
3. "사용 설정" 클릭

### 2.2 Storage 버킷 생성
1. 좌측 메뉴에서 "Cloud Storage" > "버킷" 선택
2. "버킷 만들기" 클릭
3. 버킷 설정:
   - **이름**: `kmonglisten-voice-files` (전역적으로 고유해야 함)
   - **위치 유형**: Region
   - **위치**: asia-northeast3 (서울)
   - **스토리지 클래스**: Standard
   - **액세스 제어**: 균등한 액세스 제어
4. "만들기" 클릭

### 2.3 버킷 권한 설정
1. 생성된 버킷 선택
2. "권한" 탭 클릭
3. "주 구성원 추가" 클릭
4. 서비스 계정 이메일 입력 (3단계에서 생성)
5. 역할: "Storage Object Admin" 선택

## 🗃️ 3단계: Google Cloud SQL (PostgreSQL) 설정

### 3.1 SQL API 활성화
1. "API 및 서비스" > "라이브러리"에서 "Cloud SQL Admin API" 검색
2. "사용 설정" 클릭

### 3.2 PostgreSQL 인스턴스 생성

> **💰 비용 절약 팁**: 2024년부터 Google Cloud SQL의 요금제가 변경되어 Enterprise 이상만 제공됩니다. 개발용으로는 최소 사양을 선택하세요.

1. 좌측 메뉴에서 "SQL" 선택
2. "인스턴스 만들기" 클릭
3. "PostgreSQL" 선택
4. **Cloud SQL 버전 선택**: "Enterprise" 선택 (현재 유일한 옵션)
5. 인스턴스 설정:
   - **인스턴스 ID**: `kmonglisten-db`
   - **비밀번호**: 강력한 비밀번호 설정 (기록해두세요!)A5^Y=J\.Z&:X,$l9
   - **리전**: asia-northeast3 (서울)
   - **영역**: 단일 영역
   - **머신 유형**: **db-f1-micro** (가장 저렴한 옵션)
   - **스토리지**: **10GB SSD** (최소 용량)
   
6. **고급 설정** (비용 절약을 위해):
   - **자동 백업**: 비활성화 (개발용)
   - **고가용성**: 비활성화
   - **삭제 방지**: 비활성화
   - **유지보수 기간**: 기본값 사용

7. "인스턴스 만들기" 클릭 (5-10분 소요)

> **⚠️ 중요**: 개발 완료 후 인스턴스를 삭제하면 비용이 발생하지 않습니다. 사용하지 않을 때는 인스턴스를 중지하세요.

### 3.3 데이터베이스 생성
1. 생성된 인스턴스 클릭
2. "데이터베이스" 탭 선택
3. "데이터베이스 만들기" 클릭
4. 데이터베이스 이름: `voice_messages_db`
5. "만들기" 클릭

### 3.4 사용자 생성
1. "사용자" 탭 선택
2. "사용자 계정 추가" 클릭
3. 사용자 이름: `app_user`
4. 비밀번호 설정 O$0);[l;g&R6n2+K
5. "추가" 클릭

### 3.5 네트워크 설정
1. "연결" 탭 선택
2. "네트워킹" 섹션에서 "공개 IP" 활성화
3. "승인된 네트워크" 추가:
   - 개발 환경: `0.0.0.0/0` (보안상 권장하지 않음, 개발용만)
   - 프로덕션: 특정 IP 대역 설정

## 🎤 4단계: Speech-to-Text API 설정

### 4.1 Speech-to-Text API 활성화
1. "API 및 서비스" > "라이브러리"에서 "Cloud Speech-to-Text API" 검색
2. "사용 설정" 클릭

## 🔑 5단계: 서비스 계정 생성 및 키 파일 다운로드

### 5.1 서비스 계정 생성
1. "IAM 및 관리자" > "서비스 계정" 선택
2. "서비스 계정 만들기" 클릭
3. 서비스 계정 세부정보:
   - **이름**: `kmonglisten-service-account`
   - **설명**: `마음의 전화 서비스 계정`
4. "만들기 및 계속하기" 클릭

### 5.2 역할 부여
다음 역할들을 추가:
- `Cloud SQL Client`
- `Storage Object Admin`
- `Speech Client`

### 5.3 키 파일 생성
1. 생성된 서비스 계정 클릭
2. "키" 탭 선택
3. "키 추가" > "새 키 만들기" 클릭
4. 키 유형: JSON 선택
5. "만들기" 클릭
6. JSON 파일 다운로드 및 안전한 위치에 저장

## ⚙️ 6단계: 환경 변수 설정

프로젝트 루트에 `.env.local` 파일 생성:

```bash
# GCP 설정
GCP_PROJECT_ID=your-project-id
GCP_KEY_FILE=C:\Users\jkh04\Downloads\kmonglisten\my-app\kmonglisten-886e8fa5016f.json
GCS_BUCKET_NAME=kmonglisten-voice-files

# PostgreSQL 설정
DB_HOST=your-cloud-sql-public-ip
DB_PORT=5432
DB_NAME=voice_messages_db
DB_USER=app_user
DB_PASSWORD=O$0);[l;g&R6n2+K

# 환경 설정
NODE_ENV=development
```

### 환경 변수 값 확인 방법:

1. **GCP_PROJECT_ID**: GCP Console 상단에서 확인
2. **GCP_KEY_FILE**: 다운로드한 JSON 키 파일의 절대 경로
3. **GCS_BUCKET_NAME**: 생성한 버킷 이름
4. **DB_HOST**: Cloud SQL 인스턴스의 "연결" 탭에서 "공개 IP 주소" 확인
5. **DB_PASSWORD**: 설정한 데이터베이스 비밀번호

## 🔧 7단계: 로컬 개발 환경 설정

### 7.1 패키지 설치
```bash
cd my-app
npm install
```

### 7.2 데이터베이스 초기화
애플리케이션 첫 실행 시 자동으로 테이블이 생성됩니다.

### 7.3 개발 서버 실행
```bash
npm run dev
```

## 🚀 8단계: 배포 준비

### 8.1 프로덕션 환경 변수
Vercel, Netlify 등 배포 플랫폼에서 환경 변수 설정:

```bash
GCP_PROJECT_ID=your-project-id
GCP_KEY_FILE_CONTENT={"type":"service_account",...} # JSON 키 파일 내용 전체
GCS_BUCKET_NAME=kmonglisten-voice-files
DB_HOST=your-cloud-sql-public-ip
DB_PORT=5432
DB_NAME=voice_messages_db
DB_USER=app_user
DB_PASSWORD=your-database-password
NODE_ENV=production
```

### 8.2 보안 설정
1. **Cloud SQL 네트워크 제한**: 승인된 네트워크에 배포 서버 IP만 추가
2. **서비스 계정 권한 최소화**: 필요한 권한만 부여
3. **환경 변수 보안**: 키 파일을 환경 변수로 설정

## 📊 9단계: 모니터링 설정

### 9.1 Cloud Logging 활성화
1. "로깅" > "로그 탐색기" 접속
2. 애플리케이션 로그 확인

### 9.2 Cloud Monitoring 설정
1. "모니터링" 접속
2. 대시보드 생성하여 리소스 사용량 모니터링

## 💰 비용 관리 및 최적화

### 예상 비용 (월 기준) - 2024년 실제 요금
- **Cloud Storage**: 1GB 저장 시 약 $0.02
- **Cloud SQL Enterprise**: db-f1-micro 인스턴스 약 $14-15 (24시간 가동 시)
- **Speech-to-Text**: 60분 처리 시 약 $1
- **총 예상 비용**: 월 $15-20 (개발/테스트 환경)

> **💡 실제 비용**: 시간당 $0.02로 하루 8시간만 사용 시 월 $4.8로 매우 저렴합니다!

### 💡 추가 비용 절약 방법

1. **개발용 대안 고려**:
   ```bash
   # 로컬 PostgreSQL 사용 (무료)
   docker run --name postgres-local -e POSTGRES_PASSWORD=mypassword -d -p 5432:5432 postgres:15
   ```

2. **Cloud SQL 사용 시간 최적화**:
   - 개발하지 않을 때는 인스턴스 중지
   - 주말/야간에는 자동 중지 스케줄 설정

3. **무료 크레딧 활용**:
   - Google Cloud 신규 가입 시 $300 크레딧 제공
   - 약 7-12개월 무료 사용 가능

4. **Supabase 대안** (PostgreSQL 호스팅):
   - 무료 플랜: 500MB DB, 2GB 대역폭
   - 유료 플랜: $25/월 (8GB DB)
   - 더 저렴한 PostgreSQL 호스팅 옵션

## ⚠️ 주의사항

1. **보안**: 서비스 계정 키 파일을 절대 Git에 커밋하지 마세요
2. **비용**: Speech-to-Text API는 사용량에 따라 과금됩니다
3. **백업**: 중요한 데이터는 정기적으로 백업하세요
4. **업데이트**: GCP 서비스 업데이트를 정기적으로 확인하세요

## 🔍 문제 해결

### 연결 오류
- 방화벽 설정 확인
- 서비스 계정 권한 확인
- 네트워크 설정 검토

### 음성 인식 오류
- 오디오 파일 형식 확인
- API 할당량 확인
- 언어 코드 설정 확인

### 데이터베이스 연결 오류
- IP 주소 확인
- 사용자 권한 확인
- SSL 설정 확인

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. [GCP 문서](https://cloud.google.com/docs)
2. [Cloud SQL 문제 해결](https://cloud.google.com/sql/docs/troubleshooting)
3. [Speech-to-Text 문제 해결](https://cloud.google.com/speech-to-text/docs/troubleshooting)

---

이 가이드를 따라 설정하면 마음의 전화 서비스를 위한 GCP 환경이 완성됩니다. 추가 질문이 있으시면 언제든 문의하세요!
