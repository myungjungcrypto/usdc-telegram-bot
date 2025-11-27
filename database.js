// database.js - 사용자 설정 관리 (JSON 기반)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, 'users.json');

// 데이터베이스 초기화
function initDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, '{}', 'utf8');
    console.log('📄 users.json 파일 생성됨');
  }
}

// 모든 사용자 로드
export function loadUsers() {
  initDB();
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ 사용자 로드 실패:', error.message);
    return {};
  }
}

// 모든 사용자 저장
function saveUsers(users) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (error) {
    console.error('❌ 사용자 저장 실패:', error.message);
  }
}

// 특정 사용자 가져오기
export function getUser(chatId) {
  const users = loadUsers();
  return users[chatId] || null;
}

// 사용자 저장/업데이트
export function saveUser(chatId, config) {
  const users = loadUsers();
  
  // 기존 설정과 병합 (merge)
  users[chatId] = {
    ...users[chatId],
    ...config,
    lastUpdated: Date.now()
  };
  
  saveUsers(users);
  console.log(`💾 사용자 ${chatId} 설정 저장됨`);
  return users[chatId];
}

// 사용자 설정 업데이트 (부분 업데이트)
export function updateUser(chatId, updates) {
  const users = loadUsers();
  
  if (!users[chatId]) {
    return null;
  }
  
  users[chatId] = {
    ...users[chatId],
    ...updates,
    lastUpdated: Date.now()
  };
  
  saveUsers(users);
  console.log(`🔄 사용자 ${chatId} 설정 업데이트됨`);
  return users[chatId];
}

// 사용자 삭제
export function deleteUser(chatId) {
  const users = loadUsers();
  
  if (users[chatId]) {
    delete users[chatId];
    saveUsers(users);
    console.log(`🗑️ 사용자 ${chatId} 삭제됨`);
    return true;
  }
  
  return false;
}

// 활성 사용자 수
export function getActiveUserCount() {
  const users = loadUsers();
  return Object.values(users).filter(u => u.isActive).length;
}

// 초기화
initDB();
