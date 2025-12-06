// components/layout/CommonLayout.tsx
import React, { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import Footer from "./Footer";
import Header from "./Header";


type CommonLayoutProps = {
  title?: string;
  children: ReactNode;
  showFooter?: boolean; // 필요시 끌 수 있도록 옵션
};

export default function CommonLayout({
  title,
  children,
  showFooter = true,
}: CommonLayoutProps) {
  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
      {/* 공통 헤더 */}
      <Header title={title} />

      {/* 콘텐츠 영역 */}
      <View style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 16,
            paddingBottom: 80, // Footer와 겹치지 않도록 여유
          }}
        >
          {children}
        </ScrollView>
      </View>

      {/* 공통 Footer (필요 없으면 showFooter=false로 끌 수 있음) */}
      {showFooter && <Footer />}
    </View>
  );
}
