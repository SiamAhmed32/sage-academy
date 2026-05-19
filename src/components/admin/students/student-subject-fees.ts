export type BatchSubjectFee = {
  subjectName: string;
  monthlyFee: number;
  startTime?: string;
  endTime?: string;
  days?: string[];
};

export type SavedSubjectFee = {
  subjectName: string;
  monthlyFee: number;
  baseFee?: number;
  discountType?: string;
  discountValue?: number;
  discountNote?: string;
};

export type SubjectFeeSelection = Required<Pick<SavedSubjectFee, "subjectName" | "monthlyFee">> & {
  baseFee: number;
  discountType: "none" | "amount" | "percent" | "custom";
  discountValue: number;
  discountNote: string;
};

export function finalSubjectFee(
  baseFee: number,
  type: SubjectFeeSelection["discountType"],
  value: number
) {
  if (type === "amount") return Math.max(0, baseFee - value);
  if (type === "percent") return Math.max(0, Math.round(baseFee - baseFee * Math.min(value, 100) / 100));
  if (type === "custom") return Math.max(0, value);
  return baseFee;
}

export function makeSubjectSelection(
  subject: BatchSubjectFee,
  saved?: SavedSubjectFee
): SubjectFeeSelection {
  const baseFee = Math.max(
    Number(saved?.baseFee) || 0,
    Number(subject.monthlyFee) || 0,
    Number(saved?.monthlyFee) || 0
  );
  const savedFinalFee = saved?.monthlyFee ?? baseFee;
  const savedDiscountType = saved?.discountType ?? "none";
  const savedDiscountValue = saved?.discountValue ?? 0;
  const hasLegacyDiscount =
    savedFinalFee < baseFee &&
    (savedDiscountType === "none" || savedDiscountValue <= 0);
  const discountType =
    hasLegacyDiscount ? "amount" : (savedDiscountType as SubjectFeeSelection["discountType"]);
  const discountValue = hasLegacyDiscount ? baseFee - savedFinalFee : savedDiscountValue;
  return {
    subjectName: subject.subjectName,
    baseFee,
    discountType,
    discountValue,
    discountNote: saved?.discountNote ?? "",
    monthlyFee: saved?.monthlyFee ?? finalSubjectFee(baseFee, discountType, discountValue),
  };
}
