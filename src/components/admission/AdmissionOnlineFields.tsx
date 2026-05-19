"use client";

/* =========================================================================
   PRIMITIVES — plain HTML, no Shadcn, fully customisable via className
   ========================================================================= */

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  required?: boolean;
};

function FormLabel({ required, className = "", children, ...props }: LabelProps) {
  return (
    <label
      className={`block text-sm font-bold text-sage-secondary ${className}`}
      {...props}
    >
      {children}
      {required && <span className="ml-1 text-[#8b1a1a]">*</span>}
    </label>
  );
}

/* ------------------------------------------------------------------ */

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

function FormInput({ className = "", ...props }: InputProps) {
  return (
    <input
      className={`
        h-12 w-full px-4 py-3
        rounded-lg border border-gray-200
        bg-white text-sm text-sage-secondary
        placeholder:text-sage-gray-500
        outline-none
        transition-all duration-200
        focus:border-[#8b1a1a] focus:ring-2 focus:ring-[#8b1a1a]/10
        hover:border-gray-300
        ${className}
      `}
      {...props}

    />
  );
}

/* ------------------------------------------------------------------ */

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

function FormSelect({ className = "", children, ...props }: SelectProps) {
  return (
    <select
      className={`
        h-12 w-full px-4 py-3
        rounded-lg border border-gray-200
        bg-white text-sm text-sage-secondary
        outline-none appearance-none
        transition-all duration-200
        focus:border-[#8b1a1a] focus:ring-2 focus:ring-[#8b1a1a]/10
        hover:border-gray-300
        cursor-pointer
        ${className}
      `}
      {...props}
    >
      {children}
    </select>
  );
}

/* ------------------------------------------------------------------ */

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

function FormTextarea({ className = "", ...props }: TextareaProps) {
  return (
    <textarea
      className={`
        w-full px-4 py-3
        rounded-lg border border-gray-200
        bg-white text-sm text-sage-secondary
        placeholder:text-sage-gray-500
        outline-none resize-none
        transition-all duration-200
        focus:border-[#8b1a1a] focus:ring-2 focus:ring-[#8b1a1a]/10
        hover:border-gray-300
        ${className}
      `}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------ */

type FieldProps = {
  className?: string;
  children: React.ReactNode;
};

function Field({ className = "", children }: FieldProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */

type SectionProps = {
  title: string;
  children: React.ReactNode;
};

function Section({ title, children }: SectionProps) {
  return (
    <div className="mt-10 first:mt-0">
      <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-3">
        <span className="h-4 w-1 rounded-full bg-[#8b1a1a]" />
        <h3 className="text-base font-extrabold text-[#1a1a2e] tracking-tight">
          {title}
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
        {children}
      </div>
    </div>
  );
}

type AdmissionOnlineForm = {
  studentName: string;
  nameBangla: string;
  fatherName: string;
  motherName: string;
  phone: string;
  studentWhatsapp: string;
  className: string;
  schoolName: string;
  section: string;
  classRoll: string;
  studentDateOfBirth: string;
  studentGender: string;
  academicVersion: string;
  interestedSubjects: string;
  admissionDate: string;
  presentAddress: string;
  permanentAddress: string;
};

type AdmissionOnlineFieldsProps = {
  form: AdmissionOnlineForm;
  updateField: (name: keyof AdmissionOnlineForm, value: string) => void;
  toggleSameAddress: (checked: boolean) => void;
  sameAddress: boolean;
  requiresOnlineFields: boolean;
};

/* =========================================================================
   MAIN EXPORT
   ========================================================================= */

export function AdmissionOnlineFields({
  form,
  updateField,
  toggleSameAddress,
  sameAddress,
  requiresOnlineFields: req,
}: AdmissionOnlineFieldsProps) {
  return (
    <div>

      {/* ── ১. শিক্ষার্থীর তথ্য ───────────────────────────────────── */}
      <Section title="শিক্ষার্থীর তথ্য">

        <Field>
          <FormLabel htmlFor="studentName" required>ইংরেজি নাম</FormLabel>
          <FormInput
            id="studentName"
            placeholder="উদা: Siam Ahmed"
            value={form.studentName}
            onChange={(e) => updateField("studentName", e.target.value)}
            required={req}
          />
        </Field>

        <Field>
          <FormLabel htmlFor="nameBangla">বাংলা নাম</FormLabel>
          <FormInput
            id="nameBangla"
            placeholder="উদা: সিয়াম আহমেদ"
            value={form.nameBangla}
            onChange={(e) => updateField("nameBangla", e.target.value)}
          />
        </Field>

        <Field>
          <FormLabel htmlFor="studentDateOfBirth">জন্ম তারিখ</FormLabel>
          <FormInput
            id="studentDateOfBirth"
            type="date"
            value={form.studentDateOfBirth}
            onChange={(e) => updateField("studentDateOfBirth", e.target.value)}
          />
        </Field>

        <Field>
          <FormLabel htmlFor="studentGender">লিঙ্গ</FormLabel>
          <FormSelect
            id="studentGender"
            value={form.studentGender}
            onChange={(e) => updateField("studentGender", e.target.value)}
          >
            <option value="">সিলেক্ট করুন</option>
            <option value="male">পুরুষ</option>
            <option value="female">মহিলা</option>
            <option value="other">অন্যান্য</option>
          </FormSelect>
        </Field>

        <Field>
          <FormLabel htmlFor="studentWhatsapp" required>হোয়াটসঅ্যাপ নম্বর</FormLabel>
          <FormInput
            id="studentWhatsapp"
            placeholder="উদা: 018XXXXXXXX"
            value={form.studentWhatsapp}
            onChange={(e) => updateField("studentWhatsapp", e.target.value)}
            required={req}
          />
        </Field>

        <Field>
          <FormLabel htmlFor="interestedSubjects">আগ্রহী বিষয়</FormLabel>
          <FormInput
            id="interestedSubjects"
            placeholder="উদা: গণিত, পদার্থবিজ্ঞান"
            value={form.interestedSubjects}
            onChange={(e) => updateField("interestedSubjects", e.target.value)}
          />
        </Field>

      </Section>

      {/* ── ২. একাডেমিক তথ্য ─────────────────────────────────────── */}
      <Section title="একাডেমিক তথ্য">

        <Field>
          <FormLabel htmlFor="className" required>শ্রেণী</FormLabel>
          <FormInput
            id="className"
            placeholder="উদা: নবম অথবা SSC"
            value={form.className}
            onChange={(e) => updateField("className", e.target.value)}
            required={req}
          />
        </Field>

        <Field>
          <FormLabel htmlFor="academicVersion">ভার্সন</FormLabel>
          <FormSelect
            id="academicVersion"
            value={form.academicVersion}
            onChange={(e) => updateField("academicVersion", e.target.value)}
          >
            <option value="bangla">বাংলা ভার্সন</option>
            <option value="english">ইংলিশ ভার্সন</option>
            <option value="other">অন্যান্য</option>
          </FormSelect>
        </Field>

        <Field>
          <FormLabel htmlFor="schoolName">স্কুল / কলেজ</FormLabel>
          <FormInput
            id="schoolName"
            placeholder="প্রতিষ্ঠানের নাম লিখুন"
            value={form.schoolName}
            onChange={(e) => updateField("schoolName", e.target.value)}
          />
        </Field>

        {/* Section + Roll — side by side in a sub-grid */}
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FormLabel htmlFor="section">সেকশন</FormLabel>
            <FormInput
              id="section"
              placeholder="উদা: A"
              value={form.section}
              onChange={(e) => updateField("section", e.target.value)}
            />
          </Field>
          <Field>
            <FormLabel htmlFor="classRoll">রোল</FormLabel>
            <FormInput
              id="classRoll"
              placeholder="উদা: ১২"
              value={form.classRoll}
              onChange={(e) => updateField("classRoll", e.target.value)}
            />
          </Field>
        </div>

        <Field>
          <FormLabel htmlFor="admissionDate">ভর্তির তারিখ</FormLabel>
          <FormInput
            id="admissionDate"
            type="date"
            value={form.admissionDate}
            onChange={(e) => updateField("admissionDate", e.target.value)}
          />
        </Field>

      </Section>

      {/* ── ৩. অভিভাবক ও ঠিকানা ─────────────────────────────────── */}
      <Section title="অভিভাবক ও ঠিকানা">

        <div className="sm:col-span-2">
          <Field>
            <FormLabel htmlFor="fatherName">পিতার নাম</FormLabel>
            <FormInput
              id="fatherName"
              placeholder="পিতার পূর্ণ নাম লিখুন"
              value={form.fatherName}
              onChange={(e) => updateField("fatherName", e.target.value)}
            />
          </Field>
        </div>

        <div className="sm:col-span-2">
          <Field>
            <FormLabel htmlFor="motherName">মাতার নাম</FormLabel>
            <FormInput
              id="motherName"
              placeholder="মাতার পূর্ণ নাম লিখুন"
              value={form.motherName}
              onChange={(e) => updateField("motherName", e.target.value)}
            />
          </Field>
        </div>

        <div className="sm:col-span-2">
          <Field>
            <FormLabel htmlFor="phone" required>অভিভাবকের ফোন নম্বর</FormLabel>
            <FormInput
              id="phone"
              placeholder="উদা: 01XXXXXXXXX"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              required={req}
            />
          </Field>
        </div>

        {/* Same address checkbox */}
        <div className="sm:col-span-2">
          <label
            htmlFor="sameAddress"
            className="flex cursor-pointer select-none items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
          >
            <input
              id="sameAddress"
              type="checkbox"
              checked={sameAddress}
              onChange={(e) => toggleSameAddress(e.target.checked)}
              className="h-5 w-5 rounded accent-[#8b1a1a] cursor-pointer"
            />
            <span className="text-sm font-semibold text-[#1a1a2e]">
              বর্তমান ও স্থায়ী ঠিকানা একই
            </span>
          </label>
        </div>

        {/* Full-width textareas */}

        <div className="sm:col-span-2">
          <Field>
            <FormLabel htmlFor="presentAddress">বর্তমান ঠিকানা</FormLabel>
            <FormTextarea
              id="presentAddress"
              rows={4}
              placeholder="বাসা নং, রোড নং, এলাকা, থানা, জেলা লিখুন..."
              value={form.presentAddress}
              onChange={(e) => updateField("presentAddress", e.target.value)}
            />
          </Field>
        </div>

        <div className="sm:col-span-2">
          <Field>
            <FormLabel htmlFor="permanentAddress">স্থায়ী ঠিকানা</FormLabel>
            <FormTextarea
              id="permanentAddress"
              rows={4}
              placeholder="স্থায়ী ঠিকানা লিখুন..."
              value={form.permanentAddress}
              onChange={(e) => updateField("permanentAddress", e.target.value)}
            />
          </Field>
        </div>

      </Section>

    </div>
  );
}
