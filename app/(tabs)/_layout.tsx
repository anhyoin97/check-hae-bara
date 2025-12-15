// app/(tabs)/_layout.tsx
import { Slot } from "expo-router";
import { useEffect } from "react";
import { getOrCreateUserId, registerUserIfNeeded } from "../../lib/user";

export default function RootLayout() {

  useEffect(() => {
    async function init() {
      const id = await getOrCreateUserId();

      // Firestore의 users 컬렉션에 유저 등록
      await registerUserIfNeeded(id);

    }

    init();
  }, []);

  return <Slot />;
}
