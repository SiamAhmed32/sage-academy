export type AdminTestimonial = {
  _id: string;
  name: string;
  role: "student" | "guardian";
  className: string;
  review: string;
  rating: number;
  image: string;
  isFeatured: boolean;
  order: number;
};

export type TestimonialFormValues = {
  name: string;
  role: "student" | "guardian";
  className: string;
  review: string;
  rating: number;
  image: string;
  isFeatured: boolean;
  order: number;
};
