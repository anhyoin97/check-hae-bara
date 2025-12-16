// app/(tabs)/add-item.tsx
import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, TouchableOpacity, Alert } from "react-native";
import CommonLayout from "../../components/layout/CommonLayout";
import { db } from "../../lib/firebase";
import { getOrCreateUserId } from "../../lib/user";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import type { Product } from "../../types/product";

export default function AddItemScreen() {
  const [userId, setUserId] = useState<string | null>(null);

  // 폼 상태
  const [name, setName] = useState("");
  const [type, setType] = useState<"cycle" | "expiry">("cycle");
  const [location, setLocation] = useState("");
  const [cycleDays, setCycleDays] = useState("7"); // 교체주기형 기본값 7일
  const [expiryDateText, setExpiryDateText] = useState(""); // YYYY-MM-DD 문자열

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function init() {
      const id = await getOrCreateUserId();
      setUserId(id);
    }
    init();
  }, []);

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
    } catch (e) {
      console.log("물품 저장 에러:", e);
      Alert.alert("에러", "물품 저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <CommonLayout
      title="물품 등록"
      headerAlign="center"
      headerRightButtons={[]}
    >
      <View style={{ marginTop: 16 }}>
        <Text style={{ fontSize: 14, color: "#888", marginBottom: 4 }}>
          물품 이름
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="예: 기저귀, 우유, 가습기 필터..."
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        />

        <View style={{ height: 16 }} />

        <Text style={{ fontSize: 14, color: "#888", marginBottom: 4 }}>
          물품 유형
        </Text>
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
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: type === "cycle" ? "#007AFF" : "#333",
              }}
            >
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
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: type === "expiry" ? "#FF8A00" : "#333",
              }}
            >
              유통기한형
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 16 }} />

        <Text style={{ fontSize: 14, color: "#888", marginBottom: 4 }}>
          위치 (선택)
        </Text>
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
            <Text style={{ fontSize: 14, color: "#888", marginBottom: 4 }}>
              교체 주기 (일)
            </Text>
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
          </>
        ) : (
          <>
            <Text style={{ fontSize: 14, color: "#888", marginBottom: 4 }}>
              유통기한 (YYYY-MM-DD)
            </Text>
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

        <Button
          title={saving ? "저장 중..." : "물품 저장하기"}
          onPress={handleSave}
          disabled={saving}
        />
      </View>
    </CommonLayout>
  );
}
