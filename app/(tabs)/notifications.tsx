import React from "react";
import { View, Button } from "react-native";
import CommonLayout from "../../components/layout/CommonLayout";
import { logScheduledCheckHaebalaNotis } from "../../lib/notiDebug";

export default function NotificationsScreen() {
    return (
        <CommonLayout title="물품 등록" headerAlign="center" headerRightButtons={[]}>
            <View style={{ padding: 16 }}>
                <Button
                    title="예약된 알림 목록 콘솔로 보기"
                    onPress={async () => {
                        await logScheduledCheckHaebalaNotis();
                    }}
                />
            </View>
        </CommonLayout>

    );
}
