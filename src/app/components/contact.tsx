import { useState, useEffect, useRef, useCallback } from "react";
import {
  motion, useScroll, useTransform, useSpring,
  useMotionValue, useInView, AnimatePresence, useMotionTemplate,
  type MotionValue,
} from "motion/react";
import Lenis from "lenis";
import { t } from "../i18n";
import { sendInquiry, track } from "../services";
import { ArrowUpRight, Github, Linkedin, Mail, ExternalLink } from "lucide-react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import alphinPhoto from "@/imports/Picture3.png";
import alphinCV from "@/imports/AlphinFrancis.pdf";
import alphinCVPage1 from "@/imports/AlphinFrancis-page-1.png";
import alphinCVPage2 from "@/imports/AlphinFrancis-page-2.png";
import { type V3, type Face, type Cam, m3T, m3Ry, m3Rx, m3Rz, m3Mul, m3P, v3Sub, v3Dot, v3Norm, addBox, addCyl, makeCam, proj, runCanvas } from "@/app/components/robot3d/engine";
import { Preloader3D, RobotShowcase, RobotHeadCompanion } from "@/app/components/robot3d/robots";

import { BG, MN, BODY, BRD, scrollToTarget, ROLES, SIMPLE } from "../lib";
import { GearDecor, TypeBot, HUDFrame, CircuitBg, HexDotBg, WordReveal, Mag } from "./fx";
import { RobotArm3D } from "./hero";
import { About, Skills } from "./sections";

/* ─── CONTACT FORM ───────────────────────────────────────────────── */
export function ContactForm() {
  const [form,setForm]=useState({name:"",email:"",type:"",message:""});
  const [status,setStatus]=useState<"idle"|"sending"|"sent"|"mailto">("idle");
  const [focused,setFocused]=useState("");
  const types=[t("FULL-TIME ROLE","FESTANSTELLUNG"),t("RESEARCH COLLAB","FORSCHUNGSKOOPERATION"),t("CONSULTING","BERATUNG"),t("SPEAKING / DEMO","VORTRAG / DEMO"),"OPEN SOURCE"];
  const handleSubmit=async(e:React.FormEvent)=>{e.preventDefault();if(!form.name||!form.email)return;setStatus("sending");setStatus(await sendInquiry(form));};
  const fieldStyle=(f:string):React.CSSProperties=>({display:"block",width:"100%",background:"transparent",fontFamily:MN,fontSize:"16px",color:"#fff",outline:"none",padding:"13px 0 9px",borderBottom:`1px solid ${focused===f?"rgba(255,255,255,0.65)":"rgba(255,255,255,0.22)"}`,transition:"border-color .25s",letterSpacing:"0.03em"});
  const lbl:React.CSSProperties={fontFamily:MN,fontSize:"12.5px",color:"rgba(255,255,255,0.68)",letterSpacing:"0.2em",display:"block",marginBottom:4};
  return (
    <motion.div initial={{opacity:0,y:38}} whileInView={{opacity:1,y:0}} viewport={{once:false}} transition={{duration:0.9,ease:[0.22,1,0.36,1]}} style={{border:`1px solid ${BRD}`,position:"relative",overflow:"hidden"}}>
      <div className="flex items-center justify-between px-5 py-3" style={{borderBottom:`1px solid ${BRD}`,background:"rgba(255,255,255,0.016)"}}>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">{[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:`rgba(255,255,255,${0.08+i*0.04})`}}/>)}</div>
          <span style={{fontFamily:MN,fontSize:"12.5px",color:"rgba(255,255,255,0.62)",letterSpacing:"0.18em"}}>{t("CONTACT REQUEST","KONTAKTANFRAGE")}</span>
        </div>
        <span style={{fontFamily:MN,fontSize:"11.5px",color:"rgba(255,255,255,0.58)",letterSpacing:"0.14em"}}>{t("SECURE FORM","SICHERES FORMULAR")}</span>
      </div>
      <motion.div style={{position:"absolute",left:0,right:0,height:1,background:"linear-gradient(to right,transparent,rgba(255,255,255,0.08),transparent)",pointerEvents:"none",zIndex:10}} animate={{top:["8%","96%"]}} transition={{duration:5,repeat:Infinity,repeatDelay:8,ease:"linear"}}/>
      <AnimatePresence mode="wait">
        {status==="sent"||status==="mailto"?(
          <motion.div key="sent" initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="flex flex-col items-center justify-center py-20 px-8 gap-6">
            <div style={{width:52,height:52,border:`1px solid rgba(255,255,255,0.18)`,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="20" height="15" fill="none" viewBox="0 0 20 15"><path d="M1 7.5 L7 13.5 L19 1" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="text-center">
              <TypeBot text={status==="sent"?t("MESSAGE DELIVERED","NACHRICHT ZUGESTELLT"):t("MAIL CLIENT OPENED","E-MAIL-PROGRAMM GEÖFFNET")} speed={30} style={{fontFamily:MN,fontSize:"16px",color:"rgba(255,255,255,0.86)",letterSpacing:"0.18em",display:"block",marginBottom:8}}/>
              <TypeBot text={status==="sent"?t("REPLY WITHIN 24H","ANTWORT INNERHALB VON 24 STD."):t("HIT SEND · REPLY WITHIN 24H","AUF SENDEN KLICKEN · ANTWORT IN 24 STD.")} delay={1.0} speed={28} style={{fontFamily:MN,fontSize:"12.5px",color:"rgba(255,255,255,0.62)",letterSpacing:"0.14em"}}/>
            </div>
          </motion.div>
        ):(
          <motion.form key="form" onSubmit={handleSubmit} exit={{opacity:0}} className="p-6 md:p-8 space-y-7">
            <div style={{fontFamily:MN,fontSize:"11.5px",color:"rgba(255,255,255,0.66)",letterSpacing:"0.12em",marginBottom:2}}>
              <span style={{color:"rgba(255,255,255,0.46)"}}>$</span> ./initiate_contact.sh --secure --priority=HIGH
            </div>
            <div className="grid md:grid-cols-2 gap-7">
              <div><label style={lbl}>PARAM: NAME *</label><input required value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} onFocus={()=>setFocused("name")} onBlur={()=>setFocused("")} style={fieldStyle("name")} placeholder="—"/></div>
              <div><label style={lbl}>PARAM: EMAIL *</label><input required type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} onFocus={()=>setFocused("email")} onBlur={()=>setFocused("")} style={fieldStyle("email")} placeholder="—"/></div>
            </div>
            <div>
              <label style={lbl}>PARAM: SUBJECT_TYPE</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {types.map(ty=>(
                  <button key={ty} type="button" onClick={()=>setForm(p=>({...p,type:ty}))} style={{fontFamily:MN,fontSize:"12px",letterSpacing:"0.1em",padding:"8px 13px",border:`1px solid ${form.type===ty?"rgba(255,255,255,0.65)":"rgba(255,255,255,0.18)"}`,color:form.type===ty?"#fff":"rgba(255,255,255,0.66)",background:form.type===ty?"rgba(255,255,255,0.1)":"transparent",transition:"all .2s",cursor:"none"}}>{ty}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={lbl}>PARAM: MESSAGE</label>
              <textarea value={form.message} onChange={e=>setForm(p=>({...p,message:e.target.value}))} onFocus={()=>setFocused("msg")} onBlur={()=>setFocused("")} rows={4} style={{display:"block",width:"100%",background:"rgba(255,255,255,0.025)",fontFamily:MN,fontSize:"16px",color:"#fff",outline:"none",resize:"none",padding:"14px",border:`1px solid ${focused==="msg"?"rgba(255,255,255,0.65)":"rgba(255,255,255,0.2)"}`,transition:"border-color .25s",letterSpacing:"0.02em",lineHeight:1.7}} placeholder={t("Describe your project or inquiry...","Beschreiben Sie Ihr Projekt oder Ihre Anfrage …")}/>
            </div>
            <div className="flex items-center justify-between pt-2" style={{borderTop:`1px solid ${BRD}`}}>
              <span style={{fontFamily:MN,fontSize:"11.5px",color:"rgba(255,255,255,0.66)",letterSpacing:"0.12em"}}>{t("DIRECT INQUIRY","DIREKTANFRAGE")}</span>
              <motion.button type="submit" whileHover={{scale:1.02}} whileTap={{scale:0.97}} disabled={status==="sending"} className="flex items-center gap-2" style={{fontFamily:MN,fontSize:"13.5px",letterSpacing:"0.15em",border:`1px solid ${status==="sending"?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.5)"}`,color:status==="sending"?"rgba(255,255,255,0.5)":"#fff",padding:"12px 24px",background:status==="sending"?"transparent":"rgba(255,255,255,0.08)",transition:"all .25s",cursor:"none"}}>
                {status==="sending"?<><span style={{animation:"termBlink 0.4s step-end infinite"}}>█</span> {t("TRANSMITTING...","SENDE …")}</>:<><span style={{opacity:0.4}}>→</span> {t("TRANSMIT","SENDEN")}<ArrowUpRight size={10}/></>}
              </motion.button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── CONTACT ────────────────────────────────────────────────────── */
export function Contact() {
  const ref=useRef<HTMLElement>(null);
  const {scrollYProgress}=useScroll({target:ref,offset:["start end","end end"]});
  const y=useTransform(scrollYProgress,[0,1],[80,0]);
  const op=useTransform(scrollYProgress,[0,0.4],[0,1]);
  return (
    <section ref={ref} id="contact" className="px-5 md:px-14 pt-24 pb-20 md:pt-36 md:pb-28 border-t" style={{borderColor:BRD,position:"relative"}}>
      <CircuitBg opacity={0.033}/><HexDotBg opacity={0.022}/>
      <HUDFrame label="06_CONTACT"/>
      <GearDecor size={280} teeth={22} speed={50} opacity={0.04} x="68%" y="-8%"/>
      <GearDecor size={150} teeth={14} speed={30} opacity={0.038} x="-3%" y="58%" reverse/>
      <div className="absolute right-6 top-16 pointer-events-none select-none" aria-hidden>
        <span style={{fontFamily:BG,fontWeight:900,fontSize:"clamp(8rem,22vw,18rem)",color:"rgba(255,255,255,0.035)",lineHeight:1,letterSpacing:"-0.055em"}}>06</span>
      </div>
      <div className="relative max-w-screen-xl mx-auto">
        <TypeBot text={t("06 / CONTACT","06 / KONTAKT")} delay={0.1} speed={28} style={{fontFamily:MN,fontSize:"11.5px",color:"rgba(255,255,255,0.64)",letterSpacing:"0.32em",display:"block",marginBottom:"3.5rem"}}/>
        <div className="grid md:grid-cols-[1fr_1.1fr] gap-16 md:gap-20 items-start">
          <motion.div style={{y,opacity:op}}>
            <h2 style={{fontFamily:BG,fontWeight:900,letterSpacing:"-0.048em",lineHeight:0.86,fontSize:"clamp(2.5rem,7vw,7rem)",marginBottom:"2rem"}}>
              <WordReveal text={t("Let's build","Lassen Sie uns")} delay={0}/><br/>
              <WordReveal text={t("something","etwas bauen,")} delay={0.12}/><br/>
              <WordReveal text={t("that moves.","das sich bewegt.")} delay={0.24} color="rgba(255,255,255,0.58)"/>
            </h2>
            <motion.p initial={{opacity:0,clipPath:"inset(0 100% 0 0)"}} whileInView={{opacity:1,clipPath:"inset(0 0% 0 0)"}} viewport={{once:false}} transition={{duration:1.1,ease:[0.22,1,0.36,1],delay:0.3}} style={{fontFamily:BODY,fontSize:"18px",color:"rgba(255,255,255,0.82)",lineHeight:1.7,maxWidth:"44ch",marginBottom:"2.5rem"}}>
              {t("I'm open to full-time roles, research collaborations, and consulting in robotics and automation. I'm always happy to talk mobile manipulators, vision-guided systems, or the best coffee in Leverkusen.","Ich bin offen für Festanstellungen, Forschungskooperationen und Beratung in Robotik und Automatisierung. Ich spreche jederzeit gern über mobile Manipulatoren, bildgestützte Systeme oder den besten Kaffee in Leverkusen.")}
            </motion.p>
            <div className="flex flex-col gap-3.5">
              {[{I:Mail,label:t("EMAIL","E-MAIL"),v:"alphinfrancis7@gmail.com",href:"mailto:alphinfrancis7@gmail.com"},{I:ExternalLink,label:t("PHONE","TELEFON"),v:"+49 176 43244722",href:"tel:+4917643244722"},{I:Linkedin,label:"LINKEDIN",v:"linkedin.com/in/alphin-francis",href:"https://www.linkedin.com/in/alphin-francis"}].map(({I,label,v,href})=>(
                <Mag key={v} str={0.1}>
                  <a href={href} className="group flex items-center gap-3" style={{textDecoration:"none"}}>
                    <div style={{width:34,height:34,border:"1px solid rgba(255,255,255,0.18)",display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,0.62)",transition:"all .22s",flexShrink:0}} className="group-hover:border-white/50 group-hover:text-white"><I size={14}/></div>
                    <div>
                      <div style={{fontFamily:MN,fontSize:"11.5px",color:"rgba(255,255,255,0.74)",letterSpacing:"0.18em",marginBottom:3}}>{label}</div>
                      <div style={{fontFamily:MN,fontSize:"15px",color:"rgba(255,255,255,0.86)",letterSpacing:"0.04em",transition:"color .22s"}} className="group-hover:text-white">{v}</div>
                    </div>
                    <ArrowUpRight size={11} style={{color:"rgba(255,255,255,0.15)",marginLeft:"auto"}} className="opacity-0 group-hover:opacity-100 transition-opacity"/>
                  </a>
                </Mag>
              ))}
            </div>
            {!SIMPLE&&<div className="mt-10 border border-white/10 bg-white/[0.015]">
              <RobotHeadCompanion/>
            </div>}
          </motion.div>
          <ContactForm/>
        </div>
      </div>
    </section>
  );
}

/* ─── FOOTER ─────────────────────────────────────────────────────── */
export function LocalClock() {
  const [t,setT]=useState("");
  useEffect(()=>{
    const f=()=>setT(new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit",second:"2-digit",timeZone:"Europe/Berlin"}));
    f();const id=setInterval(f,1000);return()=>clearInterval(id);
  },[]);
  return <span style={{fontVariantNumeric:"tabular-nums"}}>{t}</span>;
}
export function Footer() {
  const ref=useRef<HTMLElement>(null);
  const {scrollYProgress}=useScroll({target:ref,offset:["start end","end end"]});
  const nameY=useTransform(scrollYProgress,[0.35,1],["55%","0%"]);
  const navLinks:[string,string][]=[["work",t("Work","Projekte")],["lab",t("Lab","Labor")],["anatomy",t("Anatomy","Anatomie")],["about",t("About","Über mich")],["skills","Skills"],["contact",t("Contact","Kontakt")]];
  const contacts=[
    {l:t("Email","E-Mail"),v:"alphinfrancis7@gmail.com",href:"mailto:alphinfrancis7@gmail.com"},
    {l:t("Phone","Telefon"),v:"+49 176 43244722",href:"tel:+4917643244722"},
    {l:"LinkedIn",v:"in/alphin-francis",href:"https://www.linkedin.com/in/alphin-francis"},
  ];
  const head:React.CSSProperties={fontFamily:MN,fontSize:"12px",color:"rgba(0,0,0,0.55)",letterSpacing:"0.2em",marginBottom:18,paddingBottom:12,borderBottom:"1px solid rgba(0,0,0,0.1)"};
  const link="group flex items-center justify-between gap-3 py-2.5 text-black/70 transition-colors hover:text-black";
  return (
    <footer ref={ref} id="site-footer" className="relative overflow-hidden" style={{background:"#f4f2ee",color:"#0a0a0a",borderTop:"1px solid rgba(0,0,0,0.1)"}}>
      <HexDotBg opacity={0.04} dark={false}/>

      {/* CTA band */}
      <div className="relative mx-auto max-w-screen-2xl px-6 pt-20 md:px-12 md:pt-28">
        <div className="grid gap-10 border-b pb-16 md:pb-20 lg:grid-cols-[1.4fr_1fr] lg:items-end" style={{borderColor:"rgba(0,0,0,0.12)"}}>
          <div>
            <div className="mb-6 flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full" style={{background:"rgba(0,0,0,0.25)"}}/>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-black"/>
              </span>
              <span style={{fontFamily:MN,fontSize:"13px",color:"rgba(0,0,0,0.7)",letterSpacing:"0.16em"}}>{t("AVAILABLE FOR FULL-TIME ROLES · 2027","VERFÜGBAR FÜR FESTANSTELLUNG · 2027")}</span>
            </div>
            <h2 style={{fontFamily:BG,fontWeight:900,fontSize:"clamp(2.8rem,7vw,7rem)",letterSpacing:"-0.05em",lineHeight:0.86}}>
              <WordReveal text={t("Have a robot","Ein Roboter, der")}/><br/><WordReveal text={t("that needs to move?","sich bewegen soll?")} delay={0.12} color="rgba(0,0,0,0.42)"/>
            </h2>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Mag str={0.14}>
              <a href="mailto:alphinfrancis7@gmail.com" data-cur="MAIL" className="group flex items-center gap-3 rounded-full bg-black px-8 py-5 text-white transition-transform"
                style={{fontFamily:BG,fontWeight:800,fontSize:"1.1rem",textDecoration:"none"}}>
                {t("Start a conversation","Gespräch starten")} <ArrowUpRight size={18} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"/>
              </a>
            </Mag>
            <Mag str={0.1}>
              <a href={alphinCV} onClick={()=>track("CV Download",{from:"footer"})} download="Alphin-Francis-CV.pdf" className="flex items-center gap-3 rounded-full border border-black/25 px-7 py-5 text-black transition-colors hover:border-black"
                style={{fontFamily:BG,fontWeight:700,fontSize:"1.1rem",textDecoration:"none"}}>
                {t("Download CV","Lebenslauf herunterladen")}
              </a>
            </Mag>
          </div>
        </div>

        {/* columns */}
        <div className="grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-[1.1fr_0.8fr_1fr_1.1fr]">
          <div>
            <div style={head}>{t("BASED IN","STANDORT")}</div>
            <div style={{fontFamily:BG,fontWeight:800,fontSize:"1.6rem",letterSpacing:"-0.03em",lineHeight:1.1}}>Leverkusen,<br/>{t("Germany","Deutschland")}</div>
            <div className="mt-4" style={{fontFamily:MN,fontSize:"14px",color:"rgba(0,0,0,0.65)",letterSpacing:"0.06em"}}>{t("LOCAL TIME","ORTSZEIT")} · <LocalClock/></div>
            <p className="mt-5" style={{fontFamily:BODY,fontSize:"16px",lineHeight:1.65,color:"rgba(0,0,0,0.7)",maxWidth:"32ch"}}>
              {t("Robotics & automation engineer. M.Sc. at TU Dortmund, building vision-guided, commissioned systems.","Robotik- & Automatisierungsingenieur. M.Sc. an der TU Dortmund – ich baue bildgestützte, in Betrieb genommene Systeme.")}
            </p>
          </div>
          <div>
            <div style={head}>{t("NAVIGATE","NAVIGATION")}</div>
            <nav className="flex flex-col">
              {navLinks.map(([id,n])=>(
                <a key={id} href={`#${id}`} className={link} style={{fontFamily:BG,fontWeight:700,fontSize:"1.15rem",textDecoration:"none"}}>
                  {n}<ArrowUpRight size={15} className="opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5"/>
                </a>
              ))}
            </nav>
          </div>
          <div>
            <div style={head}>{t("CONTACT","KONTAKT")}</div>
            <div className="flex flex-col">
              {contacts.map(c=>(
                <a key={c.l} href={c.href} target={c.href.startsWith("http")?"_blank":undefined} rel="noreferrer" className={`${link} border-b border-black/[0.07]`} style={{textDecoration:"none"}}>
                  <span>
                    <span className="block" style={{fontFamily:MN,fontSize:"11.5px",color:"rgba(0,0,0,0.5)",letterSpacing:"0.16em"}}>{c.l.toUpperCase()}</span>
                    <span className="mt-1 block" style={{fontFamily:BODY,fontWeight:500,fontSize:"16px"}}>{c.v}</span>
                  </span>
                  <ArrowUpRight size={16} className="shrink-0 opacity-40 transition-all group-hover:opacity-100"/>
                </a>
              ))}
            </div>
          </div>
          {!SIMPLE&&<div className="flex flex-col">
            <div style={head}>AUTO CELL · PICK &amp; PLACE</div>
            <div className="relative w-full" style={{aspectRatio:"340 / 240"}}>
              <RobotArm3D variant="footer"/>
            </div>
          </div>}
        </div>
      </div>

      {/* giant name rising into view */}
      <div className="relative select-none overflow-hidden" aria-hidden>
        <motion.div className="px-4 md:px-10" style={{y:nameY,fontFamily:BG,fontWeight:900,fontSize:"clamp(4rem,19vw,26rem)",letterSpacing:"-0.055em",lineHeight:0.8,whiteSpace:"nowrap",color:"#0a0a0a"}}>
          <div>ALPHIN</div><div style={{textAlign:"right"}}>FRANCIS</div>
        </motion.div>
      </div>

      {/* bottom bar */}
      <div className="relative bg-black text-white">
        <div className="mx-auto flex max-w-screen-2xl flex-col items-start justify-between gap-4 px-6 py-6 sm:flex-row sm:items-center md:px-12">
          <span style={{fontFamily:MN,fontSize:"12.5px",color:"rgba(255,255,255,0.7)",letterSpacing:"0.1em"}}>{t("© 2026 ALPHIN FRANCIS · DESIGNED & ENGINEERED IN GERMANY","© 2026 ALPHIN FRANCIS · GESTALTET & ENTWICKELT IN DEUTSCHLAND")}</span>
          <button onClick={()=>scrollToTarget(0)} data-cur="TOP" className="group flex items-center gap-3 rounded-full border border-white/25 px-5 py-2.5 transition-colors hover:border-white hover:bg-white hover:text-black"
            style={{fontFamily:MN,fontSize:"12.5px",letterSpacing:"0.14em"}}>
            {t("BACK TO TOP","NACH OBEN")} <span className="inline-block transition-transform group-hover:-translate-y-0.5">↑</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
