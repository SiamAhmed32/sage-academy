import { heroTeachers } from "@/constants/hero";

const PRELOAD_COUNT = 3;

export function HeroImagePreloads() {
  return (
    <>
      {heroTeachers.slice(0, PRELOAD_COUNT).map((teacher) => (
        <link
          key={teacher.image}
          rel="preload"
          as="image"
          href={encodeURI(teacher.image)}
          fetchPriority={teacher.image === heroTeachers[0]?.image ? "high" : "low"}
        />
      ))}
    </>
  );
}
