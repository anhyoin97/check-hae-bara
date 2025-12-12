// app/(tabs)/index.tsx
import React from "react";
import { View, Text } from "react-native";
import CommonLayout from "../../components/layout/CommonLayout";

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
  // 1) 오늘 해야 할 일 (교체, 유통기한)
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

  // 2) 요약 카드용 더미 데이터
  const totalItems = 12;
  const upcomingWithin7Days = 5;
  const expiredCount = 2;

  // 3) 다가오는 교체 주기
  const upcomingCycleItems: UpcomingItem[] = [
    { id: "1", name: "공기청정기 필터 교체", dday: "D-2" },
    { id: "2", name: "욕실 수건 교체", dday: "D-5" },
  ];

  // 4) 다가오는 유통기한
  const upcomingExpiryItems: UpcomingItem[] = [
    { id: "1", name: "두부", dday: "D-1" },
    { id: "2", name: "요거트", dday: "D-3" },
  ];

  return (
    <CommonLayout
      title="체크해바라"
      headerAlign="center"
      headerRightButtons={["bell", "settings"]}
    >
      {/* 1. 인사 + 날짜 */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 4 }}>
          안녕하세요, 효인님
        </Text>
        <Text style={{ fontSize: 14, color: "#666" }}>
          오늘은 12월 12일 금요일이에요.
        </Text>
      </View>

      {/* 2. 오늘 해야 할 일 */}
      <View style={{ marginBottom: 24 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            marginBottom: 12,
          }}
        >
          오늘 해야 할 일
        </Text>

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

              {task.location && (
                <Text style={{ fontSize: 12, color: "#777" }}>
                  {task.location}
                </Text>
              )}
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

      {/* 3. 요약 카드 3개 */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 24,
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

      {/* 4. 다가오는 교체 주기 */}
      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            marginBottom: 10,
          }}
        >
          다가오는 교체 주기
        </Text>

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

      {/* 5. 다가오는 유통기한 */}
      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            marginBottom: 10,
          }}
        >
          다가오는 유통기한
        </Text>

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
