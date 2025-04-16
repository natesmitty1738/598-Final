import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role?: string;
    permissions?: string[];
  }
  
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role?: string;
      permissions?: string[];
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: string;
    permissions?: string[];
  }
} 