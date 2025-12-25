import * as Notifications from "expo-notifications";
import { Timestamp } from "firebase/firestore";

/**
 * 요약 알림
 * - 앞으로 N일(기본 30일) 동안
 * - "교체 필요한 날" / "유통기한 D-1 날" 에만
 * - 오전 9시에 1회성 로컬 알림을 미리 예약.
 */

const PREFIX = "CHB_";
const DAYS_AHEAD = 30;
const HOUR = 9;
const MINUTE = 0;

export type CheckHaebalaItem = {
    id: string;
    name?: string;
    nextReplaceAt?: Timestamp | null; // 교체 예정일
    expiryAt?: Timestamp | null;      // 유통기한
};

/** YYYYMMDD */
function yyyymmdd(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}${m}${day}`;
}

function startOfDay(d: Date): Date {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

function addDays(d: Date, days: number): Date {
    const x = new Date(d);
    x.setDate(x.getDate() + days);
    return x;
}

function atNineAM(d: Date): Date {
    const x = new Date(d);
    x.setHours(HOUR, MINUTE, 0, 0);
    return x;
}

function withinRangeDay(target: Date, day0: Date, dayN: Date): boolean {
    const t = startOfDay(target).getTime();
    return t >= day0.getTime() && t <= dayN.getTime();
}

async function cancelAllCheckHaebalaScheduledNotifications() {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const ours = scheduled.filter((n) => (n.identifier || "").startsWith(PREFIX));
    await Promise.all(
        ours.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );
}

/** 단순 날짜키(YYYYMMDD) -> Date */
function dateFromKey(key: string): Date {
    const yyyy = Number(key.slice(0, 4));
    const mm = Number(key.slice(4, 6)) - 1;
    const dd = Number(key.slice(6, 8));
    return new Date(yyyy, mm, dd);
}

async function scheduleOneShotIfFuture(params: {
    identifier: string;
    fireAt: Date;
    title: string;
    body: string;
    data: Record<string, string>;
}) {
    const now = Date.now();
    const diffMs = params.fireAt.getTime() - now;

    // 이미 지난 시간이면 스킵
    if (diffMs <= 0) return;

    const seconds = Math.ceil(diffMs / 1000);

    await Notifications.scheduleNotificationAsync({
        identifier: params.identifier,
        content: {
            title: params.title,
            body: params.body,
            data: params.data,
        },
        trigger: {
            type: "timeInterval",
            seconds,
            repeats: false,
        } as Notifications.NotificationTriggerInput
    });
}

export async function rebuildSummaryNotificationsNext30Days(items: CheckHaebalaItem[]) {
    // 우리 앱이 만든 예약 알림만 싹 지우고 새로 만듬
    await cancelAllCheckHaebalaScheduledNotifications();

    const today = startOfDay(new Date());
    const lastDay = startOfDay(addDays(today, DAYS_AHEAD));

    // "해당되는 날짜"만 Set에 모으기
    const replaceDayKeys = new Set<string>();
    const expiryDayKeys = new Set<string>();

    for (const item of items) {
        // 교체: nextReplaceAt 날짜가 범위 내면 그 날짜에 "교체 요약" 예약
        if (item.nextReplaceAt) {
            const d = item.nextReplaceAt.toDate();
            if (withinRangeDay(d, today, lastDay)) {
                replaceDayKeys.add(yyyymmdd(d));
            }
        }

        // 유통기한: expiryAt 하루 전 날짜에 "유통기한 요약" 예약
        if (item.expiryAt) {
            const exp = item.expiryAt.toDate();
            const d1 = addDays(exp, -1);
            if (withinRangeDay(d1, today, lastDay)) {
                expiryDayKeys.add(yyyymmdd(d1));
            }
        }
    }

    // 날짜별로 오전 9시 1회성 알림 예약
    await Promise.all(
        [...replaceDayKeys].map(async (key) => {
            const day = dateFromKey(key);
            const fireAt = atNineAM(day);
            await scheduleOneShotIfFuture({
                identifier: `${PREFIX}REPLACE_${key}`,
                fireAt,
                title: "교체가 필요한 물품이 있습니다.",
                body: "교체 시기가 지난 물품이 있어요. 확인해주세요.",
                data: { type: "REPLACE_SUMMARY", date: key },
            });
        })
    );

    await Promise.all(
        [...expiryDayKeys].map(async (key) => {
            const day = dateFromKey(key);
            const fireAt = atNineAM(day);
            await scheduleOneShotIfFuture({
                identifier: `${PREFIX}EXPIRY_${key}`,
                fireAt,
                title: "유통기한 만료 예정인 물품이 있습니다.",
                body: "유통기한이 임박한 물품이 있어요. 확인해주세요.",
                data: { type: "EXPIRY_SUMMARY", date: key },
            });
        })
    );

    return {
        replaceCount: replaceDayKeys.size,
        expiryCount: expiryDayKeys.size,
    };
}
