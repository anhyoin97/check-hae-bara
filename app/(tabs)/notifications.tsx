import React from "react";
import { View, Text, StyleSheet } from "react-native";
import CommonLayout from "../../components/layout/CommonLayout";

const dummyPast = [
  { id: "1", title: "칫솔 교체 알림", time: "2025.12.20 09:00" },
  { id: "2", title: "샴푸 유통기한 알림", time: "2025.12.18 21:30" },
];

const dummyFuture = [
  { id: "a", title: "세제 교체 알림", time: "2025.12.30 10:00" },
  { id: "b", title: "면도기 교체 알림", time: "2026.01.02 08:00" },
];

export default function NotificationsScreen() {
  return (
    <CommonLayout title="알림" headerAlign="center" headerRightButtons={[]}>
      <View style={styles.container}>
        {/* 과거 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>이전 알림 목록</Text>
          {dummyPast.length === 0 ? (
            <Text style={styles.placeholder}>아직 울린 알림이 없어요.</Text>
          ) : (
            dummyPast.map((n) => (
              <View key={n.id} style={styles.row}>
                <Text style={styles.rowTitle}>{n.title}</Text>
                <Text style={styles.rowTime}>{n.time}</Text>
              </View>
            ))
          )}
        </View>

        {/* 예정 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>알림 예정 목록</Text>
          {dummyFuture.length === 0 ? (
            <Text style={styles.placeholder}>예정된 알림이 없어요.</Text>
          ) : (
            dummyFuture.map((n) => (
              <View key={n.id} style={styles.row}>
                <Text style={styles.rowTitle}>{n.title}</Text>
                <Text style={styles.rowTime}>{n.time}</Text>
              </View>
            ))
          )}
        </View>
      </View>
    </CommonLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 18 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  placeholder: { opacity: 0.6 },
  row: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 6 },
  rowTitle: { fontSize: 14, fontWeight: "600" },
  rowTime: { fontSize: 12, opacity: 0.7 },
});
