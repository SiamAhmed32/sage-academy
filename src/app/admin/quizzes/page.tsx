import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Pagination } from "@/components/admin/shared/Pagination";
import {
  boundedAdminSearch,
  clampAdminPage,
  escapeAdminRegex,
  getAdminParam,
  parseAdminPage,
  pickAdminSort,
} from "@/lib/admin-query";
import { connectDB } from "@/lib/mongodb";
import QuizQuestion from "@/models/QuizQuestion";
import { QuizManager } from "@/components/admin/quizzes/QuizManager";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const PAGE_SIZE = 20;
const sortOptions: Record<string, Record<string, 1 | -1>> = {
  order: { classLevel: 1, order: 1, createdAt: -1 },
  newest: { createdAt: -1 },
  class: { classLevel: 1, createdAt: -1 },
};

export default async function AdminQuizzesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = boundedAdminSearch(getAdminParam(params, "q"));
  const classLevel = getAdminParam(params, "classLevel");
  const status = getAdminParam(params, "status");
  const sort = getAdminParam(params, "sort", "order");
  const requestedPage = parseAdminPage(getAdminParam(params, "page"));
  const filter: Record<string, unknown> = {};

  if (q) {
    const regex = new RegExp(escapeAdminRegex(q), "i");
    filter.$or = [{ questionText: regex }, { explanation: regex }, { "options.text": regex }];
  }
  const parsedClass = Number(classLevel);
  if (Number.isInteger(parsedClass) && parsedClass >= 5 && parsedClass <= 12) {
    filter.classLevel = parsedClass;
  }
  if (status === "active") filter.isActive = true;
  if (status === "inactive") filter.isActive = false;

  await connectDB();
  const total = await QuizQuestion.countDocuments(filter);
  const { page, totalPages } = clampAdminPage(requestedPage, total, PAGE_SIZE);
  const questions = await QuizQuestion.find(filter)
    .select("classLevel questionText options explanation isActive order")
    .sort(pickAdminSort(sort, sortOptions, "order"))
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .lean();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Quiz Questions"
        description="Add and manage quiz questions and explanations for students."
      />
      <QuizManager
        initialQuestions={JSON.parse(JSON.stringify(questions))}
        filters={{ q, classLevel, status, sort }}
      />
      <Pagination totalPages={totalPages} currentPage={page} totalItems={total} pageSize={PAGE_SIZE} showWhenSinglePage />
    </div>
  );
}
