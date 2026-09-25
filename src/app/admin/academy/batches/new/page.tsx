import { redirect } from "next/navigation";

// Batches are created in the side drawer on the Batches page.
export default function NewBatchPage() {
  redirect("/admin/academy/batches?create=1");
}
