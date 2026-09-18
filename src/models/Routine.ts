import { Schema, model, models } from "mongoose";
import "./SubjectBatch";

/**
 * Routine = one weekly recurring time-slot for a SubjectBatch.
 * A student's personal timetable is assembled dynamically by looking up the
 * Routine rows of every SubjectBatch they hold an ACTIVE Enrollment in.
 */
const RoutineSchema = new Schema(
  {
    subjectBatchId: {
      type: Schema.Types.ObjectId,
      ref: "SubjectBatch",
      required: true,
    },
    dayOfWeek: {
      type: String,
      enum: [
        "SATURDAY",
        "SUNDAY",
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
      ],
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
    },
    endTime: {
      type: String,
      required: true,
      trim: true,
    },
    roomNumber: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

RoutineSchema.index({ subjectBatchId: 1, dayOfWeek: 1 });

const Routine = models.Routine || model("Routine", RoutineSchema);

export default Routine;
