import NextAuth from "next-auth";
import { UserRole } from "@prisma/client";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            roles: UserRole[];
        };
    }

    interface User {
        id: string;
        name?: string | null;
        email?: string | null;
        image?: string | null;
        roles: UserRole[];
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
    }
} 