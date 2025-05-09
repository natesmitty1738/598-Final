# MerchX

A modern e-commerce platform built with Next.js, Prisma, and PostgreSQL. MerchX provides a robust solution for managing and selling merchandise online.

> **⚠️ Troubleshooting Database Issues**: If you encounter the error `The table 'public.User' does not exist`, check the [Database Troubleshooting Guide](#table-does-not-exist-error) for a quick fix.

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
- **Docker** for containerization

## Prerequisites

Before you begin, ensure you have installed:
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher) - *Not needed if using Docker*
- npm or yarn
- Git
- Docker and Docker Compose (optional, for containerized setup)

## Getting Started

### Option 1: Local Development

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

### Option 2: Docker Setup

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd merchx
   ```

2. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Update with your configuration (for Docker, the DATABASE_URL will be `postgresql://postgres:postgres@db:5432/merchx`)

3. **Build and start the Docker containers**
   ```bash
   docker compose build
   docker compose up -d
   ```

4. **Run migrations and seed the database**
   ```bash
   # Run migrations
   docker compose exec app npx prisma migrate deploy
   
   # Fix the database (if table not found error)
   npx prisma migrate dev --name init
   docker compose exec app npx prisma migrate dev --name init
   docker compose exec app npx prisma migrate deploy
   ```

5. **Access the application**
   
   Open [http://localhost:3000](http://localhost:3000) to view the application.

6. **Stop the containers when done**
   ```bash
   docker compose down
   ```

7. **To remove everything including volumes**
   ```bash
   docker compose down -v
   ```

## Docker Configuration

The project includes Docker configuration for easy setup and deployment:

1. **Dockerfile**: Configures the Node.js environment for the application
2. **docker-compose.yml**: Sets up the application and PostgreSQL database services
3. **.dockerignore**: Specifies files and directories to exclude from the Docker build

The Docker setup includes:
- PostgreSQL database running on port 5432
- Next.js application running on port 3000
- Data persistence through Docker volumes

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

## Troubleshooting

### "Table does not exist" Error

If you encounter the error `The table 'public.User' does not exist` after resetting or rebuilding your Docker environment:

1. **Use the automated fix script (Windows)**
   ```
   # Run the automated fix script
   powershell -ExecutionPolicy Bypass -File .\fix-database.ps1
   ```
   This script will automatically apply the necessary migrations to recreate your database tables.

2. **Manual fix (any platform)**
   ```bash
   # Apply SQL migrations directly to the database
   docker cp prisma/migrations/20250419000000_init/migration.sql 598-final-db-1:/tmp/
   docker exec 598-final-db-1 psql -U postgres -d merchx -f /tmp/migration.sql
   
   # Restart the app container
   docker restart 598-final-app-1
   ```

### PostgreSQL Initialization and Prisma SSL Issues

If you encounter either of these errors when running the application in Docker:

```
# Error 1: PostgreSQL initialization error
initdb: error: directory "/var/lib/postgresql/data" exists but is not empty

# Error 2: Prisma SSL error
PrismaClientInitializationError: Unable to require(`/app/node_modules/.prisma/client/libquery_engine-linux-musl.so.node`).
Error loading shared library libssl.so.1.1: No such file or directory
```

These issues are related to Docker configuration. Here's how to fix them:

1. **Update your Dockerfile**
   
   Ensure your Dockerfile includes the necessary OpenSSL dependencies:
   ```dockerfile
   FROM node:18-alpine AS base

   # Install dependencies for Prisma and other required packages
   RUN apk add --no-cache \
       openssl \
       openssl-dev \
       libc6-compat \
       ca-certificates \
       netcat-openbsd
   ```

2. **Configure PostgreSQL in docker-compose.yml**
   
   Update your docker-compose.yml with the correct PostgreSQL configuration:
   ```yaml
   services:
     db:
       image: postgres:14
       environment:
         POSTGRES_USER: ${POSTGRES_USER:-postgres}
         POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
         POSTGRES_DB: merchx
         PGDATA: /var/lib/postgresql/data/pgdata
       volumes:
         - type: volume
           source: postgres_data
           target: /var/lib/postgresql/data
       healthcheck:
         test: ["CMD-SHELL", "pg_isready -U postgres"]
         interval: 5s
         timeout: 5s
         retries: 5

     migration:
       # ... migration service configuration ...
       environment:
         - DATABASE_URL=postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-postgres}@db:5432/merchx
         - NODE_ENV=development
         - PRISMA_BINARY_PLATFORM=linux-musl

     app:
       # ... app service configuration ...
       environment:
         - DATABASE_URL=postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-postgres}@db:5432/merchx
         - PRISMA_BINARY_PLATFORM=linux-musl
   ```

3. **Clean up and restart**
   ```bash
   # Stop containers and remove volumes
   docker compose down -v

   # Rebuild and start containers
   docker compose up --build
   ```

Key points to note:
- The `PGDATA` environment variable ensures PostgreSQL initializes in a clean subdirectory
- `PRISMA_BINARY_PLATFORM=linux-musl` is required for Alpine Linux
- The migration service runs before the app service to ensure the database is properly initialized
- Using `type: volume` for PostgreSQL data ensures proper initialization

If you still encounter issues:
1. Check that all containers are running: `docker compose ps`
2. View container logs: `docker compose logs [service_name]`
3. Ensure your .env file exists and contains the necessary environment variables
4. Try rebuilding without cache: `docker compose build --no-cache`

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

### TODOS

-Add docker config for ease of use

## Component Structure

The components are organized in the following structure:

```
components/
├── ui/              # Base UI components (buttons, inputs, etc.)
├── layout/          # Layout components (Header, Sidebar, Navigation)
├── forms/           # Form components
├── features/        # Feature-specific components
│   ├── onboarding/  # Onboarding-related components
│   ├── inventory/   # Inventory-related components
│   └── sales/       # Sales-related components
├── shared/          # Shared utility components
└── providers/       # Context providers
```

> **Note:** The previous component structure that used `app/components` has been completely removed in favor of this cleaner approach. All components now reside in the root `/components` directory organized by function.

## Data Visualization

MerchX uses Chart.js for data visualization through custom chart components:

### CategoryChart Component

The `CategoryChart` component handles data visualization with these key features:

- **Large Number Formatting**: Values are formatted with K (thousands), M (millions), and B (billions) suffixes
  ```javascript
  // Examples:
  // 1,500 -> 1.5K
  // 1,500,000 -> 1.5M
  // 1,500,000,000 -> 1.5B
  ```

- **Currency Formatting**: Automatically adds $ symbol to values when valueLabel includes '$'

- **Automatic Theming**: Charts adapt to light/dark mode using predefined color schemes

- **Responsive Sizing**: Charts automatically adjust based on container width and specified height

- **Multiple Chart Types**: Supports both bar charts and pie charts with appropriate configurations

The dashboard demo can be accessed via the Analytics page after logging in.

## Directory Paths

- `@/components/ui/*`: UI components
- `@/components/layout/*`: Layout components
- `@/components/forms/*`: Form components
- `@/components/features/*`: Feature-specific components
- `@/components/shared/*`: Shared utility components
- `@/components/providers/*`: Context providers

## Data Upload and Processing

The application supports uploading business data via CSV files:

### Sales History Import

Businesses can upload their sales history using CSV files with the following columns:
- `date` - The date of the sale (YYYY-MM-DD format)
- `productId` - Optional ID or SKU of the product
- `productName` - Name of the product
- `quantity` - Number of units sold
- `unitPrice` - Price per unit
- `totalAmount` - Optional total amount (will be calculated if not provided)

### Inventory Items Import

Businesses can upload their inventory items using CSV files with the following columns:
- `sku` - The SKU or unique identifier for the product
- `name` - Product name (required)
- `description` - Optional product description
- `category` - Optional product category
- `unitCost` - Optional cost per unit
- `sellingPrice` - Optional selling price
- `stockQuantity` - Optional current stock quantity
- `location` - Optional storage location
- `size` - Optional product size
- `color` - Optional product color

### Dynamic Pricing

Uploaded sales history is analyzed to provide dynamic pricing suggestions based on:
- Historical price elasticity
- Inventory levels
- Sales velocity
- Market trends

The system calculates optimal pricing that maximizes revenue while considering inventory constraints.

## Getting Started

projected earning line-chart, peak selling hours bar chart, price suggestions bar chart (compare current price with suggested price) [second graph: projected revenue with price changes line chart that compares current revenue projection using current prices vs renenue projection using profitable and up recommended prices], optimal products (bar chart with products that have best score based on margin & selling volume) 

...
