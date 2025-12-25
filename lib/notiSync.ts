import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase"; 
import { rebuildSummaryNotificationsNext30Days, CheckHaebalaItem } from "./notiScheduler";

/**
 * Firestore에서 내 물품을 가져와서
 * 앞으로 30일치 요약 알림을 재생성.
 */
export async function syncSummaryNotisFromFirestore(userId: string) {
  const colRef = collection(db, "users", userId, "items");

  const snap = await getDocs(colRef);

  const items: CheckHaebalaItem[] = snap.docs.map((d) => {
    const data = d.data() as any;
    return {
      id: d.id,
      name: data.name,
      nextReplaceAt: data.nextReplaceAt ?? null,
      expiryAt: data.expiryAt ?? null,
    };
  });

  return await rebuildSummaryNotificationsNext30Days(items);
}
