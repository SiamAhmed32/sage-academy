import { MapPin } from "lucide-react";

interface AdmissionAddressBoxProps {
  title: string;
  address?: string | null;
}

export function AdmissionAddressBox({ title, address }: AdmissionAddressBoxProps) {
  if (!address?.trim()) return null;

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 bg-gray-50 px-4 py-3 border-b border-gray-200">
        <MapPin size={15} className="text-[#8b1a1a]" />
        <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
          {title}
        </h3>
      </div>
      {/* Body */}
      <div className="px-4 py-3">
        <p className="text-sm font-semibold text-gray-800 leading-relaxed">
          {address}
        </p>
      </div>
    </div>
  );
}
