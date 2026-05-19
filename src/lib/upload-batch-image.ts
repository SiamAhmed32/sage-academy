import { v2 as cloudinary } from "cloudinary";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { BadRequestError } from "@/lib/errors";

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const maxFileSizeBytes = 5 * 1024 * 1024;

function validateImage(file: File) {
  if (!allowedImageTypes.includes(file.type)) {
    throw new BadRequestError("Only JPG, PNG, or WEBP image files are allowed");
  }
  if (file.size > maxFileSizeBytes) {
    throw new BadRequestError("Image size must be 5MB or less");
  }
}

export async function uploadBatchImage(file: File) {
  validateImage(file);
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const bytes = Buffer.from(await file.arrayBuffer());
  const extension = file.type.split("/")[1] || "jpg";

  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
    const dataUri = `data:${file.type};base64,${bytes.toString("base64")}`;
    try {
      const result = await cloudinary.uploader.upload(dataUri, {
        folder: "sage-academy/batches",
        resource_type: "image",
        use_filename: true,
        unique_filename: true,
      });
      return result.secure_url;
    } catch {
      // Fall through to local storage fallback.
    }
  }

  try {
    const relativeDir = path.join("uploads", "batches");
    const targetDir = path.join(process.cwd(), "public", relativeDir);
    await mkdir(targetDir, { recursive: true });
    const filename = `${Date.now()}-${randomUUID()}.${extension}`;
    const fullPath = path.join(targetDir, filename);
    await writeFile(fullPath, bytes);
    return `/${relativeDir.replace(/\\/g, "/")}/${filename}`;
  } catch {
    throw new BadRequestError("Batch image upload failed");
  }
}
