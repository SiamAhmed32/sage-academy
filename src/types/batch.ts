export type Batch = {
  _id: string;
  title: string;
  slug: string;
  batchCode?: string;
  image: string;
  shift: string;
  classLevel?: number;
  genderGroup?: "male" | "female" | "combined";
  version?: "bangla" | "english" | "other";
  startTime?: string;
  endTime?: string;
  classDays?: string[];
  routineNote?: string;
  examSchedule?: string;
  features: string[];
  feature1?: string;
  feature2?: string;
  feature3?: string;
  feature4?: string;
  subjects?: Array<{
    subjectName: string;
    teacher?: {
      _id: string;
      name: string;
      subject?: string;
      designation?: string;
      image?: string;
    } | null;
    days: string[];
    startTime: string;
    endTime: string;
    monthlyFee: number;
  }>;
  overview?: string;
  duration?: string;
  totalClasses?: number;
  seats?: number;
  instructor?: {
    _id: string;
    name: string;
    subject: string;
    designation: string;
    experience: string;
    image: string;
    quote?: string;
  } | null;
  status: string;
  isActive: boolean;
  websiteVisible?: boolean;
  featured?: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type BatchDetailsResponse = {
  success: true;
  message: string;
  data: {
    batch: Batch;
    related: Array<
      Pick<Batch, "_id" | "slug" | "title" | "image" | "status" | "shift"> & {
        badge?: string;
        linkedBatch?: { classLevel?: number | string } | null;
      }
    >;
  };
};

export type BatchListResponse = {
  success: true;
  message: string;
  data: {
    items: Batch[];
    meta: {
      total: number;
      page: number;
      limit: number;
      pages: number;
      hasNext: boolean;
      hasPrev: boolean;
      filters: {
        q: string;
        shift: string;
        status: string;
        sort: string;
      };
    };
  };
};
