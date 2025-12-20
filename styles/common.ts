// styles/common.ts
import { StyleSheet } from "react-native";

export const COLORS = {
  // brand
  primary: "#156D2C",
  secondary: "#93D658",
  secondaryText: "#2E7A2A",
  secondarySoft: "#F1FAE8",

  // expiry
  expiry: "#B45309",
  expirySoft: "#FFF3E6",

  // text
  text: "#111111",
  subText: "#555555",
  muted: "#777777",

  // surface
  background: "#FFFFFF",
  card: "#FFFFFF",
  cardSoft: "#F6F8F6",
  border: "#E6E8EB",

  // danger (만료/지연)
  danger: "#D64545",
  dangerSoft: "#FFF1F1",
} as const;

export const SPACING = {
  sectionGap: 32,
  sectionTitleGap: 16,
  sectionTitleBarGap: 4,
  greetingTop: 10,
  taskGap: 8,
} as const;

export const RADIUS = {
  sm: 10,
  md: 12,
  pill: 999,
} as const;

export const commonStyles = StyleSheet.create({
  // layout
  section: {
    marginBottom: SPACING.sectionGap,
  },
  greetingSection: {
    backgroundColor: COLORS.background,
    padding: 25,
    borderRadius: 16,
    marginBottom: SPACING.sectionGap,
    marginTop: SPACING.greetingTop,

    // 부드러운 그림자
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  // typography
  greetTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 18,
    color: COLORS.text,
  },
  greetDesc: {
    fontSize: 14,
    color: COLORS.subText,
    lineHeight: 20,
  },

  // section title
  sectionTitleWrap: {
    marginBottom: SPACING.sectionTitleGap,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: SPACING.sectionTitleBarGap,
    color: COLORS.text,
  },
  sectionTitleBar: {
    width: 28,
    height: 3,
    backgroundColor: COLORS.primary, // ✅ 메인 색상은 여기 “서명”으로만
    borderRadius: 2,
  },

  divider: {
    height: 1,
    backgroundColor: "#EDEDED",
    marginBottom: 16,
  },

  // today task card
  taskCard: {
    backgroundColor: "#F2F8F4",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  taskLeft: {
    flex: 1,
    paddingRight: 12,
  },
  taskTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  taskName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    flexShrink: 1,
  },
  taskDday: {
    fontSize: 14,
    fontWeight: "800",
    flexShrink: 0,
  },

  // tag/chip
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    marginRight: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "600",
  },

  // summary cards
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12, // RN 버전에 따라 미지원일 수 있음(그때는 index에서 justifyContent 방식으로)
  },

  summaryCardLg: {
    width: "48%",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },

  // 선택된 상태(카드 탭 시)
  summaryCardActive: {
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  summaryCardActiveDanger: {
    borderWidth: 1,
    borderColor: COLORS.danger,
  },

  summaryCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  summaryLabel: {
    fontSize: 13,
    color: COLORS.muted,
    fontWeight: "600",
  },

  summaryValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },

  summaryValue: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -0.2,
  },

  summaryUnit: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.muted,
  },

  summaryHint: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.subText,
  },

  // danger summary card
  summaryCardDanger: {
    width: "48%",
    backgroundColor: COLORS.dangerSoft,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },

  summaryDangerLabel: {
    fontSize: 13,
    color: COLORS.danger,
    fontWeight: "700",
  },

  summaryDangerValue: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.danger,
    letterSpacing: -0.2,
  },

  // (구버전 대비 유지용) list rows
  listRow: {
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  listRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  listItemName: {
    fontSize: 14,
    color: COLORS.text,
  },
  listDdayBase: {
    fontSize: 13,
    fontWeight: "600",
  },

  // ===== 나의 물품 요약 상세 보기 패널 =====
  detailPanel: {
    marginTop: 12,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },

  detailPanelHeader: {
    paddingVertical: 10,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
    marginBottom: 6,
  },

  detailPanelTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },

  // 테이블 헤더 느낌
  detailTableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
    marginBottom: 2,
  },

  detailTh: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.muted,
  },
  detailThName: { flex: 1.2 },
  detailThType: { flex: 0.9, textAlign: "left" },
  detailThDday: { width: 58, textAlign: "right" },

  // Row
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  // 컬럼들
  detailName: {
    flex: 1.2,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    paddingRight: 10,
  },

  detailTypeWrap: {
    flex: 0.9,
    alignItems: "flex-start",
  },

  detailDday: {
    width: 58,
    textAlign: "right",
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 12,
  },
});
