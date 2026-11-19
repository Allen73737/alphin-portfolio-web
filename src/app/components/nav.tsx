import { useState, useEffect, useRef, useCallback } from "react";
import {
  motion, useScroll, useTransform, useSpring,
  useMotionValue, useInView, AnimatePresence, useMotionTemplate,
  type MotionValue,
} from "motion/react";
import Lenis from "lenis";
import { t, getLang, setLang, type Lang } from "../i18n";
import { ArrowUpRight, Github, Linkedin, Mail, ExternalLink } from "lucide-react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import alphinPhoto from "@/imports/Picture3.png";
import alphinCV from "@/imports/AlphinFrancis.pdf";
import alphinCVPage1 from "@/imports/AlphinFrancis-page-1.png";
import alphinCVPage2 from "@/imports/AlphinFrancis-page-2.png";
import { type V3, type Face, type Cam, m3T, m3Ry, m3Rx, m3Rz, m3Mul, m3P, v3Sub, v3Dot, v3Norm, addBox, addCyl, makeCam, proj, runCanvas } from "@/app/components/robot3d/engine";
import { Preloader3D, RobotShowcase, RobotHeadCompanion } from "@/app/components/robot3d/robots";

import { BG, MN } from "../lib";
import { GearDecor, HUDCorners, CircuitBg } from "./fx";
import { About, Skills } from "./sections";
import { Contact } from "./contact";

/* ─── ROBOTIC NAVBAR ─────────────────────────────────────────────── */
/* ─── NAV LINK ───────────────────────────────────────────────────── */
export function NavLink({id,n,idx,active,lm}:{id:string;n:string;idx:number;active:boolean;lm:boolean}) {
  const [hov,setHov]=useState(false);
  const on=active||hov;
  const hi=lm?"#0a0a0a":"#fff";
  const lo=lm?"rgba(0,0,0,0.6)":"rgba(255,255,255,0.62)";
  return (
    <a href={`#${id}`} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{textDecoration:"none",position:"relative",display:"flex",flexDirection:"column",alignItems:"flex-start",gap:6,padding:"12px 0 14px"}}>
      {/* index */}
      <span style={{fontFamily:MN,fontSize:"12.5px",letterSpacing:"0.2em",lineHeight:1,
        color:on?(lm?"rgba(0,0,0,0.6)":"rgba(255,255,255,0.6)"):(lm?"rgba(0,0,0,0.35)":"rgba(255,255,255,0.35)"),
        transition:"color .22s"}}>
        {String(idx+1).padStart(2,"0")}
      </span>
      {/* name */}
      <span style={{fontFamily:BG,fontSize:"clamp(17px,1.35vw,20px)",letterSpacing:"-0.01em",
        color:on?hi:lo,transition:"color .22s",lineHeight:1,fontWeight:active?800:600}}>
        {n}
      </span>
      {/* bottom indicator */}
      <motion.span style={{position:"absolute",bottom:0,left:0,right:0,height:"1.5px",
        background:hi,originX:0,borderRadius:1}}
        animate={{scaleX:on?1:0}} transition={{duration:0.3,ease:[0.22,1,0.36,1]}}/>
    </a>
  );
}

/* ─── NAV ────────────────────────────────────────────────────────── */
/* EN | DE segmented switch + simple-mode toggle, shared by desktop bar and mobile menu */
function SiteControls({lm,simple,onToggleSimple}:{lm:boolean;simple:boolean;onToggleSimple:()=>void}) {
  const lang=getLang();
  const ink=lm?"0,0,0":"255,255,255";
  const seg=(l:Lang)=>(
    <button key={l} onClick={()=>setLang(l)} aria-pressed={lang===l} aria-label={l==="en"?"English":"Deutsch"}
      style={{fontFamily:MN,fontSize:"12.5px",letterSpacing:"0.1em",padding:"8px 11px",borderRadius:99,border:"none",cursor:"none",
        background:lang===l?`rgb(${ink})`:"transparent",color:lang===l?(lm?"#fff":"#0a0a0a"):`rgba(${ink},0.7)`,transition:"background .2s,color .2s"}}>
      {l.toUpperCase()}
    </button>
  );
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center rounded-full p-1" style={{border:`1px solid rgba(${ink},0.18)`}}>{seg("en")}{seg("de")}</div>
      <button onClick={onToggleSimple} aria-pressed={simple}
        title={t("Simple mode: normal cursor, fewer animations","Einfacher Modus: normaler Cursor, weniger Animationen")}
        style={{fontFamily:MN,fontSize:"12.5px",letterSpacing:"0.08em",padding:"9px 13px",borderRadius:99,cursor:"none",
          border:`1px solid rgba(${ink},${simple?0.7:0.18})`,background:simple?`rgba(${ink},0.1)`:"transparent",color:`rgba(${ink},0.85)`}}>
        {simple?"◉":"○"} {t("SIMPLE","EINFACH")}
      </button>
    </div>
  );
}

export function Nav({onHireClick,onRecruiterClick,simple,onToggleSimple}:{onHireClick:()=>void;onRecruiterClick:()=>void;simple:boolean;onToggleSimple:()=>void}) {
  const [open,setOpen]=useState(false);
  const [scrolled,setScrolled]=useState(false);
  const [lightMode,setLightMode]=useState(false);
  const [activeSection,setActiveSection]=useState("home");
  const [mounted,setMounted]=useState(false);

  useEffect(()=>{setMounted(true);},[]);

  useEffect(()=>{
    const check=()=>{
      setScrolled(window.scrollY>24);
      let lm=false;
      ["lab","about","site-footer"].forEach(sid=>{
        const el=document.getElementById(sid);
        if(el){const r=el.getBoundingClientRect();if(r.top<=100&&r.bottom>=0)lm=true;}
      });
      setLightMode(lm);
      const secs=["home","work","lab","about","skills","contact"];
      for(const s of secs){
        const el=document.getElementById(s);
        if(el){const r=el.getBoundingClientRect();if(r.top<=170&&r.bottom>=0){setActiveSection(s);break;}}
      }
    };
    let raf=0;
    const onScroll=()=>{if(!raf)raf=requestAnimationFrame(()=>{raf=0;check();});};
    window.addEventListener("scroll",onScroll,{passive:true});check();
    return()=>{cancelAnimationFrame(raf);window.removeEventListener("scroll",onScroll);};
  },[]);

  const lm=lightMode;
  const lCol=lm?"#0a0a0a":"#fff";
  const bg=scrolled?(lm?"rgba(236,232,225,0.97)":"rgba(5,5,5,0.96)"):"rgba(0,0,0,0)";
  const links:[string,string][]=[["work",t("Work","Projekte")],["lab",t("Lab","Labor")],["about",t("About","Über mich")],["skills","Skills"],["contact",t("Contact","Kontakt")]];

  /* CTA button style — solid/filled (inverted from page) */
  const ctaBg=lm?"#0a0a0a":"#fff";
  const ctaCol=lm?"#fff":"#0a0a0a";
  const ctaBgHov=lm?"rgba(0,0,0,0.82)":"rgba(255,255,255,0.88)";

  return (
    <>
      <motion.header
        initial={{opacity:0}} animate={{opacity:mounted?1:0}} transition={{duration:0.5}}
        style={{position:"fixed",top:0,left:0,right:0,zIndex:50,
          backdropFilter:scrolled?"blur(36px) saturate(2)":"none",
          background:bg,
          transition:"background .45s,backdrop-filter .45s"}}>

        {/* Permanent 1px top accent line */}
        <div style={{position:"absolute",top:0,left:0,right:0,height:1,
          background:lm?"rgba(0,0,0,0.1)":"rgba(255,255,255,0.1)",
          pointerEvents:"none"}}/>

        {/* Bottom border — fades in on scroll */}
        <motion.div style={{position:"absolute",bottom:0,left:0,right:0,height:1,
          background:lm?"rgba(0,0,0,0.1)":"rgba(255,255,255,0.08)",
          pointerEvents:"none"}}
          animate={{opacity:scrolled?1:0}} transition={{duration:0.35}}/>

        {/* HUD corner marks */}
        <AnimatePresence>
          {scrolled&&(
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.4}}
              style={{position:"absolute",inset:0,pointerEvents:"none"}}>
              <HUDCorners lCol={lm?"rgba(0,0,0,0.28)":"rgba(255,255,255,0.3)"} size={14}/>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scan sweep */}
        <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"}}>
          <motion.div style={{position:"absolute",top:0,bottom:0,width:"20%",
            background:"linear-gradient(to right,transparent,rgba(255,255,255,0.05),transparent)"}}
            animate={{x:["-22%","122%"]}} transition={{duration:4.5,repeat:Infinity,repeatDelay:16,ease:"linear"}}/>
        </div>

        {/* ── Inner layout ── */}
        <div style={{
          display:"flex",alignItems:"center",justifyContent:"space-between",
          height:90,
          padding:"0 clamp(1.5rem,4.5vw,4rem)"}}>

          {/* Logo */}
          <a href="#" style={{color:lCol,textDecoration:"none",transition:"color .3s",
            display:"flex",alignItems:"center",gap:16,flexShrink:0}}>

            {/* Joint SVG — 48px */}
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="h-9 w-9 md:h-12 md:w-12">
              {/* Outermost orbit ring */}
              <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="0.6" strokeDasharray="2.5 5.5" opacity="0.35"
                style={{transformOrigin:"24px 24px",animation:"gs 14s linear infinite"}}/>
              {/* Counter-rotating diamond */}
              <rect x="9" y="9" width="30" height="30" stroke="currentColor" strokeWidth="0.5" opacity="0.14"
                style={{transformOrigin:"24px 24px",animation:"gs 28s linear infinite reverse"}}/>
              {/* Cardinal tick marks — longer, bolder */}
              <line x1="24" y1="1" x2="24" y2="9" stroke="currentColor" strokeWidth="1.6" opacity="0.9" strokeLinecap="round"/>
              <line x1="24" y1="39" x2="24" y2="47" stroke="currentColor" strokeWidth="1.6" opacity="0.9" strokeLinecap="round"/>
              <line x1="1" y1="24" x2="9" y2="24" stroke="currentColor" strokeWidth="1.6" opacity="0.9" strokeLinecap="round"/>
              <line x1="39" y1="24" x2="47" y2="24" stroke="currentColor" strokeWidth="1.6" opacity="0.9" strokeLinecap="round"/>
              {/* 45° diagonal minor ticks */}
              <line x1="7.5" y1="7.5" x2="11" y2="11" stroke="currentColor" strokeWidth="0.8" opacity="0.3" strokeLinecap="round"/>
              <line x1="40.5" y1="7.5" x2="37" y2="11" stroke="currentColor" strokeWidth="0.8" opacity="0.3" strokeLinecap="round"/>
              <line x1="7.5" y1="40.5" x2="11" y2="37" stroke="currentColor" strokeWidth="0.8" opacity="0.3" strokeLinecap="round"/>
              <line x1="40.5" y1="40.5" x2="37" y2="37" stroke="currentColor" strokeWidth="0.8" opacity="0.3" strokeLinecap="round"/>
              {/* Outer joint ring */}
              <circle cx="24" cy="24" r="8" stroke="currentColor" strokeWidth="1.8"/>
              {/* Mid ring */}
              <circle cx="24" cy="24" r="5" stroke="currentColor" strokeWidth="0.8" opacity="0.45"/>
              {/* Center bearing */}
              <circle cx="24" cy="24" r="2.2" fill="currentColor"/>
              {/* Orbiting bolt holes — 4 pcs */}
              <g style={{transformOrigin:"24px 24px",animation:"gs 48s linear infinite"}}>
                {[0,1,2,3].map(i=>{
                  const a=(i/4)*Math.PI*2+Math.PI/4;
                  return <circle key={i} cx={24+Math.cos(a)*6} cy={24+Math.sin(a)*6} r="1.2" fill="currentColor" opacity="0.55"/>;
                })}
              </g>
            </svg>

            {/* Divider */}
            <div className="hidden sm:block" style={{width:1,height:36,background:lm?"rgba(0,0,0,0.12)":"rgba(255,255,255,0.12)"}}/>

            {/* Wordmark */}
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              <div style={{fontFamily:BG,fontWeight:900,fontSize:"clamp(1.05rem,4.8vw,1.6rem)",letterSpacing:"-0.04em",lineHeight:1}}>
                ALPHIN FRANCIS
              </div>
              <div className="hidden sm:block" style={{fontFamily:MN,fontSize:"11.5px",letterSpacing:"0.32em",lineHeight:1,
                color:lm?"rgba(0,0,0,0.36)":"rgba(255,255,255,0.36)"}}>
                ROBOTICS · ENG
              </div>
            </div>
          </a>

          {/* Nav links — centered */}
          <nav className="hidden lg:flex items-center gap-7 rounded-full px-7 xl:gap-10 xl:px-9" style={{border:`1px solid ${lm?"rgba(0,0,0,0.12)":"rgba(255,255,255,0.12)"}`,background:lm?"rgba(255,255,255,0.45)":"rgba(255,255,255,0.035)",backdropFilter:"blur(14px)",transition:"background .3s,border-color .3s"}}>
            {links.map((n,i)=>(
              <NavLink key={n[0]} id={n[0]} n={n[1]} idx={i} active={activeSection===n[0]} lm={lm}/>
            ))}
          </nav>

          {/* Right cluster */}
          <div className="hidden lg:flex items-center gap-5" style={{flexShrink:0}}>
            <motion.button onClick={onRecruiterClick} whileHover={{opacity:1}} whileTap={{scale:0.97}} className="hidden xl:block"
              style={{fontFamily:MN,fontSize:"13px",letterSpacing:"0.12em",color:lm?"rgba(0,0,0,0.78)":"rgba(255,255,255,0.8)",background:"transparent",border:`1px solid ${lm?"rgba(0,0,0,0.18)":"rgba(255,255,255,0.18)"}`,borderRadius:99,padding:"12px 20px",opacity:0.9,cursor:"none"}}>
              {t("RECRUITER MODE","RECRUITER-MODUS")}
            </motion.button>
            {/* HIRE ME — opens modal */}
            <motion.button onClick={onHireClick}
              whileHover={{scale:1.02}} whileTap={{scale:0.97}}
              style={{fontFamily:MN,fontSize:"14px",letterSpacing:"0.14em",borderRadius:99,
                padding:"12px 28px",
                background:ctaBg,color:ctaCol,
                display:"flex",alignItems:"center",gap:8,border:"none",
                cursor:"none",transition:"background .22s,opacity .22s"}}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=ctaBgHov}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=ctaBg}>
              {t("HIRE ME","ANFRAGEN")} <ArrowUpRight size={13}/>
            </motion.button>
          </div>

          {/* Mobile toggle */}
          <button className="lg:hidden" onClick={()=>setOpen(o=>!o)}
            style={{color:lCol,fontFamily:MN,fontSize:"12.5px",letterSpacing:"0.22em",
              border:`1px solid ${lm?"rgba(0,0,0,0.18)":"rgba(255,255,255,0.15)"}`,
              padding:"9px 12px",background:"transparent",cursor:"none",
              transition:"color .25s,border-color .25s"}}>
            {open?t("CLOSE","SCHLIESSEN"):"MENU"}
          </button>
        </div>
      </motion.header>

      {/* Desktop: language + simple mode in a floating glass pill (the top bar is full) */}
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:mounted?1:0,y:mounted?0:20}} transition={{delay:0.6,duration:0.5}}
        className="fixed bottom-6 left-6 z-[60] hidden rounded-full border border-white/15 bg-black/60 p-1.5 backdrop-blur-xl lg:block">
        <SiteControls lm={false} simple={simple} onToggleSimple={onToggleSimple}/>
      </motion.div>

      {/* Mobile fullscreen */}
      <AnimatePresence>
        {open&&(
          <motion.div
            initial={{clipPath:"inset(0 0 100% 0)"}}
            animate={{clipPath:"inset(0 0 0% 0)"}}
            exit={{clipPath:"inset(0 0 100% 0)"}}
            transition={{duration:0.72,ease:[0.22,1,0.36,1]}}
            data-lenis-prevent=""
            style={{position:"fixed",inset:0,zIndex:40,background:"#060606",
              display:"flex",flexDirection:"column",justifyContent:"center",
              padding:"0 clamp(2rem,8vw,6rem)",gap:24}}>
            <CircuitBg opacity={0.04}/>
            <GearDecor size={260} teeth={16} speed={28} opacity={0.04} x="74%" y="50%" reverse/>
            <div style={{fontFamily:MN,fontSize:"11.5px",color:"rgba(255,255,255,0.71)",letterSpacing:"0.3em",marginBottom:12}}>
              SYS ▸ NAVIGATE
            </div>
            {links.map((n,i)=>(
              <motion.a key={n[0]} href={`#${n[0]}`}
                initial={{x:-80,opacity:0}} animate={{x:0,opacity:1}}
                transition={{delay:i*0.07,ease:[0.22,1,0.36,1]}}
                onClick={()=>setOpen(false)}
                style={{textDecoration:"none",display:"flex",alignItems:"baseline",gap:20}}>
                <span style={{fontFamily:MN,fontSize:"11.5px",color:"rgba(255,255,255,0.66)",letterSpacing:"0.16em",minWidth:24}}>
                  {String(i+1).padStart(2,"0")}
                </span>
                <span style={{fontFamily:BG,fontWeight:900,
                  fontSize:"clamp(3rem,12vw,7rem)",
                  color:"#fff",letterSpacing:"-0.045em",lineHeight:0.86}}>
                  {n[1]}
                </span>
              </motion.a>
            ))}
            <SiteControls lm={false} simple={simple} onToggleSimple={onToggleSimple}/>
            <div style={{display:"flex",flexWrap:"wrap",gap:10,marginTop:8}}>
              {[{I:Linkedin,href:"https://www.linkedin.com/in/alphin-francis"},{I:Mail,href:"mailto:alphinfrancis7@gmail.com"}].map(({I,href},i)=>(
                <a key={i} href={href}
                  style={{width:40,height:40,border:"1px solid rgba(255,255,255,0.1)",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    color:"rgba(255,255,255,0.56)"}}>
                  <I size={15}/>
                </a>
              ))}
              <motion.button onClick={()=>{setOpen(false);onHireClick();}}
                style={{fontFamily:MN,fontSize:"11.5px",letterSpacing:"0.2em",border:"1px solid rgba(255,255,255,0.28)",
                  color:"#fff",padding:"0 24px",height:40,background:"rgba(255,255,255,0.06)",cursor:"none"}}>
                {t("HIRE ME","ANFRAGEN")}
              </motion.button>
              <motion.button onClick={()=>{setOpen(false);onRecruiterClick();}}
                style={{fontFamily:MN,fontSize:"11.5px",letterSpacing:"0.14em",border:"1px solid rgba(255,255,255,0.2)",color:"#fff",padding:"0 18px",height:40,background:"transparent",cursor:"none"}}>
                RECRUITER
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
