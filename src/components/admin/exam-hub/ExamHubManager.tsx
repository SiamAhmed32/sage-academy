"use client";

import { useMemo, useState } from "react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ExamAttemptPanel } from "@/components/admin/exam-hub/ExamAttemptPanel";
import { ExamEnrollmentPanel } from "@/components/admin/exam-hub/ExamEnrollmentPanel";
import { ExamProgramsPanel } from "@/components/admin/exam-hub/ExamProgramsPanel";
import { ExamQuestionPanel } from "@/components/admin/exam-hub/ExamQuestionPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type AdminExamProgram = {
  _id: string;
  title: string;
  slug: string;
  subtitle?: string;
  image?: string;
  description?: string;
  deliveryMode: "online" | "offline";
  offlineType?: "weekly" | "monthly" | null;
  accessType?: "public" | "private";
  isPaid?: boolean;
  feeAmount?: number;
  classLevels?: number[];
  startDate: string;
  endDate: string;
  durationMinutes?: number;
  totalMarks?: number;
  correctMark?: number;
  wrongMark?: number;
  unansweredMark?: number;
  maxAttempts?: number;
  instructions?: string;
  markingRulesNote?: string;
  venue?: string;
  scheduleNote?: string;
  examTime?: string;
  subjectSyllabus?: string;
  subjectSyllabusItems?: Array<{ name: string; syllabus: string; topics: string[] }>;
  enrollmentInfo?: string;
  shuffleQuestions?: boolean;
  showLeaderboard?: boolean;
  status: "draft" | "published" | "hidden" | "archived";
  featured?: boolean;
  order?: number;
  questionCount?: number;
  enrollmentCount?: number;
};

export type ExamProgramOption = Pick<
  AdminExamProgram,
  "_id" | "title" | "slug" | "deliveryMode" | "status"
>;

function preferredOnlineProgramId(programs: ExamProgramOption[]) {
  const onlinePrograms = programs.filter((program) => program.deliveryMode === "online");
  return (
    onlinePrograms.find((program) => program.status === "published")?._id ||
    onlinePrograms[0]?._id ||
    ""
  );
}

export function ExamHubManager({
  initialProgramOptions,
}: {
  initialProgramOptions: ExamProgramOption[];
}) {
  const [programOptions, setProgramOptions] = useState(initialProgramOptions);
  const [tab, setTab] = useState("programs");
  const [selectedProgramId, setSelectedProgramId] = useState<string>(() =>
    preferredOnlineProgramId(initialProgramOptions)
  );

  const onlinePrograms = useMemo(
    () => programOptions.filter((p) => p.deliveryMode === "online"),
    [programOptions]
  );

  function upsertProgramOption(program: AdminExamProgram) {
    const option: ExamProgramOption = {
      _id: program._id,
      title: program.title,
      slug: program.slug,
      deliveryMode: program.deliveryMode,
      status: program.status,
    };
    const exists = programOptions.some((item) => item._id === option._id);
    const nextOptions = exists
      ? programOptions.map((item) => (item._id === option._id ? option : item))
      : [...programOptions, option];
    setProgramOptions(nextOptions);

    if (selectedProgramId === option._id && option.deliveryMode !== "online") {
      setSelectedProgramId(preferredOnlineProgramId(nextOptions));
    } else if (!selectedProgramId && option.deliveryMode === "online") {
      setSelectedProgramId(option._id);
    }
  }

  function deleteProgramOption(programId: string) {
    const nextOptions = programOptions.filter((program) => program._id !== programId);
    setProgramOptions(nextOptions);
    if (selectedProgramId === programId) {
      setSelectedProgramId(preferredOnlineProgramId(nextOptions));
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Exam Hub"
        description="Manage online MCQ exams, offline schedules, question banks, enrollments, payments, and attempts."
      />

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="h-11 w-full justify-start rounded-2xl bg-white p-1 ring-1 ring-sage-border/80 sm:w-auto">
          <TabsTrigger value="programs" className="rounded-xl px-5 data-[state=active]:bg-sage-primary data-[state=active]:text-white">
            Programs
          </TabsTrigger>
          <TabsTrigger value="questions" className="rounded-xl px-5 data-[state=active]:bg-sage-primary data-[state=active]:text-white">
            Questions
          </TabsTrigger>
          <TabsTrigger value="enrollments" className="rounded-xl px-5 data-[state=active]:bg-sage-primary data-[state=active]:text-white">
            Enrollments
          </TabsTrigger>
          <TabsTrigger value="attempts" className="rounded-xl px-5 data-[state=active]:bg-sage-primary data-[state=active]:text-white">
            Attempts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="programs" className="mt-0">
          <ExamProgramsPanel
            onProgramUpsert={upsertProgramOption}
            onProgramDelete={deleteProgramOption}
          />
        </TabsContent>

        <TabsContent value="questions">
          <ExamQuestionPanel programs={onlinePrograms} selectedProgramId={selectedProgramId} onSelectProgram={setSelectedProgramId} />
        </TabsContent>

        <TabsContent value="enrollments">
          <ExamEnrollmentPanel programs={programOptions} />
        </TabsContent>

        <TabsContent value="attempts">
          <ExamAttemptPanel programs={programOptions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
