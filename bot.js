// bot.js - 멀티유저 USDC 모니터링 텔레그램 봇
import TelegramBot from 'node-telegram-bot-api';
import { startMonitoring, stopMonitoring, getStatus, updateUserConfig } from './monitor.js';
import { loadUsers, saveUser, getUser, deleteUser } from './database.js';

// 환경변수 또는 직접 입력
const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';

if (BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
  console.error('❌ 에러: BOT_TOKEN 환경변수를 설정해주세요!');
  process.exit(1);
}

// 봇 생성
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log('🤖 텔레그램 봇 시작됨!');

// ===== 명령어 핸들러 =====

// /start - 시작
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  
  const welcome = `
🤖 <b>USDC 모니터링 봇에 오신 것을 환영합니다!</b>

이 봇은 Arbitrum 네트워크의 USDC 잔액을 실시간으로 모니터링하고 알림을 보내드립니다.

<b>📋 명령어 목록:</b>

<b>모니터링</b>
/monitor [주소] [임계값] - 모니터링 시작
예: <code>/monitor 0xc477... 1000</code>

/stop - 모니터링 중지
/status - 현재 상태 및 잔액 확인

<b>설정</b>
/settings - 현재 설정 보기
/address [주소] - 모니터링 주소 변경
/threshold [금액] - 임계값 변경 (USDC)
/checkinterval [초] - 체크 간격 변경
/alertinterval [분] - 알림 간격 변경
/alerton - 알림 켜기
/alertoff - 알림 끄기

<b>도움말</b>
/help - 도움말 보기

시작하려면 /monitor 명령어를 사용하세요!
  `.trim();
  
  await bot.sendMessage(chatId, welcome, { parse_mode: 'HTML' });
});

// /help - 도움말
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  
  const help = `
<b>📖 상세 도움말</b>

<b>1. 모니터링 시작</b>
<code>/monitor [주소] [임계값]</code>

예시:
<code>/monitor 0xc47756133753280c37b227c24782984e021c4544 1000</code>

• 주소: Arbitrum 지갑 주소 (0x로 시작)
• 임계값: USDC 금액 (이 금액 이상이면 알림)

<b>2. 설정 변경</b>

<code>/address 0x새주소...</code> - 주소 변경
<code>/threshold 500</code> - 임계값을 500 USDC로 변경
<code>/checkinterval 30</code> - 30초마다 체크
<code>/alertinterval 10</code> - 10분마다 알림
<code>/alertoff</code> - 알림 끄기 (모니터링만)
<code>/alerton</code> - 알림 다시 켜기

<b>3. 상태 확인</b>

<code>/status</code> - 현재 잔액 및 설정 확인
<code>/settings</code> - 설정만 보기

<b>4. 중지</b>

<code>/stop</code> - 모니터링 완전히 중지

<b>💡 팁</b>
• 모니터링은 백그라운드에서 계속 실행됩니다
• 봇을 재시작해도 설정이 저장되어 있습니다
• 여러 명이 동시에 사용할 수 있습니다
  `.trim();
  
  await bot.sendMessage(chatId, help, { parse_mode: 'HTML' });
});

// /monitor - 모니터링 시작
bot.onText(/\/monitor(?:\s+(\S+))?(?:\s+(\d+(?:\.\d+)?))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const address = match[1];
  const threshold = match[2] ? parseFloat(match[2]) : null;
  
  // 파라미터 검증
  if (!address) {
    return bot.sendMessage(chatId, 
      '❌ 사용법: /monitor [주소] [임계값]\n\n예시:\n<code>/monitor 0xc477... 1000</code>',
      { parse_mode: 'HTML' }
    );
  }
  
  if (!address.startsWith('0x') || address.length !== 42) {
    return bot.sendMessage(chatId, '❌ 유효하지 않은 주소입니다. 0x로 시작하는 42자 주소를 입력하세요.');
  }
  
  if (!threshold || threshold <= 0) {
    return bot.sendMessage(chatId, '❌ 임계값은 0보다 큰 숫자여야 합니다.');
  }
  
  // 사용자 설정 저장
  const config = {
    address: address.toLowerCase(),
    threshold,
    checkInterval: 10,      // 기본 10초
    alertInterval: 5,       // 기본 5분
    alertEnabled: true,
    isActive: true
  };
  
  saveUser(chatId, config);
  
  // 모니터링 시작
  startMonitoring(chatId, bot);
  
  const response = `
✅ <b>모니터링이 시작되었습니다!</b>

📍 주소: <code>${address}</code>
💰 임계값: ${threshold} USDC
⏱️ 체크 간격: 10초
🔔 알림 간격: 5분

잠시 후 현재 잔액을 확인해드리겠습니다.
설정 변경: /settings
상태 확인: /status
  `.trim();
  
  await bot.sendMessage(chatId, response, { parse_mode: 'HTML' });
});

// /stop - 모니터링 중지
bot.onText(/\/stop/, async (msg) => {
  const chatId = msg.chat.id;
  const user = getUser(chatId);
  
  if (!user || !user.isActive) {
    return bot.sendMessage(chatId, '❌ 현재 실행 중인 모니터링이 없습니다.');
  }
  
  stopMonitoring(chatId);
  deleteUser(chatId);
  
  await bot.sendMessage(chatId, '✅ 모니터링이 중지되었습니다.');
});

// /status - 현재 상태
bot.onText(/\/status/, async (msg) => {
  const chatId = msg.chat.id;
  const user = getUser(chatId);
  
  if (!user || !user.isActive) {
    return bot.sendMessage(chatId, '❌ 현재 실행 중인 모니터링이 없습니다.\n\n시작하려면: /monitor [주소] [임계값]');
  }
  
  try {
    const status = await getStatus(chatId);
    
    const nextAlert = user.alertEnabled && status.nextAlertIn > 0
      ? `⏳ 다음 알림: ${Math.ceil(status.nextAlertIn / 60)}분 후`
      : user.alertEnabled
      ? '🔔 알림 대기 중'
      : '🔕 알림 꺼짐';
    
    const response = `
📊 <b>현재 상태</b>

💰 현재 잔액: <b>${status.balance.toFixed(2)} USDC</b>
${status.balance >= user.threshold ? '🔥' : '💤'} 상태: ${status.balance >= user.threshold ? '임계값 초과' : '정상'}

<b>설정</b>
📍 주소: <code>${user.address}</code>
💵 임계값: ${user.threshold} USDC
⏱️ 체크 간격: ${user.checkInterval}초
🔔 알림 간격: ${user.alertInterval}분
${nextAlert}

마지막 체크: ${status.lastCheck}

설정 변경: /settings
    `.trim();
    
    await bot.sendMessage(chatId, response, { parse_mode: 'HTML' });
  } catch (error) {
    await bot.sendMessage(chatId, '❌ 상태를 확인하는 중 오류가 발생했습니다: ' + error.message);
  }
});

// /settings - 설정 보기
bot.onText(/\/settings/, async (msg) => {
  const chatId = msg.chat.id;
  const user = getUser(chatId);
  
  if (!user) {
    return bot.sendMessage(chatId, '❌ 설정된 모니터링이 없습니다.\n\n시작하려면: /monitor [주소] [임계값]');
  }
  
  const response = `
⚙️ <b>현재 설정</b>

📍 주소: <code>${user.address}</code>
💵 임계값: ${user.threshold} USDC
⏱️ 체크 간격: ${user.checkInterval}초
🔔 알림 간격: ${user.alertInterval}분
${user.alertEnabled ? '✅' : '🔕'} 알림: ${user.alertEnabled ? '켜짐' : '꺼짐'}
${user.isActive ? '▶️' : '⏸️'} 상태: ${user.isActive ? '실행 중' : '중지됨'}

<b>변경 명령어:</b>
/address [새주소] - 주소 변경
/threshold [금액] - 임계값 변경
/checkinterval [초] - 체크 간격 변경
/alertinterval [분] - 알림 간격 변경
/alerton, /alertoff - 알림 켜기/끄기
  `.trim();
  
  await bot.sendMessage(chatId, response, { parse_mode: 'HTML' });
});

// /address - 주소 변경
bot.onText(/\/address\s+(\S+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const newAddress = match[1];
  
  if (!newAddress.startsWith('0x') || newAddress.length !== 42) {
    return bot.sendMessage(chatId, '❌ 유효하지 않은 주소입니다.');
  }
  
  const updated = updateUserConfig(chatId, { address: newAddress.toLowerCase() });
  
  if (!updated) {
    return bot.sendMessage(chatId, '❌ 먼저 /monitor로 모니터링을 시작해주세요.');
  }
  
  await bot.sendMessage(chatId, `✅ 주소가 변경되었습니다.\n\n📍 새 주소: <code>${newAddress}</code>`, { parse_mode: 'HTML' });
});

// /threshold - 임계값 변경
bot.onText(/\/threshold\s+(\d+(?:\.\d+)?)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const newThreshold = parseFloat(match[1]);
  
  if (newThreshold <= 0) {
    return bot.sendMessage(chatId, '❌ 임계값은 0보다 큰 숫자여야 합니다.');
  }
  
  const updated = updateUserConfig(chatId, { threshold: newThreshold });
  
  if (!updated) {
    return bot.sendMessage(chatId, '❌ 먼저 /monitor로 모니터링을 시작해주세요.');
  }
  
  await bot.sendMessage(chatId, `✅ 임계값이 변경되었습니다.\n\n💵 새 임계값: ${newThreshold} USDC`);
});

// /checkinterval - 체크 간격 변경
bot.onText(/\/checkinterval\s+(\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const newInterval = parseInt(match[1]);
  
  if (newInterval < 5) {
    return bot.sendMessage(chatId, '❌ 체크 간격은 최소 5초 이상이어야 합니다.');
  }
  
  if (newInterval > 3600) {
    return bot.sendMessage(chatId, '❌ 체크 간격은 최대 3600초(1시간)까지 가능합니다.');
  }
  
  const updated = updateUserConfig(chatId, { checkInterval: newInterval });
  
  if (!updated) {
    return bot.sendMessage(chatId, '❌ 먼저 /monitor로 모니터링을 시작해주세요.');
  }
  
  // 모니터링 재시작 (새 간격 적용)
  stopMonitoring(chatId);
  startMonitoring(chatId, bot);
  
  await bot.sendMessage(chatId, `✅ 체크 간격이 변경되었습니다.\n\n⏱️ 새 간격: ${newInterval}초`);
});

// /alertinterval - 알림 간격 변경
bot.onText(/\/alertinterval\s+(\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const newInterval = parseInt(match[1]);
  
  if (newInterval < 1) {
    return bot.sendMessage(chatId, '❌ 알림 간격은 최소 1분 이상이어야 합니다.');
  }
  
  if (newInterval > 1440) {
    return bot.sendMessage(chatId, '❌ 알림 간격은 최대 1440분(24시간)까지 가능합니다.');
  }
  
  const updated = updateUserConfig(chatId, { alertInterval: newInterval });
  
  if (!updated) {
    return bot.sendMessage(chatId, '❌ 먼저 /monitor로 모니터링을 시작해주세요.');
  }
  
  await bot.sendMessage(chatId, `✅ 알림 간격이 변경되었습니다.\n\n🔔 새 간격: ${newInterval}분`);
});

// /alerton - 알림 켜기
bot.onText(/\/alerton/, async (msg) => {
  const chatId = msg.chat.id;
  
  const updated = updateUserConfig(chatId, { alertEnabled: true });
  
  if (!updated) {
    return bot.sendMessage(chatId, '❌ 먼저 /monitor로 모니터링을 시작해주세요.');
  }
  
  await bot.sendMessage(chatId, '✅ 알림이 켜졌습니다. 🔔');
});

// /alertoff - 알림 끄기
bot.onText(/\/alertoff/, async (msg) => {
  const chatId = msg.chat.id;
  
  const updated = updateUserConfig(chatId, { alertEnabled: false });
  
  if (!updated) {
    return bot.sendMessage(chatId, '❌ 먼저 /monitor로 모니터링을 시작해주세요.');
  }
  
  await bot.sendMessage(chatId, '✅ 알림이 꺼졌습니다. 🔕\n\n잔액은 계속 모니터링되지만 알림은 오지 않습니다.');
});

// 에러 핸들링
bot.on('polling_error', (error) => {
  console.error('❌ Polling 에러:', error.message);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ 처리되지 않은 에러:', error);
});

// 시작 시 기존 사용자 모니터링 재개
console.log('📋 저장된 사용자 로드 중...');
const users = loadUsers();
let activeCount = 0;

for (const [chatId, config] of Object.entries(users)) {
  if (config.isActive) {
    startMonitoring(chatId, bot);
    activeCount++;
  }
}

console.log(`✅ ${activeCount}명의 사용자 모니터링 재개됨`);
console.log('🤖 봇이 준비되었습니다!');
