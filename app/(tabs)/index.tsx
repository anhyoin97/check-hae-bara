// app/(tabs)/index.tsx
import React from "react";
import { View, Text } from "react-native";
import CommonLayout from "../../components/layout/CommonLayout";

export default function HomeScreen() {
  return (
    <CommonLayout
      title="체크해바라"
      headerAlign="center"
      headerRightButtons={["bell", "settings"]}
    >
      <View>
        <Text>홈 화면입니다.</Text>
      </View>
    </CommonLayout>
  );
}
