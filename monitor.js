// monitor.js - USDC 잔액 모니터링 로직
import { ethers } from 'ethers';
import { getUser, updateUser } from './database.js';

// Arbitrum 설정
const ARBITRUM_RPC = 'https://arb1.arbitrum.io/rpc';
const USDC_ADDRESS = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';

// ERC20 ABI
const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
];

// Provider & Contract
const provider = new ethers.JsonRpcProvider(ARBITRUM_RPC);
const contract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);

// 각 사용자별 interval 저장
const intervals = new Map();
const lastAlertTimes = new Map();

// USDC 잔액 조회
async function getBalance(address) {
  try {
    const balance = await contract.balanceOf(address);
    const decimals = await contract.decimals();
    return parseFloat(ethers.formatUnits(balance, decimals));
  } catch (error) {
    console.error(`❌ 잔액 조회 실패 (${address}):`, error.message);
    return null;
  }
}

// 텔레그램 알림 전송
async function sendAlert(bot, chatId, balance, address, threshold) {
  const user = getUser(chatId);
  const message = `
🚨 <b>USDC 알림!</b>

💰 현재 잔액: <b>${balance.toFixed(2)} USDC</b>
📍 주소: <code>${address}</code>
💵 임계값: ${threshold} USDC
⏰ 시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}

🔗 <a href="https://arbiscan.io/address/${address}">Arbiscan에서 보기</a>

${user?.alertInterval ? `📌 다음 알림은 ${user.alertInterval}분 후에 전송됩니다.` : ''}
  `.trim();

  try {
    await bot.sendMessage(chatId, message, { 
      parse_mode: 'HTML',
      disable_web_page_preview: true 
    });
    console.log(`✅ 알림 전송 완료: ${chatId}`);
  } catch (error) {
    console.error(`❌ 알림 전송 실패 (${chatId}):`, error.message);
  }
}

// 시간 포맷 함수
function formatTime(seconds) {
  if (seconds < 60) {
    return `${seconds}초`;
  }
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${minutes}분 ${secs}초` : `${minutes}분`;
}

// 단일 사용자 모니터링
async function monitorUser(chatId, bot) {
  const user = getUser(chatId);
  
  if (!user || !user.isActive) {
    console.log(`⏸️ 사용자 ${chatId} 비활성 - 모니터링 중지`);
    stopMonitoring(chatId);
    return;
  }
  
  const balance = await getBalance(user.address);
  
  if (balance === null) {
    console.log(`⚠️ 사용자 ${chatId} 잔액 조회 실패`);
    return;
  }
  
  const timestamp = new Date().toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul' });
  const emoji = balance >= user.threshold ? '🔥' : '💤';
  
  console.log(`${emoji} [${timestamp}] ${chatId}: ${balance.toFixed(2)} USDC`);
  
  // 알림 체크
  if (user.alertEnabled && balance >= user.threshold) {
    const now = Date.now();
    const lastAlertTime = lastAlertTimes.get(chatId) || 0;
    const timeSinceLastAlert = now - lastAlertTime;
    const alertIntervalMs = user.alertInterval * 60 * 1000;
    
    // 첫 알림이거나 알림 간격이 지났으면 알림 전송
    if (lastAlertTime === 0 || timeSinceLastAlert >= alertIntervalMs) {
      await sendAlert(bot, chatId, balance, user.address, user.threshold);
      lastAlertTimes.set(chatId, now);
    } else {
      const remaining = Math.ceil((alertIntervalMs - timeSinceLastAlert) / 1000);
      console.log(`⏳ 사용자 ${chatId} 다음 알림까지 ${formatTime(remaining)} 남음`);
    }
  } else if (balance < user.threshold) {
    // 임계값 아래로 떨어지면 알림 타이머 리셋
    if (lastAlertTimes.has(chatId)) {
      console.log(`📉 사용자 ${chatId} 잔액 감소 - 알림 타이머 리셋`);
      lastAlertTimes.delete(chatId);
    }
  }
}

// 모니터링 시작
export function startMonitoring(chatId, bot) {
  const user = getUser(chatId);
  
  if (!user) {
    console.error(`❌ 사용자 ${chatId} 설정을 찾을 수 없습니다`);
    return false;
  }
  
  // 기존 interval 정리
  if (intervals.has(chatId)) {
    console.log(`🔄 사용자 ${chatId} 기존 모니터링 중지`);
    clearInterval(intervals.get(chatId));
  }
  
  // 즉시 1회 실행
  monitorUser(chatId, bot);
  
  // 주기적 실행
  const intervalMs = user.checkInterval * 1000;
  const intervalId = setInterval(() => {
    monitorUser(chatId, bot);
  }, intervalMs);
  
  intervals.set(chatId, intervalId);
  console.log(`▶️ 사용자 ${chatId} 모니터링 시작 (${user.checkInterval}초 간격)`);
  
  return true;
}

// 모니터링 중지
export function stopMonitoring(chatId) {
  if (intervals.has(chatId)) {
    clearInterval(intervals.get(chatId));
    intervals.delete(chatId);
    lastAlertTimes.delete(chatId);
    console.log(`⏹️ 사용자 ${chatId} 모니터링 중지`);
    
    // DB 업데이트
    updateUser(chatId, { isActive: false });
    
    return true;
  }
  
  return false;
}

// 현재 상태 조회
export async function getStatus(chatId) {
  const user = getUser(chatId);
  
  if (!user) {
    throw new Error('사용자를 찾을 수 없습니다');
  }
  
  const balance = await getBalance(user.address);
  
  if (balance === null) {
    throw new Error('잔액 조회 실패');
  }
  
  const lastAlertTime = lastAlertTimes.get(chatId) || 0;
  const now = Date.now();
  const alertIntervalMs = user.alertInterval * 60 * 1000;
  const nextAlertIn = lastAlertTime > 0 ? alertIntervalMs - (now - lastAlertTime) : 0;
  
  return {
    balance,
    nextAlertIn: Math.max(0, nextAlertIn),
    lastCheck: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
  };
}

// 사용자 설정 업데이트 (모니터링 재시작 없이)
export function updateUserConfig(chatId, updates) {
  const user = updateUser(chatId, updates);
  return user !== null;
}

// 활성 모니터링 수
export function getActiveMonitoringCount() {
  return intervals.size;
}
