"use client";

import { useState } from "react";
import { ContactRow } from "./ContactRow";
import { ContactDetailModal } from "./ContactDetailModal";
import { ContactDeleteModal } from "./ContactDeleteModal";
import type { ContactRequestItem } from "./types";

type ContactTableProps = {
  requests: ContactRequestItem[];
};

export function ContactTable({ requests }: ContactTableProps) {
  const [selectedItem, setSelectedItem] = useState<ContactRequestItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ContactRequestItem | null>(null);

  return (
    <div className="overflow-hidden rounded-xl border border-sage-border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-sage-red-50/50 border-b border-sage-border">
              <th className="px-4 py-3 text-sm font-bold text-sage-secondary">Sender</th>
              <th className="px-4 py-3 text-sm font-bold text-sage-secondary">Message</th>
              <th className="px-4 py-3 text-sm font-bold text-sage-secondary">Date</th>
              <th className="px-4 py-3 text-sm font-bold text-sage-secondary">Status</th>
              <th className="px-4 py-3 text-sm font-bold text-sage-secondary">Actions</th>
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
          No messages found.
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
