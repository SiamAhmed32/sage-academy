"use client";

import { Fragment, useMemo, useState } from "react";
import Image from "next/image";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { Search, Filter, Archive, Trash2, RotateCcw } from "lucide-react";
import { PromotionCardEditForm } from "./PromotionCardEditForm";

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
  const [editingId, setEditingId] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "visible" | "hidden" | "featured">("all");
  const [view, setView] = useState<"active" | "archived">("active");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const router = useRouter();

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const matchesSearch = card.title.toLowerCase().includes(search.toLowerCase());
      const matchesView = view === "active" ? !card.isArchived : card.isArchived;
      const matchesFilter = 
        filter === "all" ? true :
        filter === "visible" ? card.websiteVisible :
        filter === "hidden" ? !card.websiteVisible :
        filter === "featured" ? card.featured : true;
      
      return matchesSearch && matchesView && matchesFilter;
    });
  }, [cards, search, filter, view]);

  async function handleAction(id: string, action: "archive" | "delete" | "restore") {
    if (action === "delete" && !confirm("এই কার্ডটি কি চিরতরে মুছে ফেলতে চান?")) return;
    
    setIsProcessing(id);
    try {
      let url = `/api/promotion-cards/${id}`;
      let method = "DELETE";

      if (action === "delete") url += "?permanent=true";
      if (action === "restore") {
        method = "PATCH";
        const formData = new FormData();
        formData.append("isArchived", "false");
        formData.append("websiteVisible", "true"); // Auto show on website when restored
        
        const res = await fetch(url, { method, body: formData });
        if (!res.ok) throw new Error("অ্যাকশনটি সফল হয়নি");
      } else {
        const res = await fetch(url, { method });
        if (!res.ok) throw new Error("অ্যাকশনটি সফল হয়নি");
      }

      toast.success(
        action === "archive" ? "কার্ডটি আর্কাইভ করা হয়েছে" : 
        action === "restore" ? "কার্ডটি রিস্টোর করা হয়েছে" : "কার্ডটি চিরতরে মুছে ফেলা হয়েছে"
      );
      router.refresh();
    } catch (error) {
      toast.error("দুঃখিত, পুনরায় চেষ্টা করুন");
    } finally {
      setIsProcessing(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4 rounded-xl border border-sage-border bg-sage-white p-4 shadow-sm md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-sage-gray-400" size={18} />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="টাইটেল দিয়ে খুঁজুন..." 
            className="h-11 w-full rounded-lg border border-sage-border bg-sage-red-50/30 pl-10 pr-4 text-sm outline-none transition focus:border-sage-primary"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="text-sage-gray-400" size={18} />
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="h-11 rounded-lg border border-sage-border bg-white px-3 text-sm outline-none"
          >
            <option value="all">সব কার্ড</option>
            <option value="visible">ওয়েবসাইটে দৃশ্যমান</option>
            <option value="hidden">ওয়েবসাইটে লুকানো</option>
            <option value="featured">হোমপেজে ফিচার্ড</option>
          </select>
        </div>

        <div className="flex rounded-lg border border-sage-border bg-sage-red-50 p-1">
          <button 
            onClick={() => setView("active")}
            className={`rounded-md px-4 py-1.5 text-xs font-bold transition ${view === "active" ? "bg-white text-sage-primary shadow-sm" : "text-sage-gray-500"}`}
          >
            একটিভ
          </button>
          <button 
            onClick={() => setView("archived")}
            className={`rounded-md px-4 py-1.5 text-xs font-bold transition ${view === "archived" ? "bg-white text-sage-primary shadow-sm" : "text-sage-gray-500"}`}
          >
            আর্কাইভড
          </button>
        </div>
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
              <Fragment key={card._id}>
                <tr className={`transition-colors hover:bg-sage-red-50/30 ${isProcessing === card._id ? "opacity-50" : ""}`}>
                  <td className="p-4">
                    <div className="relative h-16 w-24 overflow-hidden rounded-lg border border-sage-border bg-sage-red-50">
                      <Image src={card.image} alt={card.title} fill className="object-cover" />
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-sage-secondary">{card.title}</p>
                    <p className="mt-1 text-xs text-sage-primary">{card.badge}</p>
                  </td>
                  <td className="p-4">
                    {card.linkedBatch ? (
                      <div>
                        <p className="font-semibold text-sage-secondary">{card.linkedBatch.title}</p>
                        <p className="text-xs text-sage-gray-500">{card.linkedBatch.batchCode}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-sage-gray-400">লিঙ্কড নেই</span>
                    )}
                  </td>
                  <td className="max-w-xs p-4">
                    <div className="flex flex-wrap gap-1">
                      {card.features.map((f, i) => (
                        <span key={i} className="rounded-md bg-sage-white px-2 py-0.5 text-[10px] ring-1 ring-sage-red-100">
                          {f}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1 text-[11px] font-bold">
                      <span className={card.websiteVisible ? "text-green-600" : "text-gray-400"}>
                        {card.websiteVisible ? "Visible" : "Hidden"}
                      </span>
                      <span className={card.featured ? "text-sage-primary" : "text-gray-400"}>
                        {card.featured ? "Featured" : "Regular"}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setEditingId(editingId === card._id ? "" : card._id)}
                        className="rounded-lg border border-sage-border bg-white px-3 py-1.5 text-xs font-bold text-sage-secondary transition hover:border-sage-primary hover:text-sage-primary"
                      >
                        {editingId === card._id ? "বন্ধ" : "এডিট"}
                      </button>
                      
                      {!card.isArchived ? (
                        <button 
                          onClick={() => handleAction(card._id, "archive")}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-red-50 text-sage-primary transition hover:bg-sage-primary hover:text-white"
                          title="আর্কাইভ করুন"
                        >
                          <Archive size={16} />
                        </button>
                      ) : (
                        <>
                          <button 
                            onClick={() => handleAction(card._id, "restore")}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600 transition hover:bg-green-100"
                            title="রিস্টোর করুন"
                          >
                            <RotateCcw size={16} />
                          </button>
                          
                          <button 
                            onClick={() => handleAction(card._id, "delete")}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-600 hover:text-white"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
                {editingId === card._id && (
                  <tr>
                    <td colSpan={6} className="bg-sage-white p-4">
                      <PromotionCardEditForm 
                        card={{...card, linkedBatch: card.linkedBatch?._id}} 
                        batches={batches} 
                        onCancel={() => setEditingId("")}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
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
