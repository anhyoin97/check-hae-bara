import * as Notifications from "expo-notifications";

const PREFIX = "CHB_";

export async function logScheduledCheckHaebalaNotis() {
  const list = await Notifications.getAllScheduledNotificationsAsync();

  const ours = list
    .filter((n) => (n.identifier || "").startsWith(PREFIX))
    .map((n) => ({
      id: n.identifier,
      title: n.content?.title,
      body: n.content?.body,
      data: n.content?.data,
      trigger: n.trigger, // timeInterval/date 등 트리거 정보
    }));

  console.log("==== [CHB] Scheduled Notifications ====");
  console.log(`total(all): ${list.length}, total(CHB): ${ours.length}`);
  console.table(ours);
  console.log("======================================");

  return { allCount: list.length, chbCount: ours.length, ours };
}
