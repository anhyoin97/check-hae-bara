// app/(tabs)/_layout.tsx
import { Slot } from "expo-router";
import { useEffect } from "react";
import * as Notifications from "expo-notifications";

import { getOrCreateUserId, registerUserIfNeeded } from "../../lib/user";
import { setupNotificationHandler } from "../../lib/notificationHandler";
import { syncSummaryNotisFromFirestore } from "../../lib/notiSync";
import { addFiredNoti } from "../../lib/notiHistory";

export default function RootLayout() {
  useEffect(() => {
    // 알림 표시 정책 설정
    setupNotificationHandler();

    // 알림 수신(포그라운드) 시 기록
    const receivedSub =
      Notifications.addNotificationReceivedListener(async (n) => {
        await addFiredNoti({
          id: n.request.identifier,
          title: n.request.content.title ?? undefined,
          body: n.request.content.body ?? undefined,
          data: n.request.content.data,
          firedAt: Date.now(),
        });
      });

    // 알림 클릭 시 기록 (백그라운드/잠금 대응)
    const responseSub =
      Notifications.addNotificationResponseReceivedListener(
        async (response) => {
          const n = response.notification;

          await addFiredNoti({
            id: n.request.identifier,
            title: n.request.content.title ?? undefined,
            body: n.request.content.body ?? undefined,
            data: n.request.content.data,
            firedAt: Date.now(),
          });
        }
      );

    // 앱 초기화 로직
    async function init() {
      const id = await getOrCreateUserId();
      await registerUserIfNeeded(id);
      await syncSummaryNotisFromFirestore(id);
    }

    init();

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);

  return <Slot />;
}
