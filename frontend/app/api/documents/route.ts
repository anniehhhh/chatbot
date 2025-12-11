// app/api/documents/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const conversationId = searchParams.get('conversation_id');

        const url = conversationId
            ? `${BACKEND_URL}/documents?conversation_id=${conversationId}`
            : `${BACKEND_URL}/documents`;

        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json(
            { detail: error.message || 'Failed to fetch documents' },
            { status: 500 }
        );
    }
}
