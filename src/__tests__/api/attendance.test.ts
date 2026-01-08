import { POST as BiometricPOST } from "@/app/api/attendance/biometric/route";
import { POST as SessionPOST } from "@/app/api/attendance/session/route";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
    __esModule: true,
    default: {
        student: {
            findUnique: jest.fn(),
        },
        attendanceSession: {
            findFirst: jest.fn(),
            create: jest.fn(),
        },
        attendance: {
            findFirst: jest.fn(),
            create: jest.fn(),
        },
        lesson: {
            findMany: jest.fn(),
        },
    },
}));

// Mock Auth
jest.mock("@clerk/nextjs/server", () => ({
    auth: jest.fn(() => ({
        sessionClaims: { metadata: { role: "teacher" } },
    })),
}));

describe("Attendance API", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("Biometric POST", () => {
        it("should return 401 if device secret is invalid", async () => {
            const req = new NextRequest("http://localhost", {
                method: "POST",
                body: JSON.stringify({ biometricId: "123", deviceSecret: "WRONG" }),
            });
            process.env.DEVICE_SECRET = "SECRET"; // Mock env

            const res = await BiometricPOST(req);
            expect(res.status).toBe(401);
        });

        it("should mark attendance if session is OPEN", async () => {
            process.env.DEVICE_SECRET = "SECRET";
            const req = new NextRequest("http://localhost", {
                method: "POST",
                body: JSON.stringify({ biometricId: "BIO_123", deviceSecret: "SECRET" }),
            });

            // Mock Student found
            (prisma.student.findUnique as jest.Mock).mockResolvedValue({
                id: "student_1",
                name: "John",
                classId: 10,
            });

            // Mock Session OPEN
            ((prisma as any).attendanceSession.findFirst as jest.Mock).mockResolvedValue({
                id: 1,
                lessonId: 100,
                status: "OPEN",
                lesson: { name: "Math" }
            });

            // Mock No existing attendance
            (prisma.attendance.findFirst as jest.Mock).mockResolvedValue(null);

            const res = await BiometricPOST(req);
            const data = await res.json();

            expect(res.status).toBe(201);
            expect(data.message).toContain("Attendance marked");
            expect(prisma.attendance.create).toHaveBeenCalled();
        });

        it("should fail if no active session", async () => {
            process.env.DEVICE_SECRET = "SECRET";
            const req = new NextRequest("http://localhost", {
                method: "POST",
                body: JSON.stringify({ biometricId: "BIO_123", deviceSecret: "SECRET" }),
            });

            (prisma.student.findUnique as jest.Mock).mockResolvedValue({ id: "student_1", classId: 10 });
            ((prisma as any).attendanceSession.findFirst as jest.Mock).mockResolvedValue(null); // No session

            const res = await BiometricPOST(req);
            expect(res.status).toBe(404);
        });
    });

    describe("Session POST", () => {
        it("should create a new session if none exists", async () => {
            const req = new NextRequest("http://localhost", {
                method: "POST",
                body: JSON.stringify({ lessonId: 100 }),
            });

            ((prisma as any).attendanceSession.findFirst as jest.Mock).mockResolvedValue(null);
            ((prisma as any).attendanceSession.create as jest.Mock).mockResolvedValue({ id: 1, status: "OPEN" });

            const res = await SessionPOST(req);
            expect(res.status).toBe(201);
        });
    });
});
