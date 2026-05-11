const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    await prisma.deviceHeartbeat.updateMany({
        where: { deviceId: "ESP32_MAIN" },
        data: { pendingCommand: "EMPTY_ALL" }
    });
    console.log("✅ EMPTY_ALL command queued. The ESP32 will clear all templates on the next heartbeat.");
    
    // Also clear all student biometricIds since we're wiping the sensor
    const result = await prisma.student.updateMany({
        where: { biometricId: { not: null } },
        data: { biometricId: null }
    });
    console.log(`✅ Cleared biometricId from ${result.count} students.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
