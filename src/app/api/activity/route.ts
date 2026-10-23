import { NextResponse } from 'next/server';
import { getStore } from '@/lib/rag-store';

export async function GET() {
  const store = getStore();
  return NextResponse.json({
    activity: store.activity,
  });
}
