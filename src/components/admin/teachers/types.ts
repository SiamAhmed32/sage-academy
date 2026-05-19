export type TeacherFormValues = {
  name: string;
  subject: string;
  designation: string;
  experience: string;
  quote: string;
  image: string;
  isFeatured: boolean;
  order: number;
};

export type AdminTeacher = TeacherFormValues & {
  _id: string | { toString(): string };
};
