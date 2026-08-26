# choice_app (상담/고해 현황판)

Render에 배포된 간단한 Node 앱입니다.  
상태·메모·카운트는 서버 메모리에 저장되며, 재시작 시 초기화될 수 있습니다.

- **GitHub:** https://github.com/wonjunSung/choice_app
- **라이브 URL:** https://choice-app.onrender.com
- **로컬 폴더(현재 PC):** `C:\Users\golfpang\rental-status`

## 다른 PC에서 이어서 개발하기

### 1) 준비물
- Git 설치
- Node.js LTS 설치 (https://nodejs.org)
- GitHub 계정 (`wonjunSung`) 로그인 가능해야 함
- (선택) Cursor 설치 — 같은 Cursor 계정이어도 **이전 채팅은 자동 동기화되지 않음**

### 2) 코드 받기

```powershell
git clone https://github.com/wonjunSung/choice_app.git
cd choice_app
npm install
```

### 3) 로컬에서 실행·확인

```powershell
npm start
```

브라우저: http://localhost:3000

### 4) 수정 후 배포(Render 반영)

```powershell
git add .
git commit -m "변경 내용 요약"
git push origin main
```

- push 후 Render가 보통 1~3분 안에 자동 재배포합니다.
- 확인: https://dashboard.render.com → `choice-app` → Events / Logs
- Auto-Deploy: Settings → Build & Deploy → **On Commit** 인지 확인

### 5) 주의사항
- **파일 저장만으로는 배포되지 않음** → 반드시 `commit` + `push`
- Free 플랜은 약 15분 무접속 시 잠들 수 있음 (다시 열면 30~60초 대기 가능)
- 잠금/재시작/재배포 시 **상태·메모·카운트 초기화**될 수 있음
- Cursor 대화 기록은 PC 로컬이라, 다른 PC에서는 이 README를 참고하면 됨

## 앱 구성

| 파일 | 역할 |
|------|------|
| `server.js` | 항목/상태/타이머/카운트/메모 API |
| `public/index.html` | 화면 UI |
| `package.json` | `npm start` → `node server.js` |
| `render.yaml` | Render 배포 참고 설정 |

### 항목 배치
- 1줄: 차수신부님, 선택신부님, 고해1, 고해2
- 2줄: 차수수녀님, 선택수녀님, 큰부부님, 작은부부님

### 동작 요약
- 일반 항목: 상담시작/상담완료, 경과시간, `상담완료 : n명`, 메모
- 고해1·고해2: 고해가능/고해중, 고해시작/고해완료, 메모 (타이머·인원수 없음)
- 메모: 최대 100자, `메모입력` / `메모리셋`

## 로컬 실행 (요약)

```powershell
npm install
npm start
```

## Render 설정 요약
- Runtime: Node
- Build Command: `npm install`
- Start Command: `npm start`
- Branch: `main`
- Plan: Free
