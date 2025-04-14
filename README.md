# MerchX

A modern e-commerce platform built with Next.js, Prisma, and PostgreSQL. MerchX provides a robust solution for managing and selling merchandise online.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TailwindCSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **Payment Processing**: Stripe
- **Image Storage**: Cloudinary
- **State Management**: Zustand, TanStack Query
- **UI Components**: Radix UI, Lucide Icons
- **Forms**: React Hook Form
- **Charts**: Recharts
- **TypeScript** for type safety

## Prerequisites

Before you begin, ensure you have installed:
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn
- Git

## Getting Started

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd merchx
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Update the following variables:
     - `DATABASE_URL`: Your PostgreSQL connection string
     - `NEXTAUTH_SECRET`: Generate a secure random string
     - `STRIPE_*`: Your Stripe API keys
     - `CLOUDINARY_*`: Your Cloudinary credentials

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run migrations
   npx prisma migrate dev
   
   # Seed the database (optional)
   npm run seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
merchx/
├── app/                    # Next.js app router pages and API routes
├── prisma/                 # Database schema and migrations
├── public/                 # Static assets
├── scripts/               # Utility scripts (including database seeding)
└── components/            # Reusable React components
```

## Key Features

- **Authentication**: Full user authentication system with NextAuth.js
- **Product Management**: CRUD operations for products with image upload
- **Shopping Cart**: Client-side cart management with Zustand
- **Payment Processing**: Secure payments via Stripe integration
- **Admin Dashboard**: Analytics and management interface
- **Responsive Design**: Mobile-first approach with TailwindCSS

## Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint
- `npm run seed`: Seed the database with sample data

## API Routes

The application exposes several API endpoints:

- `/api/auth/*`: Authentication endpoints (NextAuth.js)
- `/api/products`: Product management
- `/api/orders`: Order processing
- `/api/webhook`: Stripe webhook handler

## Database Schema

The main entities in our Prisma schema:
- Users
- Products
- Orders
- Categories
- Cart Items

## Environment Variables

Required environment variables:
```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Deployment

- Set up PostgreSQL database
- Configure environment variables
- Set up build commands
- Configure Stripe webhooks

## Support

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.


## Design System

MerchX uses a consistent design system with predefined themes and components. The theme is defined in several key files:

### Theme Configuration

- **globals.css**: Contains the CSS variables for both light and dark modes
- **ThemeConstants.tsx**: Provides TypeScript constants for use in components
- **tailwind.config.js**: Extends Tailwind with our custom colors and animations

### Using the Theme

When creating new components:

1. Use Tailwind classes that reference our theme variables (e.g., `bg-background`, `text-foreground`)
2. For custom styles, import constants from `ThemeConstants.tsx`
3. Follow the gradient patterns defined in existing components
4. Use the predefined card and button styles from globals.css

### Theme Guidelines

- All components should respect both light and dark themes
- Refer to existing components when creating new UI elements
