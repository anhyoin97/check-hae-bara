// user.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "./firebase"; 
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const USER_ID_KEY = "checkhaebara_user_id";

function generateUserId() {
  const random = Math.random().toString(36).substring(2, 10);
  const time = Date.now().toString(36);
  return `user_${time}_${random}`;
}

export async function getOrCreateUserId() {
  const existingId = await AsyncStorage.getItem(USER_ID_KEY);
  if (existingId) {
    return existingId;
  }

  const newId = generateUserId();
  await AsyncStorage.setItem(USER_ID_KEY, newId);
  return newId;
}

export async function registerUserIfNeeded(userId: string) {
  const userRef = doc(db, "users", userId);
  const snap = await getDoc(userRef);

  // 이미 있으면 
  if (snap.exists()) {
    return;
  }

  // 없으면 새로 생성
  await setDoc(userRef, {
    createdAt: serverTimestamp(),
    
  });
}
