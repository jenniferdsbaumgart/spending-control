"use server";

import { prisma } from "@/db/prisma";
import bcrypt from "bcryptjs";
import { signIn, signOut } from "@/lib/auth";
import { z } from "zod";
import { AuthError } from "next-auth";

const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

export async function registerUser(formData: FormData) {
    const rawData = {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        password: formData.get("password") as string,
    };

    const validatedData = registerSchema.safeParse(rawData);

    if (!validatedData.success) {
        return {
            success: false,
            error: validatedData.error.issues[0].message,
        };
    }

    const { name, email, password } = validatedData.data;

    try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return {
                success: false,
                error: "Email already registered",
            };
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Create user
        await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
            },
        });

        // Sign in the user
        await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        return { success: true };
    } catch (error) {
        console.error("Registration error:", error);
        return {
            success: false,
            error: "Failed to create account",
        };
    }
}

export async function loginUser(formData: FormData) {
    const rawData = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
    };

    const validatedData = loginSchema.safeParse(rawData);

    if (!validatedData.success) {
        return {
            success: false,
            error: validatedData.error.issues[0].message,
        };
    }

    const { email, password } = validatedData.data;

    try {
        await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        return { success: true };
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return {
                        success: false,
                        error: "Invalid email or password",
                    };
                default:
                    return {
                        success: false,
                        error: "Authentication failed",
                    };
            }
        }
        throw error;
    }
}

export async function logoutUser() {
    await signOut({ redirect: false });
    return { success: true };
}
