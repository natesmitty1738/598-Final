import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Get business profile for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const businessProfile = await prisma.businessProfile.findUnique({
      where: { userId: session.user.id },
    });
    
    if (!businessProfile) {
      // Return empty object if no business profile found
      return NextResponse.json({}, { status: 200 });
    }
    
    return NextResponse.json(businessProfile);
  } catch (error) {
    console.error('Error fetching business profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business profile' },
      { status: 500 }
    );
  }
}

// Update business profile for the current user
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    
    // Check if business profile exists
    const existingProfile = await prisma.businessProfile.findUnique({
      where: { userId: session.user.id },
    });
    
    let businessProfile;
    
    if (existingProfile) {
      // Update existing profile
      businessProfile = await prisma.businessProfile.update({
        where: { userId: session.user.id },
        data,
      });
    } else {
      // Create new profile
      businessProfile = await prisma.businessProfile.create({
        data: {
          ...data,
          userId: session.user.id,
        },
      });
    }
    
    return NextResponse.json(businessProfile);
  } catch (error) {
    console.error('Error updating business profile:', error);
    return NextResponse.json(
      { error: 'Failed to update business profile' },
      { status: 500 }
    );
  }
} 