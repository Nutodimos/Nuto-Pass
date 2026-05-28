export const ITEM_PER_PAGE = 9

type RouteAccessMap = {
  [key: string]: string[];
};

export const routeAccessMap: RouteAccessMap = {
  "/super-admin(.*)": ["super_admin"],
  "/admin(.*)": ["admin"],
  "/student(.*)": ["student"],
  "/teacher(.*)": ["teacher"],
  "/list/lecturers": ["admin"],
  "/list/students": ["admin", "teacher"],
  "/list/courses": ["admin", "teacher", "student"],
  "/list/levels(.*)": ["admin", "teacher"],
  "/list/assignments": ["admin", "teacher", "student"],
  "/list/attendance(.*)": ["admin", "teacher", "student"],
  // "/list/events": ["admin", "teacher", "student"],
  "/list/announcements": ["admin", "teacher", "student"],
  "/list/materials": ["admin", "teacher", "student"],
  "/list/lessons": ["admin", "teacher", "student"],
  "/settings": ["admin", "teacher", "student"],
};