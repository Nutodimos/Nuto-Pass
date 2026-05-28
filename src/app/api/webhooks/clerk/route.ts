export const dynamic = "force-dynamic";
import prismaBase from "@/lib/prisma-base";
import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
 

    // Get the webhook secret from environment variables
    const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        console.error("Missing WEBHOOK_SECRET environment variable");
        return NextResponse.json(
            { error: "Server configuration error" },
            { status: 500 }
        );
    }

    // Get the headers
    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return NextResponse.json(
            { error: "Missing svix headers" },
            { status: 400 }
        );
    }

    // Get the body
    const payload = await req.json();
    const body = JSON.stringify(payload);

    // Create a new Svix instance with your secret
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: WebhookEvent;

    // Verify the payload with the headers
    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as WebhookEvent;
    } catch (err) {
        console.error("Error verifying webhook:", err);
        return NextResponse.json(
            { error: "Invalid signature" },
            { status: 400 }
        );
    }

    // Handle the webhook event
    const eventType = evt.type;

    try {
        if (eventType === "user.deleted") {
            const { id } = evt.data;

            if (!id) {
                return NextResponse.json(
                    { error: "Missing user id" },
                    { status: 400 }
                );
            }

            // Try to delete from each user table (Student, Teacher, User)
            // Only one will succeed based on user role
            const results = await Promise.allSettled([
                prismaBase.student.delete({ where: { id } }).catch(() => null),
                prismaBase.teacher.delete({ where: { id } }).catch(() => null),
                prismaBase.user.delete({ where: { clerkId: id } }).catch(() => null),
            ]);



            return NextResponse.json({ success: true, message: "User deleted from database" });
        }

        if (eventType === "user.updated") {
            const { id, username, first_name, last_name, email_addresses } = evt.data;

            if (!id) {
                return NextResponse.json(
                    { error: "Missing user id" },
                    { status: 400 }
                );
            }

            const primaryEmail = email_addresses?.find((e) => e.id === evt.data.primary_email_address_id)?.email_address;

            // Update data object
            const updateData = {
                ...(username && { username }),
                ...(first_name && { name: first_name }),
                ...(last_name && { surname: last_name }),
                ...(primaryEmail !== undefined && { email: primaryEmail || null }),
            };

            // Only proceed if there's something to update
            if (Object.keys(updateData).length === 0) {
                return NextResponse.json({ success: true, message: "No fields to update" });
            }

            // Try to update in Student table first, then Teacher
            // User table uses clerkId and has email/name
            let updated = false;

            try {
                await prismaBase.student.update({
                    where: { id },
                    data: updateData,
                });
                updated = true;

            } catch {
                // Not a student, try teacher
            }

            if (!updated) {
                try {
                    await prismaBase.teacher.update({
                        where: { id },
                        data: updateData,
                    });
                    updated = true;

                } catch {
                    // Not a teacher, try user
                }
            }

            if (!updated && primaryEmail) {
                try {
                    await prismaBase.user.update({
                        where: { clerkId: id },
                        data: {
                            email: primaryEmail,
                            ...(first_name || last_name ? { name: `${first_name || ""} ${last_name || ""}`.trim() } : {})
                        },
                    });
                    updated = true;

                } catch {
                    console.error(`User ${id} not found in any table`);
                }
            }

            return NextResponse.json({
                success: true,
                message: updated ? "User updated in database" : "User not found in database"
            });
        }

        // Event type not handled
        return NextResponse.json({ success: true, message: `Event ${eventType} acknowledged` });

    } catch (error) {
        console.error("Error processing webhook:", error);
        return NextResponse.json(
            { error: "Error processing webhook" },
            { status: 500 }
        );
    }
}
