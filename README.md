# Fabric Master (가방 생산 통합 관리 시스템)

가방 생산 공정의 전 과정을 효율적으로 관리하기 위한 프리미엄 통합 대시보드 시스템입니다.

## 🚀 주요 기능

### 1. 생산 파이프라인 대시보드 (Kanban)
* **11단계 파이프라인**: 견적 안내부터 출고 완료까지 주문의 모든 상태를 한눈에 파악할 수 있는 칸반 보드 제공
* **드래그 앤 드롭**: 주문 카드의 상태를 자유롭게 변경하고 백엔드에 즉시 동기화
* **공장별 필터링**: 다수의 협력 공장별로 주문 현황을 그룹화하여 관리

### 2. 동적 사양 및 원가 계산 엔진
* **자동 소요량 계산**: 원단, 부자재(웨빙, 지퍼 등)의 소요량을 가방 사이즈에 맞춰 실시간 계산
* **정밀 설정**: 시접(Seam Allowance) 및 공정별 손실률(Loss Rate)을 커스텀 설정 가능
* **실시간 원가 분석**: 재료비, 공임비 등을 합산하여 실시간 수익성 분석 및 견적 산출

### 3. Google Workspace 통합 및 자동화
* **Google Drive 연동**: 주문별 디자인 시안(Proof) 폴더 자동 생성 및 실시간 이미지 스트리밍
* **Google Sheets 동기화**: 공장별 발주서 및 생산 일지를 구글 시트와 실시간 연동
* **문서 자동 생성**: PDF 견적서, 납품서 자동 생성 및 시퀀스 기반 파일 관리

### 4. 프리미엄 디자인 및 UX
* **글래스모피즘(Glassmorphism)**: 반투명 블러 효과와 파스텔 톤 포인트 컬러를 적용한 현대적이고 세련된 UI
* **반응형 레이아웃**: 데스크탑과 모바일 환경 모두 최적화된 인터페이스 제공
* **마이크로 인터랙션**: 상태 변경, 호버 효과 등 부드러운 애니메이션 적용

## 🛠 기술 스택

### Frontend
* **Core**: React, Vite
* **Styling**: Vanilla CSS (Premium Glassmorphism Design)
* **Icons**: Lucide React

### Backend
* **Runtime**: Node.js (Express)
* **APIs**: Google Drive API, Google Sheets API
* **Documentation**: PDFKit (견적서/납품서 생성)

## 📦 시작하기

### 환경 변수 설정
`backend` 디렉토리에 `.env` 파일을 생성하고 다음 정보를 입력합니다:
```env
PORT=3001
GOOGLE_SERVICE_ACCOUNT_KEY=...
GOOGLE_DRIVE_FOLDER_ID=...
```

### 설치 및 실행

#### Backend
```bash
cd backend
npm install
npm start
```

#### Frontend
```bash
cd fabric-master-web
npm install
npm run dev
```

## 📝 라이선스
이 프로젝트는 개인 및 내부 관리용으로 제작되었습니다.
