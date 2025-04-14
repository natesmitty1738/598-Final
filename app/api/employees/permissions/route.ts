import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// Get employee role info
export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const employeeId = url.searchParams.get('employeeId');

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if current user is a business admin
    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only business admins can manage employees' },
        { status: 403 }
      );
    }

    // Get employee
    const employee = await prisma.user.findUnique({
      where: { 
        id: employeeId,
        businessId: currentUser.id // Make sure the employee belongs to this admin
      }
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found or not associated with your business' },
        { status: 404 }
      );
    }

    // Return employee info
    return NextResponse.json({
      employeeId: employee.id,
      name: employee.name,
      email: employee.email,
      role: employee.role
    });
  } catch (error) {
    console.error('Error getting employee info:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

// Update role for an employee
export async function PUT(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get request body
    const { employeeId, role } = await request.json();

    if (!employeeId || !role) {
      return NextResponse.json(
        { error: 'Employee ID and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (role !== 'USER' && role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if current user is a business admin
    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only business admins can manage employees' },
        { status: 403 }
      );
    }

    // Get employee
    const employee = await prisma.user.findUnique({
      where: { 
        id: employeeId,
        businessId: currentUser.id // Make sure the employee belongs to this admin
      }
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found or not associated with your business' },
        { status: 404 }
      );
    }

    // Update employee role
    const updatedEmployee = await prisma.user.update({
      where: { id: employeeId },
      data: { role }
    });

    // Return updated employee
    return NextResponse.json({
      employeeId: updatedEmployee.id,
      name: updatedEmployee.name,
      email: updatedEmployee.email,
      role: updatedEmployee.role
    });
  } catch (error) {
    console.error('Error updating employee role:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
} 