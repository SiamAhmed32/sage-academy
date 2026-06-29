type AnswerRow = {
  questionId: unknown;
  selectedIndex: number | null;
  isCorrect?: boolean | null;
  marksAwarded?: number;
};

type QuestionRow = {
  _id: unknown;
  questionText?: string;
  image?: string;
  options?: { text: string }[];
  correctIndex?: number;
  marks?: number;
};

export type ExamAnswerReview = {
  questionId: string;
  questionNumber: number;
  questionText: string;
  image: string;
  options: { text: string }[];
  correctIndex: number;
  selectedIndex: number | null;
  isCorrect: boolean | null;
  marksAwarded: number;
  status: "correct" | "wrong" | "skipped";
};

export function buildAttemptAnswerReview(
  answers: AnswerRow[],
  questions: QuestionRow[]
) {
  const questionMap = new Map(questions.map((q) => [String(q._id), q]));
  let correct = 0;
  let wrong = 0;
  let skipped = 0;

  const items: ExamAnswerReview[] = answers.map((answer, index) => {
    const question = questionMap.get(String(answer.questionId));
    const selectedIndex = answer.selectedIndex ?? null;
    let status: ExamAnswerReview["status"] = "skipped";

    if (selectedIndex === null) {
      skipped += 1;
    } else {
      const resolvedCorrect =
        answer.isCorrect ?? (question ? selectedIndex === Number(question.correctIndex ?? -1) : false);
      if (resolvedCorrect) {
        correct += 1;
        status = "correct";
      } else {
        wrong += 1;
        status = "wrong";
      }
    }

    const resolvedIsCorrect =
      selectedIndex === null
        ? null
        : (answer.isCorrect ?? (question ? selectedIndex === Number(question.correctIndex ?? -1) : false));

    return {
      questionId: String(answer.questionId),
      questionNumber: index + 1,
      questionText: question?.questionText || "",
      image: question?.image || "",
      options: question?.options || [],
      correctIndex: Number(question?.correctIndex ?? 0),
      selectedIndex,
      isCorrect: resolvedIsCorrect,
      marksAwarded: Number(answer.marksAwarded ?? 0),
      status,
    };
  });

  return {
    questions: items,
    stats: { correct, wrong, skipped },
  };
}
