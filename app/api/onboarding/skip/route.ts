import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get step information from request
    const { stepId } = await request.json();
    
    if (!stepId) {
      return NextResponse.json(
        { error: 'Step ID is required' },
        { status: 400 }
      );
    }
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { onboarding: true }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Get or create onboarding record
    let onboarding = user.onboarding;
    
    if (!onboarding) {
      onboarding = await prisma.onboarding.create({
        data: {
          userId: user.id,
          completedSteps: [stepId]
        }
      });
    } else {
      // Update onboarding record to mark step as skipped/completed
      onboarding = await prisma.onboarding.update({
        where: { id: onboarding.id },
        data: {
          completedSteps: {
            set: [...new Set([...onboarding.completedSteps, stepId])]
          }
        }
      });
    }
    
    return NextResponse.json({ success: true, onboarding });
  } catch (error) {
    console.error('Error skipping step:', error);
    return NextResponse.json(
      { error: 'Failed to skip step' },
      { status: 500 }
    );
  }
} 