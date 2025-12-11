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
    label: "홈",
    path: "/",
    icon: "home-outline",
    activeIcon: "home",
  },
  {
    label: "예약",
    path: "/reservation",
    icon: "calendar-outline",
    activeIcon: "calendar",
  },
  {
    label: "설정",
    path: "/settings",
    icon: "settings-outline",
    activeIcon: "settings",
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
        const isActive = pathname === tab.path;

        return (
          <TouchableOpacity
            key={index}
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
            onPress={() => router.push(tab.path as any)}
          >
            <Ionicons
              name={isActive ? tab.activeIcon : tab.icon}
              size={22}
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
