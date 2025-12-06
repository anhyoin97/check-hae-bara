// components/layout/Header.tsx
import React from "react";
import { Text, View } from "react-native";

type HeaderProps = {
  title?: string;
};

export default function Header({ title }: HeaderProps) {
  return (
    <View
      style={{
        height: 56,
        justifyContent: "center",
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderColor: "#eeeeee",
        backgroundColor: "#ffffff",
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: "600" }}>
        {title ?? "체크해바라"}
      </Text>
    </View>
  );
}
