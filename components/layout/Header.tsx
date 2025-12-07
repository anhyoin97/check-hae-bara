// components/layout/Header.tsx
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type HeaderProps = {
  title?: string;
  showBackButton?: boolean; 
  align?: "center" | "left"; // 타이틀 정렬
  rightButtons?: Array<"bell" | "settings">; // 우측 아이콘들
};

export default function Header({
  title,
  showBackButton,
  align = "center",
  rightButtons = [],
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const canGoBack = showBackButton ?? pathname !== "/";

  return (
    <View
      style={{
        paddingTop: 12,
        height: 56 + 12,
        backgroundColor: "#ffffff",
        borderBottomWidth: 1,
        borderColor: "#e5e5e5",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 12,

        // 그림자 효과
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      {/* 왼쪽 영역 */}
      <View style={{ width: 50 }}>
        {canGoBack && (
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
        )}
      </View>

      {/* 중앙 */}
      <View
        style={{
          flex: 1,
          alignItems: align === "center" ? "center" : "flex-start",
          marginLeft: align === "left" && !canGoBack ? 12 : 0,
        }}
      >
        <Text style={{ fontSize: 17, fontWeight: "600" }} numberOfLines={1}>
          {title ?? ""}
        </Text>
      </View>

      {/* 오른쪽 영역 */}
      <View
        style={{
          width: 50,
          flexDirection: "row",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 12,
        }}
      >
        {rightButtons.map((btn, idx) => (
          <TouchableOpacity key={idx}>
            {btn === "bell" && (
              <Ionicons name="notifications-outline" size={22} color="#000" />
            )}
            {btn === "settings" && (
              <Ionicons name="settings-outline" size={22} color="#000" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
