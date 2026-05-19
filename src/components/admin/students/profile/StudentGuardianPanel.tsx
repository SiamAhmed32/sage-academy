import { MapPin, Phone, Users } from "lucide-react";

import type { StudentProfile } from "./types";

export function StudentGuardianPanel({ student }: { student: StudentProfile }) {
  return (
    <section className="rounded-xl border border-sage-border bg-white shadow-sm">
      <div className="border-b border-sage-border bg-sage-red-50/40 p-4">
        <h3 className="flex items-center gap-2 text-lg font-bold text-sage-secondary">
          <Users className="h-5 w-5 text-sage-primary" />
          Guardian & Address
        </h3>
      </div>
      <div className="grid gap-4 p-4 lg:grid-cols-2">
        <div className="space-y-3">
          <p className="text-sm text-sage-gray-500">Father</p>
          <p className="font-bold text-sage-secondary">{student.fatherName || "N/A"}</p>
          <p className="text-sm text-sage-gray-500">Mother</p>
          <p className="font-bold text-sage-secondary">{student.motherName || "N/A"}</p>
          <p className="flex items-center gap-2 text-sm font-bold text-sage-secondary">
            <Phone className="h-4 w-4 text-sage-primary" />
            {student.guardianPhone || "Guardian phone not set"}
          </p>
        </div>
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm text-sage-gray-500">
            <MapPin className="h-4 w-4 text-sage-primary" />
            Present address
          </p>
          <p className="font-bold text-sage-secondary">{student.presentAddress || "N/A"}</p>
          <p className="text-sm text-sage-gray-500">Permanent address</p>
          <p className="font-bold text-sage-secondary">{student.permanentAddress || "N/A"}</p>
        </div>
      </div>
    </section>
  );
}
