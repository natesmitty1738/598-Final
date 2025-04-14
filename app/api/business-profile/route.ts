import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get the business profile for the authenticated user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userEmail = session.user.email;
    
    if (!userEmail) {
      return NextResponse.json({ error: 'User email not found in session' }, { status: 400 });
    }
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { businessProfile: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (!user.businessProfile) {
      return NextResponse.json({ error: 'Business profile not found' }, { status: 404 });
    }
    
    return NextResponse.json(user.businessProfile);
  } catch (error) {
    console.error('Error fetching business profile:', error);
    return NextResponse.json({ error: 'Failed to fetch business profile' }, { status: 500 });
  }
}

// Create or update a business profile
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userEmail = session.user.email;
    
    if (!userEmail) {
      return NextResponse.json({ error: 'User email not found in session' }, { status: 400 });
    }
    
    const data = await request.json();
    const { businessName, industry, address, city, state, zipCode, country, phone, website, taxId, logo } = data;
    
    if (!businessName) {
      return NextResponse.json({ error: 'Business name is required' }, { status: 400 });
    }
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Create or update business profile
    const businessProfile = await prisma.businessProfile.upsert({
      where: {
        userId: user.id
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
        logo
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
        logo,
        userId: user.id
      }
    });
    
    return NextResponse.json(businessProfile);
  } catch (error) {
    console.error('Error creating/updating business profile:', error);
    return NextResponse.json({ error: 'Failed to create/update business profile' }, { status: 500 });
  }
} 