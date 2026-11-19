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

import { BG, MN, BODY, ROLES, PROJECTS, TIMELINE } from "../lib";
import { GearDecor, TypeBot, HUDCorners, CircuitBg, HexDotBg } from "./fx";

/* ─── HIRE MODAL ─────────────────────────────────────────────────── */
export function HireModal({onClose}:{onClose:()=>void}) {
  const [form,setForm]=useState({name:"",email:"",type:"",message:""});
  const [status,setStatus]=useState<"idle"|"sending"|"sent"|"mailto">("idle");
  const [focused,setFocused]=useState("");
  const [clock,setClock]=useState("");
  const types=[t("FULL-TIME ROLE","FESTANSTELLUNG"),t("INTERNSHIP","PRAKTIKUM"),t("RESEARCH COLLAB","FORSCHUNGSKOOPERATION"),t("CONSULTING","BERATUNG"),t("OTHER","SONSTIGES")];

  useEffect(()=>{
    const t=()=>setClock(new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}));
    t();const id=setInterval(t,1000);return()=>clearInterval(id);
  },[]);
  useEffect(()=>{
    const fn=(e:KeyboardEvent)=>{if(e.key==="Escape")onClose();};
    window.addEventListener("keydown",fn);
    document.body.style.overflow="hidden";
    return()=>{window.removeEventListener("keydown",fn);document.body.style.overflow="";};
  },[onClose]);

  const handleSubmit=async(e:React.FormEvent)=>{e.preventDefault();if(!form.name||!form.email)return;setStatus("sending");setStatus(await sendInquiry(form));};
  const fs=(f:string):React.CSSProperties=>({display:"block",width:"100%",background:"transparent",fontFamily:MN,fontSize:"17px",color:"#fff",outline:"none",padding:"13px 0 10px",borderBottom:`1px solid ${focused===f?"rgba(255,255,255,0.7)":"rgba(255,255,255,0.22)"}`,transition:"border-color .25s",letterSpacing:"0.03em"});
  const lbl:React.CSSProperties={fontFamily:MN,fontSize:"12.5px",color:"rgba(255,255,255,0.68)",letterSpacing:"0.2em",display:"block",marginBottom:8};

  return (
    <motion.div
      initial={{clipPath:"inset(50% 0 50% 0)"}}
      animate={{clipPath:"inset(0% 0 0% 0)"}}
      exit={{clipPath:"inset(50% 0 50% 0)"}}
      transition={{duration:0.78,ease:[0.22,1,0.36,1]}}
      data-lenis-prevent=""
      style={{position:"fixed",inset:0,zIndex:9990,background:"#050505",display:"flex",flexDirection:"column",overflow:"hidden"}}>

      {/* Bg decoration */}
      <CircuitBg opacity={0.035}/><HexDotBg opacity={0.018}/>
      <GearDecor size={700} teeth={36} speed={90} opacity={0.018} x="-14%" y="-20%"/>
      <GearDecor size={320} teeth={22} speed={55} opacity={0.025} x="76%" y="52%" reverse/>
      {/* Diagonal grid lines */}
      <div style={{position:"absolute",inset:0,pointerEvents:"none",backgroundImage:"repeating-linear-gradient(60deg,rgba(255,255,255,0.012) 0px,rgba(255,255,255,0.012) 1px,transparent 1px,transparent 60px)",zIndex:0}}/>
      {/* Moving scan line */}
      <motion.div style={{position:"absolute",left:0,right:0,height:1,pointerEvents:"none",zIndex:2,background:"linear-gradient(to right,transparent,rgba(255,255,255,0.04),transparent)"}} animate={{top:["-1%","101%"]}} transition={{duration:6,repeat:Infinity,repeatDelay:8,ease:"linear"}}/>

      {/* ── Top bar ── */}
      <motion.div initial={{opacity:0,y:-12}} animate={{opacity:1,y:0}} transition={{delay:0.5,duration:0.6}}
        style={{position:"relative",zIndex:10,display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"22px clamp(1.5rem,4.5vw,4rem)",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontFamily:MN,fontSize:"11.5px",color:"rgba(255,255,255,0.66)",letterSpacing:"0.3em"}}>SYS</span>
          <div style={{width:1,height:12,background:"rgba(255,255,255,0.1)"}}/>
          <TypeBot text={t("CONTACT REQUEST","KONTAKTANFRAGE")} speed={26} style={{fontFamily:MN,fontSize:"11.5px",color:"rgba(255,255,255,0.62)",letterSpacing:"0.2em"}}/>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:18}}>
          <span className="hidden sm:block" style={{fontFamily:MN,fontSize:"11.5px",color:"rgba(255,255,255,0.64)",letterSpacing:"0.16em"}}>{clock}</span>
          <motion.button onClick={onClose} whileHover={{scale:1.03}} whileTap={{scale:0.96}}
            style={{fontFamily:MN,fontSize:"12.5px",letterSpacing:"0.18em",border:"1px solid rgba(255,255,255,0.28)",
              color:"rgba(255,255,255,0.78)",padding:"10px 20px",background:"transparent",cursor:"none",
              display:"flex",alignItems:"center",gap:9,transition:"border-color .2s,color .2s"}}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor="rgba(255,255,255,0.5)";(e.currentTarget as HTMLElement).style.color="#fff";}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor="rgba(255,255,255,0.28)";(e.currentTarget as HTMLElement).style.color="rgba(255,255,255,0.78)";}}>
            ESC <span style={{opacity:0.4}}>/</span> {t("CLOSE","SCHLIESSEN")} ✕
          </motion.button>
        </div>
      </motion.div>

      {/* ── Body ── */}
      <div style={{flex:1,display:"flex",overflow:"hidden",position:"relative",zIndex:5}}>

        {/* LEFT PANEL */}
        <motion.div initial={{opacity:0,x:-50}} animate={{opacity:1,x:0}} transition={{delay:0.55,duration:0.85,ease:[0.22,1,0.36,1]}}
          className="hidden md:flex flex-col justify-between"
          style={{width:"42%",flexShrink:0,padding:"clamp(2.5rem,5vh,4.5rem) clamp(1.5rem,4.5vw,4rem)",
            borderRight:"1px solid rgba(255,255,255,0.05)",position:"relative",overflow:"hidden"}}>
          <HUDCorners lCol="rgba(255,255,255,0.2)" size={18}/>

          {/* Top: display type */}
          <div>
            <div style={{fontFamily:MN,fontSize:"11.5px",color:"rgba(255,255,255,0.68)",letterSpacing:"0.3em",marginBottom:"2.2rem"}}>{t("01 / INITIATE CONTACT","01 / KONTAKT AUFNEHMEN")}</div>
            <h2 style={{fontFamily:BG,fontWeight:900,fontSize:"clamp(5rem,8.5vw,9.5rem)",letterSpacing:"-0.055em",lineHeight:0.8,marginBottom:"2.8rem"}}>
              {t("LET'S","JETZT")}<br/><span style={{color:"rgba(255,255,255,0.50)"}}>{t("BUILD.","STARTEN.")}</span>
            </h2>
            <motion.div initial={{scaleX:0}} animate={{scaleX:1}} transition={{delay:1.0,duration:1.1,ease:[0.22,1,0.36,1]}} style={{width:56,height:1,background:"rgba(255,255,255,0.22)",originX:0,marginBottom:"2rem"}}/>
            <p style={{fontFamily:BODY,fontSize:"17px",color:"rgba(255,255,255,0.78)",lineHeight:1.7,maxWidth:"40ch"}}>
              {t("I'm open to full-time roles in industrial robotics and automation. I'm currently finishing my M.Sc. at TU Dortmund and will be available from 2027.","Ich suche eine Festanstellung in der industriellen Robotik und Automatisierung. Derzeit schließe ich meinen M.Sc. an der TU Dortmund ab und bin ab 2027 verfügbar.")}
            </p>
          </div>

          {/* Middle: status rows */}
          <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",gap:0,padding:"2rem 0"}}>
            {[
              {k:t("AVAILABILITY","VERFÜGBARKEIT"),v:t("From 2027","Ab 2027"),green:true},
              {k:t("LOCATION","STANDORT"),v:t("Leverkusen, Germany","Leverkusen, Deutschland")},
              {k:t("RESPONSE","ANTWORT"),v:t("< 24 hours","< 24 Stunden")},
              {k:t("LANGUAGES","SPRACHEN"),v:t("English C1 · Deutsch B1","Englisch C1 · Deutsch B1")},
              {k:t("EMAIL","E-MAIL"),v:"alphinfrancis7@gmail.com"},
            ].map(({k,v,green},i)=>(
              <motion.div key={k} initial={{opacity:0,x:-18}} animate={{opacity:1,x:0}} transition={{delay:0.72+i*0.07,ease:[0.22,1,0.36,1]}}
                style={{display:"flex",alignItems:"center",gap:16,padding:"13px 0",borderBottom:"1px solid rgba(255,255,255,0.045)"}}>
                <span style={{fontFamily:MN,fontSize:"11.5px",color:"rgba(255,255,255,0.70)",letterSpacing:"0.18em",minWidth:112,flexShrink:0}}>{k}</span>
                {green&&<span style={{width:5,height:5,borderRadius:"50%",background:"rgba(255,255,255,0.72)",flexShrink:0}}/>}
                <span style={{fontFamily:green?BG:MN,fontWeight:green?700:400,fontSize:green?"1.12rem":"12px",color:green?"#fff":"rgba(255,255,255,0.76)",letterSpacing:green?"-0.015em":"0.03em"}}>{v}</span>
              </motion.div>
            ))}
          </div>

          {/* Bottom: LinkedIn */}
          <motion.a href="https://www.linkedin.com/in/alphin-francis" target="_blank" rel="noreferrer"
            initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.15}} whileHover={{scale:1.02}}
            style={{display:"inline-flex",alignItems:"center",gap:10,fontFamily:MN,fontSize:"12.5px",
              letterSpacing:"0.14em",color:"rgba(255,255,255,0.72)",border:"1px solid rgba(255,255,255,0.22)",
              padding:"12px 20px",textDecoration:"none",width:"fit-content",transition:"border-color .22s,color .22s"}}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor="rgba(255,255,255,0.38)";(e.currentTarget as HTMLElement).style.color="#fff";}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor="rgba(255,255,255,0.22)";(e.currentTarget as HTMLElement).style.color="rgba(255,255,255,0.72)";}}>
            <Linkedin size={11}/> {t("VIEW LINKEDIN PROFILE","LINKEDIN-PROFIL ANSEHEN")} <ArrowUpRight size={11}/>
          </motion.a>
        </motion.div>

        {/* RIGHT PANEL — form */}
        <motion.div initial={{opacity:0,x:50}} animate={{opacity:1,x:0}} transition={{delay:0.6,duration:0.85,ease:[0.22,1,0.36,1]}}
          style={{flex:1,display:"flex",flexDirection:"column",padding:"clamp(2.5rem,5vh,4.5rem) clamp(1.5rem,4.5vw,4rem)",overflow:"auto"}}>

          {/* Terminal header */}
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:"2.5rem",paddingBottom:16,borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
            <div style={{display:"flex",gap:6}}>{[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:`rgba(255,255,255,${0.06+i*0.04})`}}/>)}</div>
            <span style={{fontFamily:MN,fontSize:"12.5px",color:"rgba(255,255,255,0.62)",letterSpacing:"0.18em"}}>{t("PROJECT INQUIRY","PROJEKTANFRAGE")}</span>
            <span style={{marginLeft:"auto",fontFamily:MN,fontSize:"11.5px",color:"rgba(255,255,255,0.58)",letterSpacing:"0.12em"}}>{t("REQUIRED FIELDS *","PFLICHTFELDER *")}</span>
          </div>

          <AnimatePresence mode="wait">
            {status==="sent"||status==="mailto"?(
              <motion.div key="sent" initial={{opacity:0,scale:0.94}} animate={{opacity:1,scale:1}} exit={{opacity:0}}
                style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:32,textAlign:"center"}}>
                <div style={{position:"relative",width:88,height:88}}>
                  <svg viewBox="0 0 88 88" style={{position:"absolute",inset:0,width:"100%",height:"100%"}}>
                    <circle cx="44" cy="44" r="40" stroke="rgba(255,255,255,0.07)" strokeWidth="1" fill="none"/>
                    <motion.circle cx="44" cy="44" r="40" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" fill="none"
                      strokeDasharray="251" strokeDashoffset="251"
                      animate={{strokeDashoffset:0}} transition={{duration:1.3,ease:[0.22,1,0.36,1]}}/>
                  </svg>
                  <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <motion.svg width="26" height="20" viewBox="0 0 26 20">
                      <motion.path d="M1 10 L9 18 L25 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"
                        initial={{pathLength:0}} animate={{pathLength:1}} transition={{delay:0.9,duration:0.75}}/>
                    </motion.svg>
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  <TypeBot text={status==="sent"?t("MESSAGE DELIVERED","NACHRICHT ZUGESTELLT"):t("MAIL CLIENT OPENED","E-MAIL-PROGRAMM GEÖFFNET")} speed={28} style={{fontFamily:MN,fontSize:"17px",color:"rgba(255,255,255,0.9)",letterSpacing:"0.18em",display:"block"}}/>
                  <TypeBot text={status==="sent"?t("REPLY WITHIN 24H","ANTWORT INNERHALB VON 24 STD."):t("HIT SEND · REPLY WITHIN 24H","AUF SENDEN KLICKEN · ANTWORT IN 24 STD.")} delay={1.1} speed={24} style={{fontFamily:MN,fontSize:"13.5px",color:"rgba(255,255,255,0.64)",letterSpacing:"0.14em"}}/>
                </div>
                <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:2.4}} style={{fontFamily:BG,fontWeight:600,fontSize:"1.15rem",color:"rgba(255,255,255,0.62)",letterSpacing:"-0.01em"}}>
                  {status==="sent"?t("I'll be in touch shortly.","Ich melde mich in Kürze."):t("Just press send in your email app.","Klicken Sie in Ihrem E-Mail-Programm einfach auf Senden.")}
                </motion.p>
              </motion.div>
            ):(
              <motion.form key="form" onSubmit={handleSubmit} exit={{opacity:0}} style={{flex:1,display:"flex",flexDirection:"column",gap:28}}>
                <div style={{fontFamily:MN,fontSize:"11.5px",color:"rgba(255,255,255,0.68)",letterSpacing:"0.12em"}}>
                  <span style={{color:"rgba(255,255,255,0.72)"}}>$</span> {t("Tell me what you would like to build.","Erzählen Sie mir, was Sie bauen möchten.")}
                </div>
                <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">
                  <div>
                    <label style={lbl}>--NAME *</label>
                    <input required value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} onFocus={()=>setFocused("name")} onBlur={()=>setFocused("")} style={fs("name")} placeholder={t("Full name","Vollständiger Name")}/>
                  </div>
                  <div>
                    <label style={lbl}>--EMAIL *</label>
                    <input required type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} onFocus={()=>setFocused("email")} onBlur={()=>setFocused("")} style={fs("email")} placeholder="your@email.com"/>
                  </div>
                </div>
                <div>
                  <label style={lbl}>--SUBJECT_TYPE</label>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:4}}>
                    {types.map(t=>(
                      <motion.button key={t} type="button" onClick={()=>setForm(p=>({...p,type:t}))}
                        animate={{backgroundColor:form.type===t?"rgba(255,255,255,0.12)":"rgba(255,255,255,0)",borderColor:form.type===t?"rgba(255,255,255,0.65)":"rgba(255,255,255,0.22)",color:form.type===t?"#fff":"rgba(255,255,255,0.68)"}}
                        transition={{duration:0.18}}
                        style={{fontFamily:MN,fontSize:"12.5px",letterSpacing:"0.1em",padding:"10px 16px",border:"1px solid",cursor:"none"}}>
                        {t}
                      </motion.button>
                    ))}
                  </div>
                </div>
                <div style={{flex:1}}>
                  <label style={lbl}>--MESSAGE</label>
                  <textarea value={form.message} onChange={e=>setForm(p=>({...p,message:e.target.value}))} onFocus={()=>setFocused("msg")} onBlur={()=>setFocused("")} rows={6}
                    style={{display:"block",width:"100%",background:"rgba(255,255,255,0.035)",fontFamily:MN,fontSize:"16px",color:"#fff",outline:"none",resize:"none",
                      padding:"14px 16px",letterSpacing:"0.03em",lineHeight:1.9,
                      border:`1px solid ${focused==="msg"?"rgba(255,255,255,0.68)":"rgba(255,255,255,0.2)"}`,transition:"border-color .25s"}}
                    placeholder={t("Describe your project, role, or inquiry...","Beschreiben Sie Ihr Projekt, die Stelle oder Ihre Anfrage …")}/>
                </div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:18,borderTop:"1px solid rgba(255,255,255,0.05)"}}>
                  <span style={{fontFamily:MN,fontSize:"11.5px",color:"rgba(255,255,255,0.66)",letterSpacing:"0.12em"}}>{t("DIRECT INQUIRY","DIREKTANFRAGE")}</span>
                  <motion.button type="submit" whileHover={{scale:1.02}} whileTap={{scale:0.97}} disabled={status==="sending"}
                    style={{fontFamily:MN,fontSize:"14px",letterSpacing:"0.2em",
                      background:status==="sending"?"transparent":"#fff",
                      color:status==="sending"?"rgba(255,255,255,0.25)":"#080808",
                      border:`1px solid ${status==="sending"?"rgba(255,255,255,0.12)":"#fff"}`,
                      padding:"15px 40px",cursor:"none",display:"flex",alignItems:"center",gap:10,transition:"all .25s"}}>
                    {status==="sending"
                      ?<><span style={{animation:"termBlink 0.4s step-end infinite"}}>█</span> {t("TRANSMITTING...","SENDE …")}</>
                      :<>{t("TRANSMIT","SENDEN")} <ArrowUpRight size={13}/></>}
                  </motion.button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Bottom accent */}
      <div style={{height:1,background:"linear-gradient(to right,transparent,rgba(255,255,255,0.07),transparent)",position:"relative",zIndex:5}}/>
    </motion.div>
  );
}

/* ─── CV VIEWER ──────────────────────────────────────────────────── */
export function CVViewer({onClose}:{onClose:()=>void}) {
  useEffect(()=>{
    const key=(event:KeyboardEvent)=>{if(event.key==="Escape")onClose();};
    window.addEventListener("keydown",key);document.body.style.overflow="hidden";
    return()=>{window.removeEventListener("keydown",key);document.body.style.overflow="";};
  },[onClose]);
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[9992] flex flex-col bg-[#080808]" data-lenis-prevent="">
      <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-10">
        <div>
          <div style={{fontFamily:MN,fontSize:"11.5px",color:"rgba(255,255,255,0.66)",letterSpacing:"0.2em"}}>{t("DOCUMENT / CURRICULUM VITAE","DOKUMENT / LEBENSLAUF")}</div>
          <div className="mt-1" style={{fontFamily:BG,fontWeight:850,fontSize:"1.2rem"}}>Alphin Francis</div>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <a href={alphinCV} onClick={()=>track("CV Download",{from:"viewer"})} download="Alphin-Francis-CV.pdf" className="flex flex-1 items-center justify-center gap-2 border border-white/25 px-4 py-2.5 text-white transition-colors hover:bg-white hover:text-black sm:flex-none"
            style={{fontFamily:MN,fontSize:"11.5px",letterSpacing:"0.14em",textDecoration:"none"}}>
            {t("DOWNLOAD PDF","PDF HERUNTERLADEN")}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v7m0 0 2.4-2.4M6 8 3.6 5.6M1.5 10.5h9" stroke="currentColor"/></svg>
          </a>
          <button onClick={onClose} className="flex-1 border border-white/15 px-4 py-2.5 text-white/70 hover:border-white/40 hover:text-white sm:flex-none" style={{fontFamily:MN,fontSize:"11.5px",letterSpacing:"0.14em"}}>{t("CLOSE","SCHLIESSEN")}</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto bg-[#171717] px-3 py-6 md:px-8 md:py-10">
        <div className="mx-auto flex max-w-[920px] flex-col gap-6">
          {[alphinCVPage1,alphinCVPage2].map((page,i)=>(
            <div key={page} className="relative bg-white shadow-2xl">
              <div className="absolute right-3 top-3 z-10 bg-black/75 px-2 py-1 text-white" style={{fontFamily:MN,fontSize:"11.5px",letterSpacing:"0.12em"}}>{t("PAGE","SEITE")} {i+1} / 2</div>
              <img src={page} alt={`My CV page ${i+1}`} className="block h-auto w-full"/>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── RECRUITER MODE ─────────────────────────────────────────────── */
export function RecruiterMode({onClose,onViewCV}:{onClose:()=>void;onViewCV:()=>void}) {
  useEffect(()=>{
    const key=(event:KeyboardEvent)=>{if(event.key==="Escape")onClose();};
    window.addEventListener("keydown",key);document.body.style.overflow="hidden";
    return()=>{window.removeEventListener("keydown",key);document.body.style.overflow="";};
  },[onClose]);
  const strengths=[
    [t("ROBOT PLATFORMS","ROBOTERPLATTFORMEN"),"UR10 · UR20 · Stäubli TX2-140"],
    [t("VISION","BILDVERARBEITUNG"),"RealSense · CubeEye · SensoPart · OpenCV · Open3D"],
    ["SIMULATION","ROS · Gazebo · RViz · RoboDK · Robotics Suite"],
    [t("PROGRAMMING","PROGRAMMIERUNG"),"Python · C++ · MATLAB · URScript · VAL3"],
  ];
  return (
    <motion.div initial={{clipPath:"inset(0 0 100% 0)"}} animate={{clipPath:"inset(0)"}} exit={{clipPath:"inset(0 0 100% 0)"}} transition={{duration:0.65,ease:[0.22,1,0.36,1]}}
      className="fixed inset-0 z-[9991] overflow-y-auto bg-[#eeeae3] text-[#0a0a0a]" data-lenis-prevent="">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/10 bg-[#eeeae3]/95 px-5 py-4 backdrop-blur-xl md:px-10">
        <span style={{fontFamily:MN,fontSize:"12.5px",letterSpacing:"0.18em",color:"rgba(0,0,0,0.68)"}}>{t("RECRUITER MODE / PROFESSIONAL DOSSIER","RECRUITER-MODUS / PROFIL-DOSSIER")}</span>
        <button onClick={onClose} className="border border-black/25 px-5 py-3" style={{fontFamily:MN,fontSize:"12.5px",letterSpacing:"0.12em"}}>{t("EXIT MODE","MODUS BEENDEN")}</button>
      </div>
      <div className="mx-auto max-w-screen-2xl px-6 py-16 md:px-14 md:py-24">
        <div className="grid gap-12 border-b border-black/15 pb-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <div className="mb-5 flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-black"/><span style={{fontFamily:MN,fontSize:"12.5px",letterSpacing:"0.16em",color:"rgba(0,0,0,0.64)"}}>{t("AVAILABLE FOR FULL-TIME ROLES FROM 2027","VERFÜGBAR FÜR FESTANSTELLUNG AB 2027")}</span></div>
            <h2 style={{fontFamily:BG,fontWeight:900,fontSize:"clamp(4.2rem,9.5vw,10rem)",letterSpacing:"-0.062em",lineHeight:0.76}}>ALPHIN<br/>FRANCIS.</h2>
          </div>
          <div>
            <p style={{fontFamily:BG,fontWeight:750,fontSize:"clamp(1.55rem,3vw,2.4rem)",letterSpacing:"-0.032em",lineHeight:1.2}}>{t("Robotics & Automation Engineer building vision-guided, simulated, commissioned systems.","Robotik- & Automatisierungsingenieur für bildgestützte, simulierte und in Betrieb genommene Systeme.")}</p>
            <p className="mt-6" style={{fontFamily:BODY,fontSize:"17px",lineHeight:1.75,color:"rgba(0,0,0,0.74)"}}>{t("I'm completing my M.Sc. in Automation & Robotics at TU Dortmund and have industry experience at Invite GmbH and Fraunhofer IWU. My hands-on work spans mobile manipulation, Universal Robots, Stäubli programming, perception hardware, robot simulation, validation, troubleshooting, and technical handover.","Ich schließe meinen M.Sc. in Automation & Robotics an der TU Dortmund ab und habe Industrieerfahrung bei der Invite GmbH und am Fraunhofer IWU. Meine praktische Arbeit umfasst mobile Manipulation, Universal Robots, Stäubli-Programmierung, Sensorhardware, Robotersimulation, Validierung, Fehlersuche und technische Übergabe.")}</p>
            <div className="mt-7 flex flex-wrap gap-2">
              <button onClick={onViewCV} className="bg-black px-5 py-3 text-white" style={{fontFamily:MN,fontSize:"12.5px",letterSpacing:"0.14em"}}>{t("VIEW CV","LEBENSLAUF ANSEHEN")}</button>
              <a href={alphinCV} onClick={()=>track("CV Download",{from:"recruiter"})} download="Alphin-Francis-CV.pdf" className="border border-black/20 px-5 py-3" style={{fontFamily:MN,fontSize:"12.5px",letterSpacing:"0.14em",textDecoration:"none",color:"#0a0a0a"}}>{t("DOWNLOAD CV","LEBENSLAUF HERUNTERLADEN")}</a>
              <a href="mailto:alphinfrancis7@gmail.com" className="border border-black/20 px-5 py-3" style={{fontFamily:MN,fontSize:"12.5px",letterSpacing:"0.14em",textDecoration:"none",color:"#0a0a0a"}}>{t("EMAIL ALPHIN","E-MAIL AN ALPHIN")}</a>
            </div>
          </div>
        </div>

        <div className="grid border-l border-t border-black/12 md:grid-cols-2">
          {strengths.map(([label,value],i)=><motion.div key={label} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.3+i*0.06}} className="min-h-[190px] border-b border-r border-black/12 p-8 md:p-10"><div style={{fontFamily:MN,fontSize:"12.5px",letterSpacing:"0.15em",color:"rgba(0,0,0,0.70)"}}>{label}</div><div className="mt-6" style={{fontFamily:BG,fontWeight:850,fontSize:"clamp(1.45rem,2.5vw,2.15rem)",letterSpacing:"-0.03em",lineHeight:1.08}}>{value}</div></motion.div>)}
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
          <div><div style={{fontFamily:MN,fontSize:"11.5px",letterSpacing:"0.2em",color:"rgba(0,0,0,0.64)"}}>{t("EXPERIENCE SNAPSHOT","ERFAHRUNG IM ÜBERBLICK")}</div><h3 className="mt-5" style={{fontFamily:BG,fontWeight:900,fontSize:"clamp(2.5rem,5vw,5rem)",letterSpacing:"-0.05em",lineHeight:0.9}}>{t("FROM LAB","VOM LABOR")}<br/>{t("TO CELL.","IN DIE ZELLE.")}</h3></div>
          <div className="border-t border-black/15">
            {TIMELINE.map(item=><div key={item.year} className="grid gap-4 border-b border-black/15 py-8 md:grid-cols-[140px_1fr]"><span style={{fontFamily:MN,fontSize:"13.5px",color:"rgba(0,0,0,0.70)"}}>{item.year}</span><div><div style={{fontFamily:BG,fontWeight:850,fontSize:"1.6rem",letterSpacing:"-0.025em"}}>{item.role}</div><div className="mt-2" style={{fontFamily:MN,fontSize:"13.5px",color:"rgba(0,0,0,0.62)",letterSpacing:"0.07em"}}>{item.org}</div><p className="mt-5" style={{fontFamily:BODY,fontSize:"16.5px",lineHeight:1.8,color:"rgba(0,0,0,0.7)",maxWidth:"90ch"}}>{item.detail}</p></div></div>)}
          </div>
        </div>

        <div className="mt-20 border-t border-black/15 pt-10">
          <div className="mb-9 flex items-end justify-between gap-6">
            <div><div style={{fontFamily:MN,fontSize:"12.5px",letterSpacing:"0.18em",color:"rgba(0,0,0,0.70)"}}>{t("SELECTED PROJECT EVIDENCE","AUSGEWÄHLTE PROJEKTE")}</div><h3 className="mt-4" style={{fontFamily:BG,fontWeight:900,fontSize:"clamp(2.6rem,5vw,5.5rem)",letterSpacing:"-0.052em",lineHeight:0.88}}>{t("WHAT I","WAS ICH")}<br/>{t("HAVE BUILT.","GEBAUT HABE.")}</h3></div>
            <span className="hidden md:block" style={{fontFamily:MN,fontSize:"12.5px",color:"rgba(0,0,0,0.64)",letterSpacing:"0.12em"}}>{t("REAL CV PROJECTS / 05","PROJEKTE AUS DEM LEBENSLAUF / 05")}</span>
          </div>
          <div className="grid border-l border-t border-black/15 lg:grid-cols-3">
            {PROJECTS.slice(1,4).map((project,i)=><motion.article key={project.num} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.45+i*0.08}} className="flex min-h-[330px] flex-col justify-between border-b border-r border-black/15 p-8">
              <div><div className="flex justify-between"><span style={{fontFamily:MN,fontSize:"12.5px",color:"rgba(0,0,0,0.66)",letterSpacing:"0.14em"}}>{project.num} / {t("PROJECT","PROJEKT")}</span><span style={{fontFamily:MN,fontSize:"11.5px",color:"rgba(0,0,0,0.59)"}}>{project.year}</span></div><h4 className="mt-10" style={{fontFamily:BG,fontWeight:900,fontSize:"clamp(1.8rem,2.8vw,2.7rem)",letterSpacing:"-0.04em",lineHeight:0.95}}>{project.title}</h4><p className="mt-5" style={{fontFamily:BODY,fontSize:"16.5px",lineHeight:1.75,color:"rgba(0,0,0,0.66)"}}>{project.desc}</p></div>
              <div className="mt-8 flex flex-wrap gap-2">{project.tags.map(tag=><span key={tag} className="border border-black/15 px-2.5 py-1" style={{fontFamily:MN,fontSize:"11.5px",color:"rgba(0,0,0,0.72)"}}>{tag}</span>)}</div>
            </motion.article>)}
          </div>
        </div>

        <div className="mt-20 grid gap-12 border-t border-black/15 pt-10 lg:grid-cols-2">
          <div><div style={{fontFamily:MN,fontSize:"12.5px",letterSpacing:"0.18em",color:"rgba(0,0,0,0.70)"}}>{t("EDUCATION","AUSBILDUNG")}</div><div className="mt-7 space-y-7">{TIMELINE.slice(2).map(item=><div key={item.year} className="border-l border-black/20 pl-5"><div style={{fontFamily:BG,fontWeight:850,fontSize:"1.5rem"}}>{item.role}</div><div className="mt-2" style={{fontFamily:MN,fontSize:"13.5px",color:"rgba(0,0,0,0.62)"}}>{item.org} · {item.year}</div></div>)}</div></div>
          <div><div style={{fontFamily:MN,fontSize:"12.5px",letterSpacing:"0.18em",color:"rgba(0,0,0,0.70)"}}>{t("LANGUAGES & WORKING PROFILE","SPRACHEN & PROFIL")}</div><div className="mt-7 grid grid-cols-2 border-l border-t border-black/15">{[[t("ENGLISH","ENGLISCH"),"C1"],[t("GERMAN","DEUTSCH"),"B1"],[t("LOCATION","STANDORT"),"LEVERKUSEN"],[t("AVAILABILITY","VERFÜGBAR"),"2027"]].map(([label,value])=><div key={label} className="border-b border-r border-black/15 p-6"><div style={{fontFamily:MN,fontSize:"11.5px",color:"rgba(0,0,0,0.64)"}}>{label}</div><div className="mt-3" style={{fontFamily:BG,fontWeight:900,fontSize:"1.65rem"}}>{value}</div></div>)}</div></div>
        </div>
      </div>
    </motion.div>
  );
}
