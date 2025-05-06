import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Get payment configuration for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const paymentConfig = await prisma.paymentConfig.findUnique({
      where: { userId: session.user.id },
    });
    
    if (!paymentConfig) {
      // Return default payment config if none exists
      return NextResponse.json({
        acceptsCreditCards: false,
        acceptsPayPal: false,
        stripeConnected: false,
        paypalConnected: false,
        defaultPaymentMethod: 'CREDIT_CARD'
      });
    }
    
    return NextResponse.json(paymentConfig);
  } catch (error) {
    console.error('Error fetching payment configuration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment configuration' },
      { status: 500 }
    );
  }
}

// Update payment configuration for the current user
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    
    // Check if payment config exists
    const existingConfig = await prisma.paymentConfig.findUnique({
      where: { userId: session.user.id },
    });
    
    let paymentConfig;
    
    if (existingConfig) {
      // Update existing config
      paymentConfig = await prisma.paymentConfig.update({
        where: { userId: session.user.id },
        data,
      });
    } else {
      // Create new config
      paymentConfig = await prisma.paymentConfig.create({
        data: {
          ...data,
          userId: session.user.id,
        },
      });
    }
    
    return NextResponse.json(paymentConfig);
  } catch (error) {
    console.error('Error updating payment configuration:', error);
    return NextResponse.json(
      { error: 'Failed to update payment configuration' },
      { status: 500 }
    );
  }
} 