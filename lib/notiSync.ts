import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { rebuildSummaryNotificationsFromProducts, ProductDoc } from "./notiScheduler";

export async function syncSummaryNotisFromFirestore(userId: string) {
  const q = query(
    collection(db, "products"),
    where("userId", "==", userId),
    where("isArchived", "==", false)
  );

  const snap = await getDocs(q);

  const products: ProductDoc[] = snap.docs.map((d) => {
    const data = d.data() as any;
    return {
      id: d.id,
      userId: data.userId,
      type: data.type,
      isArchived: data.isArchived,
      expiryDate: data.expiryDate,
      reminder: data.reminder,
      cycleDays: data.cycleDays,
    };
  });

  console.log("[CHB] products fetched:", products.length);

  const result = await rebuildSummaryNotificationsFromProducts(products);
  console.log("[CHB] rebuild result:", result);
  return result;
}
