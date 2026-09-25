export type AdminQuizQuestion = {
  _id: string;
  classLevel: number;
  questionText: string;
  options: { text: string; isCorrect: boolean }[];
  explanation: string;
  isActive: boolean;
  order: number;
};
