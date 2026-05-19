"use client";

import { useState } from "react";
import { ContactRow } from "./ContactRow";
import { ContactDetailModal } from "./ContactDetailModal";
import { ContactDeleteModal } from "./ContactDeleteModal";

type ContactTableProps = {
  requests: any[];
};

export function ContactTable({ requests }: ContactTableProps) {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  return (
    <div className="overflow-hidden rounded-xl border border-sage-border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-sage-red-50/50 border-b border-sage-border">
              <th className="px-4 py-3 text-sm font-bold text-sage-secondary">প্রেরক</th>
              <th className="px-4 py-3 text-sm font-bold text-sage-secondary">বার্তা</th>
              <th className="px-4 py-3 text-sm font-bold text-sage-secondary">তারিখ</th>
              <th className="px-4 py-3 text-sm font-bold text-sage-secondary">স্ট্যাটাস</th>
              <th className="px-4 py-3 text-sm font-bold text-sage-secondary">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((item) => (
              <ContactRow 
                key={item._id.toString()} 
                item={item} 
                onView={setSelectedItem} 
                onDelete={setItemToDelete}
              />
            ))}
          </tbody>
        </table>
      </div>

      {requests.length === 0 && (
        <div className="py-12 text-center text-sage-gray-500">
          কোনো মেসেজ পাওয়া যায়নি।
        </div>
      )}

      {selectedItem && (
        <ContactDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {itemToDelete && (
        <ContactDeleteModal
          item={itemToDelete}
          onClose={() => setItemToDelete(null)}
        />
      )}
    </div>
  );
}
