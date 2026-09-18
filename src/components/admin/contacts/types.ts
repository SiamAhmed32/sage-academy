export interface ContactRequestItem {
  _id: string;
  name: string;
  phone: string;
  message: string;
  source?: string;
  status: string;
  adminNote?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  attributionSubmitPath?: string;
  createdAt: string;
}
