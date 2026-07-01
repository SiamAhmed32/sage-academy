import { revalidatePath, revalidateTag } from "next/cache";

import { EXAM_PROGRAMS_CACHE_TAG } from "@/lib/exam-hub-programs";
import { PROMOTION_CARDS_CACHE_TAG } from "@/lib/promotion-cards";
import { PUBLIC_TEACHERS_CACHE_TAG } from "@/lib/public-teachers";
import { PUBLIC_TESTIMONIALS_CACHE_TAG } from "@/lib/public-testimonials";

export function revalidatePromotionCardPublicPages() {
  revalidateTag(PROMOTION_CARDS_CACHE_TAG, { expire: 0 });
  revalidatePath("/");
  revalidatePath("/batches");
}

export function revalidateTeacherPublicPages() {
  revalidateTag(PUBLIC_TEACHERS_CACHE_TAG, { expire: 0 });
  revalidatePath("/teachers");
  revalidatePath("/");
}

export function revalidateTestimonialPublicPages() {
  revalidateTag(PUBLIC_TESTIMONIALS_CACHE_TAG, { expire: 0 });
  revalidatePath("/");
}

export function revalidateExamProgramPublicPages() {
  revalidateTag(EXAM_PROGRAMS_CACHE_TAG, { expire: 0 });
  revalidatePath("/exams");
  revalidatePath("/");
}
