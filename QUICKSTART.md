# 🚀 빠른 시작 가이드

## 📦 다운로드한 파일들

```
telegram-bot/
├── bot.js              # 메인 봇 코드
├── monitor.js          # 모니터링 로직
├── database.js         # 데이터 관리
├── package.json        # 의존성 정보
├── users.json          # 사용자 설정 저장 (자동 생성)
├── .gitignore          # Git 제외 파일
├── .env.example        # 환경변수 예시
└── README.md           # 상세 가이드
```

---

## ⚡ 3분 안에 시작하기

### 1️⃣ 봇 만들기 (2분)

1. **텔레그램 앱 열기**
2. **@BotFather** 검색 → 대화 시작
3. 명령어 입력:
   ```
   /newbot
   ```
4. 봇 이름 입력 (예: `My USDC Monitor`)
5. 유저네임 입력 (예: `my_usdc_monitor_bot`) - 반드시 `bot`으로 끝나야 함
6. **토큰 복사** 📋
   ```
   예시: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

### 2️⃣ 로컬 테스트 (1분)

```bash
# 1. 폴더로 이동
cd telegram-bot

# 2. 패키지 설치
npm install

# 3. 봇 토큰 설정 (선택 1: 환경변수)
export BOT_TOKEN="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"

# 또는 (선택 2: 파일 수정)
# bot.js 4번째 줄에 토큰 직접 입력

# 4. 실행!
npm start
```

**성공하면 이렇게 나옵니다:**
```
📄 users.json 파일 생성됨
🤖 텔레그램 봇 시작됨!
📋 저장된 사용자 로드 중...
✅ 0명의 사용자 모니터링 재개됨
🤖 봇이 준비되었습니다!
```

### 3️⃣ 봇 사용하기

텔레그램에서:
```
1. 봇 검색: @my_usdc_monitor_bot
2. /start 입력
3. /monitor 0xc477... 1000 입력
4. 완료! 🎉
```

---

## 🌐 Railway 배포 (24/7 실행)

### 사전 준비

- [ ] GitHub 계정 (https://github.com)
- [ ] Railway 계정 (https://railway.app)
- [ ] Git 설치 확인 (`git --version`)

### Step 1: GitHub에 업로드

```bash
# 1. 폴더로 이동
cd telegram-bot

# 2. Git 초기화
git init

# 3. 파일 추가
git add .

# 4. 커밋
git commit -m "Initial commit"

# 5. GitHub 저장소 만들기
# → GitHub 웹사이트에서 New repository 클릭
# → 이름: usdc-telegram-bot
# → Create repository

# 6. 저장소 연결 (아래 URL을 본인 것으로 변경)
git remote add origin https://github.com/본인유저네임/usdc-telegram-bot.git

# 7. 업로드
git branch -M main
git push -u origin main
```

**GitHub 인증 요청 시:**
- Username: GitHub 유저네임
- Password: Personal Access Token 사용
  - GitHub → Settings → Developer settings → Personal access tokens
  - Generate new token (classic)
  - `repo` 체크
  - 생성된 토큰 복사

### Step 2: Railway 배포

1. **Railway 접속**: https://railway.app
2. **로그인**: GitHub 계정으로
3. **New Project** 클릭
4. **Deploy from GitHub repo** 선택
5. **usdc-telegram-bot** 저장소 선택
6. **Variables** 탭 클릭
7. **New Variable** 추가:
   - Name: `BOT_TOKEN`
   - Value: `123456789:ABCdefGHI...` (본인 토큰)
8. **Deploy** 자동 시작!

### Step 3: 확인

Railway에서:
1. **Deployments** 탭 → 최신 배포 클릭
2. **View Logs** 클릭
3. "🤖 봇이 준비되었습니다!" 확인

텔레그램에서:
1. 봇에게 `/start` 전송
2. 정상 작동 확인! ✅

---

## 🎮 사용 예시

### 기본 사용

```
👤 사용자: /start
🤖 봇: 환영 메시지 + 명령어 목록

👤 사용자: /monitor 0xc477... 1000
🤖 봇: ✅ 모니터링이 시작되었습니다!
       📍 주소: 0xc477...
       💰 임계값: 1000 USDC
       ...

[10초 후]
🤖 봇: 💤 현재 잔액: 523.45 USDC

[잔액이 1000 넘으면]
🤖 봇: 🚨 USDC 알림!
       💰 현재 잔액: 1245.80 USDC
       ...
```

### 설정 변경

```
👤 사용자: /threshold 500
🤖 봇: ✅ 임계값이 변경되었습니다.
       💵 새 임계값: 500 USDC

👤 사용자: /checkinterval 30
🤖 봇: ✅ 체크 간격이 변경되었습니다.
       ⏱️ 새 간격: 30초

👤 사용자: /alertoff
🤖 봇: ✅ 알림이 꺼졌습니다. 🔕
```

---

## ❓ FAQ

### Q1: 여러 명이 동시에 사용할 수 있나요?
✅ 네! 각자 다른 설정으로 독립적으로 사용 가능합니다.

### Q2: 봇을 재시작하면 설정이 사라지나요?
❌ 아니요! `users.json`에 저장되어 자동으로 복구됩니다.

### Q3: Railway는 완전 무료인가요?
⚠️ 월 $5 크레딧 무료입니다. 이 봇은 $1-2/월 정도 사용하므로 무료로 충분합니다.

### Q4: GitHub에 올려도 안전한가요?
✅ 네! `.gitignore`로 `users.json`과 토큰을 제외합니다.

### Q5: 설정을 바꾸면 기존 설정이 사라지나요?
❌ 아니요! **병합(merge)** 방식이라 바꾼 부분만 변경됩니다.

### Q6: 로컬과 Railway를 동시에 실행하면?
❌ 안 됩니다! 텔레그램은 한 곳에서만 봇을 실행할 수 있습니다.

---

## 🆘 문제 해결

### 로컬 테스트 시

**"BOT_TOKEN 환경변수를 설정해주세요" 에러:**
```bash
# 방법 1: 환경변수
export BOT_TOKEN="본인토큰"
npm start

# 방법 2: 파일 수정
# bot.js 4번째 줄 수정
```

**"Polling error" 에러:**
- 토큰이 올바른지 확인
- 다른 곳에서 실행 중인지 확인 (Railway + 로컬 동시 실행 불가)

### Railway 배포 시

**배포가 실패합니다:**
1. Logs에서 에러 메시지 확인
2. Variables에 BOT_TOKEN이 있는지 확인
3. GitHub 저장소가 올바른지 확인

**봇이 응답하지 않습니다:**
1. Railway Logs에서 "봇이 준비되었습니다" 확인
2. 텔레그램에서 봇에게 `/start` 먼저 보냈는지 확인
3. Variables의 BOT_TOKEN이 올바른지 확인

---

## 📞 도움이 필요하신가요?

- 📖 **상세 가이드**: `README.md` 참고
- 🐛 **버그 리포트**: GitHub Issues
- 💬 **질문**: GitHub Discussions

---

## 🎉 완료!

이제 친구들과 함께 사용하세요! 🚀
