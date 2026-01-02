// app/(tabs)/schedule.tsx
import React, { useMemo, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { Calendar, type DateData } from "react-native-calendars";
import type { MarkedDates } from "react-native-calendars/src/types";

type NotiItem = {
  id: string;
  title: string;
  fireDate: string; // "YYYY-MM-DD"
  type?: "CYCLE" | "EXPIRY";
};

const MOCK_NOTIS: NotiItem[] = [
  { id: "1", title: "휴지 교체", fireDate: "2026-01-02", type: "CYCLE" },
  { id: "2", title: "샴푸 교체", fireDate: "2026-01-02", type: "CYCLE" },
  { id: "3", title: "우유 유통기한", fireDate: "2026-01-05", type: "EXPIRY" },
];

function todayYMD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function ScheduleScreen() {
  // 나중에 가져온 데이터로 교체
  const notis = MOCK_NOTIS;

  const [selectedDate, setSelectedDate] = useState<string>(todayYMD());

  // 날짜별 알림 묶기
  const byDate = useMemo(() => {
    const map = new Map<string, NotiItem[]>();
    for (const n of notis) {
      if (!n.fireDate) continue;
      const key = n.fireDate;
      const arr = map.get(key) ?? [];
      arr.push(n);
      map.set(key, arr);
    }
    return map;
  }, [notis]);

  // 캘린더 표시용 markedDates 생성 
  const markedDates: MarkedDates = useMemo(() => {
    const result: MarkedDates = {};

    for (const [date, items] of byDate.entries()) {
      result[date] = {
        marked: true,
        dots: items.slice(0, 3).map((it) => ({
          key: it.id,
          color: it.type === "EXPIRY" ? "#E11D48" : "#111111",
        })),
      };
    }

    result[selectedDate] = {
      ...(result[selectedDate] ?? {}),
      selected: true,
      selectedColor: "#111111",
    };

    return result;
  }, [byDate, selectedDate]);

  const dayNotis = useMemo(() => byDate.get(selectedDate) ?? [], [byDate, selectedDate]);

  const onDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>일정</Text>

      <View style={styles.calendarCard}>
        <Calendar
          markingType="multi-dot"
          markedDates={markedDates}
          onDayPress={onDayPress}
          enableSwipeMonths
          theme={{
            textDayFontSize: 14,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 12,
            todayTextColor: "#111111",
            arrowColor: "#111111",
          }}
        />
      </View>

      <View style={styles.listWrap}>
        <Text style={styles.listTitle}>
          {selectedDate} 알림 {dayNotis.length}개
        </Text>

        {dayNotis.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>이 날짜에는 알림이 없어요.</Text>
          </View>
        ) : (
          <FlatList
            data={dayNotis}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            renderItem={({ item }) => (
              <Pressable
                style={styles.row}
                onPress={() => {
                  
                  console.log("go detail:", item.id);
                }}
              >
                <View style={[styles.badge, item.type === "EXPIRY" ? styles.badgeExpiry : styles.badgeCycle]}>
                  <Text style={styles.badgeText}>{item.type === "EXPIRY" ? "유통" : "교체"}</Text>
                </View>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {item.title}
                </Text>
              </Pressable>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F7F9", paddingHorizontal: 16, paddingTop: 12 },
  header: { fontSize: 22, fontWeight: "800", marginBottom: 12, color: "#111111" },

  calendarCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 8,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },

  listWrap: { flex: 1, marginTop: 14 },
  listTitle: { fontSize: 14, fontWeight: "700", color: "#333333", marginBottom: 10 },

  emptyBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { color: "#777777", fontWeight: "600" },

  row: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeCycle: { backgroundColor: "#111111" },
  badgeExpiry: { backgroundColor: "#E11D48" },

  badgeText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  rowTitle: { flex: 1, fontSize: 15, fontWeight: "700", color: "#111111" },

  sep: { height: 10 },
});
