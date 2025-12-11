// app/api/documents/[docId]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function DELETE(
    request: NextRequest,
    { params }: { params: { docId: string } }
) {
    try {
        const { searchParams } = new URL(request.url);
        const conversationId = searchParams.get('conversation_id');

        const url = conversationId
            ? `${BACKEND_URL}/documents/${params.docId}?conversation_id=${conversationId}`
            : `${BACKEND_URL}/documents/${params.docId}`;

        const response = await fetch(url, {
            method: 'DELETE',
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json(
            { detail: error.message || 'Failed to delete document' },
            { status: 500 }
        );
    }
}
