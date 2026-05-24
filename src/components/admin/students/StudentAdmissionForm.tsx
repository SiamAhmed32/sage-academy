"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import { createStudentAction, updateStudentAction } from "@/app/admin/actions";
import { StudentImageUpload } from "@/components/admin/students/StudentImageUpload";
import { StudentSubjectFeeSelector } from "@/components/admin/students/StudentSubjectFeeSelector";
import { SubjectChangeEffectiveFields } from "@/components/admin/students/SubjectChangeEffectiveFields";
import { classLevelOptions, toBanglaDigits } from "@/constants/class-levels";

type BatchSubjectRow = {
  subjectName: string;
  monthlyFee: number;
  startTime?: string;
  endTime?: string;
  days?: string[];
};

export type AdminBatchRow = {
  _id: { toString(): string };
  title: string;
  genderGroup?: string;
  classLevel?: number;
  subjects: BatchSubjectRow[];
};

type EditStudentRow = {
  _id: { toString(): string };
  presentAddress?: string;
  permanentAddress?: string;
  nameEnglish?: string;
  nameBangla?: string;
  whatsapp?: string;
  gender?: string;
  version?: string;
  admissionYear?: number;
  classLevel?: number;
  section?: string;
  roll?: string;
  schoolName?: string;
  admissionDate?: string | Date;
  fatherName?: string;
  motherName?: string;
  guardianName?: string;
  guardianPhone?: string;
  note?: string;
  image?: { url?: string };
  batch?: { _id?: { toString(): string } } | string;
  selectedSubjects?: Array<{
    subjectName: string;
    monthlyFee: number;
    baseFee?: number;
    discountType?: string;
    discountValue?: number;
    discountNote?: string;
  }>;
};

/** Admission request row — used to prefill the create form */
export type AdmissionPrefill = {
  _id?: string;
  studentName?: string;
  nameBangla?: string;
  phone?: string;
  studentWhatsapp?: string;
  studentGender?: string;
  academicVersion?: string;
  fatherName?: string;
  motherName?: string;
  guardianName?: string;
  section?: string;
  classRoll?: string;
  schoolName?: string;
  presentAddress?: string;
  permanentAddress?: string;
  className?: string;
};

function parseClassLevelFromLabel(className?: string): number | undefined {
  if (!className?.trim()) return undefined;
  const normalized = className.replace(/[০-৯]/g, (digit) => String("০১২৩৪৫৬৭৮৯".indexOf(digit)));
  const m = normalized.match(/\d+/);
  const wordMap: Record<string, number> = {
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    পঞ্চম: 5,
    ষষ্ঠ: 6,
    ষষ্ঠী: 6,
    সপ্তম: 7,
    অষ্টম: 8,
    নবম: 9,
    দশম: 10,
    একাদশ: 11,
    দ্বাদশ: 12,
  };

  const n = m
    ? Number(m[0])
    : Object.entries(wordMap).find(([word]) => normalized.toLowerCase().includes(word))?.[1];
  return n && n >= 1 && n <= 12 ? n : undefined;
}

function batchIdFromStudent(s?: EditStudentRow): string {
  if (!s?.batch) return "";
  const b = s.batch;
  if (typeof b === "string") return b;
  return b._id?.toString() ?? "";
}

interface StudentAdmissionFormProps {
  batches: AdminBatchRow[];
  student?: EditStudentRow;
  prefillData?: AdmissionPrefill | null;
  onCancel?: () => void;
}

const tabOptions = [
  { id: "primary", label: "প্রাথমিক তথ্য" },
  { id: "academic", label: "একাডেমিক ও ব্যাচ" },
  { id: "guardian", label: "অভিভাবকের তথ্য" },
  { id: "other", label: "ঠিকানা ও অন্যান্য" },
];

export function StudentAdmissionForm({ batches, student, prefillData, onCancel }: StudentAdmissionFormProps) {
  const isEdit = !!student;
  const [isPending, startTransition] = useTransition();

  const defaultNameEnglish = student?.nameEnglish ?? prefillData?.studentName ?? "";
  const defaultNameBangla = student?.nameBangla ?? prefillData?.nameBangla ?? "";
  const defaultWhatsapp =
    student?.whatsapp ?? prefillData?.studentWhatsapp ?? prefillData?.phone ?? "";
  const defaultGender = student?.gender ?? prefillData?.studentGender ?? "male";
  const defaultVersion = student?.version ?? prefillData?.academicVersion ?? "bangla";
  const defaultFatherName = student?.fatherName ?? prefillData?.fatherName ?? "";
  const defaultMotherName = student?.motherName ?? prefillData?.motherName ?? "";
  const defaultGuardianName = student?.guardianName ?? prefillData?.guardianName ?? "";
  const defaultGuardianPhone = student?.guardianPhone ?? prefillData?.phone ?? "";
  const defaultSection = student?.section ?? prefillData?.section ?? "";
  const defaultRoll = student?.roll ?? prefillData?.classRoll ?? "";
  const defaultSchoolName = student?.schoolName ?? prefillData?.schoolName ?? "";
  const defaultPresentAddress = student?.presentAddress ?? prefillData?.presentAddress ?? "";
  const defaultPermanentAddress = student?.permanentAddress ?? prefillData?.permanentAddress ?? "";
  const defaultAdmissionYear = student?.admissionYear ?? new Date().getFullYear();
  const defaultClassLevel =
    student?.classLevel ?? parseClassLevelFromLabel(prefillData?.className);
  const defaultAdmissionDate = student?.admissionDate
    ? new Date(student.admissionDate).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  const [presentAddress, setPresentAddress] = useState(defaultPresentAddress);
  const [permanentAddress, setPermanentAddress] = useState(defaultPermanentAddress);
  const [isSameAddress, setIsSameAddress] = useState(() => {
    if (student) {
      return !!student.presentAddress && student.presentAddress === student.permanentAddress;
    }
    const p = prefillData?.presentAddress;
    const perm = prefillData?.permanentAddress;
    return !!p && p === perm;
  });

  const [selectedClassLevel, setSelectedClassLevel] = useState(() => defaultClassLevel ? String(defaultClassLevel) : "");
  const [selectedBatchId, setSelectedBatchId] = useState(() => batchIdFromStudent(student));
  const [activeTab, setActiveTab] = useState("primary");

  const selectedClassNumber = Number(selectedClassLevel);
  const eligibleBatches = selectedClassLevel
    ? batches.filter((batch) => Number(batch.classLevel) === selectedClassNumber)
    : [];
  const selectedBatchRaw = batches.find((batch) => batch._id.toString() === selectedBatchId);
  const batchClassMismatch = Boolean(
    selectedBatchRaw &&
    selectedClassLevel &&
    Number(selectedBatchRaw.classLevel) !== selectedClassNumber
  );
  const selectedBatch = batchClassMismatch
    ? undefined
    : eligibleBatches.find((batch) => batch._id.toString() === selectedBatchId);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Custom validation for required fields across all tabs
    if (!formData.get("nameEnglish") || !formData.get("whatsapp")) {
      setActiveTab("primary");
      toast.error("প্রাথমিক তথ্যের ফিল্ডগুলো পূরণ করুন।");
      return;
    }
    if (!formData.get("admissionYear") || !formData.get("classLevel") || !formData.get("batch")) {
      setActiveTab("academic");
      toast.error("একাডেমিক তথ্য ও ব্যাচ নির্বাচন করুন।");
      return;
    }
    if (!formData.get("guardianPhone")) {
      setActiveTab("guardian");
      toast.error("অভিভাবকের ফোন নম্বর দিন।");
      return;
    }
    
    startTransition(async () => {
      if (isEdit) {
        const res = await updateStudentAction(formData);
        if (!res.ok) {
          toast.error(res.message);
          return;
        }
        toast.success("তথ্য সংরক্ষিত হয়েছে।");
      } else {
        const res = await createStudentAction(formData);
        if (!res.ok) {
          toast.error(res.message);
          return;
        }
        toast.success("শিক্ষার্থী ভর্তি সম্পন্ন।");
      }
      if (onCancel) onCancel();
    });
  };

  const handlePresentAddressChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setPresentAddress(val);
    if (isSameAddress) setPermanentAddress(val);
  };

  const handleSameAddressToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsSameAddress(checked);
    if (checked) setPermanentAddress(presentAddress);
  };

  return (
    <div className="animate-in fade-in slide-in-from-top-4 duration-500">
      <form 
        onSubmit={handleSubmit}
        noValidate
        className="relative rounded-2xl border border-sage-border bg-white p-6 shadow-xl"
      >
        {isEdit && student && (
          <input type="hidden" name="id" value={student._id.toString()} />
        )}

        {/* Close Button */}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="absolute right-4 top-4 flex items-center gap-1 rounded-lg bg-sage-red-50 px-3 py-1.5 text-xs font-bold text-sage-primary transition hover:bg-sage-primary hover:text-white"
          >
            <X size={14} />
            বন্ধ করুন
          </button>
        )}

        <div className="flex border-b border-sage-border overflow-x-auto whitespace-nowrap scrollbar-none pb-px gap-1 mt-4">
          {tabOptions.map((t) => (
            <button key={t.id} type="button" onClick={() => setActiveTab(t.id)} className={`px-5 py-3 text-sm font-black transition relative ${activeTab === t.id ? "text-sage-primary" : "text-sage-gray-500 hover:text-sage-secondary"}`}>
              {t.label}
              {activeTab === t.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sage-primary rounded-full" />}
            </button>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-3 mt-6 min-h-[350px] content-start">
          {/* PRIMARY INFO */}
          <div className={`md:col-span-3 grid gap-6 md:grid-cols-2 ${activeTab === 'primary' ? 'block' : 'hidden'}`}>
            <div className="grid gap-2">
              <label className="text-xs font-bold text-sage-secondary">ইংরেজিতে নাম (Name in English) *</label>
              <input name="nameEnglish" defaultValue={defaultNameEnglish} placeholder="Parvej Khan" className="h-11 rounded-lg border border-sage-border px-3 focus:ring-1 focus:ring-sage-primary outline-none" />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-bold text-sage-secondary">বাংলায় নাম (Name in Bangla)</label>
              <input name="nameBangla" defaultValue={defaultNameBangla} placeholder="পারভেজ খান" className="h-11 rounded-lg border border-sage-border px-3 focus:ring-1 focus:ring-sage-primary outline-none" />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-bold text-sage-secondary">স্টুডেন্ট হোয়াটসঅ্যাপ (WhatsApp Number) *</label>
              <input name="whatsapp" defaultValue={defaultWhatsapp} placeholder="01XXXXXXXXX" className="h-11 rounded-lg border border-sage-border px-3 focus:ring-1 focus:ring-sage-primary outline-none" />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-bold text-sage-secondary">জেন্ডার (Gender)</label>
              <select name="gender" defaultValue={defaultGender} className="h-11 rounded-lg border border-sage-border px-3">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="grid gap-2 md:col-span-2">
              <label className="text-xs font-bold text-sage-secondary">ভার্সন (Version)</label>
              <select name="version" defaultValue={defaultVersion} className="h-11 rounded-lg border border-sage-border px-3">
                <option value="bangla">Bangla</option>
                <option value="english">English</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          
          {/* ACADEMIC INFO */}
          <div className={`md:col-span-3 space-y-6 ${activeTab === 'academic' ? 'block' : 'hidden'}`}>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-xs font-bold text-sage-secondary">ভর্তির বছর (Admission Year) *</label>
                <input name="admissionYear" defaultValue={defaultAdmissionYear} className="h-11 rounded-lg border border-sage-border px-3 focus:ring-1 focus:ring-sage-primary outline-none" />
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-bold text-sage-secondary">শ্রেণি *</label>
                <select
                  name="classLevel"
                  value={selectedClassLevel}
                  onChange={(e) => {
                    const nextClass = e.target.value;
                    setSelectedClassLevel(nextClass);
                    const currentBatch = batches.find((batch) => batch._id.toString() === selectedBatchId);
                    if (currentBatch && Number(currentBatch.classLevel) !== Number(nextClass)) {
                      setSelectedBatchId("");
                    }
                  }}
                  className="h-11 rounded-lg border border-sage-border px-3 focus:ring-1 focus:ring-sage-primary outline-none"
                >
                  <option value="">নির্বাচন করুন</option>
                  {classLevelOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-bold text-sage-secondary">শাখা (Section)</label>
                <input name="section" defaultValue={defaultSection} placeholder="e.g. A" className="h-11 rounded-lg border border-sage-border px-3 focus:ring-1 focus:ring-sage-primary outline-none" />
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-bold text-sage-secondary">রোল</label>
                <input name="roll" defaultValue={defaultRoll} placeholder="e.g. 01" className="h-11 rounded-lg border border-sage-border px-3 focus:ring-1 focus:ring-sage-primary outline-none" />
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-bold text-sage-secondary">স্কুল/কলেজের নাম (School/College Name)</label>
                <input name="schoolName" defaultValue={defaultSchoolName} placeholder="School or College" className="h-11 rounded-lg border border-sage-border px-3 focus:ring-1 focus:ring-sage-primary outline-none" />
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-bold text-sage-secondary">ভর্তির তারিখ (Admission Date)</label>
                <input name="admissionDate" type="date" defaultValue={defaultAdmissionDate} className="h-11 rounded-lg border border-sage-border px-3 focus:ring-1 focus:ring-sage-primary outline-none" />
              </div>
            </div>
            
            {/* BATCH & SUBJECT SELECTION */}
            <div className="rounded-xl border border-dashed border-sage-border bg-sage-red-50/20 p-5 mt-2">
              <div className="grid gap-2">
                <label className="text-xs font-bold text-sage-secondary flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-sage-primary text-white">★</span> 
                  ব্যাচ নির্বাচন (Select Batch) *
                </label>
                <select 
                  name="batch" 
                  value={selectedBatchId}
                  onChange={(e) => {
                    setSelectedBatchId(e.target.value);
                  }}
                  className="h-11 rounded-lg border border-sage-border bg-white px-3 focus:ring-1 focus:ring-sage-primary outline-none"
                >
                  <option value="">Select a batch</option>
                  {batchClassMismatch && selectedBatchRaw && (
                    <option value={selectedBatchId} disabled>
                      {selectedBatchRaw.title} is class {selectedBatchRaw.classLevel}; change batch
                    </option>
                  )}
                  {eligibleBatches.map((batch) => (
                    <option key={batch._id.toString()} value={batch._id.toString()}>
                      {batch.title} | {batch.genderGroup === "female" ? "মেয়েদের" : "ছেলেদের"} | ক্লাস {toBanglaDigits(batch.classLevel)}
                    </option>
                  ))}
                </select>
                {!selectedClassLevel && (
                  <p className="text-xs font-semibold text-sage-gray-500">Select class first to load matching batches.</p>
                )}
                {selectedClassLevel && !eligibleBatches.length && (
                  <p className="text-xs font-semibold text-amber-700">No batch exists for this class yet.</p>
                )}
                {batchClassMismatch && selectedBatchRaw && (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                    This student is class {selectedClassLevel}, but the selected batch &quot;{selectedBatchRaw.title}&quot; is class {selectedBatchRaw.classLevel}. Select a matching batch before saving.
                  </p>
                )}
              </div>
              
              {selectedBatch && (
                <div className="animate-in space-y-4 fade-in zoom-in duration-300 mt-4 pt-4 border-t border-sage-border/50">
                  <SubjectChangeEffectiveFields />
                  <StudentSubjectFeeSelector
                    subjects={selectedBatch.subjects}
                    savedSubjects={student?.selectedSubjects}
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* GUARDIAN INFO */}
          <div className={`md:col-span-3 grid gap-6 md:grid-cols-2 ${activeTab === 'guardian' ? 'block' : 'hidden'}`}>
            <div className="grid gap-2 md:col-span-2">
              <label className="text-xs font-bold text-sage-secondary">পিতার নাম (Father&apos;s Name)</label>
              <input name="fatherName" defaultValue={defaultFatherName} placeholder="Father's Name" className="h-11 rounded-lg border border-sage-border px-3" />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <label className="text-xs font-bold text-sage-secondary">মাতার নাম (Mother&apos;s Name)</label>
              <input name="motherName" defaultValue={defaultMotherName} placeholder="Mother's Name" className="h-11 rounded-lg border border-sage-border px-3" />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-bold text-sage-secondary">অন্য অভিভাবকের নাম (Other Guardian)</label>
              <input name="guardianName" defaultValue={defaultGuardianName} placeholder="Other Guardian Name" className="h-11 rounded-lg border border-sage-border px-3" />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-bold text-sage-secondary">অভিভাবকের ফোন (Guardian Phone) *</label>
              <input name="guardianPhone" defaultValue={defaultGuardianPhone} placeholder="01XXXXXXXXX" className="h-11 rounded-lg border border-sage-border px-3" />
            </div>
          </div>

          {/* ADDRESS & OTHERS SECTION */}
          <div className={`md:col-span-3 space-y-6 ${activeTab === 'other' ? 'block' : 'hidden'}`}>
            <div className="flex items-center justify-between border-b border-sage-border pb-2">
              <h3 className="font-bold text-sage-secondary flex items-center gap-2">
                🏠 ঠিকানা (Address)
              </h3>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={isSameAddress}
                  onChange={handleSameAddressToggle}
                  className="accent-sage-primary"
                />
                <span className="text-[10px] font-bold text-sage-primary uppercase tracking-wider">Same as Present Address</span>
              </label>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-xs font-bold text-sage-secondary">বর্তমান ঠিকানা (Present Address)</label>
                <textarea 
                  name="presentAddress" 
                  value={presentAddress}
                  onChange={handlePresentAddressChange}
                  placeholder="Full present address..." 
                  className="h-20 rounded-lg border border-sage-border px-3 py-2 focus:ring-1 focus:ring-sage-primary outline-none" 
                />
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-bold text-sage-secondary">স্থায়ী ঠিকানা (Permanent Address)</label>
                <textarea 
                  name="permanentAddress" 
                  value={permanentAddress}
                  onChange={(e) => setPermanentAddress(e.target.value)}
                  placeholder="Full permanent address..." 
                  disabled={isSameAddress}
                  className={`h-20 rounded-lg border border-sage-border px-3 py-2 focus:ring-1 focus:ring-sage-primary outline-none ${isSameAddress ? 'bg-sage-red-50/30 text-sage-gray-500' : ''}`} 
                />
              </div>
            </div>

            <div className="border-b border-sage-border pb-2 pt-4">
              <h3 className="font-bold text-sage-secondary">অতিরিক্ত তথ্য ও ছবি</h3>
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-bold text-sage-secondary">অতিরিক্ত তথ্য বা নোট (Extra Info / Note)</label>
              <textarea name="note" defaultValue={student?.note} placeholder="Write any extra information here..." className="w-full h-20 rounded-lg border border-sage-border px-3 py-2 focus:ring-1 focus:ring-sage-primary outline-none" />
            </div>
            
            <div className="pt-2">
              <label className="mb-2 block text-xs font-bold text-sage-secondary uppercase tracking-widest">ছাত্র-ছাত্রীর ছবি (ঐচ্ছিক)</label>
              <div className="flex justify-start">
                <StudentImageUpload currentImage={student?.image?.url} />
              </div>
            </div>
          </div>

          <div className="md:col-span-3 flex justify-end pt-4 mt-2 border-t border-sage-border">
            <button 
              type="submit"
              disabled={isPending || batchClassMismatch || !selectedBatchId}
              className="h-12 w-full md:w-auto md:min-w-[200px] rounded-xl bg-sage-primary px-8 font-bold text-white shadow-lg shadow-sage-primary/20 transition hover:bg-sage-secondary active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending 
                ? "প্রসেসিং হচ্ছে..." 
                : (isEdit ? "আপডেট করুন" : "ভর্তি সম্পন্ন করুন")}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
