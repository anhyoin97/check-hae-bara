import { StyleSheet } from "react-native";

export const common = StyleSheet.create({
  /* ===== 텍스트 ===== */
  label: {
    fontSize: 14,
    color: "#888",
    marginBottom: 4,
  },

  subLabel: {
    fontSize: 13,
    color: "#888",
    marginBottom: 4,
  },

  errorText: {
    fontSize: 12,
    color: "#FF3B30",
    marginTop: 6,
  },

  /* ===== 입력 ===== */
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  inputError: {
    borderColor: "#FF3B30",
  },

  /* ===== 여백 ===== */
  gap8: { height: 8 },
  gap12: { height: 12 },
  gap16: { height: 16 },
  gap20: { height: 20 },
  gap24: { height: 24 },

  /* ===== 세그먼트 / 버튼 ===== */
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    alignItems: "center",
  },

  segmentActive: {
    borderColor: "#007AFF",
    backgroundColor: "#E5F3FF",
  },

  segmentText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },

  segmentTextActive: {
    color: "#007AFF",
  },

  /* ===== 칩 ===== */
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },

  chipActive: {
    borderColor: "#007AFF",
    backgroundColor: "#E5F3FF",
  },

  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },

  chipTextActive: {
    color: "#007AFF",
  },
});
