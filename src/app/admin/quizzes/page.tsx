import { QuizQuestionCreateButton, QuizQuestionsGrid } from "@/components/admin/grids/QuizQuestionsGrid";
import { PageHeading } from "@/components/admin/sa/ui";
import { quizQuestionTiles } from "@/lib/grid/tiles-assessments";

export default async function AdminQuizzesPage() {
  const tiles = await quizQuestionTiles();

  return (
    <div>
      <PageHeading
        title="Quiz Questions"
        description="Add and manage quiz questions and explanations for students."
        actions={<QuizQuestionCreateButton />}
      />
      <QuizQuestionsGrid tiles={tiles} />
    </div>
  );
}
