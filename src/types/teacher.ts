export type Teacher = {
  _id: string;
  name: string;
  subject: string;
  designation: string;
  experience: string;
  quote?: string;
  image: string;
  isFeatured: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type TeacherCreateInput = Omit<Teacher, "_id" | "createdAt" | "updatedAt">;
