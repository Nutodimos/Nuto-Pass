
const getLatestMonday = (): Date => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const latestMonday = today;
  latestMonday.setDate(today.getDate() - daysSinceMonday);
  return latestMonday;
};

export const adjustScheduleToCurrentWeek = (
  lessons: { title: string; start: Date; end: Date }[]
): { title: string; start: Date; end: Date }[] => {
  const latestMonday = getLatestMonday();

  return lessons.map((lesson) => {
    const lessonDayOfWeek = lesson.start.getDay();

    const daysFromMonday = lessonDayOfWeek === 0 ? 6 : lessonDayOfWeek - 1;

    const adjustedStartDate = new Date(latestMonday);

    adjustedStartDate.setDate(latestMonday.getDate() + daysFromMonday);
    adjustedStartDate.setHours(
      lesson.start.getHours(),
      lesson.start.getMinutes(),
      lesson.start.getSeconds()
    );
    const adjustedEndDate = new Date(adjustedStartDate);
    adjustedEndDate.setHours(
      lesson.end.getHours(),
      lesson.end.getMinutes(),
      lesson.end.getSeconds()
    );

    return {
      title: lesson.title,
      start: adjustedStartDate,
      end: adjustedEndDate,
    };
  });
};

export const handleActionError = (
  err: any
): { success: boolean; error: true; messages: string[] } => {
  console.error("Action Error:", err);

  // Prisma Unique Constraint Violation
  if (err.code === "P2002" && err.meta?.target) {
    const field = err.meta.target[0];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)
      } already exists!`;
    return { success: false, error: true, messages: [message] };
  }

  // Prisma Foreign Key Constraint Violation (Deletion issues)
  if (err.code === "P2003") {
    return {
      success: false,
      error: true,
      messages: ["Cannot delete: This item is used specifically elsewhere."],
    };
  }

  // Clerk Errors (e.g. Password validation, existing user)
  if (err.errors && Array.isArray(err.errors)) {
    // Collect all messages from Clerk errors
    const messages = err.errors.map((e: any) => e.message);
    return { success: false, error: true, messages };
  }

  // Fallback for generic errors
  const message = err.message || "Something went wrong!";
  return { success: false, error: true, messages: [message] };
};
