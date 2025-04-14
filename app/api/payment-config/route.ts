import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET() {
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

    // Get payment configuration
    const paymentConfig = await prisma.paymentConfig.findUnique({
      where: { userId: user.id },
    });

    if (!paymentConfig) {
      // Return default configuration if not found
      return NextResponse.json({
        acceptCash: true,
        acceptCardPayments: false,
        acceptInvoicePayments: false,
        stripeEnabled: false,
        stripeConnected: false,
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

    // Validate required fields
    const validFields = [
      'acceptCash',
      'acceptCardPayments',
      'acceptInvoicePayments',
      'stripeEnabled',
      'stripeConnected',
      'stripeAccountId',
    ];

    const sanitizedData = Object.keys(data).reduce((obj, key) => {
      if (validFields.includes(key)) {
        obj[key] = data[key];
      }
      return obj;
    }, {} as Record<string, any>);

    // Save payment configuration
    const paymentConfig = await prisma.paymentConfig.upsert({
      where: { userId: user.id },
      update: sanitizedData,
      create: {
        ...sanitizedData,
        userId: user.id,
      },
    });

    return NextResponse.json(paymentConfig);
  } catch (error) {
    console.error('Error saving payment configuration:', error);
    return NextResponse.json(
      { error: 'Failed to save payment configuration' },
      { status: 500 }
    );
  }
} 