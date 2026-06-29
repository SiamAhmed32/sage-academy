export const FREE_CLASS_OPEN_EVENT = "sage:open-free-class";

export function openFreeClassModal() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(FREE_CLASS_OPEN_EVENT));
}
