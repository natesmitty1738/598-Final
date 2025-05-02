import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { Permission, Role } from '@prisma/client';
import prisma from '@/app/api/prisma';

// Debug environment variables
console.log("API Route - DATABASE_URL:", process.env.DATABASE_URL);

// Map the frontend roles to database roles and assign default permissions
const getRoleAndPermissions = (role: string): { role: Role, permissions: Permission[] } => {
  switch (role) {
    case 'BUSINESS_ADMIN':
      return {
        role: 'ADMIN' as Role,
        permissions: [
          'MANAGE_INVENTORY', 
          'MANAGE_SALES', 
          'VIEW_REPORTS', 
          'MANAGE_EMPLOYEES', 
          'MANAGE_SETTINGS', 
          'VIEW_ANALYTICS'
        ] as Permission[]
      };
    case 'MANAGER':
      return {
        role: 'MANAGER' as Role,
        permissions: [
          'MANAGE_INVENTORY', 
          'MANAGE_SALES', 
          'VIEW_REPORTS', 
          'VIEW_ANALYTICS'
        ] as Permission[]
      };
    case 'SALES_REP':
      return {
        role: 'SALES_REP' as Role,
        permissions: [
          'MANAGE_SALES', 
          'VIEW_REPORTS'
        ] as Permission[]
      };
    case 'INVENTORY_MANAGER':
      return {
        role: 'INVENTORY_MANAGER' as Role,
        permissions: [
          'MANAGE_INVENTORY', 
          'VIEW_REPORTS'
        ] as Permission[]
      };
    default:
      return {
        role: 'USER' as Role,
        permissions: ['VIEW_REPORTS'] as Permission[]
      };
  }
};

export async function POST(request: Request) {
  try {
    const { name, email, password, role: frontendRole, businessEmail } = await request.json();

    // Validation
    if (!name || !email || !password || !frontendRole) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Get role and permissions
    const { role, permissions } = getRoleAndPermissions(frontendRole);

    if (role === 'ADMIN') {
      // Create business admin user
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
          permissions
        },
      });

      // Create onboarding record
      const onboarding = await prisma.onboarding.create({
        data: {
          userId: user.id,
          completed: false,
          completedSteps: []
        }
      });

      // Create empty step data records for tracking progress
      if (onboarding?.id) {
        // Create separate StepData records for each step
        await prisma.stepData.createMany({
          data: [
            {
              onboardingId: onboarding.id,
              stepId: 'welcome',
              data: JSON.stringify({})
            },
            {
              onboardingId: onboarding.id,
              stepId: 'business-profile',
              data: JSON.stringify({})
            },
            {
              onboardingId: onboarding.id,
              stepId: 'inventory-setup',
              data: JSON.stringify({})
            },
            {
              onboardingId: onboarding.id,
              stepId: 'payment-setup',
              data: JSON.stringify({})
            },
            {
              onboardingId: onboarding.id,
              stepId: 'completion',
              data: JSON.stringify({})
            }
          ]
        });
      }

      return NextResponse.json(
        {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            permissions: user.permissions
          },
        },
        { status: 201 }
      );
    } else {
      // Find the business admin
      const businessAdmin = await prisma.user.findUnique({
        where: { 
          email: businessEmail,
          role: 'ADMIN'
        },
      });

      if (!businessAdmin) {
        return NextResponse.json(
          { error: 'Business admin not found' },
          { status: 404 }
        );
      }

      // Create employee user linked to the business admin
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
          permissions,
          businessId: businessAdmin.id
        },
      });

      return NextResponse.json(
        {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            permissions: user.permissions
          },
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
} 