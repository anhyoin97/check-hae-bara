import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import CommonLayout from "../../components/layout/CommonLayout";
import { clearFiredNotis, deleteFiredNoti, getFiredNotis, FiredNoti } from "../../lib/notiHistory";
import * as Notifications from "expo-notifications";


export default function NotificationsScreen() {
  const [items, setItems] = useState<FiredNoti[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const list = await getFiredNotis();
    list.sort((a, b) => b.firedAt - a.firedAt);
    setItems(list);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const onDeleteOne = async (id: string) => {
    await deleteFiredNoti(id);
    await load();
  };

  const onClearAll = async () => {
    await clearFiredNotis();
    await load();
  };

  return (
    <CommonLayout title="알림" headerAlign="center" headerRightButtons={[]}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>알림 목록</Text>

          <Pressable onPress={onClearAll} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>전체 삭제</Text>
          </Pressable>

          <Pressable
            onPress={async () => {
              const id = await Notifications.scheduleNotificationAsync({
                content: {
                  title: "테스트 알림",
                  body: "알림이 울립니다.",
                },
                trigger: null,
              });
              console.log("scheduled id:", id);
            }}
            style={styles.clearBtn}
          >
            <Text style={styles.clearBtnText}>10초 테스트</Text>
          </Pressable>
        </View>

        {loading ? (
          <Text style={styles.placeholder}>불러오는 중...</Text>
        ) : items.length === 0 ? (
          <Text style={styles.placeholder}>아직 울린 알림이 없어요.</Text>
        ) : (
          items.map((n) => (
            <View key={n.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{n.title ?? "(제목 없음)"}</Text>
                {!!n.body && <Text style={styles.rowBody}>{n.body}</Text>}
                <Text style={styles.rowTime}>{formatKoreanDateTime(n.firedAt)}</Text>
              </View>

              <Pressable onPress={() => onDeleteOne(n.id)} style={styles.deleteBtn}>
                <Text style={styles.deleteBtnText}>삭제</Text>
              </Pressable>
            </View>
          ))
        )}
      </View>
    </CommonLayout>
  );
}

function formatKoreanDateTime(epochMs: number) {
  const d = new Date(epochMs);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yy}.${mm}.${dd} ${hh}:${mi}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { fontSize: 16, fontWeight: "700" },

  clearBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 10,
  },
  clearBtnText: { fontSize: 12, fontWeight: "600" },

  placeholder: { opacity: 0.6 },

  row: {
    flexDirection: "row",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  rowTitle: { fontSize: 14, fontWeight: "700" },
  rowBody: { marginTop: 4, fontSize: 12, opacity: 0.8 },
  rowTime: { marginTop: 6, fontSize: 12, opacity: 0.6 },

  deleteBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 10,
  },
  deleteBtnText: { fontSize: 12, fontWeight: "600" },
});
