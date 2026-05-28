import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Error: Please provide an email address as an argument.");
    console.error("Usage: npx ts-node scripts/make-super-admin.ts <email>");
    process.exit(1);
  }

  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  if (!clerkSecretKey) {
    console.error("Error: CLERK_SECRET_KEY is not defined in your environment variables (.env or .env.local).");
    process.exit(1);
  }

  console.log(`Promoting user with email "${email}" to SUPER_ADMIN...`);

  // 1. Find user in Clerk
  const findUserResponse = await fetch(
    `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`,
    {
      headers: {
        Authorization: `Bearer ${clerkSecretKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!findUserResponse.ok) {
    const errorText = await findUserResponse.text();
    console.error(`Failed to fetch user from Clerk: ${errorText}`);
    process.exit(1);
  }

  const clerkUsers = (await findUserResponse.json()) as any[];
  if (clerkUsers.length === 0) {
    console.error(`No user found in Clerk with email "${email}".`);
    process.exit(1);
  }

  const clerkUser = clerkUsers[0];
  const clerkUserId = clerkUser.id;
  console.log(`Found Clerk User: ${clerkUserId} (${clerkUser.first_name || ""} ${clerkUser.last_name || ""})`);

  // 2. Update Clerk user metadata
  console.log("Updating Clerk public metadata...");
  const updateMetadataResponse = await fetch(
    `https://api.clerk.com/v1/users/${clerkUserId}/metadata`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${clerkSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        public_metadata: {
          role: "super_admin",
          organizationId: null,
          orgSlug: null,
        },
      }),
    }
  );

  if (!updateMetadataResponse.ok) {
    const errorText = await updateMetadataResponse.text();
    console.error(`Failed to update Clerk user metadata: ${errorText}`);
    process.exit(1);
  }

  console.log("✅ Clerk public metadata updated successfully!");

  // 3. Create or update database record in Prisma
  console.log("Updating database record...");
  const dbUser = await prisma.user.upsert({
    where: { clerkId: clerkUserId },
    update: {
      role: "SUPER_ADMIN",
      organizationId: null,
    },
    create: {
      clerkId: clerkUserId,
      email: email,
      name: `${clerkUser.first_name || ""} ${clerkUser.last_name || ""}`.trim() || null,
      role: "SUPER_ADMIN",
      organizationId: null,
    },
  });

  console.log(`✅ Database record updated successfully (User ID: ${dbUser.id})!`);
  console.log(`\n🎉 Success! User "${email}" is now a SUPER_ADMIN.`);
  console.log(`You can now log in and access: http://localhost:3000/super-admin/dashboard`);
}

main()
  .catch((e) => {
    console.error("An error occurred:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
