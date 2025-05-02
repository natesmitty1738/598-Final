import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { StepId } from '@/app/hooks/useOnboardingAutomata';

export async function POST(request: Request) {
  try {
    // Extract data carefully to handle potential beacon API requests
    let requestData;
    
    if (request.headers.get('content-type')?.includes('multipart/form-data')) {
      // This is likely a beacon API request (navigating away)
      const formData = await request.formData();
      const stepId = formData.get('stepId') as string;
      const completedStepsStr = formData.get('completedSteps') as string;
      const formDataStr = formData.get('formData') as string;
      
      try {
        requestData = {
          stepId,
          completedSteps: completedStepsStr ? JSON.parse(completedStepsStr) : [],
          formData: formDataStr ? JSON.parse(formDataStr) : {}
        };
      } catch (e) {
        console.error('Error parsing form data in beacon request:', e);
        return new Response(null, { status: 204 }); // Still return success for beacon
      }
    } else {
      // Normal JSON request
      try {
        requestData = await request.json();
      } catch (e) {
        console.error('Error parsing request JSON:', e);
        return NextResponse.json(
          { error: 'Invalid JSON in request body' },
          { status: 400 }
        );
      }
    }
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be signed in to save progress' },
        { status: 401 }
      );
    }

    // Get user ID from session
    const userId = session.user.id;
    
    // Validate required fields
    const { stepId, completedSteps = [], formData } = requestData;
    
    if (!stepId) {
      return NextResponse.json(
        { error: 'Step ID is required' },
        { status: 400 }
      );
    }
    
    if (!Array.isArray(completedSteps)) {
      return NextResponse.json(
        { error: 'Completed steps must be an array' },
        { status: 400 }
      );
    }
    
    // Ensure current step is in completed steps if not already
    const updatedCompletedSteps = 
      completedSteps.includes(stepId)
        ? completedSteps
        : [...completedSteps, stepId];
    
    // Get existing onboarding record
    const existingOnboarding = await prisma.onboarding.findUnique({
      where: { userId },
      include: { stepData: true }
    });
    
    // If no existing record, create a new one with all data
    if (!existingOnboarding) {
      await prisma.onboarding.create({
        data: {
          userId,
          completedSteps: updatedCompletedSteps,
          completed: updatedCompletedSteps.includes('completion'),
          ...(formData ? {
            stepData: {
              create: {
                stepId,
                data: JSON.stringify(formData)
              }
            }
          } : {})
        }
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Initial progress saved'
      });
    }
    
    // If the record exists, check if we need to update it
    const isAlreadyCompleted = existingOnboarding.completedSteps.includes(stepId);
    const dataHasChanged = formData && JSON.stringify(formData) !== 
      existingOnboarding.stepData.find(sd => sd.stepId === stepId)?.data;
    
    // Only update if something has changed
    if (!isAlreadyCompleted || dataHasChanged) {
      // Get the onboarding ID
      const onboardingId = existingOnboarding.id;
      
      // Update the onboarding record
      await prisma.onboarding.update({
        where: { id: onboardingId },
        data: {
          completedSteps: updatedCompletedSteps,
          completed: updatedCompletedSteps.includes('completion')
        }
      });
      
      // Update step data if provided
      if (formData) {
        // Check if step data exists
        const existingStepData = existingOnboarding.stepData.find(sd => sd.stepId === stepId);
        
        if (existingStepData) {
          // Update existing step data
          await prisma.stepData.update({
            where: { id: existingStepData.id },
            data: { data: JSON.stringify(formData) }
          });
        } else {
          // Create new step data
          await prisma.stepData.create({
            data: {
              onboardingId,
              stepId,
              data: JSON.stringify(formData)
            }
          });
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Progress saved successfully',
      completedSteps: updatedCompletedSteps,
      completed: updatedCompletedSteps.includes('completion')
    });
  } catch (error) {
    console.error('ONBOARDING API: Error saving onboarding progress:', error);
    
    // Return a more specific error message if possible
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown server error';
    
    return NextResponse.json(
      { 
        error: 'Failed to save onboarding progress',
        details: errorMessage
      },
      { status: 500 }
    );
  }
} 