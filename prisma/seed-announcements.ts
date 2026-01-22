import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAnnouncements() {
    console.log('Seeding announcements...');

    try {
        // Clear existing seed announcements (optional - comment out if you want to keep existing data)
        // await prisma.announcement.deleteMany({});

        // Create general announcements based on notification dummy data
        const announcements = [
            {
                title: "New Student Enrolled",
                description: "John Doe has joined Class 5A. Welcome to our learning community!",
                date: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
                targetAudience: "all",
                classId: null,
            },
            {
                title: "Attendance Session Completed",
                description: "CS101 attendance session has ended successfully. All records have been saved.",
                date: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
                targetAudience: "teachers",
                classId: null,
            },
            {
                title: "System Update Available",
                description: "New features are now available! Check out the enhanced search functionality and improved dashboard.",
                date: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
                targetAudience: "all",
                classId: null,
            },
            {
                title: "Upcoming Assignment Deadline",
                description: "Reminder: Mathematics assignment is due in 2 days. Make sure to submit on time!",
                date: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
                targetAudience: "students",
                classId: null,
            },
            {
                title: "Important: School Event Next Week",
                description: "Annual Science Fair will be held next Friday. All students are encouraged to participate.",
                date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
                targetAudience: "all",
                classId: null,
            },
            {
                title: "Teacher Meeting Scheduled",
                description: "Monthly staff meeting scheduled for Monday at 3 PM. Attendance is mandatory.",
                date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                targetAudience: "teachers",
                classId: null,
            },
            {
                title: "Library Hours Extended",
                description: "Starting this week, the library will remain open until 6 PM to support exam preparations.",
                date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
                targetAudience: "students",
                classId: null,
            },
            {
                title: "Grade Updates Available",
                description: "Recent assessment grades have been uploaded. Check your student profiles for details.",
                date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
                targetAudience: "all",
                classId: null,
            },
        ];

        // Insert announcements
        for (const announcement of announcements) {
            await prisma.announcement.create({
                data: announcement,
            });
        }

        console.log(`✅ Created ${announcements.length} announcements`);

        // Create lesson-based automatic announcements
        await createLessonAnnouncements();

        console.log('✅ Announcement seeding completed!');
    } catch (error) {
        console.error('Error seeding announcements:', error);
        throw error;
    }
}

async function createLessonAnnouncements() {
    console.log('Creating lesson-based announcements...');

    // Get current day of week
    const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
    const today = new Date();
    const currentDayIndex = (today.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
    const currentDay = daysOfWeek[currentDayIndex] || 'MONDAY';

    // Get current hour
    const currentHour = today.getHours();

    // Fetch today's lessons
    const todaysLessons = await prisma.lesson.findMany({
        where: {
            day: currentDay as any,
        },
        include: {
            subject: true,
            class: true,
            teacher: true,
        },
    });

    console.log(`Found ${todaysLessons.length} lessons for ${currentDay}`);

    // Create announcements for upcoming lessons (next 2 hours)
    let createdCount = 0;
    for (const lesson of todaysLessons) {
        const lessonHour = lesson.startTime.getHours();

        // Only create announcements for lessons happening within the next 2 hours
        if (lessonHour >= currentHour && lessonHour <= currentHour + 2) {
            // Check if announcement already exists for this lesson today
            const existingAnnouncement = await prisma.announcement.findFirst({
                where: {
                    title: {
                        contains: `${lesson.subject.name} - ${lesson.class.name}`,
                    },
                    date: {
                        gte: new Date(today.setHours(0, 0, 0, 0)),
                    },
                },
            });

            if (!existingAnnouncement) {
                // Create announcement for students
                await prisma.announcement.create({
                    data: {
                        title: `Upcoming Lesson: ${lesson.subject.name}`,
                        description: `${lesson.subject.name} class for ${lesson.class.name} starts at ${lesson.startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}. Don't forget to bring your materials!`,
                        date: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
                        targetAudience: 'students',
                        classId: lesson.classId,
                    },
                });

                // Create announcement for teachers
                await prisma.announcement.create({
                    data: {
                        title: `Teaching Schedule: ${lesson.subject.name}`,
                        description: `You have ${lesson.subject.name} with ${lesson.class.name} at ${lesson.startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}. Room: ${lesson.name}`,
                        date: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
                        targetAudience: 'teachers',
                        classId: lesson.classId,
                    },
                });

                createdCount += 2;
            }
        }
    }

    console.log(`✅ Created ${createdCount} lesson-based announcements`);
}

// Run the seed function
seedAnnouncements()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
