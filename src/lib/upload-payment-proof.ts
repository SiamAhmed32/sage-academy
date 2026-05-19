import { v2 as cloudinary } from "cloudinary";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { BadRequestError } from "@/lib/errors";

const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const maxSize = 10 * 1024 * 1024;

function validate(file: File) {
  if (!allowedTypes.includes(file.type)) throw new BadRequestError("Only JPG, PNG, WEBP, or PDF proof files are allowed");
  if (file.size > maxSize) throw new BadRequestError("Proof file must be 10MB or less");
}

function getCloudinaryPdfPreviewUrl(url: string) {
  if (!url.includes("/image/upload/")) return "";

  return url
    .replace("/image/upload/", "/image/upload/pg_1,f_jpg/")
    .replace(/\.pdf$/i, ".jpg");
}

export async function uploadPaymentProof(file: File) {
  validate(file);
  const bytes = Buffer.from(await file.arrayBuffer());
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
    const dataUri = `data:${file.type};base64,${bytes.toString("base64")}`;
    const isPdf = file.type === "application/pdf";
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "sage-academy/payment-proofs",
      resource_type: "auto",
      use_filename: true,
      unique_filename: true,
      ...(isPdf
        ? {
            eager: [{ page: 1, format: "jpg" }],
            eager_async: false,
          }
        : {}),
    });
    const eagerPreview = Array.isArray(result.eager)
      ? result.eager.find((item) => item.secure_url)?.secure_url
      : "";
    const previewUrl = isPdf
      ? eagerPreview || getCloudinaryPdfPreviewUrl(result.secure_url)
      : result.secure_url;

    return {
      url: result.secure_url,
      previewUrl,
      publicId: result.public_id,
      resourceType: result.resource_type,
      originalName: file.name,
      format: result.format ?? "",
    };
  }
  const relativeDir = path.join("uploads", "payment-proofs");
  const targetDir = path.join(process.cwd(), "public", relativeDir);
  await mkdir(targetDir, { recursive: true });
  const extension = file.name.split(".").pop() || (file.type === "application/pdf" ? "pdf" : "jpg");
  const filename = `${Date.now()}-${randomUUID()}.${extension}`;
  await writeFile(path.join(targetDir, filename), bytes);
  return {
    url: `/${relativeDir.replace(/\\/g, "/")}/${filename}`,
    previewUrl: file.type === "application/pdf" ? "" : `/${relativeDir.replace(/\\/g, "/")}/${filename}`,
    publicId: "",
    resourceType: file.type,
    originalName: file.name,
    format: extension,
  };
}
