const LoadingSkeleton = ({
  type = "card",
  className = "",
}: {
  type?: "card" | "calendar" | "chart" | "announcements";
  className?: string;
}) => {
  if (type === "calendar") {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 bg-gray-200 rounded-lg w-32"></div>
          <div className="flex gap-2">
            <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
            <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2 mb-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-2">
              <div className="h-12 w-16 bg-gray-100 rounded"></div>
              <div className="h-12 flex-1 bg-gray-100 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "chart") {
    return (
      <div className={`animate-pulse bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-full ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="h-5 bg-gray-200 rounded-lg w-40"></div>
          <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="flex items-end gap-3 h-[300px] pt-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full bg-gray-100 rounded-t-lg"
                style={{ height: `${30 + Math.random() * 60}%` }}
              ></div>
              <div className="h-3 w-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "announcements") {
    return (
      <div className={`animate-pulse bg-white rounded-3xl p-6 shadow-sm border border-gray-100 ${className}`}>
        <div className="h-5 bg-gray-200 rounded-lg w-36 mb-6"></div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-2xl">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default card skeleton
  return (
    <div className={`animate-pulse bg-white rounded-3xl p-6 shadow-sm border border-gray-100 ${className}`}>
      <div className="h-5 bg-gray-200 rounded-lg w-40 mb-4"></div>
      <div className="space-y-3">
        <div className="h-10 bg-gray-100 rounded-xl"></div>
        <div className="h-10 bg-gray-100 rounded-xl"></div>
        <div className="h-10 bg-gray-50 rounded-xl"></div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
