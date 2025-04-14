import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { StepId } from '@/app/services/OnboardingAutomata';

export async function POST(request: Request) {
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

    const data = await request.json();
    const { 
      stepId, 
      data: stepData, 
      allData, 
      completedSteps 
    } = data;

    if (!stepId) {
      return NextResponse.json(
        { error: 'Step ID is required' },
        { status: 400 }
      );
    }

    // Find or create onboarding record
    let onboarding = await prisma.onboarding.findUnique({
      where: { userId: user.id },
    });

    // Process completed steps
    const newCompletedSteps = completedSteps || 
      (onboarding ? 
        [...new Set([...(onboarding.completedSteps as string[]), stepId])] :
        [stepId]
      );

    // Create or update the onboarding record
    if (!onboarding) {
      onboarding = await prisma.onboarding.create({
        data: {
          userId: user.id,
          completedSteps: newCompletedSteps,
          // Set completed to true if all required steps are completed
          completed: newCompletedSteps.includes('completion')
        },
      });
    } else {
      // Update onboarding with completed step
      onboarding = await prisma.onboarding.update({
        where: { userId: user.id },
        data: {
          completedSteps: newCompletedSteps,
          // Set completed to true if completion step is included
          completed: newCompletedSteps.includes('completion')
        },
      });
    }

    // Process step-specific data if needed
    if (stepData) {
      switch (stepId as StepId) {
        case 'business-profile':
          // Save business profile data
          await prisma.businessProfile.upsert({
            where: { userId: user.id },
            update: stepData,
            create: {
              ...stepData,
              businessName: stepData.businessName || 'My Business',
              userId: user.id,
            },
          });
          break;

        case 'inventory-setup':
          // Save initial inventory items if present
          if (Array.isArray(stepData) && stepData.length > 0) {
            // For simplicity, we're not handling bulk create here
            // In a real app, you'd want to handle this more efficiently
            for (const item of stepData) {
              if (item.sku) {
                await prisma.product.upsert({
                  where: { sku: item.sku },
                  update: {
                    ...item,
                    userId: user.id
                  },
                  create: {
                    ...item,
                    userId: user.id
                  }
                });
              }
            }
          }
          break;

        case 'payment-setup':
          // Save payment configuration
          await prisma.paymentConfig.upsert({
            where: { userId: user.id },
            update: stepData,
            create: {
              ...stepData,
              userId: user.id,
            },
          });
          break;

        default:
          // For other steps, no specific action needed
          break;
      }
    }

    // Gather user data to return
    const userData = {
      businessProfile: null,
      initialInventory: [],
      paymentSetup: null,
    };

    // Fetch business profile if it exists
    const businessProfile = await prisma.businessProfile.findUnique({
      where: { userId: user.id }
    });
    if (businessProfile) {
      userData.businessProfile = businessProfile;
    }

    // Fetch payment config if it exists
    const paymentConfig = await prisma.paymentConfig.findUnique({
      where: { userId: user.id }
    });
    if (paymentConfig) {
      userData.paymentSetup = paymentConfig;
    }

    // Only fetch inventory if needed for initial setup
    if (stepId === 'inventory-setup') {
      const products = await prisma.product.findMany({
        where: { userId: user.id },
        take: 10, // Limit to recent items for efficiency
        orderBy: { createdAt: 'desc' }
      });
      userData.initialInventory = products;
    }

    return NextResponse.json({ 
      success: true, 
      onboarding,
      userData
    });
  } catch (error) {
    console.error('Error saving onboarding progress:', error);
    return NextResponse.json(
      { error: 'Failed to save onboarding progress' },
      { status: 500 }
    );
  }
} 