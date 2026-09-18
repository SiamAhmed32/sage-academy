import { Search, Filter } from "lucide-react";
import { PromotionCardTableRow } from "./PromotionCardTableRow";
import type { SerializedPromotionCard } from "@/lib/promotion-card-serialize";

type BatchOption = { _id: string; title: string; batchCode: string };

export function PromotionCardTable({
  cards,
  batches,
  filters,
}: {
  cards: SerializedPromotionCard[];
  batches: BatchOption[];
  filters: {
    q: string;
    batch: string;
    visibility: string;
    view: string;
    sort: string;
  };
}) {
  return (
    <div className="space-y-4">
      <form method="get" className="mb-5 grid gap-3 rounded-xl border border-sage-border bg-sage-white p-4 lg:grid-cols-12">
        <div className="relative lg:col-span-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-sage-gray-400" size={18} />
          <input
            name="q"
            defaultValue={filters.q}
            placeholder="Search by title..."
            className="h-10 w-full rounded-lg border border-sage-border bg-sage-white pl-10 pr-4 text-sm outline-none transition focus:border-sage-primary"
          />
        </div>
        
        <select
          name="batch"
          defaultValue={filters.batch}
          className="h-10 rounded-lg border border-sage-border bg-sage-white px-3 text-sm outline-none lg:col-span-2"
        >
          <option value="">All batches</option>
          <option value="none">Not linked</option>
          {batches.map(b => (
            <option key={b._id} value={b._id}>{b.title} ({b.batchCode})</option>
          ))}
        </select>

        <select
          name="visibility"
          defaultValue={filters.visibility}
          className="h-10 rounded-lg border border-sage-border bg-sage-white px-3 text-sm outline-none lg:col-span-2"
        >
          <option value="">All cards</option>
          <option value="visible">Visible on website</option>
          <option value="hidden">Hidden on website</option>
          <option value="featured">Featured on homepage</option>
        </select>

        <select
          name="view"
          defaultValue={filters.view}
          className="h-10 rounded-lg border border-sage-border bg-sage-white px-3 text-sm outline-none lg:col-span-1"
        >
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>

        <select
          name="sort"
          defaultValue={filters.sort}
          className="h-10 rounded-lg border border-sage-border bg-sage-white px-3 text-sm outline-none lg:col-span-1"
        >
          <option value="order">Order</option>
          <option value="newest">Newest</option>
          <option value="title">Title</option>
        </select>

        <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-sage-primary px-3 text-sm font-bold text-white lg:col-span-2">
          <Filter size={16} />
          Apply filters
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-sage-border bg-sage-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-sage-red-50 text-sage-secondary">
            <tr>
              <th className="p-4">Card image</th>
              <th className="p-4">Title</th>
              <th className="p-4">Linked batch</th>
              <th className="p-4">Features</th>
              <th className="p-4">Status</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sage-border">
            {cards.map((card) => (
              <PromotionCardTableRow
                key={card._id}
                card={card}
                batches={batches}
              />
            ))}
            {cards.length === 0 && (
              <tr>
                <td colSpan={6} className="p-12 text-center text-sage-gray-500">
                  No cards found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
