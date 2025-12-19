// app/(tabs)/add-item.tsx
import React, { useState, useEffect, useMemo } from "react";
import { View, Text, TextInput, Button, TouchableOpacity, Alert } from "react-native";
import CommonLayout from "../../components/layout/CommonLayout";
import { db } from "../../lib/firebase";
import { getOrCreateUserId } from "../../lib/user";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import type { Product } from "../../types/product";
import { common } from "../../styles/common";

type ReminderMode = "NONE" | "REPEAT" | "ONCE";
type RepeatType = "DAILY" | "WEEKLY" | "MONTHLY_DATE";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function isValidDateText(s: string) {
  // 날짜 검증
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;

  const [y, m, d] = s.split("-").map(Number);

  if (m < 1 || m > 12) return false;

  if (d < 1 || d > 31) return false;

  const dt = new Date(y, m - 1, d);

  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

function isValidTimeText(s: string) {
  // HH:mm
  if (!/^\d{2}:\d{2}$/.test(s)) return false;
  const [hh, mm] = s.split(":").map(Number);
  if (hh < 0 || hh > 23) return false;
  if (mm < 0 || mm > 59) return false;
  return true;
}

function parseDateTextToLocalDate(dateText: string) {
  const [y, m, d] = dateText.split("-").map(Number);

  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function applyTime(date: Date, timeHHmm: string) {
  const [hh, mm] = timeHHmm.split(":").map(Number);
  const d = new Date(date);
  d.setHours(hh, mm, 0, 0);

  return d;
}

function lastDayOfMonth(year: number, monthIndex0: number) {
  return new Date(year, monthIndex0 + 1, 0).getDate();
}

function addMonthsClamped(base: Date, months: number) {
  // "6개월" 계산은 월 단위로. (예: 1/31 + 1개월 → 2월 마지막날로 보정)
  const y = base.getFullYear();
  const m = base.getMonth();
  const d = base.getDate();

  const targetMonth = m + months;
  const ty = y + Math.floor(targetMonth / 12);
  const tm = ((targetMonth % 12) + 12) % 12;

  const ld = lastDayOfMonth(ty, tm);
  const cd = Math.min(d, ld);

  const out = new Date(base);
  out.setFullYear(ty, tm, cd);
  return out;
}

function formatDateTime(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(
    d.getHours()
  )}:${pad2(d.getMinutes())}`;
}

/**
 * "매월 특정 일" 보정 규칙:
 * - 요청 dayOfMonth가 해당 월의 마지막날보다 크면 "마지막날"로 보정
 */
function monthlyDateWithLastDayClamp(year: number, monthIndex0: number, dayOfMonth: number) {
  const ld = lastDayOfMonth(year, monthIndex0);
  const dd = Math.min(dayOfMonth, ld);
  return new Date(year, monthIndex0, dd, 0, 0, 0, 0);
}

/**
 * 다음 알림(로컬) 계산
 * - endDate가 있으면 초과 시 null
 */
function computeNextReminder(params: {
  now: Date;
  startDateText: string;
  endDateText?: string;
  mode: ReminderMode;
  repeatType?: RepeatType;
  timeHHmm?: string;
  everyNDays?: number;
  weekdays?: number[]; // 0=일~6=토
  dayOfMonth?: number; // 1~31
  onceDateText?: string;
  onceTimeHHmm?: string;
}) {
  const {
    now,
    startDateText,
    endDateText,
    mode,
    repeatType,
    timeHHmm,
    everyNDays,
    weekdays,
    dayOfMonth,
    onceDateText,
    onceTimeHHmm,
  } = params;

  if (!isValidDateText(startDateText)) return null;
  const startDate = parseDateTextToLocalDate(startDateText);

  let endDate: Date | null = null;
  if (endDateText && endDateText.trim()) {
    if (!isValidDateText(endDateText.trim())) return null;
    endDate = applyTime(parseDateTextToLocalDate(endDateText.trim()), "23:59");
  }

  const withinEnd = (d: Date) => {
    if (!endDate) return true;
    return d.getTime() <= endDate.getTime();
  };

  if (mode === "NONE") return null;

  if (mode === "ONCE") {
    if (!onceDateText || !onceTimeHHmm) return null;
    if (!isValidDateText(onceDateText) || !isValidTimeText(onceTimeHHmm)) return null;
    const dt = applyTime(parseDateTextToLocalDate(onceDateText), onceTimeHHmm);
    // 시작일보다 전이면 무효 처리(사용자 실수 방지)
    if (dt.getTime() < startDate.getTime()) return null;
    if (dt.getTime() < now.getTime()) return null;
    if (!withinEnd(dt)) return null;
    return dt;
  }

  // REPEAT
  if (!repeatType || !timeHHmm || !isValidTimeText(timeHHmm)) return null;

  // 시작 기준 시간
  const startAt = applyTime(startDate, timeHHmm);

  // 지금보다 과거면 다음으로 밀기
  if (repeatType === "DAILY") {
    const n = everyNDays && everyNDays > 0 ? Math.floor(everyNDays) : 1;

    // startAt 기준으로 n일 단위 반복
    const diffMs = now.getTime() - startAt.getTime();
    const dayMs = 24 * 60 * 60 * 1000;

    let k = 0;
    if (diffMs > 0) {
      k = Math.ceil(diffMs / (n * dayMs));
    }
    const next = new Date(startAt.getTime() + k * n * dayMs);
    if (next.getTime() < now.getTime()) {
      
      next.setTime(next.getTime() + n * dayMs);
    }
    if (!withinEnd(next)) return null;
    return next;
  }

  if (repeatType === "WEEKLY") {
    const days = (weekdays && weekdays.length ? weekdays : [now.getDay()]).slice().sort();
    // startAt 이후부터 탐색 
    for (let i = 0; i < 7; i++) {
      const cand = new Date(startAt);
      cand.setDate(startAt.getDate() + i);

      const wd = cand.getDay();
      if (!days.includes(wd)) continue;

      // "그 날 time" 적용
      const candAt = applyTime(parseDateTextToLocalDate(
        `${cand.getFullYear()}-${pad2(cand.getMonth() + 1)}-${pad2(cand.getDate())}`
      ), timeHHmm);

      if (candAt.getTime() < startAt.getTime()) continue;
      if (candAt.getTime() < now.getTime()) continue;
      if (!withinEnd(candAt)) return null;
      return candAt;
    }
    return null;
  }

  if (repeatType === "MONTHLY_DATE") {
    const dom = dayOfMonth && dayOfMonth >= 1 && dayOfMonth <= 31 ? Math.floor(dayOfMonth) : 1;

    // startDate의 달부터 차례로 탐색 
    const maxTryMonths = 6;
    for (let i = 0; i < maxTryMonths; i++) {
      const base = addMonthsClamped(startDate, i);
      const y = base.getFullYear();
      const m0 = base.getMonth();

      // "그 달의 dom" (마지막날 보정)
      const candDate = monthlyDateWithLastDayClamp(y, m0, dom);
      const candAt = applyTime(candDate, timeHHmm);

      // startAt 이전이면 스킵
      if (candAt.getTime() < startAt.getTime()) continue;
      if (candAt.getTime() < now.getTime()) continue;
      if (!withinEnd(candAt)) return null;
      return candAt;
    }
    return null;
  }

  return null;
}

export default function AddItemScreen() {
  const [userId, setUserId] = useState<string | null>(null);

  // 폼 상태
  const [name, setName] = useState("");
  const [type, setType] = useState<"cycle" | "expiry">("cycle");
  const [location, setLocation] = useState("");
  const [cycleDays, setCycleDays] = useState("7"); // 교체주기형 기본값 7일
  const [expiryDateText, setExpiryDateText] = useState(""); // YYYY-MM-DD 문자열

  // ===== 교체주기형 알림 설정 =====
  const todayText = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  }, []);

  const [reminderMode, setReminderMode] = useState<ReminderMode>("REPEAT"); // 기본: 반복
  const [repeatType, setRepeatType] = useState<RepeatType>("DAILY"); // 기본: 매일
  const [startDateText, setStartDateText] = useState(todayText); // 기본: 오늘
  const [endDateText, setEndDateText] = useState(""); // 선택
  const [timeHHmm, setTimeHHmm] = useState("09:00"); // 기본 시간
  const [everyNDays, setEveryNDays] = useState("1"); // 매 N일
  const [weekdays, setWeekdays] = useState<number[]>([1]); // 기본: 월(1)
  const [dayOfMonth, setDayOfMonth] = useState("1"); // 매월 1일(31도 가능)
  const [onceDateText, setOnceDateText] = useState("");
  const [onceTimeHHmm, setOnceTimeHHmm] = useState("09:00");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function init() {
      const id = await getOrCreateUserId();
      setUserId(id);
    }
    init();
  }, []);

  // 6개월 제한: 종료일 검증용
  const sixMonthsLimit = useMemo(() => {
    if (!isValidDateText(startDateText)) return null;
    const start = parseDateTextToLocalDate(startDateText);
    // start + 6개월 (같은 일자가 없으면 말일 보정)
    const limit = addMonthsClamped(start, 6);
    
    return limit;
  }, [startDateText]);

  const nextReminderPreview = useMemo(() => {
    if (type !== "cycle") return null;

    const now = new Date();
    const next = computeNextReminder({
      now,
      startDateText,
      endDateText: endDateText.trim() || undefined,
      mode: reminderMode,
      repeatType,
      timeHHmm,
      everyNDays: Number(everyNDays),
      weekdays,
      dayOfMonth: Number(dayOfMonth),
      onceDateText: onceDateText.trim() || undefined,
      onceTimeHHmm: onceTimeHHmm.trim() || undefined,
    });

    return next ? formatDateTime(next) : null;
  }, [
    type,
    reminderMode,
    repeatType,
    startDateText,
    endDateText,
    timeHHmm,
    everyNDays,
    weekdays,
    dayOfMonth,
    onceDateText,
    onceTimeHHmm,
  ]);

  function toggleWeekday(d: number) {
    setWeekdays((prev) => {
      if (prev.includes(d)) return prev.filter((x) => x !== d);
      return [...prev, d].sort((a, b) => a - b);
    });
  }

  function validateEndDate6Months() {
    if (!endDateText.trim()) return true;
    if (!isValidDateText(endDateText.trim())) return false;
    if (!sixMonthsLimit) return false;

    const start = parseDateTextToLocalDate(startDateText);
    const end = parseDateTextToLocalDate(endDateText.trim());

    // end는 start 이전이면 안됨
    if (end.getTime() < start.getTime()) return false;

    // end <= start+6개월 (월 단위)
    return end.getTime() <= sixMonthsLimit.getTime();
  }

  async function handleSave() {
    if (!userId) {
      Alert.alert("에러", "userId를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    if (!name.trim()) {
      Alert.alert("입력 필요", "물품 이름을 입력해주세요.");
      return;
    }

    // type에 따라 서로 다른 필드
    const baseData: Partial<Product> & { userId: string } = {
      userId,
      name: name.trim(),
      type,
      location: location.trim() || undefined,
      isArchived: false,
    };

    // Firestore
    const payload: any = {
      ...baseData,
      createdAt: serverTimestamp(),
    };

    if (type === "cycle") {
      const days = Number(cycleDays);
      if (!days || days <= 0) {
        Alert.alert("입력 필요", "교체 주기를 1 이상의 숫자로 입력해주세요.");
        return;
      }
      payload.cycleDays = days;

      // ===== 알림 설정 검증/저장 =====
      if (!isValidDateText(startDateText)) {
        Alert.alert("입력 필요", "시작일은 YYYY-MM-DD 형식으로 입력해주세요.");
        return;
      }

      if (!validateEndDate6Months()) {
        Alert.alert(
          "입력 오류",
          "종료일은 시작일 이후여야 하고, 최대 6개월 이내만 가능합니다. (예: 시작일 기준 +6개월)"
        );
        return;
      }

      // 알림 OFF 상태(선택): NONE
      if (reminderMode === "NONE") {
        payload.reminder = {
          enabled: false,
          mode: "NONE",
          startDate: startDateText.trim(),
          endDate: endDateText.trim() || null,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Seoul",
          updatedAt: new Date().toISOString(),
        };
      } else if (reminderMode === "ONCE") {
        if (!onceDateText.trim() || !onceTimeHHmm.trim()) {
          Alert.alert("입력 필요", "한 번 알림 날짜/시간을 입력해주세요.");
          return;
        }
        if (!isValidDateText(onceDateText.trim())) {
          Alert.alert("입력 오류", "한 번 알림 날짜는 YYYY-MM-DD 형식으로 입력해주세요.");
          return;
        }
        if (!isValidTimeText(onceTimeHHmm.trim())) {
          Alert.alert("입력 오류", "한 번 알림 시간은 HH:mm 형식으로 입력해주세요. (예: 09:00)");
          return;
        }

        // 6개월 제한: once도 종료일/시작일 범위 안에서만
        const start = parseDateTextToLocalDate(startDateText.trim());
        const once = applyTime(parseDateTextToLocalDate(onceDateText.trim()), onceTimeHHmm.trim());
        if (once.getTime() < start.getTime()) {
          Alert.alert("입력 오류", "한 번 알림은 시작일 이후로 설정해주세요.");
          return;
        }
        if (sixMonthsLimit && once.getTime() > addMonthsClamped(start, 6).getTime()) {
          Alert.alert("입력 오류", "한 번 알림은 시작일 기준 최대 6개월 이내만 가능합니다.");
          return;
        }

        payload.reminder = {
          enabled: true,
          mode: "ONCE",
          startDate: startDateText.trim(),
          endDate: endDateText.trim() || null,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Seoul",
          once: {
            date: onceDateText.trim(),
            time: onceTimeHHmm.trim(),
          },
          // 저장 시점 기준 다음 알림(미리보기)도 같이 저장
          nextPreview: nextReminderPreview || null,
          updatedAt: new Date().toISOString(),
        };
      } else {
        // REPEAT
        if (!isValidTimeText(timeHHmm.trim())) {
          Alert.alert("입력 오류", "알림 시간은 HH:mm 형식으로 입력해주세요. (예: 09:00)");
          return;
        }

        if (repeatType === "DAILY") {
          const n = Number(everyNDays);
          if (!n || n <= 0) {
            Alert.alert("입력 오류", "N일은 1 이상의 숫자로 입력해주세요.");
            return;
          }
          payload.reminder = {
            enabled: true,
            mode: "REPEAT",
            startDate: startDateText.trim(),
            endDate: endDateText.trim() || null,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Seoul",
            repeat: {
              type: "DAILY",
              everyNDays: Math.floor(n),
              time: timeHHmm.trim(),
            },
            nextPreview: nextReminderPreview || null,
            updatedAt: new Date().toISOString(),
          };
        }

        if (repeatType === "WEEKLY") {
          if (!weekdays.length) {
            Alert.alert("입력 오류", "요일을 최소 1개 선택해주세요.");
            return;
          }
          payload.reminder = {
            enabled: true,
            mode: "REPEAT",
            startDate: startDateText.trim(),
            endDate: endDateText.trim() || null,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Seoul",
            repeat: {
              type: "WEEKLY",
              weekdays,
              time: timeHHmm.trim(),
            },
            nextPreview: nextReminderPreview || null,
            updatedAt: new Date().toISOString(),
          };
        }

        if (repeatType === "MONTHLY_DATE") {
          const dom = Number(dayOfMonth);
          if (!dom || dom < 1 || dom > 31) {
            Alert.alert("입력 오류", "매월 일자는 1~31 사이로 입력해주세요.");
            return;
          }
          // "말일 보정"은 계산 로직에서 처리됨 (저장은 31 그대로 저장)
          payload.reminder = {
            enabled: true,
            mode: "REPEAT",
            startDate: startDateText.trim(),
            endDate: endDateText.trim() || null,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Seoul",
            repeat: {
              type: "MONTHLY_DATE",
              dayOfMonth: Math.floor(dom),
              time: timeHHmm.trim(),
              clampToLastDay: true, 
            },
            nextPreview: nextReminderPreview || null,
            updatedAt: new Date().toISOString(),
          };
        }
      }
    } else if (type === "expiry") {
      if (!expiryDateText.trim()) {
        Alert.alert("입력 필요", "유통기한 날짜(YYYY-MM-DD)를 입력해주세요.");
        return;
      }
      payload.expiryDate = expiryDateText.trim();
    }

    try {
      setSaving(true);
      await addDoc(collection(db, "products"), payload);
      Alert.alert("완료", "물품이 등록되었습니다.");

      // 폼 초기화
      setName("");
      setLocation("");
      setCycleDays("7");
      setExpiryDateText("");

      // 알림 섹션 초기화(교체 주기형)
      setReminderMode("REPEAT");
      setRepeatType("DAILY");
      setStartDateText(todayText);
      setEndDateText("");
      setTimeHHmm("09:00");
      setEveryNDays("1");
      setWeekdays([1]);
      setDayOfMonth("1");
      setOnceDateText("");
      setOnceTimeHHmm("09:00");
    } catch (e) {
      console.log("물품 저장 에러:", e);
      Alert.alert("에러", "물품 저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <CommonLayout title="물품 등록" headerAlign="center" headerRightButtons={[]}>
      <View style={{ marginTop: 16 }}>
        <Text style={common.label}>물품 이름</Text>
        <TextInput style={common.input} />

        <View style={{ height: 16 }} />

        <Text style={{ fontSize: 14, color: "#888", marginBottom: 4 }}>물품 유형</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            onPress={() => setType("cycle")}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: type === "cycle" ? "#007AFF" : "#ddd",
              backgroundColor: type === "cycle" ? "#E5F3FF" : "#fff",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: type === "cycle" ? "#007AFF" : "#333" }}>
              교체 주기형
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setType("expiry")}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: type === "expiry" ? "#FF8A00" : "#ddd",
              backgroundColor: type === "expiry" ? "#FFF3E5" : "#fff",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: type === "expiry" ? "#FF8A00" : "#333" }}>
              유통기한형
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 16 }} />

        <Text style={{ fontSize: 14, color: "#888", marginBottom: 4 }}>위치 (선택)</Text>
        <TextInput
          value={location}
          onChangeText={setLocation}
          placeholder="예: 아기방, 냉장고, 거실..."
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        />

        <View style={{ height: 16 }} />

        {type === "cycle" ? (
          <>
            <Text style={{ fontSize: 14, color: "#888", marginBottom: 4 }}>교체 주기 (일)</Text>
            <TextInput
              value={cycleDays}
              onChangeText={setCycleDays}
              keyboardType="number-pad"
              placeholder="예: 3 (3일마다)"
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            />

            <View style={{ height: 20 }} />

            {/* ===== 알림 설정 섹션 ===== */}
            <Text style={{ fontSize: 14, color: "#888", marginBottom: 8 }}>알림 설정</Text>

            <View style={{ flexDirection: "row", gap: 8 }}>
              {([
                { key: "NONE", label: "알림 끔" },
                { key: "REPEAT", label: "반복" },
                { key: "ONCE", label: "한 번만" },
              ] as const).map((x) => (
                <TouchableOpacity
                  key={x.key}
                  onPress={() => setReminderMode(x.key)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: reminderMode === x.key ? "#007AFF" : "#ddd",
                    backgroundColor: reminderMode === x.key ? "#E5F3FF" : "#fff",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "600", color: reminderMode === x.key ? "#007AFF" : "#333" }}>
                    {x.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ height: 12 }} />

            <Text style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>시작일 (YYYY-MM-DD)</Text>
            <TextInput
              value={startDateText}
              onChangeText={setStartDateText}
              placeholder="예: 2025-12-18"
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            />

            <View style={{ height: 12 }} />

            <Text style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>
              종료일 (선택, 최대 6개월) (YYYY-MM-DD)
            </Text>
            <TextInput
              value={endDateText}
              onChangeText={setEndDateText}
              placeholder={
                sixMonthsLimit
                  ? `예: ${sixMonthsLimit.getFullYear()}-${pad2(sixMonthsLimit.getMonth() + 1)}-${pad2(
                      sixMonthsLimit.getDate()
                    )} 까지`
                  : "예: 2026-06-18"
              }
              style={{
                borderWidth: 1,
                borderColor: validateEndDate6Months() ? "#ddd" : "#FF3B30",
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            />
            {!validateEndDate6Months() ? (
              <Text style={{ marginTop: 6, fontSize: 12, color: "#FF3B30" }}>
                종료일은 시작일 이후, 최대 6개월 이내만 가능합니다.
              </Text>
            ) : null}

            <View style={{ height: 12 }} />

            {reminderMode === "REPEAT" ? (
              <>
                <Text style={{ fontSize: 13, color: "#888", marginBottom: 6 }}>반복 유형</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {([
                    { key: "DAILY", label: "매일/N일" },
                    { key: "WEEKLY", label: "매주" },
                    { key: "MONTHLY_DATE", label: "매월(일자)" },
                  ] as const).map((x) => (
                    <TouchableOpacity
                      key={x.key}
                      onPress={() => setRepeatType(x.key)}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: repeatType === x.key ? "#007AFF" : "#ddd",
                        backgroundColor: repeatType === x.key ? "#E5F3FF" : "#fff",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: "600", color: repeatType === x.key ? "#007AFF" : "#333" }}>
                        {x.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={{ height: 12 }} />

                <Text style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>알림 시간 (HH:mm)</Text>
                <TextInput
                  value={timeHHmm}
                  onChangeText={setTimeHHmm}
                  placeholder="예: 09:00"
                  style={{
                    borderWidth: 1,
                    borderColor: isValidTimeText(timeHHmm.trim()) ? "#ddd" : "#FF3B30",
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                  }}
                />
                {!isValidTimeText(timeHHmm.trim()) ? (
                  <Text style={{ marginTop: 6, fontSize: 12, color: "#FF3B30" }}>
                    시간은 HH:mm 형식으로 입력해주세요. (예: 09:00)
                  </Text>
                ) : null}

                <View style={{ height: 12 }} />

                {repeatType === "DAILY" ? (
                  <>
                    <Text style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>N일 (1=매일)</Text>
                    <TextInput
                      value={everyNDays}
                      onChangeText={setEveryNDays}
                      keyboardType="number-pad"
                      placeholder="예: 1"
                      style={{
                        borderWidth: 1,
                        borderColor: "#ddd",
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                      }}
                    />
                  </>
                ) : null}

                {repeatType === "WEEKLY" ? (
                  <>
                    <Text style={{ fontSize: 13, color: "#888", marginBottom: 6 }}>요일 선택</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                      {weekdayLabels.map((label, idx) => {
                        const selected = weekdays.includes(idx);
                        return (
                          <TouchableOpacity
                            key={label}
                            onPress={() => toggleWeekday(idx)}
                            style={{
                              paddingVertical: 8,
                              paddingHorizontal: 12,
                              borderRadius: 999,
                              borderWidth: 1,
                              borderColor: selected ? "#007AFF" : "#ddd",
                              backgroundColor: selected ? "#E5F3FF" : "#fff",
                            }}
                          >
                            <Text style={{ fontSize: 12, fontWeight: "600", color: selected ? "#007AFF" : "#333" }}>
                              {label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </>
                ) : null}

                {repeatType === "MONTHLY_DATE" ? (
                  <>
                    <Text style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>
                      매월 일자 (1~31, 말일 보정)
                    </Text>
                    <TextInput
                      value={dayOfMonth}
                      onChangeText={setDayOfMonth}
                      keyboardType="number-pad"
                      placeholder="예: 31"
                      style={{
                        borderWidth: 1,
                        borderColor: "#ddd",
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                      }}
                    />
                    <Text style={{ marginTop: 6, fontSize: 12, color: "#888" }}>
                      예: 31일로 설정하면 2월은 28/29일, 4월은 30일로 자동 보정돼요.
                    </Text>
                  </>
                ) : null}
              </>
            ) : null}

            {reminderMode === "ONCE" ? (
              <>
                <Text style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>
                  한 번 알림 날짜 (YYYY-MM-DD)
                </Text>
                <TextInput
                  value={onceDateText}
                  onChangeText={setOnceDateText}
                  placeholder="예: 2025-12-25"
                  style={{
                    borderWidth: 1,
                    borderColor: "#ddd",
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                  }}
                />

                <View style={{ height: 12 }} />

                <Text style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>
                  한 번 알림 시간 (HH:mm)
                </Text>
                <TextInput
                  value={onceTimeHHmm}
                  onChangeText={setOnceTimeHHmm}
                  placeholder="예: 09:00"
                  style={{
                    borderWidth: 1,
                    borderColor: "#ddd",
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                  }}
                />
                <Text style={{ marginTop: 6, fontSize: 12, color: "#888" }}>
                  시작일 이후 + 최대 6개월 이내만 허용하도록 저장 시 검증해요.
                </Text>
              </>
            ) : null}

            {/* 다음 알림 미리보기 */}
            {reminderMode !== "NONE" ? (
              <>
                <View style={{ height: 12 }} />
                <Text style={{ fontSize: 12, color: "#666" }}>
                  다음 알림 미리보기:{" "}
                  <Text style={{ fontWeight: "700", color: nextReminderPreview ? "#111" : "#FF3B30" }}>
                    {nextReminderPreview ?? "설정을 확인해주세요"}
                  </Text>
                </Text>
              </>
            ) : null}
          </>
        ) : (
          <>
            <Text style={{ fontSize: 14, color: "#888", marginBottom: 4 }}>유통기한 (YYYY-MM-DD)</Text>
            <TextInput
              value={expiryDateText}
              onChangeText={setExpiryDateText}
              placeholder="예: 2025-12-31"
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            />
          </>
        )}

        <View style={{ height: 24 }} />

        <Button title={saving ? "저장 중..." : "물품 저장하기"} onPress={handleSave} disabled={saving} />
      </View>
    </CommonLayout>
  );
}
