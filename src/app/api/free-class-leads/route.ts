import { NextRequest } from "next/server";
import { z } from "zod";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { BadRequestError } from "@/lib/errors";
import { getOptionalSessionFromCookies } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import FreeClassLead from "@/models/FreeClassLead";
import { isValidBdMobileNormalized } from "@/lib/bd-phone";
import {
  bdPhoneSchema,
  freeClassLeadGuestSchema,
  normalizeBangladeshPhone,
} from "@/schemas/free-class-lead";

function clientIp(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim().slice(0, 45) ?? "";
  return req.headers.get("x-real-ip")?.slice(0, 45) ?? "";
}

function userAgent(req: NextRequest) {
  return req.headers.get("user-agent")?.slice(0, 400) ?? "";
}

const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

const subjectField = z.string().trim().min(2, "বিষয় লিখুন").max(120, "বিষয় খুব লম্বা");
const classLabelField = z.string().trim().min(1, "শ্রেণী বেছে নিন").max(40, "অবৈধ মান");

export const POST = withApiHandler(async (req: NextRequest) => {
  const body = await req.json();
  const mode = body?.mode;

  await connectDB();
  const ip = clientIp(req);
  const ua = userAgent(req);

  if (mode === "registered") {
    const session = await getOptionalSessionFromCookies();
    if (!session) {
      throw new BadRequestError("ফ্রি ক্লাসে নাম লেখাতে লগইন করুন।");
    }

    const user = await User.findById(session.sub).lean();
    if (!user || !user.isActive) {
      throw new BadRequestError("সেশন মেয়াদ শেষ। আবার লগইন করুন।");
    }

    const subject = subjectField.parse(body.subject);
    const classLabel = classLabelField.parse(body.classLabel);

    let phone = normalizeBangladeshPhone(String(user.phone ?? ""));
    if (!isValidBdMobileNormalized(phone)) {
      const extra =
        typeof body.phone === "string" ? normalizeBangladeshPhone(body.phone) : "";
      try {
        phone = bdPhoneSchema.parse(extra);
      } catch {
        throw new BadRequestError(
          "আপনার অ্যাকাউন্টে কোনো মোবাইল নেই। সঠিক ১১ ডিজিটের নম্বর দিন (০১ দিয়ে শুরু)।"
        );
      }
    }

    const duplicate = await FreeClassLead.findOne({
      phone,
      subject,
      classLabel,
      createdAt: { $gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
    }).lean();

    if (duplicate) {
      throw new BadRequestError(
        "গত ২৪ ঘণ্টায় এই শ্রেণী ও বিষয়ে আপনার নিবন্ধন আছে। শীঘ্রই যোগাযোগ করব।"
      );
    }

    await FreeClassLead.create({
      name: user.name,
      phone,
      classLabel,
      subject,
      source: "registered",
      userId: user._id,
      ip,
      userAgent: ua,
    });

    return successResponse({ ok: true }, "নিবন্ধন সম্পন্ন");
  }

  const guest = freeClassLeadGuestSchema.parse({
    mode: "guest",
    name: body.name,
    phone: body.phone,
    classLabel: body.classLabel,
    subject: body.subject,
  });

  const dupGuest = await FreeClassLead.findOne({
    phone: guest.phone,
    subject: guest.subject,
    classLabel: guest.classLabel,
    createdAt: { $gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
  }).lean();

  if (dupGuest) {
    throw new BadRequestError(
      "এই নম্বর, শ্রেণী ও বিষয়ে গত ২৪ ঘণ্টায় নিবন্ধন আছে। প্রয়োজনে কল করুন।"
    );
  }

  await FreeClassLead.create({
    name: guest.name,
    phone: guest.phone,
    classLabel: guest.classLabel,
    subject: guest.subject,
    source: "guest",
    userId: null,
    ip,
    userAgent: ua,
  });

  return successResponse({ ok: true }, "নিবন্ধন সম্পন্ন");
});
