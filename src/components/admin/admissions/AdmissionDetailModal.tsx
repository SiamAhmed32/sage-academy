"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, FileText, MessageCircle, Phone, UserPlus } from "lucide-react";

import { Modal } from "@/components/admin/sa/Modal";
import { adminGenderLabels, adminVersionLabels, getAdminClassLabel } from "@/constants/admin-display";
import { formatAdminDateTime } from "@/lib/admin-format";
import type { AdmissionRequestItem } from "./types";

interface AdmissionDetailModalProps {
  item: AdmissionRequestItem;
  onClose: () => void;
}

type TabKey = "student" | "academic" | "guardian" | "address";

const TABS: { key: TabKey; label: string }[] = [
  { key: "student", label: "Student" },
  { key: "academic", label: "Academic" },
  { key: "guardian", label: "Guardian" },
  { key: "address", label: "Address" },
];

const STATUS_LABEL: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  closed: "Closed",
  spam: "Spam",
};

function formatDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function Rows({ rows }: { rows: [string, string | undefined | null][] }) {
  const filled = rows.filter(([, value]) => value && String(value).trim());
  if (filled.length === 0) return <p className="adm-empty">Nothing was filled in here.</p>;
  return (
    <dl className="adm-rows">
      {filled.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function AdmissionDetailModal({ item, onClose }: AdmissionDetailModalProps) {
  const [tab, setTab] = useState<TabKey>("student");
  const phone = item.phone || item.studentWhatsapp;
  const whatsapp = (item.studentWhatsapp || item.phone || "").replace(/\D/g, "").replace(/^0/, "880");
  const subjects = item.interestedSubjects
    .split(",")
    .map((subject) => subject.trim())
    .filter(Boolean);
  const closed = item.status === "closed" || item.status === "spam" || item.isArchived;

  return (
    <Modal
      open
      wide
      onClose={onClose}
      eyebrow={`Admission request · #${item._id.slice(-6).toUpperCase()}`}
      title={item.studentName || "Applicant"}
      description={`Applied ${formatAdminDateTime(item.createdAt)}`}
      actions={
        <>
          <Link href={`/admin/admissions/${item._id}`} className="btn-secondary" style={{ marginRight: "auto" }}>
            <FileText size={16} /> Full application
          </Link>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
          {closed ? null : (
            <Link href={`/admin/academy/admission?request=${item._id}`} className="btn-primary">
              <UserPlus size={16} /> Admit student <ArrowRight size={15} />
            </Link>
          )}
        </>
      }
    >
      {/* At a glance: what they want and how to reach them */}
      <div className="adm-glance">
        <div>
          <span>Class</span>
          <strong>{item.className ? getAdminClassLabel(item.className) : "—"}</strong>
        </div>
        <div>
          <span>Version</span>
          <strong>{adminVersionLabels[item.academicVersion] ?? "—"}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong className={`adm-status ${item.status}`}>{item.isArchived ? "Archived" : STATUS_LABEL[item.status] ?? item.status}</strong>
        </div>
        <div className="adm-contact">
          {phone ? (
            <a href={`tel:${phone}`} className="btn-secondary">
              <Phone size={15} /> {phone}
            </a>
          ) : null}
          {whatsapp ? (
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="btn-secondary adm-wa">
              <MessageCircle size={15} /> WhatsApp
            </a>
          ) : null}
        </div>
      </div>

      {subjects.length ? (
        <div className="adm-subjects">
          <span>Wants to study</span>
          {subjects.map((subject) => (
            <b key={subject}>{subject}</b>
          ))}
        </div>
      ) : null}

      {closed ? null : (
        <p className="adm-next">
          <strong>Next step:</strong> call the guardian to confirm, then click <em>Admit student</em>. The form opens already filled in —
          you only choose the batch and subjects.
        </p>
      )}

      <div className="adm-tabs-card">
        <nav className="tabs" role="tablist" aria-label="Application sections">
          {TABS.map((entry) => (
            <button
              key={entry.key}
              type="button"
              role="tab"
              aria-selected={tab === entry.key}
              className={tab === entry.key ? "active" : ""}
              onClick={() => setTab(entry.key)}
            >
              {entry.label}
            </button>
          ))}
        </nav>
        <div className="adm-tab-body" role="tabpanel">
          {tab === "student" ? (
            <Rows
              rows={[
                ["Name (English)", item.studentName],
                ["Name (Bangla)", item.nameBangla],
                ["Gender", adminGenderLabels[item.studentGender] ?? item.studentGender],
                ["Date of birth", formatDate(item.studentDateOfBirth)],
                ["WhatsApp", item.studentWhatsapp],
                ["Email", item.email],
              ]}
            />
          ) : null}
          {tab === "academic" ? (
            <Rows
              rows={[
                ["Class", item.className ? getAdminClassLabel(item.className) : ""],
                ["Version", adminVersionLabels[item.academicVersion] ?? item.academicVersion],
                ["School / college", item.schoolName],
                ["Section", item.section],
                ["Roll number", item.classRoll],
                ["Subjects of interest", subjects.join(", ")],
                ["Wants to start", formatDate(item.admissionDate)],
              ]}
            />
          ) : null}
          {tab === "guardian" ? (
            <Rows
              rows={[
                ["Guardian", item.guardianName],
                ["Father", item.fatherName],
                ["Mother", item.motherName],
                ["Phone", item.phone],
              ]}
            />
          ) : null}
          {tab === "address" ? (
            <Rows
              rows={[
                ["Present address", item.presentAddress],
                ["Permanent address", item.permanentAddress === item.presentAddress && item.permanentAddress ? "Same as present" : item.permanentAddress],
              ]}
            />
          ) : null}
        </div>
      </div>

      {item.message || item.adminNote ? (
        <div className="adm-notes">
          {item.message ? (
            <div>
              <span>Message from the parent</span>
              <p>{item.message}</p>
            </div>
          ) : null}
          {item.adminNote ? (
            <div>
              <span>Staff comment</span>
              <p>{item.adminNote}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}
