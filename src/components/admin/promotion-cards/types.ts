export type PromotionCard = {
  _id: string;
  title: string;
  image: string;
  badge: string;
  features: string[];
  overview?: string;
  linkedBatch?: string;
  websiteVisible: boolean;
  featured: boolean;
  order: number;
  isArchived: boolean;
};
