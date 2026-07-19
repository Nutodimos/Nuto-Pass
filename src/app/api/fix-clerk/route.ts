import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Not logged in" });
  }

  try {
    await clerkClient().users.updateUser(userId, {
      publicMetadata: {
        role: "admin",
        organizationId: "cmpmsmg6f0007cod1vjv2l3kn",
        orgSlug: "unilorin-cpe"
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Clerk Metadata fixed! Please SIGN OUT and SIGN BACK IN on your dashboard for the changes to apply." 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
