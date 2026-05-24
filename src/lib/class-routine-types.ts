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
};
