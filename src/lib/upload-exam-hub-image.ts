import { uploadAssessmentImage } from "@/lib/upload-assessment-image";

export async function uploadExamHubImage(file: File) {
  return uploadAssessmentImage(file);
}
