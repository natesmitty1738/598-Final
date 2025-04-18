# MerchX Architecture Guide

This document provides a comprehensive guide on the architecture of MerchX and how to develop new features for the application.

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Application Structure](#application-structure)
- [Database Schema](#database-schema)
- [Development Workflow](#development-workflow)
- [Feature Development Guide](#feature-development-guide)
- [Docker Setup](#docker-setup)
- [Common Patterns](#common-patterns)
- [Testing](#testing)

## Overview

MerchX is a merchandise management platform designed to help businesses track inventory, process sales, and manage customer relationships. The application follows a modern web application architecture with a React frontend built with Next.js and a PostgreSQL database.

## Technology Stack

- **Frontend**: Next.js 14.x with React
- **Backend API**: Next.js API routes (serverless functions)
- **Database**: PostgreSQL 14
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Styling**: TailwindCSS
- **Containerization**: Docker
- **Payment Processing**: Stripe
- **Image Storage**: Cloudinary

## Application Structure

```
merchx/
├── app/                    # Next.js app directory structure  
│   ├── (auth)/             # Authentication-related routes
│   ├── (dashboard)/        # Dashboard routes
│   ├── api/                # API routes
│   ├── components/         # Shared components
│   └── lib/                # Utility functions and libraries
├── prisma/                 # Prisma schema and migrations
├── public/                 # Static assets
├── styles/                 # Global styles
├── middleware.ts          # Next.js middleware
├── Dockerfile              # Docker configuration
└── docker-compose.yml      # Docker Compose configuration
```

## Database Schema

The application uses a PostgreSQL database with the following main entities:

![Database Schema](https://mermaid.ink/img/pako:eNqVU8tu2zAQ_BWC5zYWHX-UxLkkQIOiiZt-YRcNtbKaUKSWpJw6hv-9S8pO4tQFCgQQsbMz4uxjySfBcCZSEQU66pRN88jTe6uHHSj9Aa5mMLmCOJG5slVt7Zt9WN5d3oLxWA7OhKAhCGeCc94TuYI9zDVCPPj4wJzfgElDCRfnH_1W-yD-JlGi9SBY-5eRbgBzRHtbKv44oHCHUB-7_dLnrCy71hQsHcARV6PbgrMZiU4phZDIcKKKP-YNTc9b_mY8l3lBwS-ZKR-_G9wnIBkNSHCrYO2HWkWZD9eiTmIErzIvbOxcPMeZsmQ0Yh2pxGrZ2cZkLfGbqvfRYUf7y5ZyHqzIHIhC2fxFtZPKyeygFmDLcCTPTBzE8fgbEQkVm81I9GDnWKF3vCwW_3d7o5KMCl-_hnfNxnYaNBvSJofj0aPvGHnLEqWsLjVYn3mO1Yp-oc9kpSoaKxLLamN-0DEvqSraSb_tJiE8XkK9onMOaGM4YwYqeKHjTvQGqszB9WrEV8aM3qFGVxUZ50Bh-0lYLTOiijlL3onUL-eJWN6LvJzTCEulKEBacFhm9KiNTPvUYdqfqK3Tk8jSQv4fBkmv7OyX27U2Q6Wb7LzTVfbPnP8A8-cxaA?type=png)

## Development Workflow

### Setup Local Development Environment

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/merchx.git
   cd merchx
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Fill in the required variables

4. **Start the development environment with Docker**
   ```bash
   docker compose up -d
   ```

5. **Run database migrations**
   ```bash
   npx prisma migrate dev
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

## Feature Development Guide

### Workflow Example: Adding a New Feature

Let's walk through the process of adding a new feature to the application using a real example: **Adding a Product Discount Feature**.

#### 1. Update the Database Schema

First, modify the Prisma schema in `prisma/schema.prisma` to include discount fields:

```prisma
model Product {
  id            String   @id @default(cuid())
  sku           String   @unique
  name          String
  description   String?
  unitCost      Float
  sellingPrice  Float
  discountType  DiscountType? // New field
  discountValue Float?        // New field
  stockQuantity Int
  // Other existing fields...
}

enum DiscountType {
  PERCENTAGE
  FIXED_AMOUNT
}
```

#### 2. Create a Migration

```bash
npx prisma migrate dev --name add_product_discounts
```

#### 3. Update API Endpoint

Modify or create the appropriate API endpoint in `app/api/products/route.ts`:

```typescript
// Inside the POST handler
export async function POST(req: Request) {
  const data = await req.json();
  
  const product = await prisma.product.create({
    data: {
      name: data.name,
      description: data.description,
      sku: data.sku,
      unitCost: parseFloat(data.unitCost),
      sellingPrice: parseFloat(data.sellingPrice),
      discountType: data.discountType || null,
      discountValue: data.discountValue ? parseFloat(data.discountValue) : null,
      stockQuantity: parseInt(data.stockQuantity),
      // Other fields...
      userId: session.user.id,
    },
  });
  
  return NextResponse.json({ product });
}
```

#### 4. Create UI Components

Create a new component for the discount fields in `app/components/products/DiscountFields.tsx`:

```tsx
import React from 'react';

export default function DiscountFields({ 
  discountType, 
  setDiscountType, 
  discountValue, 
  setDiscountValue 
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Discount Type
        </label>
        <select
          value={discountType || ''}
          onChange={(e) => setDiscountType(e.target.value || null)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="">No Discount</option>
          <option value="PERCENTAGE">Percentage</option>
          <option value="FIXED_AMOUNT">Fixed Amount</option>
        </select>
      </div>
      
      {discountType && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Discount Value {discountType === 'PERCENTAGE' ? '(%)' : '($)'}
          </label>
          <input
            type="number"
            value={discountValue || ''}
            onChange={(e) => setDiscountValue(e.target.value ? parseFloat(e.target.value) : null)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder={discountType === 'PERCENTAGE' ? 'e.g., 10' : 'e.g., 5.99'}
          />
        </div>
      )}
    </div>
  );
}
```

#### 5. Integrate the Component

Update the product form in `app/dashboard/products/new/page.tsx` to include the new discount fields:

```tsx
import { useState } from 'react';
import DiscountFields from '@/components/products/DiscountFields';

export default function NewProductPage() {
  // Existing state...
  const [discountType, setDiscountType] = useState(null);
  const [discountValue, setDiscountValue] = useState(null);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formData = {
      // Existing fields...
      discountType,
      discountValue,
    };
    
    // Submit to API...
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Existing form fields... */}
      
      <div className="mt-6">
        <h3 className="text-lg font-medium">Pricing & Discounts</h3>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Unit Cost and Selling Price fields... */}
          
          <div className="sm:col-span-2">
            <DiscountFields
              discountType={discountType}
              setDiscountType={setDiscountType}
              discountValue={discountValue}
              setDiscountValue={setDiscountValue}
            />
          </div>
        </div>
      </div>
      
      {/* Submit button... */}
    </form>
  );
}
```

#### 6. Update Product Display

Modify the product display component to show the discounted price:

```tsx
function ProductPrice({ product }) {
  const hasDiscount = product.discountType && product.discountValue;
  
  const calculateDiscountedPrice = () => {
    if (!hasDiscount) return null;
    
    if (product.discountType === 'PERCENTAGE') {
      return product.sellingPrice * (1 - product.discountValue / 100);
    } else {
      return product.sellingPrice - product.discountValue;
    }
  };
  
  const discountedPrice = hasDiscount ? calculateDiscountedPrice() : null;
  
  return (
    <div>
      {hasDiscount ? (
        <div>
          <span className="line-through text-gray-500">${product.sellingPrice.toFixed(2)}</span>
          <span className="ml-2 font-bold text-red-600">${discountedPrice.toFixed(2)}</span>
        </div>
      ) : (
        <span className="font-bold">${product.sellingPrice.toFixed(2)}</span>
      )}
    </div>
  );
}
```

### Example Workflow Diagram

![Feature Development Workflow](https://mermaid.ink/img/pako:eNp1ksFuwjAMhl_FygEkXoADl01ih01CaGjTDj2kbmplkALRmkxJNiHevaTQDRjkkvj3Z_v3GazoUAvYQakqZ8Tdb4yWPQrLK5Q3XG95fUqrFOYvU_iZPcN24HA54O3A26xCucEFCbIKZ7nU9sRZLFBaPNKl40iFJcD2vJbGEv05hTv3JfQyC7Bey49YR1_iqt09XDf7kw1D4g25nEAH7aRcDi8j4-s0RGHhMNQxQVvQwLwVXZtW4FRlscvXSldj3jFCKbcotPVLLvA9jgBNTJ2OBb_fXO-YI06PxsWqtSjGxhhxFQlZ2r7wVfRuGkkGSaQPWJoETrGtMXEKbdP9zf06BtrPyVZVpFDGZ8i5jvgZDqbPONgDY3GlOQXaT2kj3K-NdYI7pSrIBVxhXgWvdaHCLHDhhifeFw3EqpjU4AOXBrvqn0rzJSxCoXEDYV5LMUkehUxWYjKCpbiANF_A5I4yWJ1fZBzVLHmRYeP_U7dPoX1-AwltxPE?type=png)

## Docker Setup

The application uses Docker for development and production environments. Here's how the Docker setup works:

```yaml
# docker-compose.yml structure
services:
  db:
    image: postgres:14
    # Configuration...
    
  app:
    build:
      context: .
      dockerfile: Dockerfile
    # Configuration...
```

The Dockerfile uses a multi-stage build process:
1. **Base stage**: Node.js with necessary dependencies
2. **Dependencies stage**: Install npm packages
3. **Build stage**: Build the Next.js application
4. **Production stage**: Serve the application

### Starting the Docker Environment

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Rebuild containers
docker compose build --no-cache

# Reset database (careful!)
docker compose down -v
```

## Common Patterns

### Authentication Flow

The application uses NextAuth.js for authentication. Here's the typical authentication flow:

![Authentication Flow](https://mermaid.ink/img/pako:eNp1ksFqwzAMhl9F-NRCn8AHX7ZLoS20ZaOHXoLrqgsm8bCVQUt59-lx0rIxMBdi-P8f_ZKOGWlHGdtLZahZFtP-W9qw7UHU0_fjaXM8LKfDfLdfbXeH3dvLEYaPZ8y-luPDa1FyWeS-Fx6KgJfZgvjAqg8UXR8Tf7vhMJMRE3eVuKDnJ3uNVaLzHXdGcEHhZFZBEWi0Aa0mJTPM86O4KBg34bnYuukO0nHv52KgUMYglBrX8G-aTF9oLDJF2-Qk30wf8IrVJGM8Rl6p1IYs0UqtYj5g03jyQxW6gYJCvhNx6LsN36DZ9G6iWQR7TJ402d5YoRLhJA6Dke1FmfVxhSNZCfIb91p_MZFXHWqR9UvP8uG0pByahrLJgxXWlYU51m6fsjk1Hc-ZwkBZEagZHWnbkKPMdpkJvXC21Zw5LJN8U3hhXVE_B31LVlqVyGWE5S_zJX6q?type=png)

### State Management

For global state management, the application uses React Context API:

```jsx
// app/contexts/CartContext.js
import { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  
  const addItem = (product, quantity = 1) => {
    // Implementation...
  };
  
  const removeItem = (productId) => {
    // Implementation...
  };
  
  return (
    <CartContext.Provider value={{ items, addItem, removeItem }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
```

## Testing

The application uses Jest and React Testing Library for tests. Here's how to run the tests:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

Example test for a component:

```jsx
// app/components/products/DiscountFields.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import DiscountFields from '@/components/products/DiscountFields';

describe('DiscountFields', () => {
  it('renders correctly without a discount', () => {
    render(
      <DiscountFields
        discountType={null}
        setDiscountType={jest.fn()}
        discountValue={null}
        setDiscountValue={jest.fn()}
      />
    );
    
    expect(screen.getByLabelText(/discount type/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/discount value/i)).not.toBeInTheDocument();
  });
  
  it('shows discount value field when discount type is selected', () => {
    render(
      <DiscountFields
        discountType="PERCENTAGE"
        setDiscountType={jest.fn()}
        discountValue={10}
        setDiscountValue={jest.fn()}
      />
    );
    
    expect(screen.getByLabelText(/discount value/i)).toBeInTheDocument();
  });
});
```

---

This documentation will help you understand the architecture of MerchX and guide you through the process of developing new features. If you have any questions or need further clarification, please open an issue on GitHub.
