# 마음의 전화 (Heart Phone) 🎙️

Be:liveU 이음 캠페인을 위한 음성 메시지 수집 및 관리 시스템입니다.

## 📋 프로젝트 개요

마음의 전화는 사용자들이 음성 메시지를 녹음하여 전송하면, 자동으로 텍스트로 변환하고 내용을 검열한 후 무대 위 미디어월에 표시하는 시스템입니다.

## ✨ 주요 기능

### 사용자 기능
- 🎙️ **음성 녹음**: Web Audio API를 활용한 실시간 음성 녹음
- 📤 **파일 업로드**: 녹음된 음성 파일을 GCP Storage에 자동 업로드
- 🔄 **실시간 피드백**: 녹음 상태 및 업로드 진행 상황 표시

### 관리자 기능
- 📊 **메시지 관리**: 모든 음성 메시지 조회 및 관리
- ✏️ **텍스트 편집**: 변환된 텍스트 수정 및 승인
- 🔍 **상태별 필터링**: 처리 상태에 따른 메시지 분류
- 🗑️ **메시지 삭제**: 부적절한 메시지 삭제

### 자동화 기능
- 🎯 **음성-텍스트 변환**: Google Cloud Speech-to-Text API 활용
- 🛡️ **내용 검열**: 부적절한 내용 자동 필터링
- 📱 **반응형 UI**: 모바일 및 데스크톱 최적화

## 🛠️ 기술 스택

### Frontend
- **Next.js 15** - React 프레임워크
- **TypeScript** - 타입 안전성
- **Tailwind CSS** - 스타일링
- **Web Audio API** - 음성 녹음

### Backend
- **Next.js API Routes** - 서버리스 API
- **Google Cloud Storage** - 파일 저장
- **Google Cloud Speech-to-Text** - 음성 인식
- **PostgreSQL** - 데이터베이스

### Infrastructure
- **Google Cloud Platform** - 클라우드 인프라
- **Vercel** - 배포 플랫폼 (선택사항)

## 🚀 시작하기

### 1. 프로젝트 클론
```bash
git clone <repository-url>
cd my-app
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
`.env.example` 파일을 `.env.local`로 복사하고 값을 설정:

```bash
cp .env.example .env.local
```

환경 변수 설정 방법은 [GCP 설정 가이드](./docs/GCP-Setup-Guide.md)를 참조하세요.

### 4. 개발 서버 실행
```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 애플리케이션을 확인할 수 있습니다.

## 📁 프로젝트 구조

```
my-app/
├── src/
│   ├── app/
│   │   ├── admin/           # 관리자 페이지
│   │   ├── api/             # API 라우트
│   │   │   ├── upload-audio/
│   │   │   └── admin/
│   │   └── page.tsx         # 메인 페이지
│   └── lib/
│       ├── db.ts            # 데이터베이스 연결
│       └── gcp.ts           # GCP 서비스 연동
├── docs/
│   └── GCP-Setup-Guide.md   # GCP 설정 가이드
├── public/
│   └── 이음캠페인.png        # 배경 이미지
└── README.md
```

## 🔧 운영 방안

### 음성 메시지 처리 흐름
1. **수화기를 들고 녹음 버튼 클릭** → 발신자 녹음
2. **녹음 파일 확인 후 텍스트 추출** (텍스트 추출 시 내용 검열)
3. **검열된 내용은 무대 위 미디어월에 전송**하여 화면 노출

### 관리자 작업
- `/admin` 페이지에서 모든 음성 메시지 관리
- 텍스트 수정 및 승인/거부 처리
- 부적절한 메시지 삭제

## 📖 설정 가이드

자세한 GCP 설정 방법은 [GCP 설정 가이드](./docs/GCP-Setup-Guide.md)를 참조하세요.

### 주요 설정 단계
1. GCP 프로젝트 생성
2. Cloud Storage 버킷 생성
3. Cloud SQL (PostgreSQL) 인스턴스 생성
4. Speech-to-Text API 활성화
5. 서비스 계정 생성 및 키 다운로드
6. 환경 변수 설정

## 🔒 보안 고려사항

- 서비스 계정 키 파일을 절대 Git에 커밋하지 마세요
- 프로덕션 환경에서는 네트워크 접근을 제한하세요
- 정기적으로 액세스 권한을 검토하세요

## 💰 비용 관리

- Speech-to-Text API는 사용량에 따라 과금됩니다
- Cloud Storage는 저장 용량과 네트워크 사용량에 따라 과금됩니다
- 예산 알림을 설정하여 비용을 모니터링하세요

## 🐛 문제 해결

### 일반적인 문제
1. **마이크 접근 권한 오류**: 브라우저에서 마이크 권한을 허용했는지 확인
2. **파일 업로드 실패**: GCP 서비스 계정 권한 및 버킷 설정 확인
3. **음성 인식 오류**: 오디오 파일 형식 및 API 할당량 확인

자세한 문제 해결 방법은 [GCP 설정 가이드](./docs/GCP-Setup-Guide.md)의 문제 해결 섹션을 참조하세요.

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 지원

문제가 발생하거나 질문이 있으시면 이슈를 생성해 주세요.

---

**마음의 전화**로 여러분의 마음을 들려주세요 💝
