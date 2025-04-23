import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const {
      businessName,
      industry,
      address,
      city,
      state,
      zipCode,
      country,
      phone,
      website,
      taxId,
    } = body;

    // Validate required fields
    if (!businessName) {
      return new NextResponse("Business name is required", { status: 400 });
    }

    // Create or update business profile
    const businessProfile = await prisma.businessProfile.upsert({
      where: {
        userId: session.user.id,
      },
      update: {
        businessName,
        industry,
        address,
        city,
        state,
        zipCode,
        country,
        phone,
        website,
        taxId,
      },
      create: {
        businessName,
        industry,
        address,
        city,
        state,
        zipCode,
        country,
        phone,
        website,
        taxId,
        userId: session.user.id,
      },
    });

    // Update onboarding status
    await prisma.onboarding.upsert({
      where: {
        userId: session.user.id,
      },
      update: {
        completed: true,
        completedSteps: ["business_profile"],
      },
      create: {
        completed: true,
        completedSteps: ["business_profile"],
        userId: session.user.id,
      },
    });

    return NextResponse.json(businessProfile);
  } catch (error) {
    console.error("Error setting up account:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get business profile and onboarding status
    const [businessProfile, onboarding] = await Promise.all([
      prisma.businessProfile.findUnique({
        where: {
          userId: session.user.id,
        },
      }),
      prisma.onboarding.findUnique({
        where: {
          userId: session.user.id,
        },
      }),
    ]);

    return NextResponse.json({
      businessProfile,
      onboarding,
    });
  } catch (error) {
    console.error("Error fetching account setup:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 