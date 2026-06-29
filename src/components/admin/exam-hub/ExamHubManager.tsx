"use client";

import { useMemo, useState, useEffect } from "react";

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

export function ExamHubManager({ initialPrograms }: { initialPrograms: AdminExamProgram[] }) {
  const [programs, setPrograms] = useState(initialPrograms);
  const [tab, setTab] = useState("programs");
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");

  const onlinePrograms = useMemo(
    () => programs.filter((p) => p.deliveryMode === "online"),
    [programs]
  );

  useEffect(() => {
    if (selectedProgramId || onlinePrograms.length === 0) return;
    const published = onlinePrograms.find((p) => p.status === "published");
    setSelectedProgramId((published || onlinePrograms[0])._id);
  }, [onlinePrograms, selectedProgramId]);

  async function refreshPrograms() {
    const res = await fetch("/api/admin/exam-hub/programs");
    const data = await res.json().catch(() => ({}));
    if (res.ok) setPrograms(data.data || []);
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Exam Hub"
        description="অনলাইন MCQ, অফলাইন সাপ্তাহিক/মাসিক পরীক্ষা, প্রশ্ন ব্যাংক, নিবন্ধন ও পেমেন্ট ভেরিফিকেশন।"
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
            programs={programs}
            onProgramsChange={setPrograms}
            onRefresh={refreshPrograms}
          />
        </TabsContent>

        <TabsContent value="questions">
          <ExamQuestionPanel programs={onlinePrograms} selectedProgramId={selectedProgramId} onSelectProgram={setSelectedProgramId} />
        </TabsContent>

        <TabsContent value="enrollments">
          <ExamEnrollmentPanel programs={programs} />
        </TabsContent>

        <TabsContent value="attempts">
          <ExamAttemptPanel programs={programs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
