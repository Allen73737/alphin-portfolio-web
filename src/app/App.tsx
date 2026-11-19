import { useState, useEffect, useCallback, lazy, Suspense, Fragment } from "react";
import { AnimatePresence, MotionConfig } from "motion/react";
import Lenis from "lenis";
import { Preloader3D, RobotShowcase } from "@/app/components/robot3d/robots";
import { useLowPowerMode, lenisRef, scrollToTarget, SIMPLE, setSimpleFlag } from "./lib";
import { useLang, t } from "./i18n";
import { initAnalytics, track } from "./services";
import { SITE } from "./config";
import { RoboticTransition, Cursor, RobotBuddy, ProgressBar } from "./components/fx";
import { Hero } from "./components/hero";
import { Nav } from "./components/nav";
import { Ticker, WorkSection, KinematicsLab, Statement, About, Timeline, Skills, SystemsLab } from "./components/sections";
import { Contact, Footer } from "./components/contact";

/* overlays only load when first opened (and are prefetched once the page is idle) */
const loadOverlays=()=>import("./components/overlays");
const HireModal=lazy(()=>loadOverlays().then(m=>({default:m.HireModal})));
const CVViewer=lazy(()=>loadOverlays().then(m=>({default:m.CVViewer})));
const RecruiterMode=lazy(()=>loadOverlays().then(m=>({default:m.RecruiterMode})));

/* title + description for search engines and link previews, per language */
function applyMeta() {
  document.title=t("Alphin Francis — Robotics & Automation Engineer","Alphin Francis — Robotik- & Automatisierungsingenieur");
  const desc=t("Portfolio of Alphin Francis, robotics & automation engineer (M.Sc. TU Dortmund) specialising in Universal Robots, Stäubli, vision systems, ROS and robot simulation.","Portfolio von Alphin Francis, Robotik- & Automatisierungsingenieur (M.Sc. TU Dortmund) mit Schwerpunkt Universal Robots, Stäubli, Bildverarbeitung, ROS und Robotersimulation.");
  const set=(sel:string,attr:string,key:string,val:string)=>{
    let m=document.head.querySelector<HTMLMetaElement>(sel);
    if(!m){m=document.createElement("meta");m.setAttribute(attr,key);document.head.appendChild(m);}
    m.content=val;
  };
  set('meta[name="description"]',"name","description",desc);
  set('meta[property="og:title"]',"property","og:title",document.title);
  set('meta[property="og:description"]',"property","og:description",desc);
  set('meta[name="twitter:title"]',"name","twitter:title",document.title);
  set('meta[name="twitter:description"]',"name","twitter:description",desc);
  if(SITE.url)set('meta[property="og:url"]',"property","og:url",SITE.url);
  document.documentElement.lang=t("en","de");
}

/* ─── APP ────────────────────────────────────────────────────────── */
export default function App() {
  const [loading,setLoading]=useState(()=>!SIMPLE),[ready,setReady]=useState(()=>SIMPLE);
  const [transitioning,setTransitioning]=useState(false);
  const [transitionTone,setTransitionTone]=useState<"black"|"white">("black");
  const [transitionLabel,setTransitionLabel]=useState("SECTION");
  const [hireOpen,setHireOpen]=useState(false);
  const [cvOpen,setCVOpen]=useState(false);
  const [recruiterOpen,setRecruiterOpen]=useState(false);
  const lang=useLang();
  // simple mode: native cursor, no smooth scroll, reduced motion; remembered per visitor
  const [simple,setSimple]=useState(()=>SIMPLE);
  setSimpleFlag(simple);
  useEffect(()=>{try{localStorage.setItem("simple",simple?"1":"0");}catch{/* storage blocked */}},[simple]);
  const lowPower=useLowPowerMode()||simple;
  const done=useCallback(()=>{setLoading(false);setTimeout(()=>setReady(true),80);},[]);
  useEffect(()=>{applyMeta();},[lang]);
  useEffect(()=>{
    initAnalytics();
    const w=window as Window&{requestIdleCallback?:(cb:()=>void)=>number};
    const prefetch=()=>{loadOverlays();};
    if(w.requestIdleCallback)w.requestIdleCallback(prefetch);else setTimeout(prefetch,2500);
  },[]);
  const openHire=()=>{track("Hire Me Open");setHireOpen(true);};
  const openCV=()=>{track("CV View");setCVOpen(true);};
  const openRecruiter=()=>{track("Recruiter Mode Open");setRecruiterOpen(true);};
  useEffect(()=>{
    if(lowPower)return;
    const lenis=new Lenis({
      lerp:0.11,
      smoothWheel:true,
      wheelMultiplier:1,
      allowNestedScroll:true,
    });
    lenisRef.current=lenis;
    let raf=0;
    const frame=(time:number)=>{
      lenis.raf(time);
      raf=requestAnimationFrame(frame);
    };
    raf=requestAnimationFrame(frame);
    return()=>{cancelAnimationFrame(raf);lenis.destroy();lenisRef.current=null;};
  },[lowPower]);
  // freeze page scroll while an overlay is open
  const anyOverlay=hireOpen||cvOpen||recruiterOpen;
  useEffect(()=>{
    const l=lenisRef.current;if(!l)return;
    if(anyOverlay)l.stop();else l.start();
  },[anyOverlay]);
  // Intercept anchor clicks for robotic transition
  useEffect(()=>{
    const fn=(e:MouseEvent)=>{
      const a=(e.target as HTMLElement).closest("a[href^='#']");
      if(!a)return;
      const href=a.getAttribute("href");
      if(!href||href==="#")return;
      e.preventDefault();
      const target=document.querySelector(href) as HTMLElement|null;
      // simple mode: plain smooth scroll, no robotic wipe
      if(SIMPLE){if(target)scrollToTarget(target);return;}
      const lightDestination=target?.dataset.theme==="light"||target?.id==="site-footer";
      setTransitionTone(lightDestination?"black":"white");
      setTransitionLabel((target?.id||href.slice(1)||"section").replace(/-/g," "));
      setTransitioning(true);
      setTimeout(()=>{
        if(target){
          const root=document.documentElement;
          const previous=root.style.scrollBehavior;
          root.style.scrollBehavior="auto";
          scrollToTarget(target,true);
          requestAnimationFrame(()=>{root.style.scrollBehavior=previous;});
        }
      },220);
    };
    document.addEventListener("click",fn);
    return()=>document.removeEventListener("click",fn);
  },[]);
  return (
    <MotionConfig reducedMotion={simple?"always":"user"}>
    <div className={`bg-background text-foreground min-h-screen ${lowPower?"performance-lite":""} ${simple?"simple-mode":""}`}>
      <style>{`
        *,*::before,*::after{cursor:none!important}
        html{scroll-behavior:smooth;position:relative}
        html.lenis,html.lenis body{height:auto}
        .lenis.lenis-smooth{scroll-behavior:auto!important}
        .lenis.lenis-smooth [data-lenis-prevent]{overscroll-behavior:contain}
        .lenis.lenis-stopped{overflow:hidden}
        body{overflow-x:clip;position:relative}
        ::selection{background:rgba(255,255,255,0.1)}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.22);border-radius:9px}
        :focus-visible{outline:1.5px solid rgba(255,255,255,0.85);outline-offset:3px}
        [data-theme=light] :focus-visible,#site-footer :focus-visible{outline-color:#0a0a0a}
        body{-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
        ::-webkit-scrollbar-track{background:transparent}
        @keyframes gs{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-33.333%)}}
        @keyframes ping{75%,100%{transform:scale(2);opacity:0}}
        @keyframes termBlink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes dataFlicker{0%,100%{opacity:0.07}50%{opacity:0.13}}
        @keyframes ledBlink{0%,100%{opacity:1}50%{opacity:.25}}
        @keyframes buddyBlink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
        @keyframes kinPulse{0%{transform:scale(1);opacity:.6}100%{transform:scale(1.9);opacity:0}}
        @keyframes cardScan{0%{top:0%}100%{top:100%}}
        .card-scan{top:0}
        .group:hover .card-scan{animation:cardScan 1.8s linear infinite}
        .ambient-loop:hover{animation-play-state:paused}
        .animate-ping{animation:ping 2s cubic-bezier(0,0,.2,1) infinite}
        .work-swipe::-webkit-scrollbar{display:none}        .kin-range{-webkit-appearance:none;appearance:none;height:28px;background:transparent;cursor:none}
        .kin-range::-webkit-slider-runnable-track{height:3px;background:rgba(255,255,255,.25);border-radius:99px}
        .kin-range::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;margin-top:-9.5px;border-radius:50%;background:#fff;border:4px solid #111;box-shadow:0 0 0 1px rgba(255,255,255,.55)}
        .kin-range::-moz-range-track{height:3px;background:rgba(255,255,255,.25);border-radius:99px}
        .kin-range::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:#fff;border:4px solid #111}
        .performance-lite .ambient-loop,.performance-lite .ambient-loop *{animation-play-state:paused!important}
        .performance-lite svg [style*="animation:"]{animation-play-state:paused!important}
        @media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important}}
        @media (max-width:767px){
          .mobile-safe-type{overflow-wrap:anywhere}
          section{scroll-margin-top:78px}
          a,button{touch-action:manipulation}
          .kin-range{cursor:auto}
        }
        @media (pointer:coarse){
          *,*::before,*::after{cursor:auto!important}
          .robot-cursor{display:none!important}
        }
        @media (prefers-reduced-motion:reduce){
          html{scroll-behavior:auto}
          .animate-ping{animation:none}
        }
        .simple-mode *,.simple-mode *::before,.simple-mode *::after{cursor:auto!important;animation-duration:.001ms!important;animation-iteration-count:1!important}
        .simple-mode a,.simple-mode button,.simple-mode label,.simple-mode [data-drag]{cursor:pointer!important}
        .simple-mode input,.simple-mode textarea{cursor:text!important}
        .simple-mode .robot-cursor{display:none!important}
        .simple-mode{scroll-behavior:auto}
      `}</style>
      <Cursor/>
      <ProgressBar/>
      <AnimatePresence>{loading&&<Preloader3D onDone={done}/>}</AnimatePresence>
      <AnimatePresence>{transitioning&&<RoboticTransition tone={transitionTone} label={transitionLabel} onDone={()=>setTransitioning(false)}/>}</AnimatePresence>
      {/* keyed by language: switching re-mounts the page so every t() call re-evaluates */}
      <Fragment key={`${lang}-${simple?1:0}`}>
      <Suspense fallback={null}>
        <AnimatePresence>{hireOpen&&<HireModal onClose={()=>setHireOpen(false)}/>}</AnimatePresence>
        <AnimatePresence>{cvOpen&&<CVViewer onClose={()=>setCVOpen(false)}/>}</AnimatePresence>
        <AnimatePresence>{recruiterOpen&&<RecruiterMode onClose={()=>setRecruiterOpen(false)} onViewCV={()=>{setRecruiterOpen(false);openCV();}}/>}</AnimatePresence>
      </Suspense>
      <Nav onHireClick={openHire} onRecruiterClick={openRecruiter} simple={simple} onToggleSimple={()=>setSimple(s=>!s)}/>
      {!simple&&<RobotBuddy/>}
      <main style={{position:"relative"}}>
        <Hero ready={ready} lowPower={lowPower} onViewCV={openCV}/>
        <Ticker/>
        {/* The former featured case-study route was removed; work now flows directly into the lab. */}
        <WorkSection/>
        <KinematicsLab/>
        <Statement/>
        {!simple&&<RobotShowcase lowPower={lowPower}/>}
        <About/>
        <Timeline/>
        <Skills/>
        <SystemsLab/>
        <Contact/>
      </main>
      <Footer/>
      </Fragment>
    </div>
    </MotionConfig>
  );
}
