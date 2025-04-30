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
      acceptCash,
      acceptCardPayments,
      acceptInvoicePayments,
      stripeEnabled,
      stripeAccountId,
    } = body;

    // Create or update payment configuration
    const paymentConfig = await prisma.paymentConfig.upsert({
      where: {
        userId: session.user.id,
      },
      update: {
        acceptCash,
        acceptCardPayments,
        acceptInvoicePayments,
        stripeEnabled,
        stripeAccountId,
        stripeConnected: stripeEnabled && !!stripeAccountId,
      },
      create: {
        acceptCash,
        acceptCardPayments,
        acceptInvoicePayments,
        stripeEnabled,
        stripeAccountId,
        stripeConnected: stripeEnabled && !!stripeAccountId,
        userId: session.user.id,
      },
    });

    return NextResponse.json(paymentConfig);
  } catch (error) {
    console.error("Error updating payment configuration:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const paymentConfig = await prisma.paymentConfig.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    return NextResponse.json(paymentConfig);
  } catch (error) {
    console.error("Error fetching payment configuration:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 