import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";

const UserCard = async ({
  type,
}: {
  type: "admin" | "teacher" | "student";
}) => {
  const modelMap: Record<typeof type, any> = {
    admin: prisma.admin,
    teacher: prisma.teacher,
    student: prisma.student,
  };

  const linkMap: Record<typeof type, string> = {
    admin: "/list/admins",
    teacher: "/list/lecturers",
    student: "/list/students",
  };

  const data = await modelMap[type].count();

  // Fetch session year (with fallback)
  const config = await prisma.schoolConfig.findUnique({
    where: { key: "sessionYear" },
  });
  const sessionYear = config?.value || new Date().toLocaleDateString('en-GB');

  return (
    <div className="rounded-2xl odd:bg-nutoSlate/10 even:bg-nutoOrange/10 p-4 flex-1 min-w-[130px]">
      <div className="flex justify-between items-center">
        <span className="text-[10px] bg-white px-2 py-1 rounded-full text-green-600">
          {sessionYear}
        </span>
        <Link href={linkMap[type]} className="cursor-pointer hover:opacity-70 transition-opacity">
          <Image src="/more.png" alt="View all" width={20} height={20} />
        </Link>
      </div>
      <h1 className="text-2xl font-semibold my-4">{data}</h1>
      <h2 className="capitalize text-sm font-medium text-gray-500">
        {type === "teacher" ? "Lecturers" : type + "s"}
      </h2>
    </div>
  );
};

export default UserCard;
