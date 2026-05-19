import Student from "@/models/Student";

function pad(value: number, length: number) {
  return String(value).padStart(length, "0");
}

export function buildStudentId(admissionYear: number, classLevel: number, serial: number) {
  const yearCode = String(admissionYear).slice(-2);
  return `${yearCode}${pad(classLevel, 2)}${pad(serial, 3)}`;
}

export async function getNextStudentSerial(admissionYear: number, classLevel: number) {
  const latestStudent = await Student.findOne({ admissionYear, classLevel })
    .sort({ serialNumber: -1 })
    .select("serialNumber")
    .lean();

  return (latestStudent?.serialNumber ?? 0) + 1;
}
