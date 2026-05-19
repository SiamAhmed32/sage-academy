import { Schema, model, models } from "mongoose";

const UploadedFormSchema = new Schema(
  {
    url: {
      type: String,
      default: "",
      trim: true,
    },
    publicId: {
      type: String,
      default: "",
      trim: true,
    },
    resourceType: {
      type: String,
      default: "",
      trim: true,
    },
    originalName: {
      type: String,
      default: "",
      trim: true,
    },
    format: {
      type: String,
      default: "",
      trim: true,
    },
    bytes: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const AdmissionRequestSchema = new Schema(
  {
    studentName: {
      type: String,
      default: "",
      trim: true,
    },
    nameBangla: {
      type: String,
      default: "",
      trim: true,
    },
    guardianName: {
      type: String,
      default: "",
      trim: true,
    },
    fatherName: {
      type: String,
      default: "",
      trim: true,
    },
    motherName: {
      type: String,
      default: "",
      trim: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    studentWhatsapp: {
      type: String,
      default: "",
      trim: true,
    },
    email: {
      type: String,
      default: "",
      trim: true,
    },
    className: {
      type: String,
      default: "",
      trim: true,
    },
    schoolName: {
      type: String,
      default: "",
      trim: true,
    },
    section: {
      type: String,
      default: "",
      trim: true,
    },
    classRoll: {
      type: String,
      default: "",
      trim: true,
    },
    studentDateOfBirth: {
      type: Date,
      default: null,
    },
    studentGender: {
      type: String,
      enum: ["male", "female", "other", ""],
      default: "",
    },
    preferredBatch: {
      type: String,
      default: "",
      trim: true,
    },
    academicVersion: {
      type: String,
      enum: ["bangla", "english", "other"],
      default: "bangla",
    },
    interestedSubjects: {
      type: String,
      default: "",
      trim: true,
    },
    admissionDate: {
      type: Date,
      default: null,
    },
    presentAddress: {
      type: String,
      default: "",
      trim: true,
    },
    permanentAddress: {
      type: String,
      default: "",
      trim: true,
    },
    message: {
      type: String,
      default: "",
      trim: true,
    },
    source: {
      type: String,
      default: "admission-page",
      trim: true,
    },
    status: {
      type: String,
      enum: ["new", "contacted", "qualified", "closed", "spam"],
      default: "new",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    adminNote: {
      type: String,
      default: "",
      trim: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
    uploadedForm: {
      type: UploadedFormSchema,
      default: null,
    },
    utmSource: { type: String, default: "", trim: true },
    utmMedium: { type: String, default: "", trim: true },
    utmCampaign: { type: String, default: "", trim: true },
    utmContent: { type: String, default: "", trim: true },
    utmTerm: { type: String, default: "", trim: true },
    attributionReferrer: { type: String, default: "", trim: true },
    attributionLandingPath: { type: String, default: "", trim: true },
    attributionSubmitPath: { type: String, default: "", trim: true },
    attributionCapturedAt: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

const AdmissionRequest = models.AdmissionRequest || model("AdmissionRequest", AdmissionRequestSchema);

export default AdmissionRequest;
