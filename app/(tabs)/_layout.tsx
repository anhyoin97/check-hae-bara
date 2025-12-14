// app/(tabs)/_layout.tsx
import { Slot } from "expo-router";
import { useEffect } from "react";
import { getOrCreateUserId } from "../../lib/user";


export default function RootLayout() {

  useEffect(() => {
    async function initUser() {
      const userId = await getOrCreateUserId();
      console.log("최초 userId:", userId);
    }
    initUser();
  }, []);

  return <Slot />;
}
