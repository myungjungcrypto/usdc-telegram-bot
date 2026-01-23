// bot.js - 멀티유저 USDC 모니터링 텔레그램 봇 (고정 주소 버전)
import TelegramBot from 'node-telegram-bot-api';
import { startMonitoring, stopMonitoring, getStatus, updateUserConfig } from './monitor.js';
import { loadUsers, saveUser, getUser, deleteUser } from './database.js';

// 환경변수 또는 직접 입력
const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';

// ✅ 고정 모니터링 주소 (loss refund wallet)
const DEFAULT_ADDRESS = '0xc47756133753280c37b227c24782984e021c4544';

// ✅ /monitor에 아무것도 안 넣었을 때 기본 임계값
const DEFAULT_THRESHOLD = 3000;

// ✅ 알림 방향 기본값: below(미만) / above(이상)
const DEFAULT_DIRECTION = 'below';
const VALID_DIRECTIONS = new Set(['below', 'above']);

function normalizeDirection(input) {
  if (!input) return null;
  const v = String(input).toLowerCase();
  return VALID_DIRECTIONS.has(v) ? v : null;
}

function directionLabel(dir) {
  return dir === 'above' ? '이상' : '미만';
}

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
🤖 <b>USDC 모니터링 봇</b>

Arbitrum USDC 잔액을 실시간 모니터링하고, 설정한 임계값 기준으로 알림을 보내드립니다.
(기본: 임계값 <b>미만</b>일 때 알림)

<b>📍 모니터링 주소(고정)</b>
<code>${DEFAULT_ADDRESS}</code>

<b>🚀 빠른 시작</b>
• 기본 임계값(${DEFAULT_THRESHOLD} USDC), 기본 방향(below=미만)으로 시작:
<code>/monitor</code>

• 임계값만 지정 (기본: below=미만):
<code>/monitor 5000</code>

• 임계값 + 방향 지정:
<code>/monitor 5000 below</code>
<code>/monitor 5000 above</code>

• 방향만 지정 (임계값은 기본값 사용):
<code>/monitor above</code>

<b>📋 명령어</b>
/monitor [임계값] [below|above] - 모니터링 시작 (주소는 고정)
/stop - 모니터링 중지
/status - 현재 상태 및 잔액 확인

/settings - 현재 설정 보기
/threshold [금액] [below|above] - 임계값 변경 (USDC)
/direction [below|above] - 알림 조건 방향 변경
/checkinterval [초] - 체크 간격 변경 (10~3600)
/alertinterval [분] - 알림 간격 변경 (1~1440)
/alerton - 알림 켜기
/alertoff - 알림 끄기
/help - 도움말
  `.trim();

  await bot.sendMessage(chatId, welcome, { parse_mode: 'HTML' });
});

// /help - 도움말
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;

  const help = `
<b>📖 도움말</b>

<b>1) 모니터링 시작 (주소 고정)</b>
• 기본 임계값(${DEFAULT_THRESHOLD} USDC), 기본 방향(below=미만)으로 시작:
<code>/monitor</code>

• 임계값만 지정 (기본: below=미만):
<code>/monitor 3000</code>

• 임계값 + 방향 지정:
<code>/monitor 3000 below</code>
<code>/monitor 3000 above</code>

• 방향만 지정:
<code>/monitor above</code>

<b>2) 설정 변경</b>
<code>/threshold 500</code> - 임계값을 500 USDC로 변경
<code>/threshold 500 above</code> - 임계값을 500으로 바꾸고 “이상”일 때 알림
<code>/direction below</code> - 임계값 <b>미만</b>일 때 알림
<code>/direction above</code> - 임계값 <b>이상</b>일 때 알림
<code>/checkinterval 30</code> - 30초마다 체크 (10~3600)
<code>/alertinterval 10</code> - 10분마다 알림 (1~1440)
<code>/alertoff</code> - 알림 끄기 (모니터링은 계속)
<code>/alerton</code> - 알림 다시 켜기

<b>3) 상태 확인</b>
<code>/status</code> - 현재 잔액 및 설정 확인
<code>/settings</code> - 설정만 보기

<b>4) 중지</b>
<code>/stop</code> - 모니터링 완전히 중지

<b>📍 고정 주소</b>
<code>${DEFAULT_ADDRESS}</code>
  `.trim();

  await bot.sendMessage(chatId, help, { parse_mode: 'HTML' });
});

// /monitor - 모니터링 시작 (주소 고정, 임계값 + 방향 optional)
// 허용 케이스:
// /monitor
// /monitor 3000
// /monitor above
// /monitor 3000 above
// /monitor above 3000
bot.onText(/\/monitor(?:\s+(\S+))?(?:\s+(\S+))?/, async (msg, match) => {
  const chatId = msg.chat.id;

  const a1 = match?.[1] ?? null;
  const a2 = match?.[2] ?? null;

  let threshold = DEFAULT_THRESHOLD;
  let alertDirection = DEFAULT_DIRECTION;

  const cand1Dir = normalizeDirection(a1);
  const cand2Dir = normalizeDirection(a2);

  const cand1Num = a1 && /^\d+(\.\d+)?$/.test(a1) ? parseFloat(a1) : null;
  const cand2Num = a2 && /^\d+(\.\d+)?$/.test(a2) ? parseFloat(a2) : null;

  if (a1 && !a2) {
    if (cand1Num !== null) threshold = cand1Num;
    else if (cand1Dir) alertDirection = cand1Dir;
    else {
      return bot.sendMessage(
        chatId,
        `❌ 사용법: /monitor [임계값] [below|above]\n\n예시:\n<code>/monitor</code>\n<code>/monitor 3000</code>\n<code>/monitor 3000 below</code>\n<code>/monitor 3000 above</code>\n<code>/monitor above</code>`,
        { parse_mode: 'HTML' }
      );
    }
  } else if (a1 && a2) {
    if (cand1Num !== null && cand2Dir) {
      threshold = cand1Num;
      alertDirection = cand2Dir;
    } else if (cand1Dir && cand2Num !== null) {
      threshold = cand2Num;
      alertDirection = cand1Dir;
    } else {
      return bot.sendMessage(
        chatId,
        `❌ 사용법: /monitor [임계값] [below|above]\n\n예시:\n<code>/monitor</code>\n<code>/monitor 3000</code>\n<code>/monitor 3000 below</code>\n<code>/monitor 3000 above</code>\n<code>/monitor above</code>`,
        { parse_mode: 'HTML' }
      );
    }
  }

  if (!threshold || threshold <= 0) {
    return bot.sendMessage(chatId, '❌ 임계값은 0보다 큰 숫자여야 합니다.');
  }

  const address = DEFAULT_ADDRESS.toLowerCase();

  const config = {
    address,
    threshold,
    alertDirection,
    checkInterval: 10,
    alertInterval: 5,
    alertEnabled: true,
    isActive: true
  };

  saveUser(chatId, config);

  startMonitoring(chatId, bot);

  const response = `
✅ <b>모니터링이 시작되었습니다!</b>

📍 주소(고정): <code>${DEFAULT_ADDRESS}</code>
💰 임계값: ${threshold} USDC
📌 알림 조건: 임계값 <b>${directionLabel(alertDirection)}</b>일 때
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
    return bot.sendMessage(
      chatId,
      `❌ 현재 실행 중인 모니터링이 없습니다.\n\n시작하려면:\n<code>/monitor</code> 또는 <code>/monitor 3000</code>`,
      { parse_mode: 'HTML' }
    );
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
${status.isAlertCondition ? '🔥' : '✅'} 상태: ${status.isAlertCondition ? `임계값 ${directionLabel(user.alertDirection)} (경고)` : '정상'}

<b>설정</b>
📍 주소(고정): <code>${DEFAULT_ADDRESS}</code>
💵 임계값: ${user.threshold} USDC
📌 알림 조건: 임계값 ${directionLabel(user.alertDirection)}일 때
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
    return bot.sendMessage(
      chatId,
      `❌ 설정된 모니터링이 없습니다.\n\n시작하려면:\n<code>/monitor</code> 또는 <code>/monitor 3000</code>`,
      { parse_mode: 'HTML' }
    );
  }

  const response = `
⚙️ <b>현재 설정</b>

📍 주소(고정): <code>${DEFAULT_ADDRESS}</code>
💵 임계값: ${user.threshold} USDC
📌 알림 조건: 임계값 ${directionLabel(user.alertDirection)}일 때
⏱️ 체크 간격: ${user.checkInterval}초
🔔 알림 간격: ${user.alertInterval}분
${user.alertEnabled ? '✅' : '🔕'} 알림: ${user.alertEnabled ? '켜짐' : '꺼짐'}
${user.isActive ? '▶️' : '⏸️'} 상태: ${user.isActive ? '실행 중' : '중지됨'}

<b>변경 명령어:</b>
/threshold [금액] [below|above] - 임계값 변경
/direction [below|above] - 알림 조건 방향 변경
/checkinterval [초] - 체크 간격 변경
/alertinterval [분] - 알림 간격 변경
/alerton, /alertoff - 알림 켜기/끄기
  `.trim();

  await bot.sendMessage(chatId, response, { parse_mode: 'HTML' });
});

// /threshold - 임계값 변경 (옵션: 방향도 같이 변경)
bot.onText(/\/threshold\s+(\d+(?:\.\d+)?)(?:\s+(below|above))?/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const newThreshold = parseFloat(match[1]);
  const newDir = normalizeDirection(match?.[2] ?? null);

  if (newThreshold <= 0) {
    return bot.sendMessage(chatId, '❌ 임계값은 0보다 큰 숫자여야 합니다.');
  }

  const updates = { threshold: newThreshold };
  if (newDir) updates.alertDirection = newDir;

  const updated = updateUserConfig(chatId, updates);

  if (!updated) {
    return bot.sendMessage(
      chatId,
      `❌ 먼저 /monitor로 모니터링을 시작해주세요.\n예: <code>/monitor</code>`,
      { parse_mode: 'HTML' }
    );
  }

  const lines = [
    '✅ 임계값이 변경되었습니다.',
    '',
    `💵 새 임계값: ${newThreshold} USDC`
  ];
  if (newDir) lines.push(`📌 알림 조건: 임계값 ${directionLabel(newDir)}일 때`);

  await bot.sendMessage(chatId, lines.join('\n'));
});

// /direction - 알림 방향 변경
bot.onText(/\/direction\s+(below|above)/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const dir = normalizeDirection(match?.[1]);

  if (!dir) {
    return bot.sendMessage(
      chatId,
      `❌ 사용법: /direction [below|above]\n\n예시:\n<code>/direction below</code>\n<code>/direction above</code>`,
      { parse_mode: 'HTML' }
    );
  }

  const updated = updateUserConfig(chatId, { alertDirection: dir });

  if (!updated) {
    return bot.sendMessage(
      chatId,
      `❌ 먼저 /monitor로 모니터링을 시작해주세요.\n예: <code>/monitor</code>`,
      { parse_mode: 'HTML' }
    );
  }

  // 방향 바꾸면 쿨다운이 남아있을 수 있으니 모니터링 재시작해서 즉시 반영
  stopMonitoring(chatId);
  startMonitoring(chatId, bot);

  await bot.sendMessage(chatId, `✅ 알림 조건이 변경되었습니다.\n\n📌 임계값 ${directionLabel(dir)}일 때 알림`);
});

// /checkinterval - 체크 간격 변경
bot.onText(/\/checkinterval\s+(\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const newInterval = parseInt(match[1], 10);

  if (newInterval < 10) {
    return bot.sendMessage(chatId, '❌ 체크 간격은 최소 10초 이상이어야 합니다.');
  }

  if (newInterval > 3600) {
    return bot.sendMessage(chatId, '❌ 체크 간격은 최대 3600초(1시간)까지 가능합니다.');
  }

  const updated = updateUserConfig(chatId, { checkInterval: newInterval });

  if (!updated) {
    return bot.sendMessage(
      chatId,
      `❌ 먼저 /monitor로 모니터링을 시작해주세요.\n예: <code>/monitor</code>`,
      { parse_mode: 'HTML' }
    );
  }

  stopMonitoring(chatId);
  startMonitoring(chatId, bot);

  await bot.sendMessage(chatId, `✅ 체크 간격이 변경되었습니다.\n\n⏱️ 새 간격: ${newInterval}초`);
});

// /alertinterval - 알림 간격 변경
bot.onText(/\/alertinterval\s+(\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const newInterval = parseInt(match[1], 10);

  if (newInterval < 1) {
    return bot.sendMessage(chatId, '❌ 알림 간격은 최소 1분 이상이어야 합니다.');
  }

  if (newInterval > 1440) {
    return bot.sendMessage(chatId, '❌ 알림 간격은 최대 1440분(24시간)까지 가능합니다.');
  }

  const updated = updateUserConfig(chatId, { alertInterval: newInterval });

  if (!updated) {
    return bot.sendMessage(
      chatId,
      `❌ 먼저 /monitor로 모니터링을 시작해주세요.\n예: <code>/monitor</code>`,
      { parse_mode: 'HTML' }
    );
  }

  await bot.sendMessage(chatId, `✅ 알림 간격이 변경되었습니다.\n\n🔔 새 간격: ${newInterval}분`);
});

// /alerton - 알림 켜기
bot.onText(/\/alerton/, async (msg) => {
  const chatId = msg.chat.id;

  const updated = updateUserConfig(chatId, { alertEnabled: true });

  if (!updated) {
    return bot.sendMessage(
      chatId,
      `❌ 먼저 /monitor로 모니터링을 시작해주세요.\n예: <code>/monitor</code>`,
      { parse_mode: 'HTML' }
    );
  }

  await bot.sendMessage(chatId, '✅ 알림이 켜졌습니다. 🔔');
});

// /alertoff - 알림 끄기
bot.onText(/\/alertoff/, async (msg) => {
  const chatId = msg.chat.id;

  const updated = updateUserConfig(chatId, { alertEnabled: false });

  if (!updated) {
    return bot.sendMessage(
      chatId,
      `❌ 먼저 /monitor로 모니터링을 시작해주세요.\n예: <code>/monitor</code>`,
      { parse_mode: 'HTML' }
    );
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
    // 기존 데이터에 alertDirection 없으면 below로 보정 + 주소 고정
    saveUser(chatId, {
      ...config,
      address: DEFAULT_ADDRESS.toLowerCase(),
      alertDirection: normalizeDirection(config.alertDirection) || DEFAULT_DIRECTION
    });
    startMonitoring(chatId, bot);
    activeCount++;
  }
}

console.log(`✅ ${activeCount}명의 사용자 모니터링 재개됨`);
console.log('🤖 봇이 준비되었습니다!');