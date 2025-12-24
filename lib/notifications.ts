import * as Notifications from "expo-notifications";

export async function requestNotiPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function fireTestNotiNow() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "물품 교체 시기입니다.",
      body: "교체 시기가 다가온 물품이 있습니다. 확인해볼까요?",
      data: { type: "replaceCycle", itemName: "칫솔" },
    },
    trigger: null, // 즉시 발송
  });
}
