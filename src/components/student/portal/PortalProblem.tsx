import Link from "next/link";
import { PhoneCall, UserRoundSearch } from "lucide-react";

import { ACADEMY_CONTACT } from "@/lib/academy/constants";

const MESSAGES = {
  "missing-phone": {
    title: "আপনার অ্যাকাউন্টে মোবাইল নম্বর নেই",
    body: "ভর্তির সময় দেওয়া মোবাইল নম্বর দিয়ে অ্যাকাউন্ট খুললে আপনার শিক্ষার্থীর তথ্য এখানে দেখা যাবে।",
  },
  "not-found": {
    title: "এই নম্বরে কোনো শিক্ষার্থী পাওয়া যায়নি",
    body: "ভর্তির সময় যে মোবাইল নম্বর (শিক্ষার্থী, অভিভাবক বা হোয়াটসঅ্যাপ) দেওয়া হয়েছিল, সেই নম্বর দিয়ে লগইন করুন।",
  },
  "legacy-only": {
    title: "আপনার তথ্য নতুন সিস্টেমে যোগ করা হচ্ছে",
    body: "SAGE Academy নতুন ব্যবস্থায় যাচ্ছে। অফিস আপনার ভর্তির তথ্য যোগ করলেই এখানে রুটিন, ফি ও রসিদ দেখা যাবে।",
  },
};

export function PortalProblem({ problem }: { problem: keyof typeof MESSAGES }) {
  const message = MESSAGES[problem];
  return (
    <section className="panel" style={{ maxWidth: 720 }}>
      <div className="empty-state">
        <div className="empty-icon">
          <UserRoundSearch size={24} />
        </div>
        <strong>{message.title}</strong>
        <p>{message.body}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <a href={`tel:${ACADEMY_CONTACT.phones[1]}`} className="btn-primary">
            <PhoneCall size={17} /> অফিসে কল করুন
          </a>
          <Link href="/" className="btn-secondary">
            ওয়েবসাইটে ফিরুন
          </Link>
        </div>
      </div>
    </section>
  );
}
