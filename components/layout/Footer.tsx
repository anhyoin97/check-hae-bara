// components/layout/Footer.tsx
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";

type TabConfig = {
  label: string;
  path: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  activeIcon: React.ComponentProps<typeof Ionicons>["name"];
};

const tabs: TabConfig[] = [
  {
    label: "알림",
    path: "/notifications",
    icon: "notifications-outline",
    activeIcon: "notifications",
  },
  {
    label: "물품등록",
    path: "/add-item",
    icon: "add-circle-outline",
    activeIcon: "add-circle",
  },
  {
    label: "홈",
    path: "/",
    icon: "home-outline",
    activeIcon: "home",
  },
  {
    label: "일정",
    path: "/schedule",
    icon: "calendar-outline",
    activeIcon: "calendar",
  },
  {
    label: "마이",
    path: "/my",
    icon: "person-outline",
    activeIcon: "person",
  },
];

export default function Footer() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View
      style={{
        height: 62,
        borderTopWidth: 1,
        borderColor: "#e5e5e5",
        flexDirection: "row",
        backgroundColor: "#ffffff",
      }}
    >
      {tabs.map((tab, index) => {
        const isActive =
          tab.path === "/"
            ? pathname === "/" // 홈은 정확히
            : pathname.startsWith(tab.path);

        const isCenterHome = tab.path === "/";
        const iconSize = isCenterHome ? 24 : 22;

        return (
          <TouchableOpacity
            key={index}
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
            onPress={() => router.push(tab.path as any)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isActive ? tab.activeIcon : tab.icon}
              size={iconSize}
              color={isActive ? "#007AFF" : "#444"}
            />
            <Text
              style={{
                fontSize: 11,
                color: isActive ? "#007AFF" : "#444",
                marginTop: 2,
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
