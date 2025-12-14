import AsyncStorage from "@react-native-async-storage/async-storage";

const USER_ID_KEY = "checkhaebara_user_id";

// 랜덤 ID 생성
function generateUserId() {
  const random = Math.random().toString(36).substring(2, 10);
  const time = Date.now().toString(36);
  return `user_${time}_${random}`;
}

export async function getOrCreateUserId() {
  // 이미 저장된 userId 있는지 확인
  const existingId = await AsyncStorage.getItem(USER_ID_KEY);
  if (existingId) {
    return existingId;
  }

  // 없으면 새로 만들기
  const newId = generateUserId();
  await AsyncStorage.setItem(USER_ID_KEY, newId);
  return newId;
}
