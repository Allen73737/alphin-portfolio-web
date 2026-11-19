import { SITE } from "./config";

/* ─── ANALYTICS ──────────────────────────────────────────────────── */
type Win=Window&{plausible?:(e:string,o?:{props?:Record<string,string>})=>void;umami?:{track:(e:string,d?:Record<string,string>)=>void}};

export function initAnalytics() {
  const a=SITE.analytics;
  if(!a.provider||document.getElementById("site-analytics"))return;
  const s=document.createElement("script");
  s.id="site-analytics";s.defer=true;
  if(a.provider==="plausible"){
    if(!a.domain)return;
    s.src=a.scriptSrc||"https://plausible.io/js/script.js";s.dataset.domain=a.domain;
  } else {
    if(!a.websiteId)return;
    s.src=a.scriptSrc||"https://cloud.umami.is/script.js";s.dataset.websiteId=a.websiteId;
  }
  document.head.appendChild(s);
}
/* named events, e.g. track("CV Download") — a no-op until analytics is configured */
export function track(event:string,props?:Record<string,string>) {
  const w=window as Win;
  try{
    if(SITE.analytics.provider==="plausible")w.plausible?.(event,props?{props}:undefined);
    else if(SITE.analytics.provider==="umami")w.umami?.track(event,props);
  }catch{/* analytics must never break the page */}
}

/* ─── CONTACT ────────────────────────────────────────────────────── */
export type Inquiry={name:string;email:string;type:string;message:string};
/* "sent" = delivered by Formspree, "mailto" = handed to the visitor's mail app */
export async function sendInquiry(form:Inquiry):Promise<"sent"|"mailto"> {
  track("Contact Submit",{type:form.type||"none"});
  if(SITE.formspreeId){
    try{
      const res=await fetch(`https://formspree.io/f/${SITE.formspreeId}`,{
        method:"POST",headers:{Accept:"application/json","Content-Type":"application/json"},
        body:JSON.stringify({name:form.name,email:form.email,subject:form.type||"Portfolio inquiry",message:form.message}),
      });
      if(res.ok)return "sent";
    }catch{/* network error: fall through to mail client */}
  }
  const subject=`${form.type||"Portfolio inquiry"} from ${form.name}`;
  const body=`${form.message||"(no message)"}\n\n${form.name}\n${form.email}`;
  window.location.href=`mailto:alphinfrancis7@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return "mailto";
}
