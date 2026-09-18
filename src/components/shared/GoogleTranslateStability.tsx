"use client";

import { useEffect } from "react";

function resetTranslateOffset() {
  const html = document.documentElement;
  const translated =
    html.classList.contains("translated-ltr") || html.classList.contains("translated-rtl");
  const banner = document.querySelector(".goog-te-banner-frame, iframe.skiptranslate");

  if (!translated && !banner) return;

  html.style.setProperty("margin-top", "0px", "important");
  document.body.style.setProperty("top", "0px", "important");
  document.body.style.setProperty("position", "static", "important");

  document.querySelectorAll<HTMLElement>(".goog-te-banner-frame, iframe.skiptranslate").forEach((el) => {
    el.style.setProperty("display", "none", "important");
  });
}

function patchReactTranslateCrashes() {
  const node = Node.prototype;

  const originalRemoveChild = node.removeChild;
  node.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) return child;
    return originalRemoveChild.call(this, child) as T;
  };

  const originalInsertBefore = node.insertBefore;
  node.insertBefore = function <T extends Node>(this: Node, newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) return newNode;
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };
}

export function GoogleTranslateStability() {
  useEffect(() => {
    patchReactTranslateCrashes();
    resetTranslateOffset();

    const observer = new MutationObserver(resetTranslateOffset);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
