import type { StudentOption } from "./PaymentManager";

type Props = {
  student: StudentOption | null;
  admissionFee: number;
  admissionDiscount: number;
  paidAmount: number;
};

export function PaymentFeeBreakdown({ student, admissionFee, admissionDiscount, paidAmount }: Props) {
  if (!student) return null;

  const tuitionTotal = student.selectedSubjects.reduce((sum, subject) => sum + subject.monthlyFee, 0);
  const admissionPayable = Math.max(0, admissionFee - admissionDiscount);
  const expectedTotal = tuitionTotal + admissionPayable;
  const dueAmount = Math.max(0, expectedTotal - paidAmount);

  return (
    <section className="rounded-2xl border border-sage-border bg-sage-red-50/20 p-4 lg:col-span-3">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-base font-black text-sage-secondary">এই মাসের ফি বিবরণ</h4>
          <p className="text-sm text-sage-gray-500">শিক্ষার্থীর ভর্তি করা বিষয়ের উপর ভিত্তি করে হিসাব দেখানো হচ্ছে।</p>
        </div>
        <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-sage-primary ring-1 ring-sage-border">
          মোট পাওনা ৳{expectedTotal}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {student.selectedSubjects.length ? (
          student.selectedSubjects.map((subject) => (
            <div key={subject.subjectName} className="flex items-center justify-between rounded-xl border border-sage-border bg-white px-4 py-3">
              <span className="font-bold text-sage-secondary">{subject.subjectName}</span>
              <span className="font-black text-sage-primary">৳{subject.monthlyFee}</span>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-sage-border bg-white px-4 py-3 text-sm text-sage-gray-500 md:col-span-2">
            এই শিক্ষার্থীর কোনো বিষয় নির্বাচন করা নেই।
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <Summary label="টিউশন" value={tuitionTotal} />
        <Summary label="ভর্তি ফি" value={admissionFee} />
        <Summary label="ডিসকাউন্ট" value={admissionDiscount} />
        <Summary label="বকেয়া" value={dueAmount} strong />
      </div>
    </section>
  );
}

function Summary({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="rounded-xl border border-sage-border bg-white px-4 py-3">
      <p className="text-sm font-bold text-sage-gray-500">{label}</p>
      <p className={strong ? "mt-1 text-lg font-black text-sage-primary" : "mt-1 text-lg font-black text-sage-secondary"}>
        ৳{value}
      </p>
    </div>
  );
}
