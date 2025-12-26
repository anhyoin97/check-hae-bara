import * as Notifications from "expo-notifications";

const PREFIX = "CHB_";
const DAYS_AHEAD = 30;
const HOUR = 9;
const MINUTE = 0;

type ReminderMode = "NONE" | "REPEAT" | "ONCE";
type RepeatType = "DAILY" | "WEEKLY" | "MONTHLY_DATE";

export type ProductDoc = {
    id: string;
    userId: string;
    type: "cycle" | "expiry";
    isArchived?: boolean;

    cycleDays?: number;

    // expiry 타입
    expiryDate?: string; // "YYYY-MM-DD"

    // cycle 타입
    reminder?: {
        enabled: boolean;
        mode: ReminderMode;
        startDate: string; // "YYYY-MM-DD"
        endDate?: string | null; // "YYYY-MM-DD" or null
        timezone?: string;

        once?: { date: string; time: string }; // "YYYY-MM-DD", "HH:mm"
        repeat?: {
            type: RepeatType;
            everyNDays?: number;
            weekdays?: number[]; // 0~6
            dayOfMonth?: number; // 1~31
            time: string; // "HH:mm"
        };
    };
};

function pad2(n: number) {
    return String(n).padStart(2, "0");
}
function yyyymmdd(d: Date) {
    return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
}
function startOfDay(d: Date) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}
function addDays(d: Date, days: number) {
    const x = new Date(d);
    x.setDate(x.getDate() + days);
    return x;
}
function atNineAM(d: Date) {
    const x = new Date(d);
    x.setHours(HOUR, MINUTE, 0, 0);
    return x;
}

function isValidDateText(s: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    const [y, m, d] = s.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}
function isValidTimeText(s: string) {
    if (!/^\d{2}:\d{2}$/.test(s)) return false;
    const [hh, mm] = s.split(":").map(Number);
    return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
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
function monthlyDateWithLastDayClamp(year: number, monthIndex0: number, dayOfMonth: number) {
    const ld = lastDayOfMonth(year, monthIndex0);
    const dd = Math.min(dayOfMonth, ld);
    return new Date(year, monthIndex0, dd, 0, 0, 0, 0);
}

async function cancelAllCHB() {
    const list = await Notifications.getAllScheduledNotificationsAsync();
    const ours = list.filter((n) => (n.identifier || "").startsWith(PREFIX));
    await Promise.all(ours.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}

async function scheduleOneShotAt(params: {
    identifier: string;
    fireAt: Date;
    title: string;
    body: string;
    data: Record<string, string>;
}) {
    const diffMs = params.fireAt.getTime() - Date.now();
    if (diffMs <= 0) return;

    const seconds = Math.ceil(diffMs / 1000);

    await Notifications.scheduleNotificationAsync({
        identifier: params.identifier,
        content: { title: params.title, body: params.body, data: params.data },
        trigger: {
            type: "timeInterval",
            seconds,
            repeats: false,
        } as Notifications.NotificationTriggerInput,
    });
}

function withinRangeDay(target: Date, day0: Date, dayN: Date) {
    const t = startOfDay(target).getTime();
    return t >= day0.getTime() && t <= dayN.getTime();
}

/** cycle reminder에서 앞으로 range 내 "발생 날짜들(일 단위)" 뽑기 */
function collectCycleDayKeys(reminder: ProductDoc["reminder"], day0: Date, dayN: Date) {
    const out = new Set<string>();
    if (!reminder?.enabled) return out;
    if (reminder.mode === "NONE") return out;

    // endDate(있으면)까지만
    let endLimit: Date | null = null;
    if (reminder.endDate && isValidDateText(reminder.endDate)) {
        endLimit = applyTime(parseDateTextToLocalDate(reminder.endDate), "23:59");
    }
    const withinEnd = (d: Date) => (!endLimit ? true : d.getTime() <= endLimit.getTime());

    // ONCE
    if (reminder.mode === "ONCE") {
        const once = reminder.once;
        if (!once || !isValidDateText(once.date) || !isValidTimeText(once.time)) return out;
        const dt = applyTime(parseDateTextToLocalDate(once.date), once.time);
        if (!withinEnd(dt)) return out;
        if (withinRangeDay(dt, day0, dayN)) out.add(yyyymmdd(dt));
        return out;
    }

    // REPEAT
    const rep = reminder.repeat;
    if (!rep) return out;
    if (!isValidDateText(reminder.startDate)) return out;
    if (!isValidTimeText(rep.time)) return out;

    const startAt = applyTime(parseDateTextToLocalDate(reminder.startDate), rep.time);

    // 탐색 시작은 range 시작일 또는 startAt 중 큰 쪽에서
    const cursorStart = new Date(Math.max(startAt.getTime(), day0.getTime()));

    if (rep.type === "DAILY") {
        const n = rep.everyNDays && rep.everyNDays > 0 ? Math.floor(rep.everyNDays) : 1;
        // startAt 기준으로 n일 간격
        const dayMs = 24 * 60 * 60 * 1000;
        const diff = cursorStart.getTime() - startAt.getTime();
        const k = diff > 0 ? Math.floor(diff / (n * dayMs)) : 0;

        let next = new Date(startAt.getTime() + k * n * dayMs);
        // cursorStart 이후로 맞추기
        while (next.getTime() < cursorStart.getTime()) next = new Date(next.getTime() + n * dayMs);

        while (withinRangeDay(next, day0, dayN) && withinEnd(next)) {
            out.add(yyyymmdd(next));
            next = new Date(next.getTime() + n * dayMs);
        }
        return out;
    }

    if (rep.type === "WEEKLY") {
        const days = (rep.weekdays && rep.weekdays.length ? rep.weekdays : [cursorStart.getDay()])
            .slice()
            .sort((a, b) => a - b);

        // range 안에서 하루씩 돌면서 요일 맞으면 추가
        let d = startOfDay(cursorStart);
        while (d.getTime() <= dayN.getTime()) {
            const wd = d.getDay();
            if (days.includes(wd)) {
                const cand = applyTime(d, rep.time);
                if (cand.getTime() >= startAt.getTime() && withinEnd(cand)) out.add(yyyymmdd(cand));
            }
            d = addDays(d, 1);
        }
        return out;
    }

    if (rep.type === "MONTHLY_DATE") {
        const dom = rep.dayOfMonth && rep.dayOfMonth >= 1 && rep.dayOfMonth <= 31 ? rep.dayOfMonth : 1;

        // range 기간(최대 30일), 최대 2달 정도
        const start = startOfDay(cursorStart);
        for (let i = 0; i < 3; i++) {
            const y = start.getFullYear();
            const m0 = start.getMonth() + i;
            const yy = y + Math.floor(m0 / 12);
            const mm = ((m0 % 12) + 12) % 12;

            const candDate = monthlyDateWithLastDayClamp(yy, mm, dom);
            const cand = applyTime(candDate, rep.time);

            if (cand.getTime() < startAt.getTime()) continue;
            if (!withinEnd(cand)) continue;
            if (withinRangeDay(cand, day0, dayN)) out.add(yyyymmdd(cand));
        }
        return out;
    }

    return out;
}

export async function rebuildSummaryNotificationsFromProducts(products: ProductDoc[]) {
    await cancelAllCHB();

    const day0 = startOfDay(new Date());
    const dayN = startOfDay(addDays(day0, DAYS_AHEAD));

    const replaceDayKeys = new Set<string>();
    const expiryDayKeys = new Set<string>();

    for (const p of products) {
        if (p.isArchived) continue;

        if (p.type === "expiry") {
            // expiryDate: "YYYY-MM-DD"
            if (!p.expiryDate || !isValidDateText(p.expiryDate)) continue;
            const exp = parseDateTextToLocalDate(p.expiryDate);
            const d1 = addDays(exp, -1);
            if (withinRangeDay(d1, day0, dayN)) expiryDayKeys.add(yyyymmdd(d1));
            continue;
        }

        if (p.type === "cycle") {
            const days = p.cycleDays && p.cycleDays > 0 ? Math.floor(p.cycleDays) : 0;
            if (!days) continue;

            // 기준일: startDateText(reminder.startDate) 있으면 그걸 쓰고,
            // 없으면 오늘로 fallback
            const baseDateText = p.reminder?.startDate;
            if (!baseDateText || !isValidDateText(baseDateText)) continue;

            const base = parseDateTextToLocalDate(baseDateText); // 00:00 기준
            // “교체일” base + k*cycleDays 로 생성 (30일 범위 내)
            let d = startOfDay(base);

            // 범위 시작(day0) 이전이면 앞으로 당겨오기
            while (d.getTime() < day0.getTime()) d = addDays(d, days);

            while (d.getTime() <= dayN.getTime()) {
                replaceDayKeys.add(yyyymmdd(d));
                d = addDays(d, days);
            }
        }
    }

    // 예약 생성: 해당 날짜 09:00
    await Promise.all(
        [...replaceDayKeys].map(async (key) => {
            const yyyy = Number(key.slice(0, 4));
            const mm = Number(key.slice(4, 6)) - 1;
            const dd = Number(key.slice(6, 8));
            const fireAt = atNineAM(new Date(yyyy, mm, dd));

            await scheduleOneShotAt({
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
            const yyyy = Number(key.slice(0, 4));
            const mm = Number(key.slice(4, 6)) - 1;
            const dd = Number(key.slice(6, 8));
            const fireAt = atNineAM(new Date(yyyy, mm, dd));

            await scheduleOneShotAt({
                identifier: `${PREFIX}EXPIRY_${key}`,
                fireAt,
                title: "유통기한 만료 예정인 물품이 있습니다.",
                body: "유통기한이 임박한 물품이 있어요. 확인해주세요.",
                data: { type: "EXPIRY_SUMMARY", date: key },
            });
        })
    );

    return { replaceCount: replaceDayKeys.size, expiryCount: expiryDayKeys.size };
}
