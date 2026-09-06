import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/features/auth/service';

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user: session });
}
