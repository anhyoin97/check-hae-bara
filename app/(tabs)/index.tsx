// app/(tabs)/index.tsx
import React from "react";
import { Text, View } from "react-native";
import CommonLayout from "../../components/layout/CommonLayout";
export default function HomeScreen() {
  return (
    <CommonLayout title="체크해바라 홈">
      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: "600" }}>
          홈 화면입니다.
        </Text>
        <Text style={{ fontSize: 14 }}>
          컨텐츠 영역
        </Text>
      </View>
    </CommonLayout>
  );
}
