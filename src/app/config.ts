/* ─── SITE CONFIG — fill these in to switch features on ──────────────
   Everything works with the defaults; each empty value just disables
   the matching feature and falls back gracefully.                      */
export const SITE = {
  /* public URL once deployed, e.g. "https://alphinfrancis.com" (used for link previews) */
  url: "",
  /* Formspree form id (the part after formspree.io/f/). Empty = open the visitor's mail app */
  formspreeId: "",
  /* privacy-friendly analytics. provider "" disables tracking entirely.
     plausible: set domain (e.g. "alphinfrancis.com")
     umami:     set websiteId and, if self-hosted, scriptSrc            */
  analytics: {
    provider: "" as "" | "plausible" | "umami",
    domain: "",
    websiteId: "",
    scriptSrc: "",
  },
};
