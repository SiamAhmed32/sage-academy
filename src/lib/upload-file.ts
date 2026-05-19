import cloudinary from "@/lib/cloudinary";
import { BadRequestError } from "@/lib/errors";

const allowedFileTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
const maxFileSizeBytes = 10 * 1024 * 1024;

export type UploadedAdmissionForm = {
  url: string;
  publicId: string;
  resourceType: string;
  originalName: string;
  format: string;
  bytes: number;
};

function validateFile(file: File) {
  if (!allowedFileTypes.includes(file.type)) {
    throw new BadRequestError("Only JPG, PNG, WEBP, or PDF files are allowed");
  }

  if (file.size > maxFileSizeBytes) {
    throw new BadRequestError("File size must be 10MB or less");
  }
}

export async function uploadAdmissionFormFile(
  file: File
): Promise<UploadedAdmissionForm> {
  validateFile(file);

  const bytes = Buffer.from(await file.arrayBuffer());
  const dataUri = `data:${file.type};base64,${bytes.toString("base64")}`;

  let result;
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error("Cloudinary credentials missing");
    }

    result = await cloudinary.uploader.upload(dataUri, {
      folder: "sage-academy/admission-forms",
      resource_type: "auto",
      use_filename: true,
      unique_filename: true,
    });
  } catch (error: any) {
    console.error("[Cloudinary Upload Error]", error);
    throw new BadRequestError(
      error.message === "Cloudinary credentials missing"
        ? "সার্ভারে ফাইল আপলোড সেটআপ করা নেই (Cloudinary Config Missing)।"
        : "ফাইল আপলোড করা যায়নি। আবার চেষ্টা করুন।"
    );
  }

  return {
    url: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type,
    originalName: file.name,
    format: result.format ?? "",
    bytes: result.bytes ?? file.size,
  };
}
