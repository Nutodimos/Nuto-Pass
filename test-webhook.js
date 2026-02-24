const { Webhook } = require("svix");
const dotenv = require("dotenv");

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
    console.error("❌ Error: WEBHOOK_SECRET is missing in .env.local");
    process.exit(1);
}

// 1. Define the test payload (simulating a Clerk user update)
const payload = {
    data: {
        id: "test_user_123", // This ID won't exist in your DB, so we expect a "not found" message, which is fine!
        first_name: "Test",
        last_name: "User",
        username: "testuser",
        email_addresses: [
            {
                id: "email_1",
                email_address: "test@example.com",
            }
        ],
        primary_email_address_id: "email_1"
    },
    object: "event",
    type: "user.updated"
};

const payloadString = JSON.stringify(payload);

// 2. Generate the Svix headers manually using standard crypto
const crypto = require("crypto");
const msgId = "msg_local_test_" + Date.now();
const timestamp = Math.floor(Date.now() / 1000).toString();

// The secret has a "whsec_" prefix we need to remove before decoding base64
const secretBytes = Buffer.from(WEBHOOK_SECRET.replace(/^whsec_/, ""), "base64");
const toSign = `${msgId}.${timestamp}.${payloadString}`;
const signature = crypto.createHmac("sha256", secretBytes).update(toSign).digest("base64");

const headers = {
    "svix-id": msgId,
    "svix-timestamp": timestamp,
    "svix-signature": `v1,${signature}`
};

// 3. Send the request to your local Next.js server
async function testWebhook() {
    console.log("🚀 Sending test webhook to http://localhost:3000/api/webhooks/clerk...");

    try {
        const response = await fetch("http://localhost:3000/api/webhooks/clerk", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...headers,
            },
            body: payloadString,
        });

        const result = await response.json();

        console.log(`\n📬 Response Status: ${response.status} ${response.statusText}`);
        console.log("📦 Response Body:");
        console.log(result);

        if (response.ok) {
            console.log("\n✅ SUCCESS! Your webhook endpoint verified the signature and processed the request correctly.");
        } else {
            console.log("\n❌ FAILED. The webhook endpoint returned an error.");
        }
    } catch (error) {
        console.error("\n❌ ERROR: Could not connect to http://localhost:3000. Is your Next.js server (npm run dev) running?");
    }
}

testWebhook();
