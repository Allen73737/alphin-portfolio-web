import { useEffect, useState } from "react";

/* ─── I18N — tiny EN/DE switch ───────────────────────────────────────
   t(en, de) reads the current language at render time. Changing the
   language notifies subscribers (data builders first, then the App,
   which re-mounts the page so every t() call re-evaluates).           */
export type Lang="en"|"de";

function initial():Lang {
  try{const s=localStorage.getItem("lang");if(s==="en"||s==="de")return s;}catch{/* storage blocked */}
  return typeof navigator!=="undefined"&&navigator.language?.toLowerCase().startsWith("de")?"de":"en";
}
let cur:Lang=initial();
const subs=new Set<()=>void>();

export const getLang=()=>cur;
export const t=(en:string,de:string)=>cur==="de"?de:en;
export function setLang(l:Lang) {
  if(l===cur)return;
  cur=l;
  try{localStorage.setItem("lang",l);}catch{/* storage blocked */}
  document.documentElement.lang=l;
  subs.forEach(f=>f());
}
export function onLang(f:()=>void){subs.add(f);return()=>{subs.delete(f);};}
export function useLang() {
  const [l,set]=useState(cur);
  useEffect(()=>onLang(()=>set(cur)),[]);
  return l;
}
