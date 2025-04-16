import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]/auth-options';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user ID from session
    const userId = session.user.id;

    // Get onboarding status from database
    const onboarding = await prisma.onboarding.findUnique({
      where: {
        userId
      }
    });

    // Prepare userData object
    const userData = {
      businessProfile: null,
      initialInventory: [],
      paymentSetup: null,
    };

    // Get business profile
    const businessProfile = await prisma.businessProfile.findUnique({
      where: { userId }
    });
    
    if (businessProfile) {
      userData.businessProfile = businessProfile;
    }

    // Get payment config
    const paymentConfig = await prisma.paymentConfig.findUnique({
      where: { userId }
    });
    
    if (paymentConfig) {
      userData.paymentSetup = paymentConfig;
    }

    // Get sample of products for initial inventory setup
    const products = await prisma.product.findMany({
      where: { userId },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });
    
    if (products.length > 0) {
      userData.initialInventory = products;
    }

    // If no onboarding record, create one
    if (!onboarding) {
      const newOnboarding = await prisma.onboarding.create({
        data: {
          userId,
          completed: false,
          completedSteps: []
        }
      });

      return NextResponse.json({
        completed: newOnboarding.completed,
        completedSteps: newOnboarding.completedSteps,
        userData
      });
    }

    // Return onboarding status with user data
    return NextResponse.json({
      completed: onboarding.completed,
      completedSteps: onboarding.completedSteps,
      userData
    });
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
} 