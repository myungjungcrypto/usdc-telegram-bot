# 🤖 멀티유저 USDC 모니터링 텔레그램 봇

여러 사용자가 동시에 각자의 Arbitrum USDC 잔액을 모니터링하고 텔레그램 알림을 받을 수 있는 봇입니다.

---

## ✨ 주요 기능

- ✅ **멀티유저 지원** - 여러 명이 동시에 사용 가능
- ✅ **개인별 설정** - 각자 다른 주소, 임계값, 알림 간격 설정
- ✅ **실시간 모니터링** - 10초~3600초 간격 설정 가능
- ✅ **유연한 알림** - 1분~24시간 간격, 켜기/끄기 가능
- ✅ **자동 재시작** - 봇 재시작 시 설정 자동 복구
- ✅ **설정 저장** - JSON 파일에 안전하게 저장

---

## 🚀 빠른 시작

### 1️⃣ 텔레그램 봇 만들기

1. 텔레그램에서 [@BotFather](https://t.me/BotFather) 검색
2. `/newbot` 입력
3. 봇 이름과 유저네임 설정
4. **BOT_TOKEN** 복사 (예: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

---

## 📦 로컬 실행 (테스트용)

### 설치

```bash
# 패키지 설치
npm install
```

### 환경변수 설정

**방법 1: 직접 수정 (간단)**

`bot.js` 파일 4번째 줄:
```javascript
const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
```
→ `YOUR_BOT_TOKEN_HERE` 부분에 실제 토큰 입력

**방법 2: 환경변수 (권장)**

```bash
export BOT_TOKEN="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
npm start
```

### 실행

```bash
npm start
```

---

## 🌐 Railway 배포 (24/7 실행)

### 준비물
- GitHub 계정
- Railway 계정 (https://railway.app - 무료)

---

### 📤 1단계: GitHub에 코드 업로드

#### 처음 GitHub 사용하는 경우

1. **GitHub 가입** (https://github.com)
2. **새 저장소 만들기**
   - 오른쪽 상단 `+` → `New repository`
   - Repository name: `usdc-telegram-bot` (원하는 이름)
   - Public 또는 Private 선택
   - `Create repository` 클릭

3. **코드 업로드**
   
   **터미널에서 실행:**
   ```bash
   # 현재 디렉토리에서 (파일들이 있는 곳)
   cd /Users/myunggeunjung/varina_refund_balance_check/telegram-bot
   
   # Git 초기화
   git init
   
   # 파일 추가 (users.json은 .gitignore에 의해 제외됨)
   git add .
   
   # 커밋
   git commit -m "Initial commit"
   
   # GitHub 저장소 연결 (아래 URL을 본인 것으로 변경)
   git remote add origin https://github.com/본인유저네임/usdc-telegram-bot.git
   
   # 업로드
   git branch -M main
   git push -u origin main
   ```

   **GitHub 유저네임/비밀번호 입력 요청 시:**
   - Username: GitHub 유저네임
   - Password: **Personal Access Token** 사용 (비밀번호 X)
     - GitHub → Settings → Developer settings → Personal access tokens → Generate new token
     - `repo` 체크박스 선택 후 생성

---

### ☁️ 2단계: Railway 배포

1. **Railway 가입**
   - https://railway.app 접속
   - GitHub 계정으로 로그인

2. **새 프로젝트 만들기**
   - `New Project` 클릭
   - `Deploy from GitHub repo` 선택
   - 위에서 만든 저장소 선택 (`usdc-telegram-bot`)

3. **환경변수 설정**
   - 프로젝트 클릭 → `Variables` 탭
   - `New Variable` 클릭
   - **BOT_TOKEN** 추가:
     ```
     Variable: BOT_TOKEN
     Value: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz
     ```
   - `Add` 클릭

4. **배포 완료!**
   - 자동으로 배포 시작됨
   - `Deployments` 탭에서 진행 상황 확인
   - `View Logs` 클릭하면 로그 확인 가능
   - "🤖 봇이 준비되었습니다!" 메시지가 보이면 성공!

5. **봇 테스트**
   - 텔레그램에서 봇 검색 (@본인봇유저네임)
   - `/start` 입력
   - `/monitor 0xc477... 1000` 입력해서 테스트

---

### 🔄 코드 업데이트 방법

코드 수정 후 GitHub에 푸시하면 자동으로 Railway에 배포됩니다:

```bash
# 수정 후
git add .
git commit -m "설정 변경"
git push
```

Railway가 자동으로 감지하고 재배포합니다!

---

## 🎮 사용 방법

### 기본 명령어

```
/start - 시작 및 도움말
/monitor [주소] [임계값] - 모니터링 시작
/status - 현재 상태 확인
/settings - 설정 보기
/stop - 모니터링 중지
```

### 예시

**1. 모니터링 시작**
```
/monitor 0xc47756133753280c37b227c24782984e021c4544 1000
```
→ 해당 주소의 USDC가 1000 이상이면 알림

**2. 설정 변경**
```
/threshold 500          - 임계값 500으로 변경
/checkinterval 30       - 30초마다 체크
/alertinterval 10       - 10분마다 알림
/alertoff               - 알림 끄기 (모니터링만)
```

**3. 상태 확인**
```
/status                 - 현재 잔액 및 설정 확인
```

---

## 📊 데이터 저장 방식

### users.json 구조

```json
{
  "123456789": {
    "address": "0xc47756133753280c37b227c24782984e021c4544",
    "threshold": 1000,
    "checkInterval": 10,
    "alertInterval": 5,
    "alertEnabled": true,
    "isActive": true,
    "lastUpdated": 1704067200000
  },
  "987654321": {
    "address": "0xabcd...",
    "threshold": 500,
    "checkInterval": 30,
    "alertInterval": 10,
    "alertEnabled": false,
    "isActive": true,
    "lastUpdated": 1704067300000
  }
}
```

### 설정 병합(Merge) 방식

```javascript
// 초기 설정
{ "threshold": 1000, "alertInterval": 5 }

// /threshold 2000 실행
{ "threshold": 2000, "alertInterval": 5 }  // alertInterval 유지!

// /alertinterval 10 실행
{ "threshold": 2000, "alertInterval": 10 }  // 둘 다 유지!
```

---

## 🛠️ 트러블슈팅

### Railway 로그 확인

```
Railway 프로젝트 → Deployments → 최신 배포 → View Logs
```

### 흔한 에러

**1. "❌ 에러: BOT_TOKEN 환경변수를 설정해주세요"**
- Railway Variables에 BOT_TOKEN 추가했는지 확인
- 철자 확인: `BOT_TOKEN` (대문자)

**2. "Polling error"**
- 봇 토큰이 올바른지 확인
- 다른 곳에서 같은 봇을 실행 중인지 확인 (로컬 + Railway 동시 실행 불가)

**3. 알림이 안 와요**
- 봇에게 `/start` 먼저 보냈는지 확인
- `/status`로 현재 잔액 확인
- `/settings`로 alertEnabled가 true인지 확인

**4. "RPC error"**
- `monitor.js` 4번째 줄의 RPC URL 변경:
  ```javascript
  const ARBITRUM_RPC = 'https://arbitrum-one.publicnode.com';
  ```

---

## 📈 무료 사용 한도

### Railway 무료 플랜
- 월 $5 크레딧 무료
- 실행 시간: 500시간/월
- 메모리: 512MB
- 이 봇은 **매우 가볍기 때문에 무료로 충분합니다!**
- 예상 사용량: 약 $1-2/월

### 크레딧이 부족하면?
1. 다른 Railway 계정 만들기
2. Render.com 사용 (750시간/월 무료)
3. Fly.io 사용 (3개 VM 무료)

---

## 🔒 보안 주의사항

### ⚠️ 절대 GitHub에 올리면 안 되는 것
- ❌ BOT_TOKEN (환경변수로만)
- ❌ users.json (`.gitignore`에 포함됨)

### ✅ 안전한 방법
- ✅ Railway Variables에 BOT_TOKEN 저장
- ✅ users.json은 Railway 서버에만 저장됨
- ✅ `.gitignore`로 민감한 파일 제외

---

## 💡 고급 설정

### Bridged USDC (USDC.e) 모니터링

`monitor.js` 5번째 줄:
```javascript
const USDC_ADDRESS = '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8';
```

### RPC 변경 (더 빠른 속도)

무료 RPC:
```javascript
'https://arb1.arbitrum.io/rpc'
'https://arbitrum-one.publicnode.com'
'https://1rpc.io/arb'
```

유료 RPC (추천 - 안정적):
- Infura (https://infura.io)
- Alchemy (https://alchemy.com)

---

## 📞 도움말

문제가 있거나 기능 추가 요청이 있으면 GitHub Issues에 올려주세요!

---

## 📄 라이선스

MIT License
