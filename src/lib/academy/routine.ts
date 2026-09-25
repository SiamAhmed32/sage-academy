// Pure routine clash detection. Used by the batch builder (client preview)
// and by the server before anything is saved.
import { WEEK_DAY_LABELS, type WeekDay } from "@/lib/academy/constants";
import { formatTimeRange, rangesOverlap } from "@/lib/academy/codes";

export type RoutineSlotInput = {
  subjectId: string;
  day: WeekDay;
  start: string;
  end: string;
  room: string;
};

export type ClashSlot = RoutineSlotInput & {
  subjectName: string;
  batchCode: string;
  teacherId: string | null;
  teacherName: string;
};

function when(slot: { day: WeekDay; start: string; end: string }) {
  return `${WEEK_DAY_LABELS[slot.day]} ${formatTimeRange(slot.start, slot.end)}`;
}

/** Overlaps inside one batch: a batch cannot have two classes at once. */
export function internalOverlaps(slots: ClashSlot[]) {
  const problems: string[] = [];
  for (let a = 0; a < slots.length; a += 1) {
    for (let b = a + 1; b < slots.length; b += 1) {
      const first = slots[a];
      const second = slots[b];
      if (first.day === second.day && rangesOverlap(first.start, first.end, second.start, second.end)) {
        problems.push(
          `${first.subjectName} and ${second.subjectName} overlap on ${when(first)}.`
        );
      }
    }
  }
  return problems;
}

/** Room and teacher double-bookings against other batches' slots. */
export function externalClashes(slots: ClashSlot[], others: ClashSlot[]) {
  const problems: string[] = [];
  for (const slot of slots) {
    for (const other of others) {
      if (slot.day !== other.day || !rangesOverlap(slot.start, slot.end, other.start, other.end)) {
        continue;
      }
      const room = slot.room.trim().toLowerCase();
      if (room && room === other.room.trim().toLowerCase()) {
        problems.push(
          `Room ${slot.room} is already used by ${other.batchCode} (${other.subjectName}) on ${when(other)}.`
        );
      }
      if (slot.teacherId && slot.teacherId === other.teacherId) {
        problems.push(
          `${slot.teacherName || "This teacher"} already teaches ${other.batchCode} (${other.subjectName}) on ${when(other)}.`
        );
      }
    }
  }
  return Array.from(new Set(problems));
}

/** A student's own timetable clashes (used for subject transfers). */
export function studentClashes(incoming: ClashSlot[], existing: ClashSlot[]) {
  const problems: string[] = [];
  for (const slot of incoming) {
    for (const other of existing) {
      if (slot.day === other.day && rangesOverlap(slot.start, slot.end, other.start, other.end)) {
        problems.push(
          `${slot.subjectName} in ${slot.batchCode} (${when(slot)}) clashes with ${other.subjectName} in ${other.batchCode}.`
        );
      }
    }
  }
  return Array.from(new Set(problems));
}
