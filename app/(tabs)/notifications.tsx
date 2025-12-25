import React from "react";
import { View, Button } from "react-native";
import { logScheduledCheckHaebalaNotis } from "../../lib/notiDebug";

export default function NotificationsScreen() {
  return (
    <View style={{ padding: 16 }}>
      <Button
        title="예약된 알림 목록 콘솔로 보기"
        onPress={async () => {
          await logScheduledCheckHaebalaNotis();
        }}
      />
    </View>
  );
}
