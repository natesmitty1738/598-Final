import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';

export async function POST(request: Request) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { 
        onboarding: {
          include: { stepData: true }
        }
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // If no onboarding data exists, return error
    if (!user.onboarding) {
      return NextResponse.json(
        { error: 'No onboarding data found' },
        { status: 404 }
      );
    }
    
    // Get all step data
    const stepData = user.onboarding.stepData;
    
    // Process each type of step data and ensure it's saved to the right tables
    try {
      // 1. Process business profile data
      const businessProfileData = stepData.find(step => step.stepId === 'business-profile');
      if (businessProfileData) {
        const data = JSON.parse(businessProfileData.data);
        if (data.businessProfile) {
          // Create or update business profile
          await prisma.businessProfile.upsert({
            where: { userId: user.id },
            update: data.businessProfile,
            create: {
              ...data.businessProfile,
              userId: user.id
            }
          });
        }
      }
      
      // 2. Process account settings
      const accountData = stepData.find(step => step.stepId === 'account-settings');
      if (accountData) {
        const data = JSON.parse(accountData.data);
        if (data.accountSettings) {
          // Update user account info (but not password, which requires separate handling)
          await prisma.user.update({
            where: { id: user.id },
            data: {
              name: data.accountSettings.name,
              email: data.accountSettings.email,
              image: data.accountSettings.image
            }
          });
        }
      }
      
      // 3. Process payment methods
      const paymentData = stepData.find(step => step.stepId === 'payment-setup');
      if (paymentData) {
        const data = JSON.parse(paymentData.data);
        if (data.paymentMethods) {
          // Create or update payment config
          await prisma.paymentConfig.upsert({
            where: { userId: user.id },
            update: data.paymentMethods,
            create: {
              ...data.paymentMethods,
              userId: user.id
            }
          });
        }
      }
      
      // 4. Process products
      const productData = stepData.find(step => step.stepId === 'product-setup');
      if (productData) {
        const data = JSON.parse(productData.data);
        if (data.products && Array.isArray(data.products)) {
          // Create products if they don't exist (based on SKU)
          for (const product of data.products) {
            const existingProduct = await prisma.product.findFirst({
              where: {
                userId: user.id,
                sku: product.sku
              }
            });
            
            if (existingProduct) {
              // Update existing product
              await prisma.product.update({
                where: { id: existingProduct.id },
                data: {
                  name: product.name,
                  description: product.description,
                  unitCost: product.unitCost,
                  sellingPrice: product.sellingPrice,
                  stockQuantity: product.stockQuantity,
                  location: product.location,
                  category: product.category,
                  size: product.size,
                  color: product.color
                }
              });
            } else {
              // Create new product
              await prisma.product.create({
                data: {
                  ...product,
                  userId: user.id
                }
              });
            }
          }
        }
      }
      
      // 5. Process notification preferences
      // This would need a new table, which isn't in the schema yet
      // Just store it as JSON for now until that's implemented
      
      // Mark onboarding as completed
      await prisma.onboarding.update({
        where: { id: user.onboarding.id },
        data: {
          completed: true,
          completedAt: new Date()
        }
      });
      
      return NextResponse.json({
        success: true,
        message: 'Onboarding completed and data saved to profile'
      });
    } catch (err) {
      console.error('Error processing step data:', err);
      return NextResponse.json(
        { error: 'Failed to process onboarding data' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
} 