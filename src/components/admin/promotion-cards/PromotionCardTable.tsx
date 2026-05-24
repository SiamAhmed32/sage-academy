"use client";

import { useMemo, useState } from "react";
import { Search, Filter } from "lucide-react";
import { PromotionCardTableRow } from "./PromotionCardTableRow";

type PromotionCard = {
  _id: string;
  title: string;
  image: string;
  badge: string;
  features: string[];
  overview?: string;
  linkedBatch?: { _id: string; title: string; batchCode: string };
  websiteVisible: boolean;
  featured: boolean;
  order: number;
  isArchived: boolean;
};

export function PromotionCardTable({ 
  cards, 
  batches 
}: { 
  cards: PromotionCard[];
  batches: { _id: string; title: string; batchCode: string }[];
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "visible" | "hidden" | "featured">("all");
  const [view, setView] = useState<"active" | "archived">("active");
  const [batchFilter, setBatchFilter] = useState("all");

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const matchesSearch = card.title.toLowerCase().includes(search.toLowerCase());
      const matchesView = view === "active" ? !card.isArchived : card.isArchived;
      const matchesFilter = 
        filter === "all" ? true :
        filter === "visible" ? card.websiteVisible :
        filter === "hidden" ? !card.websiteVisible :
        filter === "featured" ? card.featured : true;
      const matchesBatch = 
        batchFilter === "all" ? true :
        batchFilter === "none" ? !card.linkedBatch :
        card.linkedBatch?._id === batchFilter;
      
      return matchesSearch && matchesView && matchesFilter && matchesBatch;
    });
  }, [cards, search, filter, view, batchFilter]);

  return (
    <div className="space-y-4">
      <div className="mb-5 grid gap-3 rounded-xl border border-sage-border bg-sage-white p-4 lg:grid-cols-12">
        <div className="relative lg:col-span-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-sage-gray-400" size={18} />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="টাইটেল দিয়ে খুঁজুন..." 
            className="h-10 w-full rounded-lg border border-sage-border bg-sage-white pl-10 pr-4 text-sm outline-none transition focus:border-sage-primary"
          />
        </div>
        
        <select 
          value={batchFilter}
          onChange={(e) => setBatchFilter(e.target.value)}
          className="h-10 rounded-lg border border-sage-border bg-sage-white px-3 text-sm outline-none lg:col-span-3"
        >
          <option value="all">সব ব্যাচ</option>
          <option value="none">লিঙ্কড নেই</option>
          {batches.map(b => (
            <option key={b._id} value={b._id}>{b.title} ({b.batchCode})</option>
          ))}
        </select>

        <select 
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="h-10 rounded-lg border border-sage-border bg-sage-white px-3 text-sm outline-none lg:col-span-3"
        >
          <option value="all">সব কার্ড</option>
          <option value="visible">ওয়েবসাইটে দৃশ্যমান</option>
          <option value="hidden">ওয়েবসাইটে লুকানো</option>
          <option value="featured">হোমপেজে ফিচার্ড</option>
        </select>

        <select
          value={view}
          onChange={(e) => setView(e.target.value as any)}
          className="h-10 rounded-lg border border-sage-border bg-sage-white px-3 text-sm outline-none lg:col-span-2"
        >
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-sage-border bg-sage-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-sage-red-50 text-sage-secondary">
            <tr>
              <th className="p-4">কার্ড ইমেজ</th>
              <th className="p-4">টাইটেল</th>
              <th className="p-4">লিঙ্কড ব্যাচ</th>
              <th className="p-4">ফিচারসমূহ</th>
              <th className="p-4">স্ট্যাটাস</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sage-border">
            {filteredCards.map((card) => (
              <PromotionCardTableRow
                key={card._id}
                card={card}
                batches={batches}
              />
            ))}
            {filteredCards.length === 0 && (
              <tr>
                <td colSpan={6} className="p-12 text-center text-sage-gray-500">
                  কোনো কার্ড পাওয়া যায়নি
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
