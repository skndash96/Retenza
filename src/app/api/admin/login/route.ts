import { NextRequest, NextResponse } from "next/server";
import { checkAdminCredentials } from "@/lib/server/adminAuth";

export async function POST(request: NextRequest) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json(
                { success: false, error: "Username and password are required" },
                { status: 400 }
            );
        }

        // Check admin credentials on server side
        const isValidAdmin = checkAdminCredentials(username, password);

        if (isValidAdmin) {
            return NextResponse.json({
                success: true,
                message: "Admin credentials are valid",
                username: username
            });
        } else {
            return NextResponse.json(
                { success: false, error: "Invalid admin credentials" },
                { status: 401 }
            );
        }
    } catch (error) {
        console.error("Admin login error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
} 