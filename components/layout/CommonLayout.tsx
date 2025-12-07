// components/layout/CommonLayout.tsx
import React, { ReactNode } from "react";
import { View, ScrollView } from "react-native";
import Header from "./Header";
import Footer from "./Footer";

type CommonLayoutProps = {
  title?: string;
  children: ReactNode;

  // Header 옵션 전달
  headerAlign?: "center" | "left";
  headerRightButtons?: Array<"bell" | "settings">;
  headerShowBackButton?: boolean;

  showFooter?: boolean;
};

export default function CommonLayout({
  title,
  children,
  showFooter = true,

  // header 기본값
  headerAlign = "center",
  headerRightButtons = [],
  headerShowBackButton,
}: CommonLayoutProps) {
  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>

      <Header
        title={title}
        align={headerAlign}
        rightButtons={headerRightButtons}
        showBackButton={headerShowBackButton}
      />

      <View style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 16,
            paddingBottom: 80,
          }}
        >
          {children}
        </ScrollView>
      </View>

        {showFooter && <Footer />}
      
    </View>
  );
}
