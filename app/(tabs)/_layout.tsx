// app/(tabs)/_layout.tsx
import { Slot } from "expo-router";
import { useEffect } from "react";
import { getOrCreateUserId, registerUserIfNeeded } from "../../lib/user";
import * as Notifications from "expo-notifications";
import { setupNotificationHandler } from "../../lib/notificationHandler";
import { syncSummaryNotisFromFirestore } from "../../lib/notiSync";


export default function RootLayout() {

  useEffect(() => {
    setupNotificationHandler();

    async function init() {
      const id = await getOrCreateUserId();
      
      // Firestore의 users 컬렉션에 유저 등록
      await registerUserIfNeeded(id);
      // 로컬 알림 
      await syncSummaryNotisFromFirestore(id);
    }

    init();
  }, []);
  
  return <Slot />;
}
