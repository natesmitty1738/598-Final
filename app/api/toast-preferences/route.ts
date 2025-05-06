import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

const DEFAULT_PREFERENCES = {
  success: true,
  error: true,
  info: true
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check for existing preferences in the database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        id: true,
        toastPreferences: true 
      }
    });
    
    // If no preferences are set, return defaults
    if (!user?.toastPreferences) {
      return NextResponse.json(DEFAULT_PREFERENCES);
    }
    
    try {
      const preferences = JSON.parse(user.toastPreferences);
      return NextResponse.json(preferences);
    } catch (error) {
      console.error('Error parsing toast preferences:', error);
      // Return defaults if parsing fails
      return NextResponse.json(DEFAULT_PREFERENCES);
    }
  } catch (error) {
    console.error('Error fetching toast preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch toast preferences' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse the request body
    const preferences = await request.json();
    
    // Validate the preferences
    if (typeof preferences !== 'object' || preferences === null) {
      return NextResponse.json(
        { error: 'Invalid preferences format' },
        { status: 400 }
      );
    }
    
    // Create the preferences JSON string
    const preferencesJson = JSON.stringify({
      success: Boolean(preferences.success),
      error: Boolean(preferences.error),
      info: Boolean(preferences.info)
    });
    
    // Save preferences to the database
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        toastPreferences: preferencesJson
      }
    });
    
    return NextResponse.json({
      message: 'Toast preferences saved successfully'
    });
  } catch (error) {
    console.error('Error saving toast preferences:', error);
    return NextResponse.json(
      { error: 'Failed to save toast preferences' },
      { status: 500 }
    );
  }
} 