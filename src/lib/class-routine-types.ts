export type ClassRoutineEntry = {
  day: string;
  time: string;
  subject: string;
};

export type ClassRoutinePdfOptions = {
  title: string;
  subtitle?: string;
  studentLine?: string;
  classCountLine?: string;
  footer?: string;
  entries: ClassRoutineEntry[];
  filename: string;
  /** Rows to print, in order (English day names). Defaults to Saturday–Friday. */
  days?: string[];
};
