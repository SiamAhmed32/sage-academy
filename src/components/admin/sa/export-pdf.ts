"use client";

// Renders a DOM element to a PDF. The browser draws the element (via
// html-to-image), so Bangla text and modern CSS colours come out exactly as
// they look on screen — jsPDF's built-in fonts cannot shape Bangla.

const TIMEOUT_MS = 20_000;

function withTimeout<T>(promise: Promise<T>, ms: number) {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("PDF export timed out")), ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      }
    );
  });
}

async function render(
  element: HTMLElement,
  fileName: string,
  orientation: "portrait" | "landscape",
  margin: number
) {
  const [{ toPng }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);

  const dataUrl = await toPng(element, {
    pixelRatio: 2,
    backgroundColor: "#ffffff",
    cacheBust: true,
    width: element.scrollWidth,
    height: element.scrollHeight,
    style: { overflow: "visible" },
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });

  const pdf = new jsPDF({ orientation, unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth() - margin * 2;
  const pageHeight = pdf.internal.pageSize.getHeight() - margin * 2;
  const scale = Math.min(pageWidth / image.width, pageHeight / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  // "FAST" = lossless deflate; without it jsPDF stores the image raw (a one-page sheet was ~8 MB).
  pdf.addImage(dataUrl, "PNG", margin + (pageWidth - width) / 2, margin, width, height, undefined, "FAST");
  pdf.save(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
}

/**
 * Saves the element as a PDF. If the browser cannot draw it in time (slow
 * device, background tab), falls back to the print dialog, where
 * "Save as PDF" gives the same result.
 */
export async function exportElementToPdf(
  element: HTMLElement,
  fileName: string,
  options: { orientation?: "portrait" | "landscape"; marginMm?: number } = {}
) {
  try {
    await withTimeout(render(element, fileName, options.orientation ?? "portrait", options.marginMm ?? 8), TIMEOUT_MS);
    return "saved" as const;
  } catch (error) {
    console.warn("[pdf] falling back to print", error);
    window.print();
    return "printed" as const;
  }
}
