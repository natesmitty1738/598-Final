import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Get notification preferences for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const notificationPreferences = await prisma.notificationPreference.findMany({
      where: { userId: session.user.id },
    });
    
    if (!notificationPreferences || notificationPreferences.length === 0) {
      // Return default notification preferences if none exist
      return NextResponse.json({
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: false,
        orderUpdates: true,
        inventoryAlerts: true,
        paymentNotifications: true,
        marketingEmails: false
      });
    }
    
    return NextResponse.json(notificationPreferences[0]);
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification preferences' },
      { status: 500 }
    );
  }
}

// Update notification preferences for the current user
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    
    // Check if notification preferences exist
    const existingPrefs = await prisma.notificationPreference.findFirst({
      where: { userId: session.user.id },
    });
    
    let notificationPreferences;
    
    if (existingPrefs) {
      // Update existing preferences
      notificationPreferences = await prisma.notificationPreference.update({
        where: { id: existingPrefs.id },
        data,
      });
    } else {
      // Create new preferences
      notificationPreferences = await prisma.notificationPreference.create({
        data: {
          // Only include valid fields
          emailNotifications: data.emailNotifications,
          smsNotifications: data.smsNotifications,
          pushNotifications: data.pushNotifications,
          orderUpdates: data.orderUpdates,
          inventoryAlerts: data.inventoryAlerts,
          paymentNotifications: data.paymentNotifications,
          marketingEmails: data.marketingEmails,
          userId: session.user.id,
        },
      });
    }
    
    return NextResponse.json(notificationPreferences);
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
} 