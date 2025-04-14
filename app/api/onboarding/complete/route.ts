import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update or create onboarding record
    const onboarding = await prisma.onboarding.upsert({
      where: { userId: user.id },
      update: {
        completed: true,
        completedSteps: ['welcome', 'business-profile', 'inventory-setup', 'payment-setup', 'completion'],
      },
      create: {
        userId: user.id,
        completed: true,
        completedSteps: ['welcome', 'business-profile', 'inventory-setup', 'payment-setup', 'completion'],
      },
    });

    return NextResponse.json({ success: true, onboarding });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
} 