// app/(tabs)/index.tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import CommonLayout from "../../components/layout/CommonLayout";
import { getOrCreateUserId } from "../../lib/user";
import { db } from "../../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import type { Product } from "../../types/product";

import { COLORS, SPACING, commonStyles } from "../../styles/common";

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

type SummaryKey = "all" | "upcoming7" | "expired" | "thisWeek" | null;

type DetailRow = {
  id: string;
  name: string;
  type: TaskType; // "cycle" | "expiry"
  dday: string;   // "D-Day" | "D-1" | "D+1" etc
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <View style={commonStyles.sectionTitleWrap}>
      <Text style={commonStyles.sectionTitleText}>{children}</Text>
      <View style={commonStyles.sectionTitleBar} />
    </View>
  );
}

function TaskTag({ type }: { type: TaskType }) {
  const isCycle = type === "cycle";
  return (
    <View
      style={[
        commonStyles.tagPill,
        { backgroundColor: isCycle ? COLORS.secondarySoft : COLORS.expirySoft },
      ]}
    >
      <Text
        style={[
          commonStyles.tagText,
          { color: isCycle ? COLORS.primary : COLORS.expiry },
        ]}
      >
        {isCycle ? "교체주기" : "유통기한"}
      </Text>
    </View>
  );
}

function parseDdayToNumber(dday: string): number {
  // "D-Day" => 0, "D-3" => 3, "D+2" => -2 (만료/지연을 음수로)
  if (!dday) return 9999;
  if (dday === "D-Day") return 0;

  const m = dday.match(/^D([+-])(\d+)$/);
  if (!m) return 9999;

  const sign = m[1];
  const n = Number(m[2]);
  if (Number.isNaN(n)) return 9999;

  return sign === "-" ? n : -n;
}

export default function HomeScreen() {
  const today = useMemo(() => new Date(), []);
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const weekdayNames = ["일", "월", "화", "수", "목", "금", "토"] as const;
  const weekday = weekdayNames[today.getDay()];

  const [userId, setUserId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // 요약 카드 클릭 시 아래 펼쳐질 패널 상태 
  const [openKey, setOpenKey] = useState<SummaryKey>(null);

  useEffect(() => {
    async function init() {
      const id = await getOrCreateUserId();
      setUserId(id);
      console.log("Home userId:", id);

      // 2025.12.20 AHI : 상품 조회 임시 주석
      // await loadMyProducts(id);
    }

    init();
  }, []);

  async function loadMyProducts(idParam?: string) {
    const uid = idParam ?? userId;
    if (!uid) return;

    setLoading(true);
    try {
      const q = query(collection(db, "products"), where("userId", "==", uid));
      const snapshot = await getDocs(q);

      const list: Product[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as any;

        list.push({
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
        });
      });

      setProducts(list);
      console.log("내 상품 개수:", list.length);
    } catch (e) {
      console.log("상품 조회 에러:", e);
    } finally {
      setLoading(false);
    }
  }

  const todayTasks: TodayTask[] = [
    { id: "1", name: "기저귀 갈기", type: "cycle", dday: "D-Day", location: "아기방" },
    { id: "2", name: "우유 유통기한", type: "expiry", dday: "D-1", location: "냉장고" },
    { id: "3", name: "가습기 물통 세척", type: "cycle", dday: "D-Day", location: "거실" },
  ];

  // 요약 카드용 더미 데이터
  const totalItems = 12;
  const upcomingWithin7Days = 5;
  const expiredCount = 2;

  const upcomingCycleItems: UpcomingItem[] = [
    { id: "1", name: "공기청정기 필터 교체", dday: "D-2" },
    { id: "2", name: "욕실 수건 교체", dday: "D-5" },
  ];

  const upcomingExpiryItems: UpcomingItem[] = [
    { id: "1", name: "두부", dday: "D-1" },
    { id: "2", name: "요거트", dday: "D-3" },
  ];

  const toggleOpen = (key: Exclude<SummaryKey, null>) => {
    setOpenKey((prev) => (prev === key ? null : key));
  };

  // “상세 목록 데이터” 만들기
  const baseAllRows: DetailRow[] = useMemo(() => {
    const rows: DetailRow[] = [
      ...upcomingExpiryItems.map((x) => ({
        id: `exp-${x.id}`,
        name: x.name,
        type: "expiry" as const,
        dday: x.dday,
      })),
      ...upcomingCycleItems.map((x) => ({
        id: `cyc-${x.id}`,
        name: x.name,
        type: "cycle" as const,
        dday: x.dday,
      })),

      { id: "m-1", name: "치약", type: "cycle", dday: "D-7" },
      { id: "m-2", name: "샴푸", type: "cycle", dday: "D-12" },
      { id: "m-3", name: "비타민", type: "expiry", dday: "D-20" },
      { id: "m-4", name: "세탁세제", type: "cycle", dday: "D-30" },
      { id: "m-5", name: "핸드워시", type: "cycle", dday: "D-15" },
      { id: "m-6", name: "김치", type: "expiry", dday: "D-4" },
      { id: "m-7", name: "마스크", type: "cycle", dday: "D-10" },
      { id: "m-8", name: "과일", type: "expiry", dday: "D-2" },
    ];

    const filled = rows.slice(0, totalItems);
    while (filled.length < totalItems) {
      const idx = filled.length + 1;
      filled.push({
        id: `auto-${idx}`,
        name: `추가 품목 ${idx}`,
        type: idx % 2 === 0 ? "cycle" : "expiry",
        dday: `D-${(idx % 14) + 1}`,
      });
    }

    return filled.sort((a, b) => parseDdayToNumber(a.dday) - parseDdayToNumber(b.dday));
  }, [upcomingCycleItems, upcomingExpiryItems, totalItems]);

  const detailConfig = useMemo(() => {
    const byKey: Record<Exclude<SummaryKey, null>, { title: string; countLabel: string; rows: DetailRow[] }> = {
      all: {
        title: "등록된 품목",
        countLabel: `${totalItems}개`,
        rows: baseAllRows,
      },
      upcoming7: {
        title: "7일 이내 교체/만료",
        countLabel: `${upcomingWithin7Days}개`,
        rows: baseAllRows
          .filter((r) => {
            const n = parseDdayToNumber(r.dday);
            // D-Day(0)~D-7(7)만
            return n >= 0 && n <= 7;
          })
          .slice(0, upcomingWithin7Days),
      },
      expired: {
        title: "지연/만료",
        countLabel: `${expiredCount}개`,
        rows: ([
          { id: "exd-1", name: "우유", type: "expiry", dday: "D+1" },
          { id: "exd-2", name: "요거트", type: "expiry", dday: "D+3" },
        ] as const).slice(0, expiredCount),
      },
      thisWeek: {
        title: "이번 주 할 일",
        countLabel: `${todayTasks.length}건`,
        rows: todayTasks.map((t) => ({
          id: `wk-${t.id}`,
          name: t.name,
          type: t.type,
          dday: t.dday,
        })),
      },
    };

    return openKey ? byKey[openKey] : null;
  }, [openKey, baseAllRows, totalItems, upcomingWithin7Days, expiredCount, todayTasks.length]);

  return (
    <CommonLayout
      title="CHECKHABALA"
      headerAlign="center"
      headerRightButtons={["bell", "settings"]}
    >
      {/* 인사 + 날짜 */}
      <View style={commonStyles.greetingSection}>
        <Text style={commonStyles.greetTitle}>당신의 일상을 체크해바라.</Text>
        <Text style={commonStyles.greetDesc}>
          오늘은 {month}월 {day}일 {weekday}요일이에요.{"\n"}
          오늘 하루도 교체해야할 상품을 확인해볼까요?
        </Text>
      </View>

      {/* 오늘 해야 할 일 */}
      <View style={commonStyles.section}>
        <SectionTitle>오늘 해야 할 일</SectionTitle>
        <View style={commonStyles.divider} />

        {todayTasks.map((task) => {
          const isCycle = task.type === "cycle";

          return (
            <View key={task.id} style={commonStyles.taskCard}>
              {/* LEFT */}
              <View style={commonStyles.taskLeft}>
                <View style={commonStyles.taskTitleRow}>
                  <TaskTag type={task.type} />
                  <Text style={commonStyles.taskName} numberOfLines={1} ellipsizeMode="tail">
                    {task.name}
                  </Text>
                </View>
              </View>

              {/* RIGHT */}
              <Text
                style={[
                  commonStyles.taskDday,
                  { color: isCycle ? COLORS.secondaryText : COLORS.expiry },
                ]}
              >
                {task.dday}
              </Text>
            </View>
          );
        })}
      </View>

      {/* 나의 물품 요약 (카드 클릭 -> 아래 상세 리스트 펼침) */}
      <View style={{ marginBottom: SPACING.sectionGap }}>
        <SectionTitle>나의 물품 요약</SectionTitle>

        <View style={commonStyles.summaryGrid}>
          {/* 등록된 품목 */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => toggleOpen("all")}
            style={[
              commonStyles.summaryCardLg,
              openKey === "all" && commonStyles.summaryCardActive,
            ]}
          >
            <View style={commonStyles.summaryCardHeader}>
              <Text style={commonStyles.summaryLabel}>등록된 품목</Text>
              <Text style={{ color: COLORS.secondaryText, fontWeight: "800" }}>●</Text>
            </View>

            <View style={commonStyles.summaryValueRow}>
              <Text style={commonStyles.summaryValue}>{totalItems}</Text>
              <Text style={commonStyles.summaryUnit}>개</Text>
            </View>

            <Text style={commonStyles.summaryHint}>전체 등록된 항목 수</Text>
          </TouchableOpacity>

          {/* 7일 이내 교체/만료 */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => toggleOpen("upcoming7")}
            style={[
              commonStyles.summaryCardLg,
              openKey === "upcoming7" && commonStyles.summaryCardActive,
            ]}
          >
            <View style={commonStyles.summaryCardHeader}>
              <Text style={commonStyles.summaryLabel}>7일 이내 교체/만료</Text>
              <Text style={{ color: COLORS.expiry, fontWeight: "800" }}>●</Text>
            </View>

            <View style={commonStyles.summaryValueRow}>
              <Text style={commonStyles.summaryValue}>{upcomingWithin7Days}</Text>
              <Text style={commonStyles.summaryUnit}>개</Text>
            </View>

            <Text style={commonStyles.summaryHint}>다가오는 알림이 있어요</Text>
          </TouchableOpacity>

          {/* 지연/만료 */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => toggleOpen("expired")}
            style={[
              commonStyles.summaryCardDanger,
              openKey === "expired" && commonStyles.summaryCardActiveDanger,
            ]}
          >
            <View style={commonStyles.summaryCardHeader}>
              <Text style={commonStyles.summaryDangerLabel}>지연/만료</Text>
              <Text style={{ color: COLORS.danger, fontWeight: "800" }}>●</Text>
            </View>

            <View style={commonStyles.summaryValueRow}>
              <Text style={commonStyles.summaryDangerValue}>{expiredCount}</Text>
              <Text style={commonStyles.summaryUnit}>개</Text>
            </View>

            <Text style={commonStyles.summaryHint}>확인이 필요해요</Text>
          </TouchableOpacity>

          {/* 이번 주 할 일 */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => toggleOpen("thisWeek")}
            style={[
              commonStyles.summaryCardLg,
              openKey === "thisWeek" && commonStyles.summaryCardActive,
            ]}
          >
            <View style={commonStyles.summaryCardHeader}>
              <Text style={commonStyles.summaryLabel}>이번 주 할 일</Text>
              <Text style={{ color: COLORS.primary, fontWeight: "800" }}>●</Text>
            </View>

            <View style={commonStyles.summaryValueRow}>
              <Text style={commonStyles.summaryValue}>{todayTasks.length}</Text>
              <Text style={commonStyles.summaryUnit}>건</Text>
            </View>

            <Text style={commonStyles.summaryHint}>오늘/이번 주 항목</Text>
          </TouchableOpacity>
        </View>

        {/* 카드 클릭 시 아래에 상세 패널(리스트/테이블) 표시 */}
        {detailConfig && (
          <View style={commonStyles.detailPanel}>
            <View style={commonStyles.detailPanelHeader}>
              <Text style={commonStyles.detailPanelTitle}>
                {detailConfig.title} · {detailConfig.countLabel}
              </Text>
            </View>

            {/* 테이블 헤더 느낌 */}
            <View style={commonStyles.detailTableHeader}>
              <Text style={[commonStyles.detailTh, commonStyles.detailThName]}>품목</Text>
              <Text style={[commonStyles.detailTh, commonStyles.detailThType]}>유형</Text>
              <Text style={[commonStyles.detailTh, commonStyles.detailThDday]}>Day</Text>
            </View>

            {/* Rows */}
            {detailConfig.rows.map((r, idx) => {
              const isCycle = r.type === "cycle";
              const isExpired = r.dday.startsWith("D+"); // 지연/만료 표기용

              return (
                <View
                  key={r.id}
                  style={[
                    commonStyles.detailRow,
                    idx !== detailConfig.rows.length - 1 && commonStyles.detailRowBorder,
                  ]}
                >
                  {/* 품목 */}
                  <Text style={commonStyles.detailName} numberOfLines={1} ellipsizeMode="tail">
                    {r.name}
                  </Text>

                  {/* 유형 */}
                  <View style={commonStyles.detailTypeWrap}>
                    <TaskTag type={r.type} />
                  </View>

                  {/* Day */}
                  <Text
                    style={[
                      commonStyles.detailDday,
                      {
                        color: isExpired
                          ? COLORS.danger
                          : isCycle
                            ? COLORS.secondaryText
                            : COLORS.expiry,
                      },
                    ]}
                  >
                    {r.dday}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </CommonLayout>
  );
}
