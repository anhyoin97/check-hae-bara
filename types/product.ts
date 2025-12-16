import { Timestamp } from "firebase/firestore";

export type ProductType = "cycle" | "expiry";

export interface Product {
  id: string;            // Firestore 문서 ID
  userId: string;        // 이 상품을 등록한 사용자 ID
  name: string;          // 상품 이름
  type: ProductType;     // cycle | expiry

  location?: string;     // 어디에 있는지
  category?: string;     // 카테고리

  // 교체 주기형
  cycleDays?: number;         // 며칠마다 교체인지
  lastHandledAt?: Timestamp;  // 마지막으로 교체한 날짜
  nextDueDate?: Timestamp;    // 다음 교체 예정일

  // 유통기한형
  expiryDate?: Timestamp;     // 유통기한 날짜

  notifyBeforeDays?: number;  // 며칠 전부터 알림 받을지

  isArchived?: boolean;       // 비활성 / 숨김 처리
  createdAt: Timestamp;       // 생성 일자
  updatedAt?: Timestamp;      // 수정 일자
}