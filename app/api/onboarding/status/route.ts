import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { getDataKeyForStep } from '@/app/services/OnboardingAutomata';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check user's onboarding status from the onboarding table
    const onboarding = await prisma.onboarding.findUnique({
      where: { userId: session.user.id },
      select: { completed: true }
    });
    
    // If no onboarding record exists, consider it not completed
    return NextResponse.json({ 
      complete: onboarding?.completed || false
    });
  } catch (error) {
    console.error('Error fetching onboarding status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch onboarding status' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { complete } = await request.json();
    
    // Update onboarding status in the onboarding table
    const onboarding = await prisma.onboarding.upsert({
      where: { userId: session.user.id },
      update: { completed: complete },
      create: { 
        userId: session.user.id, 
        completed: complete,
        completedSteps: []
      },
      select: { completed: true }
    });
    
    return NextResponse.json({ 
      complete: onboarding.completed
    });
  } catch (error) {
    console.error('Error updating onboarding status:', error);
    return NextResponse.json(
      { error: 'Failed to update onboarding status' },
      { status: 500 }
    );
  }
}

export async function GET_OLD(request: Request) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be signed in to access onboarding status' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Get the onboarding status with step data in a single query
    const onboarding = await prisma.onboarding.findUnique({
      where: { userId },
      include: { 
        stepData: true 
      }
    });
    
    // If no onboarding record exists, return initial state
    if (!onboarding) {
      return NextResponse.json({
        activeStep: 'welcome',
        currentStepIndex: 0,
        completedSteps: [],
        completed: false,
        formData: {}
      });
    }
    
    // Process step data for client consumption
    const formData: Record<string, any> = {};
    
    // Parse data from JSON strings to objects
    onboarding.stepData.forEach(stepItem => {
      try {
        // Get correct data key for the step
        const dataKey = getDataKeyForStep(stepItem.stepId);
        formData[dataKey] = JSON.parse(stepItem.data);
      } catch (error) {
        console.warn(`Error parsing data for step ${stepItem.stepId}:`, error);
      }
    });
    
    // Determine current step index based on completed steps
    let currentStepIndex = 0;
    let activeStep = 'welcome';
    
    const STEPS = ['welcome', 'business-profile', 'inventory-setup', 'payment-setup', 'completion'];
    
    if (onboarding.completedSteps.length > 0) {
      // Find the first incomplete step
      for (let i = 0; i < STEPS.length; i++) {
        if (!onboarding.completedSteps.includes(STEPS[i])) {
          currentStepIndex = i;
          activeStep = STEPS[i];
          break;
        }
        
        // If all steps are completed, set to the last step
        if (i === STEPS.length - 1) {
          currentStepIndex = i;
          activeStep = STEPS[i];
        }
      }
    }
    
    return NextResponse.json({
      activeStep,
      currentStepIndex,
      completedSteps: onboarding.completedSteps,
      completed: onboarding.completed,
      formData
    });
    
  } catch (error) {
    console.error('Error fetching onboarding status:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch onboarding status' },
      { status: 500 }
    );
  }
} 