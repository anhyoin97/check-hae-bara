import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "CHB_FIRED_NOTI_HISTORY_V1";
const PREFIX = "CHB_";

export type FiredNoti = {
  id: string;          // 알림 identifier
  title?: string;
  body?: string;
  data?: any;
  firedAt: number;     // epoch ms
};

export async function getFiredNotis(): Promise<FiredNoti[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as FiredNoti[]) : [];
  } catch {
    return [];
  }
}

export async function addFiredNoti(noti: FiredNoti) {
  // CHB_만 저장
  if (!noti.id?.startsWith(PREFIX)) return;

  const list = await getFiredNotis();
  if (list.some((x) => x.id === noti.id)) return; // 중복 방지

  const next = [noti, ...list].slice(0, 300);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function deleteFiredNoti(id: string) {
  const list = await getFiredNotis();
  const next = list.filter((x) => x.id !== id);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function clearFiredNotis() {
  await AsyncStorage.removeItem(KEY);
}
