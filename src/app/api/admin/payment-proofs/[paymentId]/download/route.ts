import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { readFile } from "fs/promises";

import cloudinary from "@/lib/cloudinary";
import { connectDB } from "@/lib/mongodb";
import { requireRole, staffRoles } from "@/lib/rbac";
import Payment from "@/models/Payment";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ paymentId: string }>;
};

function sanitizeFilename(value?: string) {
  const filename = value?.trim() || "payment-proof";
  return filename.replace(/[\\/:*?"<>|]/g, "-");
}

function getFormat(originalName?: string, fallback?: string) {
  const fallbackFormat = fallback?.trim().replace(/^\./, "");
  if (fallbackFormat) return fallbackFormat;

  const extension = originalName?.split(".").pop()?.trim();
  return extension || "jpg";
}

function normalizeResourceType(value?: string) {
  if (value === "image" || value === "raw" || value === "video") return value;
  return "image";
}

async function fetchCloudinaryProof(proof: {
  url?: string;
  publicId?: string;
  resourceType?: string;
  format?: string;
  originalName?: string;
}) {
  if (!proof.publicId) {
    if (!proof.url) throw new Error("Proof file URL is missing");
    return fetch(proof.url);
  }

  const signedDownloadUrl = cloudinary.utils.private_download_url(
    proof.publicId,
    getFormat(proof.originalName, proof.format),
    {
      attachment: true,
      expires_at: Math.floor(Date.now() / 1000) + 60,
      resource_type: normalizeResourceType(proof.resourceType),
      type: "upload",
    }
  );

  return fetch(signedDownloadUrl);
}

export async function GET(_req: NextRequest, context: RouteContext) {
  await requireRole(staffRoles);
  const { paymentId } = await context.params;

  await connectDB();
  const payment = await Payment.findById(paymentId).select("signedProof").lean();
  const proof = payment?.signedProof;

  if (!proof?.url) {
    return new NextResponse("Payment proof not found", { status: 404 });
  }

  const filename = sanitizeFilename(proof.originalName);

  if (proof.url.startsWith("/")) {
    const publicRoot = path.join(process.cwd(), "public");
    const filePath = path.resolve(publicRoot, proof.url.replace(/^\/+/, ""));

    if (!filePath.startsWith(publicRoot)) {
      return new NextResponse("Invalid proof path", { status: 400 });
    }

    const file = await readFile(filePath);
    return new NextResponse(file, {
      headers: {
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "application/octet-stream",
      },
    });
  }

  const proofResponse = await fetchCloudinaryProof(proof);

  if (!proofResponse.ok || !proofResponse.body) {
    return new NextResponse("Could not download payment proof", { status: proofResponse.status || 502 });
  }

  return new NextResponse(proofResponse.body, {
    headers: {
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": proofResponse.headers.get("content-type") || "application/octet-stream",
    },
  });
}
