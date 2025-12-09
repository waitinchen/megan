import { NextRequest, NextResponse } from 'next/server';

// 固定的訪客帳號
const GUEST_CREDENTIALS = {
    username: 'test',
    password: 'test1234',
};

// 固定的訪客用戶 ID
const GUEST_USER_ID = '00000000-0000-0000-0000-000000000001';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, password } = body;

        // 驗證帳號密碼
        if (username !== GUEST_CREDENTIALS.username || password !== GUEST_CREDENTIALS.password) {
            return NextResponse.json(
                { error: '帳號或密碼錯誤' },
                { status: 401 }
            );
        }

        // 返回訪客用戶資訊
        return NextResponse.json({
            success: true,
            user: {
                id: GUEST_USER_ID,
                nickname: '訪客',
                isGuest: true,
            },
        });
    } catch (error: any) {
        console.error('[Guest Login] Error:', error);
        return NextResponse.json(
            { error: '登入失敗，請稍後再試' },
            { status: 500 }
        );
    }
}
