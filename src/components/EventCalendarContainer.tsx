import Image from "next/image";
import EventCalendar from "./EventCalendar";
import EventList from "./EventList";

const EventCalendarContainer = async ({
  searchParams,
}: {
  searchParams: { [keys: string]: string | undefined };
}) => {
  const { date } = searchParams;
  return (
    <div className="group nuto-card p-6">
      <div className="group nuto-card-indicator"></div>
      <div className="relative z-10">
        <EventCalendar />
      </div>
      <div className="flex items-center justify-between mt-6 mb-4 relative z-10">
        <h1 className="text-xl font-bold text-slate-800">Events</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} className="opacity-50 hover:opacity-100 cursor-pointer" />
      </div>
      <div className="flex flex-col gap-4">
        <EventList dateParam={date} />
      </div>
    </div>
  );
};

export default EventCalendarContainer;
