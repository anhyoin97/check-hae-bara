// app/(tabs)/index.tsx
import React, { useEffect, useState } from "react";
import { View, Text, Button } from "react-native";
import CommonLayout from "../../components/layout/CommonLayout";
import { getOrCreateUserId } from "../../lib/user";
import { db } from "../../lib/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import type { Product } from "../../types/product";

type TaskType = "cycle" | "expiry";

type TodayTask = {
  id: string;
  name: string;
  type: TaskType;
  dday: string; // 예: "D-Day", "D-1"
  location?: string;
};

type UpcomingItem = {
  id: string;
  name: string;
  dday: string;
};

export default function HomeScreen() {
  const today = new Date();
  const month = today.getMonth() + 1; // 0부터 시작, +1
  const day = today.getDate();
  const weekdayNames = ["일", "월", "화", "수", "목", "금", "토"] as const;
  const weekday = weekdayNames[today.getDay()];

  // 현재 기기의 userId, 이 유저의 상품 목록 상태
  const [userId, setUserId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // 화면 처음 진입할 때 userId 가져오고, 그 유저의 상품 목록 조회
  useEffect(() => {
    async function init() {
      const id = await getOrCreateUserId();
      setUserId(id);
      console.log("Home userId:", id);

      await loadMyProducts(id);
    }

    init();
  }, []);

  // 해당 유저가 등록한 상품들만 Firestore에서 조회
  async function loadMyProducts(idParam?: string) {
    const uid = idParam ?? userId;
    if (!uid) return;

    try {
      const q = query(
        collection(db, "products"),
        where("userId", "==", uid)
      );

      const snapshot = await getDocs(q);
      const list: Product[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as any;

        const product: Product = {
          id: docSnap.id,
          userId: data.userId,
          name: data.name,
          type: data.type,
          location: data.location,
          category: data.category,
          cycleDays: data.cycleDays,
          lastHandledAt: data.lastHandledAt,
          nextDueDate: data.nextDueDate,
          expiryDate: data.expiryDate,
          notifyBeforeDays: data.notifyBeforeDays,
          isArchived: data.isArchived ?? false,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };

        list.push(product);
      });

      setProducts(list);
      console.log("내 상품 개수:", list.length);
    } catch (e) {
      console.log("상품 조회 에러:", e);
    }
  }

  // 오늘 해야 할 일 (교체, 유통기한)
  const todayTasks: TodayTask[] = [
    {
      id: "1",
      name: "기저귀 갈기",
      type: "cycle",
      dday: "D-Day",
      location: "아기방",
    },
    {
      id: "2",
      name: "우유 유통기한",
      type: "expiry",
      dday: "D-1",
      location: "냉장고",
    },
    {
      id: "3",
      name: "가습기 물통 세척",
      type: "cycle",
      dday: "D-Day",
      location: "거실",
    },
  ];

  // 요약 카드용 더미 데이터 (나중에 products 기반으로 계산)
  const totalItems = 12;
  const upcomingWithin7Days = 5;
  const expiredCount = 2;

  // 다가오는 교체 주기
  const upcomingCycleItems: UpcomingItem[] = [
    { id: "1", name: "공기청정기 필터 교체", dday: "D-2" },
    { id: "2", name: "욕실 수건 교체", dday: "D-5" },
  ];

  // 다가오는 유통기한
  const upcomingExpiryItems: UpcomingItem[] = [
    { id: "1", name: "두부", dday: "D-1" },
    { id: "2", name: "요거트", dday: "D-3" },
  ];

  // 섹션 간 공통 간격
  const SECTION_GAP = 32;

  // 공통 부제목
  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 4 }}>
        {children}
      </Text>
      <View
        style={{
          width: 28,
          height: 3,
          backgroundColor: "#007AFF", // 메인 색상
          borderRadius: 2,
        }}
      />
    </View>
  );

  return (
    <CommonLayout
      title="CHECKHABALA"
      headerAlign="center"
      headerRightButtons={["bell", "settings"]}
    >
      {/* 인사 + 날짜 */}
      <View style={{ marginBottom: SECTION_GAP, marginTop: 10 }}>
        <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}>
          안녕하세요, 효인님
        </Text>
        <Text style={{ fontSize: 14, color: "#666", lineHeight: 20 }}>
          오늘은 {month}월 {day}일 {weekday}요일이에요.{"\n"}
          오늘 하루도 재구매해야할 상품을 확인해볼까요?
        </Text>
      </View>

      {/* 오늘 해야 할 일 */}
      <View style={{ marginBottom: SECTION_GAP }}>
        <SectionTitle>오늘 해야 할 일</SectionTitle>

        {todayTasks.map((task) => (
          <View
            key={task.id}
            style={{
              borderRadius: 12,
              padding: 14,
              backgroundColor: "#F3F7FF",
              marginBottom: 8,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flex: 1, paddingRight: 8 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 999,
                    backgroundColor:
                      task.type === "cycle" ? "#E5F3FF" : "#FFF3E5",
                    marginRight: 6,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color: task.type === "cycle" ? "#007AFF" : "#FF8A00",
                    }}
                  >
                    {task.type === "cycle" ? "교체주기" : "유통기한"}
                  </Text>
                </View>
                <Text style={{ fontSize: 15, fontWeight: "600" }}>
                  {task.name}
                </Text>
              </View>
            </View>

            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: task.type === "cycle" ? "#007AFF" : "#FF8A00",
              }}
            >
              {task.dday}
            </Text>
          </View>
        ))}
      </View>

      {/* 요약 카드 (내 물품 알림) 3개 */}
      <View style={{ marginBottom: SECTION_GAP }}>
        <SectionTitle>나의 물품 요약</SectionTitle>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <View
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 10,
              backgroundColor: "#F8F8FA",
              marginRight: 8,
            }}
          >
            <Text style={{ fontSize: 12, color: "#777" }}>등록된 품목</Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                marginTop: 6,
              }}
            >
              {totalItems}개
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 10,
              backgroundColor: "#F8F8FA",
              marginRight: 8,
            }}
          >
            <Text style={{ fontSize: 12, color: "#777" }}>
              7일 이내 교체/만료
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                marginTop: 6,
              }}
            >
              {upcomingWithin7Days}개
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 10,
              backgroundColor: "#FFF4F4",
            }}
          >
            <Text style={{ fontSize: 12, color: "#C0392B" }}>지연/만료</Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                marginTop: 6,
                color: "#C0392B",
              }}
            >
              {expiredCount}개
            </Text>
          </View>
        </View>
      </View>

      {/* 다가오는 교체 주기 */}
      <View style={{ marginBottom: SECTION_GAP }}>
        <SectionTitle>다가오는 교체 주기</SectionTitle>

        {upcomingCycleItems.map((item, idx) => (
          <View
            key={item.id}
            style={{
              paddingVertical: 10,
              borderBottomWidth: idx === upcomingCycleItems.length - 1 ? 0 : 1,
              borderBottomColor: "#eee",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 14 }}>{item.name}</Text>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: "#007AFF",
              }}
            >
              {item.dday}
            </Text>
          </View>
        ))}
      </View>

      {/* 다가오는 유통기한 */}
      <View style={{ marginBottom: SECTION_GAP }}>
        <SectionTitle>다가오는 유통기한</SectionTitle>

        {upcomingExpiryItems.map((item, idx) => (
          <View
            key={item.id}
            style={{
              paddingVertical: 10,
              borderBottomWidth: idx === upcomingExpiryItems.length - 1 ? 0 : 1,
              borderBottomColor: "#eee",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 14 }}>{item.name}</Text>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: "#FF8A00",
              }}
            >
              {item.dday}
            </Text>
          </View>
        ))}
      </View>
    </CommonLayout>
  );
}
