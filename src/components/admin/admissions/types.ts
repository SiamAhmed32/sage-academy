export interface AdmissionUploadedForm {
  url: string;
  publicId: string;
  resourceType: string;
  originalName: string;
  format: string;
  bytes: number;
}

export interface AdmissionRequestItem {
  _id: string;
  studentName: string;
  nameBangla: string;
  guardianName: string;
  fatherName: string;
  motherName: string;
  phone: string;
  studentWhatsapp: string;
  email: string;
  className: string;
  schoolName: string;
  section: string;
  classRoll: string;
  studentDateOfBirth: string | null;
  studentGender: string;
  preferredBatch: string;
  academicVersion: string;
  interestedSubjects: string;
  admissionDate: string | null;
  presentAddress: string;
  permanentAddress: string;
  message: string;
  status: string;
  adminNote: string;
  isArchived: boolean;
  createdAt: string;
  uploadedForm: AdmissionUploadedForm | null;
}
