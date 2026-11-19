import { useState, useEffect, useRef, useCallback } from "react";
import {
  motion, useScroll, useTransform, useSpring,
  useMotionValue, useInView, AnimatePresence, useMotionTemplate,
  type MotionValue,
} from "motion/react";
import Lenis from "lenis";
import { t } from "../i18n";
import { ArrowUpRight, Github, Linkedin, Mail, ExternalLink } from "lucide-react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import alphinPhoto from "@/imports/alphin-portrait.jpg";
import alphinCV from "@/imports/AlphinFrancis.pdf";
import alphinCVPage1 from "@/imports/AlphinFrancis-page-1.png";
import alphinCVPage2 from "@/imports/AlphinFrancis-page-2.png";
import { type V3, type Face, type Cam, m3T, m3Ry, m3Rx, m3Rz, m3Mul, m3P, v3Sub, v3Dot, v3Norm, addBox, addCyl, makeCam, proj, runCanvas } from "@/app/components/robot3d/engine";
import { Preloader3D, RobotShowcase, RobotHeadCompanion } from "@/app/components/robot3d/robots";

import { BG, MN, BODY, BRD, LIGHT_BG, useMediaQuery, PROJECTS, SKILLS_DOMAINS, TIMELINE, AUTOMATION_PHASES, SIMPLE } from "../lib";
import { GearDecor, TypeBot, WorkMiniCanvas, HUDFrame, CircuitBg, HexDotBg, SkillRadar, WordReveal, Counter, ScanReveal, useTilt } from "./fx";

/* ─── TICKER ─────────────────────────────────────────────────────── */
export function Ticker() {
  const items=["ROS1","Python","OpenCV","MATLAB","Open3D","URScript","VAL3","Stäubli","UR RTDE","Gazebo","RViz","RoboDK","Fusion 360","Intel RealSense","CubeEye","SensoPart","C++","Linux","GitLab","VTK","Blender"];
  return (
    <div className="overflow-hidden border-y py-4" style={{borderColor:BRD}}>
      <div className="ambient-loop flex whitespace-nowrap" style={{animation:"ticker 36s linear infinite"}}>
        {[0,1,2].map(r=>(
          <span key={r} className="flex items-center shrink-0">
            {items.map((t,i)=>(
              <span key={i} className="flex items-center">
                <span style={{fontFamily:MN,fontSize:"12px",padding:"0 20px",color:"rgba(255,255,255,0.68)",letterSpacing:"0.22em"}}>{t}</span>
                <span style={{color:"rgba(255,255,255,0.07)",fontSize:"0.3rem"}}>◆</span>
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── BIG MARQUEE ────────────────────────────────────────────────── */
export function BigMarquee() {
  const ref=useRef<HTMLDivElement>(null);
  const {scrollYProgress}=useScroll({target:ref,offset:["start end","end start"]});
  const x=useTransform(scrollYProgress,[0,1],["-3%","3%"]);
  return (
    <div ref={ref} className="overflow-hidden border-b py-8 select-none" style={{borderColor:BRD,position:"relative"}}>
      <GearDecor size={170} teeth={18} speed={30} opacity={0.045} x="4%" y="-25%"/>
      <GearDecor size={100} teeth={12} speed={22} opacity={0.04} x="89%" y="22%" reverse/>
      <motion.div style={{x}} className="flex whitespace-nowrap items-center gap-12">
        {[0,1].map(r=>(
          <span key={r} className="flex items-center gap-12 shrink-0">
            {PROJECTS.map(project=>(
              <span key={project.num} className="flex items-center gap-12">
                <span style={{fontFamily:BG,fontWeight:900,fontSize:"clamp(3.8rem,9.5vw,9rem)",letterSpacing:"-0.05em",color:"rgba(255,255,255,0.085)"}}>{project.short.toUpperCase()}</span>
                <span style={{fontFamily:MN,fontSize:"11.5px",color:"rgba(255,255,255,0.04)",letterSpacing:"0.2em"}}>◆</span>
              </span>
            ))}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ─── WORK SECTION — REFINED HORIZONTAL NARRATIVE ─────────────── */
export function WorkPanel({project,i,mobile=false}:{project:typeof PROJECTS[0];i:number;mobile?:boolean}) {
  const tilt=useTilt(7);
  return (
    <motion.article initial={mobile?false:{opacity:0,y:24}} whileInView={mobile?undefined:{opacity:1,y:0}} viewport={{once:false,margin:"-8%"}} transition={{duration:0.7,ease:[0.22,1,0.36,1]}}
      {...(mobile?{}:tilt.handlers)}
      className={`group relative h-full w-full overflow-hidden border bg-[#0b0b0b]`}
      style={{borderColor:"rgba(255,255,255,0.13)",...(mobile?{}:tilt.style)}}>
      <motion.img src={`https://images.unsplash.com/photo-${project.img}?w=${mobile?800:1600}&h=${mobile?1000:1100}&fit=crop&auto=format`} alt={project.title} loading="lazy" draggable={false}
        className="absolute inset-0 h-full w-full select-none object-cover"
        style={{filter:"saturate(0) brightness(0.28) contrast(1.1)"}} whileHover={{scale:1.035,filter:"saturate(0) brightness(0.38) contrast(1.1)"}} transition={{duration:0.8,ease:[0.22,1,0.36,1]}}/>
      <div className="absolute inset-0" style={{background:"linear-gradient(90deg,rgba(0,0,0,0.92) 0%,rgba(0,0,0,0.66) 48%,rgba(0,0,0,0.2) 100%),linear-gradient(to top,rgba(0,0,0,0.92),transparent 60%)"}}/>
      {!mobile&&<motion.div className="pointer-events-none absolute inset-0 z-[1]" style={{background:tilt.glare}}/>}
      <div className="card-scan pointer-events-none absolute left-0 right-0 z-[1] h-px opacity-0 group-hover:opacity-100" style={{background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent)",boxShadow:"0 0 14px rgba(255,255,255,0.35)"}}/>
      <CircuitBg opacity={0.025}/>
      <HUDFrame sublabel={`${project.num}/05 · ${project.year}`}/>
      {/* target-lock brackets on hover */}
      {[["left-5 top-5","border-l border-t"],["right-5 top-5","border-r border-t"],["left-5 bottom-5","border-l border-b"],["right-5 bottom-5","border-r border-b"]].map(([pos,b])=>(
        <span key={pos} className={`pointer-events-none absolute z-[2] h-7 w-7 scale-150 border-white/70 opacity-0 transition-all duration-500 group-hover:scale-100 group-hover:opacity-100 ${pos} ${b}`}/>
      ))}
      {!mobile&&<WorkMiniCanvas type={i}/>}
      <div className="absolute inset-0 z-[3] flex flex-col justify-between p-6 pt-14 md:p-12 md:pt-16" style={{transform:mobile?undefined:"translateZ(30px)"}}>
        <div className="flex items-start justify-between gap-6">
          <div>
            <div style={{fontFamily:MN,fontSize:"12.5px",color:"rgba(255,255,255,0.68)",letterSpacing:"0.14em"}}>{project.type.toUpperCase()}</div>
            <div className="mt-2" style={{fontFamily:MN,fontSize:"12.5px",color:"rgba(255,255,255,0.68)",letterSpacing:"0.1em"}}>{project.spec}</div>
          </div>
          <span style={{fontFamily:BG,fontWeight:900,fontSize:"clamp(4rem,9vw,8rem)",color:"rgba(255,255,255,0.13)",lineHeight:0.7}}>{project.num}</span>
        </div>
        <div className="max-w-3xl">
          <h3 style={{fontFamily:BG,fontWeight:900,fontSize:mobile?"clamp(2.3rem,10vw,4rem)":"clamp(3.2rem,6.3vw,7rem)",letterSpacing:"-0.052em",lineHeight:0.84}}>{project.title}</h3>
          <p className="mt-5 md:mt-6" style={{fontFamily:BODY,fontSize:mobile?"15px":"16.5px",color:"rgba(255,255,255,0.72)",lineHeight:1.85,maxWidth:"58ch"}}>{project.desc}</p>
          <div className="mt-5 flex flex-wrap items-center gap-2 md:mt-6">
            {project.tags.map(tag=><span key={tag} className="border border-white/15 bg-black/20 px-3 py-1.5 transition-colors duration-300 group-hover:border-white/30" style={{fontFamily:MN,fontSize:"12.5px",color:"rgba(255,255,255,0.7)",letterSpacing:"0.08em"}}>{tag}</span>)}
            <a href="#contact" className="ml-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/30 transition-all duration-300 hover:rotate-45 hover:bg-white hover:text-black" aria-label={`Discuss ${project.title}`}><ArrowUpRight size={15}/></a>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

/* desktop: each card swings through a 3D coverflow as the track moves */
export function CoverflowSlot({progress,i,children}:{progress:MotionValue<number>;i:number;children:React.ReactNode}) {
  const c=i/(PROJECTS.length-1),w=1/(PROJECTS.length-1);
  const rotateY=useTransform(progress,[c-w,c,c+w],[16,0,-16]);
  const scale=useTransform(progress,[c-w,c,c+w],[0.9,1,0.9]);
  const dim=useTransform(progress,[c-w,c,c+w],[0.55,0,0.55]);
  return (
    <motion.div className="relative h-[calc(100svh-10rem)] max-h-[760px] min-h-[560px] w-[76vw] shrink-0" style={{rotateY,scale,transformPerspective:1800}}>
      {children}
      <motion.div className="pointer-events-none absolute inset-0 z-10 bg-black" style={{opacity:dim}}/>
    </motion.div>
  );
}

/* touch / tablet: native swipe + snap, with arrows, dots and mouse drag */
export function CarouselSlot({progress,i,children}:{progress:MotionValue<number>;i:number;children:React.ReactNode}) {
  const c=i/(PROJECTS.length-1),w=1/(PROJECTS.length-1);
  const rotateY=useTransform(progress,[c-w,c,c+w],[14,0,-14]);
  const scale=useTransform(progress,[c-w,c,c+w],[0.92,1,0.92]);
  return (
    <motion.div data-card className="h-[74svh] max-h-[680px] min-h-[520px] shrink-0 snap-center snap-always" style={{width:"var(--cw)",rotateY,scale,transformPerspective:1200}}>
      {children}
    </motion.div>
  );
}

export function WorkCarousel() {
  const ref=useRef<HTMLDivElement>(null);
  const {scrollXProgress}=useScroll({container:ref});
  const bar=useSpring(scrollXProgress,{stiffness:200,damping:30});
  const [idx,setIdx]=useState(0);
  const touched=useRef(false);
  const inView=useInView(ref,{once:true,margin:"-25% 0px"});
  const cards=()=>Array.from(ref.current?.querySelectorAll<HTMLElement>("[data-card]")??[]);
  const go=(i:number)=>{
    const el=ref.current,card=cards()[Math.max(0,Math.min(PROJECTS.length-1,i))];
    if(!el||!card)return;
    el.scrollTo({left:card.offsetLeft-(el.clientWidth-card.offsetWidth)/2,behavior:"smooth"});
  };
  useEffect(()=>{
    const el=ref.current;if(!el)return;
    let raf=0;
    const onScroll=()=>{
      if(raf)return;
      raf=requestAnimationFrame(()=>{
        raf=0;
        const mid=el.scrollLeft+el.clientWidth/2;
        let best=0,bd=Infinity;
        cards().forEach((c,i)=>{const d=Math.abs(c.offsetLeft+c.offsetWidth/2-mid);if(d<bd){bd=d;best=i;}});
        setIdx(best);
      });
    };
    el.addEventListener("scroll",onScroll,{passive:true});
    return()=>{cancelAnimationFrame(raf);el.removeEventListener("scroll",onScroll);};
  },[]);
  // teach the gesture once: nudge the track when it first appears
  useEffect(()=>{
    const el=ref.current;
    if(!inView||!el||touched.current||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
    const a=setTimeout(()=>{if(!touched.current)el.scrollTo({left:70,behavior:"smooth"});},500);
    const b=setTimeout(()=>{if(!touched.current)el.scrollTo({left:0,behavior:"smooth"});},1150);
    return()=>{clearTimeout(a);clearTimeout(b);};
  },[inView]);
  // mouse drag for tablets with trackpads / narrow desktop windows
  const drag=useRef<{x:number;left:number;moved:boolean}|null>(null);
  const suppressClick=useRef(false);
  const onPointerDown=(e:React.PointerEvent<HTMLDivElement>)=>{
    touched.current=true;
    if(e.pointerType!=="mouse")return;
    drag.current={x:e.clientX,left:e.currentTarget.scrollLeft,moved:false};
    e.currentTarget.style.scrollSnapType="none";
  };
  const onPointerMove=(e:React.PointerEvent<HTMLDivElement>)=>{
    const d=drag.current;if(!d)return;
    const dx=e.clientX-d.x;
    if(Math.abs(dx)>4)d.moved=true;
    e.currentTarget.scrollLeft=d.left-dx;
  };
  const endDrag=(e:React.PointerEvent<HTMLDivElement>)=>{
    const d=drag.current;if(!d)return;
    drag.current=null;
    const el=e.currentTarget;
    el.style.scrollSnapType="";
    if(d.moved){
      suppressClick.current=true;
      setTimeout(()=>{suppressClick.current=false;},0);
      const dx=e.clientX-d.x;
      go(idx+(dx<-60?1:dx>60?-1:0));
    }
  };
  return (
    <section className="relative border-y py-20" style={{borderColor:BRD}}>
      <CircuitBg opacity={0.02}/>
      <div className="relative mb-8 flex items-end justify-between gap-4 px-6 md:px-10">
        <div>
          <TypeBot text={t("01 / SELECTED PROJECTS","01 / AUSGEWÄHLTE PROJEKTE")} speed={24} style={{fontFamily:MN,fontSize:"12.5px",color:"rgba(255,255,255,0.7)",letterSpacing:"0.24em"}}/>
          <p className="mt-3 flex items-center gap-2" style={{fontFamily:MN,fontSize:"12.5px",color:"rgba(255,255,255,0.68)",letterSpacing:"0.1em"}}>
            {t("SWIPE TO EXPLORE","WISCHEN ZUM ENTDECKEN")} <motion.span animate={{x:[0,6,0]}} transition={{duration:1.4,repeat:Infinity,ease:"easeInOut"}}>→</motion.span>
          </p>
        </div>
        <span style={{fontFamily:BG,fontWeight:900,fontSize:"2rem",letterSpacing:"-0.04em",lineHeight:1}}>
          {String(idx+1).padStart(2,"0")}<span style={{color:"rgba(255,255,255,0.46)"}}>/{String(PROJECTS.length).padStart(2,"0")}</span>
        </span>
      </div>
      <div ref={ref} role="region" aria-roledescription="carousel" aria-label="Selected projects" tabIndex={0}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag} onPointerLeave={endDrag}
        onKeyDown={e=>{if(e.key==="ArrowRight"){e.preventDefault();go(idx+1);}if(e.key==="ArrowLeft"){e.preventDefault();go(idx-1);}}}
        onTouchStart={()=>{touched.current=true;}}
        onClickCapture={e=>{if(suppressClick.current){e.preventDefault();e.stopPropagation();}}}
        className="work-swipe relative flex snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden pb-6 pt-2 outline-none"
        style={{["--cw" as string]:"min(84vw,640px)",scrollbarWidth:"none",WebkitOverflowScrolling:"touch",overscrollBehaviorX:"contain",touchAction:"pan-x pan-y"} as React.CSSProperties}>
        <div aria-hidden className="shrink-0" style={{width:"calc((100% - var(--cw)) / 2 - 16px)"}}/>
        {PROJECTS.map((project,i)=>(
          <CarouselSlot key={project.num} progress={scrollXProgress} i={i}>
            <WorkPanel project={project} i={i} mobile/>
          </CarouselSlot>
        ))}
        <div aria-hidden className="shrink-0" style={{width:"calc((100% - var(--cw)) / 2 - 16px)"}}/>
      </div>
      <div className="relative mt-4 flex items-center gap-4 px-6 md:px-10">
        <button aria-label="Previous project" onClick={()=>{touched.current=true;go(idx-1);}} disabled={idx===0}
          className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/20 text-white transition-all active:scale-90 disabled:opacity-25" style={{fontFamily:MN}}>←</button>
        <div className="flex flex-1 items-center gap-1.5">
          {PROJECTS.map((p,i)=>(
            <button key={p.num} aria-label={`Go to project ${i+1}`} onClick={()=>{touched.current=true;go(i);}} className="flex h-11 flex-1 items-center">
              <motion.span className="block h-[2px] w-full origin-left bg-white" animate={{opacity:i===idx?1:0.18,scaleY:i===idx?1.6:1}} transition={{duration:0.3}}/>
            </button>
          ))}
        </div>
        <button aria-label="Next project" onClick={()=>{touched.current=true;go(idx+1);}} disabled={idx===PROJECTS.length-1}
          className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/20 text-white transition-all active:scale-90 disabled:opacity-25" style={{fontFamily:MN}}>→</button>
      </div>
      <div className="mx-6 mt-3 h-px overflow-hidden bg-white/10 md:mx-10"><motion.div className="h-full origin-left bg-white/60" style={{scaleX:bar}}/></div>
    </section>
  );
}

export function WorkSection() {
  // phones, tablets and any touch device get the swipe carousel
  const touchLayout=useMediaQuery("(max-width: 1023px), (pointer: coarse)");
  return <div id="work">{touchLayout||SIMPLE?<WorkCarousel/>:<WorkTrack/>}</div>;
}

export function WorkTrack() {
  const ref=useRef<HTMLElement>(null);
  const {scrollYProgress}=useScroll({target:ref,offset:["start start","end end"]});
  const overflowVw=PROJECTS.length*76+(PROJECTS.length-1)*2+16-100;
  const x=useTransform(scrollYProgress,[0,1],["0vw",`${-overflowVw}vw`]);
  const progress=useTransform(scrollYProgress,[0,1],["0%","100%"]);
  return (
      <section ref={ref} className="relative" style={{height:`${100+(PROJECTS.length-1)*78}vh`}}>
        <div className="sticky top-0 h-[100svh] overflow-hidden border-y" style={{borderColor:BRD}}>
          <CircuitBg opacity={0.02}/><HUDFrame label="01_SELECTED_WORK" sublabel="DIRECT_SCROLL_MAPPING · NO_SPRING_LAG"/>
          <div className="absolute left-8 right-8 top-7 z-20 flex items-center justify-between md:left-14 md:right-14">
            <TypeBot text={t("01 / SELECTED PROJECTS","01 / AUSGEWÄHLTE PROJEKTE")} speed={24} style={{fontFamily:MN,fontSize:"12.5px",color:"rgba(255,255,255,0.7)",letterSpacing:"0.24em"}}/>
            <span style={{fontFamily:MN,fontSize:"12.5px",color:"rgba(255,255,255,0.68)",letterSpacing:"0.12em"}}>SCROLL ↓ / TRACK →</span>
          </div>
          <motion.div className="flex h-full items-center gap-[2vw] px-[8vw] pb-8 pt-24 will-change-transform" style={{x}}>
            {PROJECTS.map((project,i)=>(
              <CoverflowSlot key={project.num} progress={scrollYProgress} i={i}>
                <WorkPanel project={project} i={i}/>
              </CoverflowSlot>
            ))}
          </motion.div>
          <div className="absolute bottom-5 left-14 right-14 z-20 flex items-center gap-4">
            <span style={{fontFamily:MN,fontSize:"11.5px",color:"rgba(255,255,255,0.58)"}}>01</span>
            <div className="h-px flex-1 overflow-hidden bg-white/10"><motion.div className="h-full bg-white" style={{width:progress}}/></div>
            <span style={{fontFamily:MN,fontSize:"11.5px",color:"rgba(255,255,255,0.58)"}}>05</span>
          </div>
        </div>
      </section>
  );
}

/* ─── INTERACTIVE KINEMATICS LAB ─────────────────────────────────── */
export function KinematicsLab() {
  const [angles,setAngles]=useState([34,58,-42]);
  const [auto,setAuto]=useState(!SIMPLE);
  const [dragging,setDragging]=useState(false);
  const svgRef=useRef<SVGSVGElement>(null);
  const trail=useRef<Array<[number,number]>>([]);
  const inView=useInView(svgRef,{margin:"-10% 0px"});
  const rad=(deg:number)=>deg*Math.PI/180;
  const base={x:122,y:252},lengths=[104,82,58];
  const LIM:[number,number][]=[[-10,145],[-100,110],[-100,110]];
  const a1=rad(angles[0]),a2=a1+rad(angles[1]),a3=a2+rad(angles[2]);
  const j2={x:base.x+Math.cos(a1)*lengths[0],y:base.y-Math.sin(a1)*lengths[0]};
  const j3={x:j2.x+Math.cos(a2)*lengths[1],y:j2.y-Math.sin(a2)*lengths[1]};
  const ee={x:j3.x+Math.cos(a3)*lengths[2],y:j3.y-Math.sin(a3)*lengths[2]};
  trail.current.push([ee.x,ee.y]);
  if(trail.current.length>70)trail.current.shift();
  const stopAuto=()=>setAuto(false);
  const update=(i:number,value:number)=>{stopAuto();setAngles(current=>current.map((angle,index)=>index===i?value:angle));};

  // idle demo: smooth joint-space motion while nobody is interacting
  useEffect(()=>{
    if(!auto||!inView||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
    let raf=0;const t0=performance.now();
    const tick=(now:number)=>{
      const t=(now-t0)/1000;
      setAngles([62+44*Math.sin(t*0.62),18+52*Math.sin(t*0.94+1.1),-28+56*Math.sin(t*0.78+2.3)]);
      raf=requestAnimationFrame(tick);
    };
    raf=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(raf);
  },[auto,inView]);

  // analytic IK: hold the current wrist orientation, solve the 2-link chain to the wrist
  const solveTo=(tx:number,ty:number)=>{
    const [L1,L2,L3]=lengths;
    const wx=tx-Math.cos(a3)*L3,wy=ty+Math.sin(a3)*L3;
    const dx=wx-base.x,dy=base.y-wy;
    const D=Math.min(L1+L2-0.5,Math.max(Math.abs(L1-L2)+1,Math.hypot(dx,dy)));
    const cl=(v:number)=>Math.min(1,Math.max(-1,v));
    const t1=Math.atan2(dy,dx)+Math.acos(cl((L1*L1+D*D-L2*L2)/(2*L1*D)));
    const t2=-(Math.PI-Math.acos(cl((L1*L1+L2*L2-D*D)/(2*L1*L2))));
    const deg=[t1,t2,a3-t1-t2].map(r=>{const d=r*180/Math.PI;return ((d+540)%360)-180;});
    setAngles(deg.map((d,i)=>Math.min(LIM[i][1],Math.max(LIM[i][0],d))));
  };
  const toSvg=(e:React.PointerEvent)=>{
    const svg=svgRef.current,m=svg?.getScreenCTM();
    if(!svg||!m)return null;
    const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(m.inverse());
    return {x:p.x,y:p.y};
  };
  const onDown=(e:React.PointerEvent<SVGSVGElement>)=>{
    const onHandle=(e.target as Element).closest("[data-drag]");
    if(e.pointerType!=="mouse"&&!onHandle)return;   // touch: only the handle captures, so the page still scrolls
    const p=toSvg(e);if(!p)return;
    stopAuto();setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    solveTo(p.x,p.y);
  };
  const onMove=(e:React.PointerEvent<SVGSVGElement>)=>{if(!dragging)return;const p=toSvg(e);if(p)solveTo(p.x,p.y);};
  const onUp=()=>setDragging(false);

  return (
    <section id="lab" data-theme="light" className="relative overflow-hidden px-5 py-20 md:px-14 md:py-40" style={{background:LIGHT_BG,color:"#0a0a0a"}}>
      <HexDotBg opacity={0.036} dark={false}/>
      <HUDFrame label="02_KINEMATICS_LAB" sublabel="FORWARD_KINEMATICS · 3DOF" dark={false}/>
      <div className="relative mx-auto max-w-screen-2xl">
        <div className="mb-16 grid gap-8 border-b pb-8 lg:grid-cols-[1fr_0.8fr] lg:items-end" style={{borderColor:"rgba(0,0,0,0.12)"}}>
          <div>
            <TypeBot text={t("INTERACTIVE / ROBOT LAB","INTERAKTIV / ROBOTERLABOR")} speed={26} style={{fontFamily:MN,fontSize:"11.5px",color:"rgba(0,0,0,0.62)",letterSpacing:"0.3em"}}/>
            <h2 className="mt-7" style={{fontFamily:BG,fontWeight:900,fontSize:"clamp(3.4rem,7.5vw,7.5rem)",letterSpacing:"-0.055em",lineHeight:0.82}}>
              <WordReveal text={t("MOVE THE","BEWEGEN SIE DIE")} stagger={0.08}/><br/><WordReveal text={t("MACHINE.","MASCHINE.")} delay={0.16} color="rgba(0,0,0,0.42)"/>
            </h2>
          </div>
          <p style={{fontFamily:BODY,fontSize:"17px",color:"rgba(0,0,0,0.74)",lineHeight:1.75,maxWidth:"55ch"}}>{t("Drag the gripper and an analytic inverse-kinematics solver computes every joint angle in real time, or set each joint directly with the sliders. It's a working engineering demo.","Ziehen Sie den Greifer: Ein analytischer Inverse-Kinematik-Solver berechnet jeden Gelenkwinkel in Echtzeit. Oder stellen Sie jedes Gelenk direkt mit den Schiebereglern ein – eine funktionierende Engineering-Demo.")}</p>
        </div>

        <ScanReveal dark={false}>
        <div className="grid overflow-hidden border border-black/15 bg-[#e8e4dc] lg:grid-cols-[1.35fr_0.65fr]">
          <div className="relative min-h-[400px] border-b border-black/10 p-4 lg:border-b-0 lg:border-r lg:p-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <span style={{fontFamily:MN,fontSize:"11.5px",color:"rgba(0,0,0,0.66)",letterSpacing:"0.18em"}}>{dragging?"IK SOLVER · TRACKING":auto?"FK SOLVER · AUTO DEMO":"FK SOLVER · XY PLANE"}</span>
              <span style={{fontFamily:MN,fontSize:"11.5px",color:"rgba(0,0,0,0.72)",letterSpacing:"0.1em"}}>X {(ee.x-base.x).toFixed(1)} · Y {(base.y-ee.y).toFixed(1)}</span>
            </div>
            <svg ref={svgRef} viewBox="0 0 480 300" className="h-[300px] w-full select-none md:h-[350px]" fill="none" aria-label="Interactive three joint robot arm. Drag the gripper to move it."
              onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
              <defs><pattern id="kin-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" stroke="rgba(0,0,0,0.07)" strokeWidth=".6"/></pattern></defs>
              <rect width="480" height="300" fill="url(#kin-grid)"/>
              <path d="M28 252H452M122 270V28" stroke="rgba(0,0,0,0.13)" strokeDasharray="4 7"/>
              <path d={`M122 252 A244 244 0 0 1 366 8`} stroke="rgba(0,0,0,0.12)" strokeDasharray="5 9"/>
              <polyline points={trail.current.map(p=>p.join(",")).join(" ")} stroke="rgba(0,0,0,0.22)" strokeWidth="1" strokeDasharray="2 3"/>
              <rect x={base.x-34} y={base.y+14} width="68" height="10" fill="#111"/>
              <path d={`M${base.x} ${base.y}L${j2.x} ${j2.y}L${j3.x} ${j3.y}L${ee.x} ${ee.y}`} stroke="rgba(0,0,0,0.12)" strokeWidth="17" strokeLinecap="round" strokeLinejoin="round" transform="translate(3 4)"/>
              <path d={`M${base.x} ${base.y}L${j2.x} ${j2.y}L${j3.x} ${j3.y}L${ee.x} ${ee.y}`} stroke="#111" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round"/>
              <path d={`M${base.x} ${base.y}L${j2.x} ${j2.y}L${j3.x} ${j3.y}L${ee.x} ${ee.y}`} stroke="rgba(255,255,255,0.28)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 6"/>
              {[base,j2,j3].map((point,i)=><g key={i} transform={`translate(${point.x} ${point.y})`}>
                <circle r={i===0?16:13} fill="#e8e4dc" stroke="#111" strokeWidth="1.4"/><circle r={4} fill="#111"/>
                <g style={{transformBox:"fill-box",transformOrigin:"center",animation:`gs ${6+i*2}s linear infinite${i%2?" reverse":""}`}}><circle r={i===0?10:8} stroke="rgba(0,0,0,0.3)" strokeDasharray="3 3"/></g>
                <text x={18} y={-14} fill="rgba(0,0,0,0.5)" fontSize="10" fontFamily="DM Mono">J{i+1} {Math.round(angles[i])}°</text>
              </g>)}
              <g transform={`translate(${ee.x} ${ee.y}) rotate(${-a3*180/Math.PI})`}>
                <path d="M0 -7H10V-3H16M0 7H10V3H16" stroke="#111" strokeWidth="2.2"/>
              </g>
              <g transform={`translate(${ee.x} ${ee.y})`} data-drag="" style={{touchAction:"none"}}>
                <circle r="30" fill="transparent"/>
                <circle r={dragging?22:18} stroke="rgba(0,0,0,0.45)" strokeDasharray="2 5" style={{transition:"r .2s"}}/>
                {!dragging&&<circle r="18" stroke="rgba(0,0,0,0.5)" style={{transformBox:"fill-box",transformOrigin:"center",animation:"kinPulse 1.8s ease-out infinite"}}/>}
                <path d="M-12 0H12M0-12V12" stroke="#111"/>
                <circle r="3" fill="#111"/>
              </g>
              <text x="32" y="28" fill="rgba(0,0,0,0.42)" fontSize="10" fontFamily="DM Mono" letterSpacing="1.5">WORKSPACE ENVELOPE</text>
              <text x={ee.x+22} y={ee.y-14} fill="rgba(0,0,0,0.7)" fontSize="10" fontFamily="DM Mono">{dragging?"IK LOCK":"DRAG ME"}</text>
            </svg>
          </div>
          <div className="flex flex-col justify-between bg-[#111] p-7 text-white md:p-10">
            <div>
              <div className="mb-8 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                <span style={{fontFamily:MN,fontSize:"11.5px",color:"rgba(255,255,255,0.62)",letterSpacing:"0.18em"}}>{t("JOINT CONTROL","GELENKSTEUERUNG")}</span>
                <div className="flex gap-2">
                  <button onClick={()=>setAuto(a=>!a)} className="border px-3 py-2 transition-colors" style={{fontFamily:MN,fontSize:"11.5px",letterSpacing:"0.12em",color:auto?"#111":"rgba(255,255,255,0.72)",background:auto?"#fff":"transparent",borderColor:auto?"#fff":"rgba(255,255,255,0.2)"}}>{auto?"■ AUTO":"▶ AUTO"}</button>
                  <button onClick={()=>{stopAuto();trail.current=[];setAngles([34,58,-42]);}} className="border border-white/20 px-3 py-2 transition-colors hover:border-white/50" style={{fontFamily:MN,fontSize:"11.5px",color:"rgba(255,255,255,0.72)",letterSpacing:"0.12em",background:"transparent"}}>RESET</button>
                </div>
              </div>
              <div className="space-y-9">
                {angles.map((angle,i)=>(
                  <label key={i} className="block">
                    <span className="mb-3 flex items-center justify-between">
                      <span style={{fontFamily:MN,fontSize:"12.5px",color:"rgba(255,255,255,0.7)",letterSpacing:"0.16em"}}>J{i+1} / {[t("BASE","BASIS"),t("ELBOW","ELLBOGEN"),t("WRIST","HANDGELENK")][i]}</span>
                      <span style={{fontFamily:BG,fontWeight:800,fontSize:"1.25rem",fontVariantNumeric:"tabular-nums"}}>{angle>0?"+":""}{Math.round(angle)}°</span>
                    </span>
                    <input aria-label={`Joint ${i+1} angle`} type="range" min={LIM[i][0]} max={LIM[i][1]} step={1} value={Math.round(angle)} onChange={event=>update(i,Number(event.target.value))} className="kin-range w-full"/>
                  </label>
                ))}
              </div>
            </div>
            <div className="mt-12 grid grid-cols-2 border-l border-t border-white/10">
              {[["X",ee.x-base.x],["Y",base.y-ee.y],["REACH",Math.hypot(ee.x-base.x,ee.y-base.y)],["DOF",3]].map(([label,value])=><div key={label as string} className="border-b border-r border-white/10 p-4"><div style={{fontFamily:MN,fontSize:"11.5px",color:"rgba(255,255,255,0.58)",letterSpacing:"0.14em"}}>{label}</div><div className="mt-2" style={{fontFamily:BG,fontWeight:850,fontSize:"1.35rem",fontVariantNumeric:"tabular-nums"}}>{typeof value==="number"&&label!=="DOF"?value.toFixed(1):value}</div></div>)}
            </div>
          </div>
        </div>
        </ScanReveal>
      </div>
    </section>
  );
}

/* ─── STATEMENT ──────────────────────────────────────────────────── */
export function Statement() {
  const ref=useRef<HTMLElement>(null);
  const {scrollYProgress}=useScroll({target:ref,offset:["start end","end start"]});
  const scale=useTransform(scrollYProgress,[0,0.4,0.6,1],[0.88,1,1,0.88]);
  const op=useTransform(scrollYProgress,[0,0.28,0.72,1],[0,1,1,0]);
  return (
    <section ref={ref} className="min-h-[70svh] md:min-h-[82svh] py-20 md:py-32 flex items-center justify-center overflow-hidden border-b" style={{borderColor:BRD,position:"relative"}}>
      <CircuitBg opacity={0.038}/><HexDotBg opacity={0.026}/>
      <GearDecor size={320} teeth={22} speed={52} opacity={0.038} x="-5%" y="-18%"/>
      <GearDecor size={200} teeth={16} speed={36} opacity={0.04} x="83%" y="58%" reverse/>
      <HUDFrame label="ENGINEERING_PHILOSOPHY"/>
      <div className="absolute inset-0 pointer-events-none" style={{background:"radial-gradient(ellipse 60% 50% at 50% 50%,rgba(255,255,255,0.016) 0%,transparent 100%)"}}/>
      <motion.div style={{scale,opacity:op}} className="px-6 md:px-14 text-center max-w-6xl">
        <div className="mb-12 flex items-center justify-center gap-3">
          <div style={{width:20,height:1,background:"rgba(255,255,255,0.14)"}}/>
          <TypeBot text={t("ENGINEERING PHILOSOPHY","ENGINEERING-PHILOSOPHIE")} delay={0.2} speed={28} style={{fontFamily:MN,fontSize:"11.5px",color:"rgba(255,255,255,0.74)",letterSpacing:"0.35em"}}/>
          <div style={{width:20,height:1,background:"rgba(255,255,255,0.14)"}}/>
        </div>
        <h2 style={{fontFamily:BG,fontWeight:900,letterSpacing:"-0.046em",lineHeight:0.86,fontSize:"clamp(3rem,8.5vw,9rem)"}}>
          <WordReveal text={t("Automation only","Automation zählt")} delay={0} stagger={0.1}/><br className="hidden md:block"/>{" "}
          <WordReveal text={t("counts when it","nur, wenn sie")} delay={0.22} stagger={0.068}/><br className="hidden md:block"/>{" "}
          <WordReveal text={t("works every time,","jedes Mal funktioniert,")} delay={0.46} stagger={0.068} color="rgba(255,255,255,0.58)"/><br className="hidden md:block"/>{" "}
          <WordReveal text={t("not just in demos.","nicht nur in Demos.")} delay={0.7} stagger={0.068} color="rgba(255,255,255,0.58)"/>
        </h2>
        <motion.div initial={{scaleX:0}} whileInView={{scaleX:1}} viewport={{once:false}} transition={{delay:1.1,duration:1.2,ease:[0.22,1,0.36,1]}} className="mt-14 mx-auto origin-left" style={{width:72,height:1,background:"rgba(255,255,255,0.18)"}}/>
      </motion.div>
    </section>
  );
}

/* ─── ABOUT ──────────────────────────────────────────────────────── */
export function About() {
  const ref=useRef<HTMLElement>(null);
  const {scrollYProgress}=useScroll({target:ref,offset:["start end","end start"]});
  const imgY=useTransform(scrollYProgress,[0,1],[-80,80]);
  const numY=useTransform(scrollYProgress,[0,1],[60,-60]);
  const STATS=[{to:4,suf:"+",l:t("Robot Platforms","Roboterplattformen")},{to:2,suf:"",l:t("Industry Roles","Industriestationen")},{to:3,suf:"+",l:t("Vision Systems","Vision-Systeme")},{to:2,suf:t(" yrs"," J."),l:t("Industry Experience","Industrieerfahrung")}];
  return (
    <section ref={ref} id="about" data-theme="light" style={{background:LIGHT_BG,position:"relative"}}>
      <HexDotBg opacity={0.044} dark={false}/>
      <div className="absolute inset-0 pointer-events-none" style={{backgroundImage:"repeating-linear-gradient(45deg,rgba(0,0,0,0.016) 0px,rgba(0,0,0,0.016) 1px,transparent 1px,transparent 30px)"}}/>
      <HUDFrame label="02_ABOUT" dark={false}/>
      <GearDecor size={250} teeth={20} speed={44} opacity={0.05} dark={false} x="76%" y="5%"/>
      <GearDecor size={130} teeth={12} speed={28} opacity={0.044} dark={false} x="-2%" y="66%" reverse/>
      <motion.div style={{y:numY}} className="absolute right-0 top-0 pointer-events-none select-none overflow-hidden" aria-hidden>
        <span style={{fontFamily:BG,fontWeight:900,fontSize:"clamp(12rem,30vw,26rem)",color:"rgba(0,0,0,0.036)",lineHeight:1,letterSpacing:"-0.055em"}}>02</span>
      </motion.div>
      <div className="relative px-5 md:px-14 py-20 md:py-36 max-w-screen-2xl mx-auto">
        <div className="flex justify-between items-baseline border-b pb-6 mb-12 md:pb-7 md:mb-20" style={{borderColor:"rgba(0,0,0,0.1)"}}>
          <TypeBot text={t("02 / ABOUT","02 / ÜBER MICH")} delay={0.1} speed={28} style={{fontFamily:MN,fontSize:"13.5px",color:"rgba(0,0,0,0.62)",letterSpacing:"0.26em"}}/>
          <span className="hidden sm:block" style={{fontFamily:MN,fontSize:"12.5px",color:"rgba(0,0,0,0.66)",letterSpacing:"0.12em"}}>LEVERKUSEN · TU DORTMUND</span>
        </div>
        <div className="mb-14 md:mb-24 max-w-6xl">
          <p style={{fontFamily:BG,fontWeight:900,letterSpacing:"-0.038em",fontSize:"clamp(2rem,5.2vw,4.8rem)",lineHeight:1.03,color:"#0a0a0a"}}>
            <WordReveal text={t("I build robots that","Ich baue Roboter, die")} delay={0} stagger={0.07}/>{" "}
            <WordReveal text={t("see, decide,","sehen, entscheiden")} delay={0.22} stagger={0.065}/>{" "}
            <WordReveal text={t("and act — reliably.","und handeln – zuverlässig.")} delay={0.46} stagger={0.06}/>
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 border-t border-l mb-14 md:mb-24" style={{borderColor:"rgba(0,0,0,0.08)"}}>
          {STATS.map((s,i)=>(
            <motion.div key={s.l} initial={{opacity:0,y:22}} whileInView={{opacity:1,y:0}} viewport={{once:false}} transition={{delay:i*0.07}} className="border-r border-b px-7 py-9" style={{borderColor:"rgba(0,0,0,0.08)"}}>
              <div style={{fontFamily:BG,fontWeight:900,fontSize:"3.8rem",lineHeight:1,color:"#0a0a0a"}}><Counter to={s.to} suffix={s.suf}/></div>
              <div style={{fontFamily:MN,fontSize:"12.5px",color:"rgba(0,0,0,0.62)",marginTop:"10px",letterSpacing:"0.12em",lineHeight:1.5}}>{s.l.toUpperCase()}</div>
            </motion.div>
          ))}
        </div>
        <div className="grid gap-16 items-start lg:grid-cols-[1fr_400px]">
          {/* ── Left column ── */}
          <div className="flex flex-col gap-12">
            {/* Lede paragraph — BG font, large */}
            <motion.p initial={{opacity:0,y:18}} whileInView={{opacity:1,y:0}} viewport={{once:false}} transition={{duration:0.9,ease:[0.22,1,0.36,1]}}
              style={{fontFamily:BG,fontWeight:600,fontSize:"clamp(1.18rem,2.2vw,1.62rem)",letterSpacing:"-0.018em",lineHeight:1.52,color:"#0a0a0a"}}>
              {t("I take robots from concept to commissioning — building, configuring, and testing automated workflows that hold up in real industrial and laboratory environments.","Ich bringe Roboter vom Konzept bis zur Inbetriebnahme – ich baue, konfiguriere und teste automatisierte Abläufe, die in echten Industrie- und Laborumgebungen bestehen.")}
            </motion.p>

            {/* Two supporting paras — DM Mono, tighter */}
            <div className="space-y-5">
              {[t("Proven track record integrating Universal Robots and Stäubli platforms with vision systems — SensoPart, Intel RealSense, CubeEye — into reliable automated workflows using Python, OpenCV, and Open3D.","Nachweisliche Erfahrung in der Integration von Universal-Robots- und Stäubli-Plattformen mit Vision-Systemen – SensoPart, Intel RealSense, CubeEye – zu zuverlässigen automatisierten Abläufen mit Python, OpenCV und Open3D."),
                t("Skilled across the full lifecycle: feasibility analysis, software development, simulation validation, on-site commissioning, troubleshooting, and structured technical documentation for handover.","Erfahren im gesamten Lebenszyklus: Machbarkeitsanalyse, Softwareentwicklung, Simulationsvalidierung, Inbetriebnahme vor Ort, Fehlersuche und strukturierte technische Dokumentation für die Übergabe.")
              ].map((t,i)=>(
                <motion.p key={i} initial={{opacity:0,clipPath:"inset(0 100% 0 0)"}} whileInView={{opacity:1,clipPath:"inset(0 0% 0 0)"}} viewport={{once:false}} transition={{delay:i*0.14,duration:1.1,ease:[0.22,1,0.36,1]}}
                  style={{fontFamily:BODY,fontSize:"clamp(16px,1.35vw,18px)",color:"rgba(0,0,0,0.72)",lineHeight:1.75,maxWidth:"68ch"}}>{t}</motion.p>
              ))}
            </div>

            {/* Languages + social */}
            <div className="flex flex-col gap-8">
              {/* Languages */}
              <div>
                <div style={{fontFamily:MN,fontSize:"12.5px",color:"rgba(0,0,0,0.72)",letterSpacing:"0.22em",marginBottom:16}}>{t("LANGUAGES","SPRACHEN")}</div>
                <div className="flex flex-col gap-4">
                  {[{l:t("English","Englisch"),code:"EN",level:"C1",pct:88},{l:"Deutsch",code:"DE",level:"B1",pct:48}].map(({l,code,level,pct},i)=>(
                    <div key={l} className="flex items-center gap-4">
                      <span style={{fontFamily:MN,fontSize:"12.5px",color:"rgba(0,0,0,0.72)",letterSpacing:"0.14em",minWidth:24}}>{code}</span>
                      <div style={{flex:1,height:1,background:"rgba(0,0,0,0.08)",position:"relative",overflow:"hidden"}}>
                        <motion.div initial={{width:"0%"}} whileInView={{width:`${pct}%`}} viewport={{once:false}} transition={{delay:i*0.15+0.4,duration:1.1,ease:[0.22,1,0.36,1]}} style={{position:"absolute",top:0,left:0,height:"100%",background:"rgba(0,0,0,0.35)"}}/>
                      </div>
                      <span style={{fontFamily:BG,fontWeight:800,fontSize:"1rem",color:"#0a0a0a",letterSpacing:"-0.01em",minWidth:24}}>{level}</span>
                      <span style={{fontFamily:MN,fontSize:"12.5px",color:"rgba(0,0,0,0.72)",letterSpacing:"0.08em"}}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Social links */}
              <div className="flex gap-6">
                {[{I:Linkedin,l:"LinkedIn",href:"https://www.linkedin.com/in/alphin-francis"},{I:Mail,l:t("Email","E-Mail"),href:"mailto:alphinfrancis7@gmail.com"}].map(({I,l,href})=>(
                  <a key={l} href={href} className="flex items-center gap-2 transition-opacity hover:opacity-100" style={{fontFamily:MN,fontSize:"13.5px",color:"rgba(0,0,0,0.68)",letterSpacing:"0.08em",opacity:0.8,textDecoration:"none"}}><I size={13}/> {l}</a>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right column — photo + spec panel ── */}
          <div className="flex flex-col gap-0">
            <ScanReveal dark={false} className="overflow-hidden" style={{height:480,borderRadius:"2px 2px 0 0"}}>
              <motion.div style={{y:imgY,height:"128%",position:"relative"}}>
              <ImageWithFallback src={alphinPhoto} alt="Alphin Francis" className="w-full h-full object-cover object-top" style={{filter:"contrast(1.08) brightness(0.92)"}}/>
            </motion.div>
              <HUDFrame dark={false} sublabel="SUBJECT_001·2026"/>
              <div className="absolute bottom-0 left-0 right-0 px-4 py-3 flex justify-between" style={{borderTop:"1px solid rgba(0,0,0,0.1)"}}>
                <TypeBot text="ALPHIN FRANCIS · TU DORTMUND" delay={0.3} speed={30} style={{fontFamily:MN,fontSize:"11.5px",color:"rgba(0,0,0,0.69)",letterSpacing:"0.12em"}}/>
                <span style={{fontFamily:MN,fontSize:"11.5px",color:"rgba(0,0,0,0.69)",letterSpacing:"0.12em"}}>LEVERKUSEN, DE</span>
              </div>
            </ScanReveal>

          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── TIMELINE ───────────────────────────────────────────────────── */
export function Timeline() {
  return (
    <section id="experience" className="px-5 md:px-14 py-20 md:py-32 border-t" style={{borderColor:BRD,position:"relative"}}>
      <CircuitBg opacity={0.032}/>
      <GearDecor size={190} teeth={16} speed={38} opacity={0.042} x="88%" y="8%" reverse/>
      <HUDFrame label="03_EXPERIENCE"/>
      <div className="relative max-w-screen-xl mx-auto">
        <div className="flex justify-between items-baseline border-b pb-6 mb-12 md:pb-7 md:mb-20" style={{borderColor:BRD}}>
            <TypeBot text={t("03 / EXPERIENCE","03 / ERFAHRUNG")} delay={0.1} speed={28} style={{fontFamily:MN,fontSize:"12.5px",color:"rgba(255,255,255,0.68)",letterSpacing:"0.26em"}}/>
        </div>
        {TIMELINE.map((item,i)=>(
          <motion.div key={item.year} initial={{opacity:0,y:36}} whileInView={{opacity:1,y:0}} viewport={{once:false,margin:"-12%"}} transition={{delay:i*0.09,duration:0.82,ease:[0.22,1,0.36,1]}} className="grid md:grid-cols-[minmax(170px,210px)_1fr] border-b" style={{borderColor:BRD}}>
            <div className="py-8 md:pr-10">
              <div style={{fontFamily:BG,fontWeight:900,fontSize:"clamp(1.2rem,1.9vw,1.75rem)",lineHeight:1,color:"rgba(255,255,255,0.54)",letterSpacing:"-0.04em",whiteSpace:"nowrap"}}>{item.year}</div>
            </div>
            <div className="relative pb-8 md:pt-8 md:pl-12 border-t md:border-t-0 md:border-l" style={{borderColor:BRD}}>
              <motion.span aria-hidden className="absolute -left-[5px] top-10 hidden h-[9px] w-[9px] rounded-full border border-white/60 bg-[#080808] md:block" initial={{scale:0}} whileInView={{scale:1}} viewport={{once:false}} transition={{delay:i*0.09+0.25,type:"spring",stiffness:300,damping:15}}/>
              <div className="mb-4 overflow-hidden">
                <motion.div initial={{y:"105%"}} whileInView={{y:"0%"}} viewport={{once:false,margin:"-15%"}} transition={{delay:i*0.08+0.14,duration:0.72,ease:[0.22,1,0.36,1]}}>
                  <div className="flex items-baseline gap-4 flex-wrap">
                    <TypeBot text={item.role} delay={i*0.1+0.2} speed={36} style={{fontFamily:BG,fontWeight:900,fontSize:"clamp(1.4rem,2.8vw,2.1rem)",letterSpacing:"-0.022em"}}/>
                    <span style={{fontFamily:MN,fontSize:"12.5px",color:"rgba(255,255,255,0.66)",letterSpacing:"0.1em",border:"1px solid rgba(255,255,255,0.16)",padding:"4px 10px",borderRadius:99}}>{item.org}</span>
                  </div>
                </motion.div>
              </div>
              <motion.p initial={{opacity:0,clipPath:"inset(0 100% 0 0)"}} whileInView={{opacity:1,clipPath:"inset(0 0% 0 0)"}} viewport={{once:false}} transition={{delay:i*0.08+0.3,duration:1.0,ease:[0.22,1,0.36,1]}} style={{fontFamily:BODY,fontSize:"16.5px",color:"rgba(255,255,255,0.76)",lineHeight:1.75,maxWidth:"92ch"}}>{item.detail}</motion.p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ─── SKILLS ─────────────────────────────────────────────────────── */
export function Skills() {
  return (
    <section id="skills" className="px-5 md:px-14 py-20 md:py-32 border-t" style={{borderColor:BRD,position:"relative"}}>
      <CircuitBg opacity={0.036}/><HexDotBg opacity={0.024}/>
      <HUDFrame label="04_SKILLS"/>
      <GearDecor size={240} teeth={20} speed={42} opacity={0.04} x="-4%" y="58%"/>
      <div className="relative">
        <div className="flex justify-between items-baseline border-b pb-6 mb-12 md:pb-7 md:mb-20" style={{borderColor:BRD}}>
          <TypeBot text={t("04 / SKILLS & STACK","04 / SKILLS & TOOLS")} delay={0.1} speed={28} style={{fontFamily:MN,fontSize:"12.5px",color:"rgba(255,255,255,0.68)",letterSpacing:"0.26em"}}/>
          <TypeBot text={t("ENGINEERING DOMAINS","FACHBEREICHE")} delay={0.4} speed={25} style={{fontFamily:MN,fontSize:"12.5px",color:"rgba(255,255,255,0.70)",letterSpacing:"0.12em"}}/>
        </div>
        <div className="grid md:grid-cols-[280px_1fr] gap-16 items-start">
          <motion.div initial={{opacity:0,scale:0.9}} whileInView={{opacity:1,scale:1}} viewport={{once:false}} transition={{duration:1.0,ease:[0.22,1,0.36,1]}}>
            <SkillRadar/>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 border-t border-l" style={{borderColor:BRD}}>
            {SKILLS_DOMAINS.map((row,ri)=>(
              <motion.div key={row.label} initial={{opacity:0,y:22}} whileInView={{opacity:1,y:0}} viewport={{once:false}} transition={{delay:ri*0.08,duration:0.78,ease:[0.22,1,0.36,1]}}
                className="border-r border-b transition-colors duration-300" style={{borderColor:BRD}}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.02)";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="transparent";}}>
                <div className="px-7 pt-7 pb-4 flex items-center gap-3" style={{borderBottom:`1px solid ${BRD}`}}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{opacity:0.3}}><circle cx="5" cy="5" r="4" stroke="white" strokeWidth="0.8"/><circle cx="5" cy="5" r="2" stroke="white" strokeWidth="0.7"/></svg>
                  <TypeBot text={row.label.toUpperCase()} delay={ri*0.08} speed={30} style={{fontFamily:MN,fontSize:"12px",color:"rgba(255,255,255,0.62)",letterSpacing:"0.28em"}}/>
                </div>
                <div className="px-7 py-6 flex flex-wrap gap-2.5">
                  {row.items.map((s,si)=>(
                    <motion.span key={s} initial={{opacity:0,scale:0.9}} whileInView={{opacity:1,scale:1}} viewport={{once:false}} transition={{delay:ri*0.06+si*0.04}}
                      style={{fontFamily:BG,fontWeight:700,fontSize:"clamp(0.88rem,1.7vw,1.25rem)",letterSpacing:"-0.014em",border:`1px solid ${BRD}`,padding:"6px 14px",borderRadius:2,display:"inline-block"}}>{s}</motion.span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── AUTOMATION LOOP ────────────────────────────────────────────── */
export function SystemsLab() {
  return (
    <section className="relative overflow-hidden border-t px-5 py-20 md:px-14 md:py-32" style={{borderColor:BRD}}>
      <CircuitBg opacity={0.028}/>
      <HUDFrame label="05_AUTOMATION_LOOP" sublabel="PERCEPTION_TO_DEPLOYMENT"/>
      <motion.div
        className="absolute left-0 right-0 top-0 h-px"
        style={{background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent)"}}
        animate={{x:["-100%","100%"]}}
        transition={{duration:5,repeat:Infinity,repeatDelay:4,ease:"linear"}}
      />
      <div className="relative mx-auto max-w-screen-xl">
        <div className="mb-16 grid gap-8 border-b pb-8 md:grid-cols-[1fr_1.2fr] md:items-end" style={{borderColor:BRD}}>
          <div>
            <TypeBot text={t("05 / AUTOMATION LOOP","05 / AUTOMATIONSKREISLAUF")} speed={28} style={{fontFamily:MN,fontSize:"12.5px",color:"rgba(255,255,255,0.7)",letterSpacing:"0.26em"}}/>
            <h2 className="mt-6" style={{fontFamily:BG,fontWeight:900,fontSize:"clamp(3rem,7vw,7rem)",letterSpacing:"-0.05em",lineHeight:0.84}}>
              {t("FROM SENSOR","VOM SENSOR")}<br/><span style={{color:"rgba(255,255,255,0.58)"}}>{t("TO SYSTEM.","ZUM SYSTEM.")}</span>
            </h2>
          </div>
          <motion.p initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:false}} transition={{duration:0.8}}
            style={{fontFamily:BODY,fontSize:"17px",color:"rgba(255,255,255,0.78)",lineHeight:1.75,maxWidth:"58ch"}}>
            {t("I work across the complete automation lifecycle. The interface below visualizes how I turn raw sensor data into simulated robot behavior, then a commissioned and documented workflow.","Ich arbeite über den gesamten Automatisierungszyklus. Die Übersicht unten zeigt, wie aus rohen Sensordaten simuliertes Roboterverhalten und daraus ein in Betrieb genommener, dokumentierter Workflow wird.")}
          </motion.p>
        </div>

        <div className="grid border-l border-t lg:grid-cols-3" style={{borderColor:BRD}}>
          {AUTOMATION_PHASES.map((project,i)=>(
            <motion.article
              key={project.id}
              initial={{opacity:0,y:34}}
              whileInView={{opacity:1,y:0}}
              viewport={{once:false,margin:"-10%"}}
              transition={{delay:i*0.1,duration:0.8,ease:[0.22,1,0.36,1]}}
              whileHover={{backgroundColor:"rgba(255,255,255,0.035)"}}
              className="group relative min-h-[360px] overflow-hidden border-b border-r p-7 md:p-9"
              style={{borderColor:BRD}}
            >
              <motion.div className="absolute left-0 top-0 h-px bg-white" initial={{width:"0%"}} whileInView={{width:"100%"}} viewport={{once:false}} transition={{delay:0.35+i*0.12,duration:1.2}}/>
              <span style={{fontFamily:MN,fontSize:"12.5px",color:"rgba(255,255,255,0.74)",letterSpacing:"0.2em"}}>{project.id}</span>
              <div className="my-10 h-20">
                <svg viewBox="0 0 260 80" className="h-full w-full overflow-visible" fill="none" aria-hidden="true">
                  <path d="M0 58 H42 L58 22 H91 L108 58 H145 L160 35 H201 L216 58 H260" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
                  <motion.path d="M0 58 H42 L58 22 H91 L108 58 H145 L160 35 H201 L216 58 H260" stroke="rgba(255,255,255,0.48)" strokeWidth="1.2" strokeDasharray="24 236" animate={{strokeDashoffset:[260,0]}} transition={{duration:3.4,repeat:Infinity,ease:"linear",delay:i*0.45}}/>
                  {[42,58,91,108,145,160,201,216].map((x,n)=><circle key={x} cx={x} cy={[58,22,22,58,58,35,35,58][n]} r="2.3" fill={n%3===i?"rgba(255,255,255,0.72)":"rgba(255,255,255,0.24)"}/>)}
                </svg>
              </div>
              <h3 style={{fontFamily:BG,fontWeight:900,fontSize:"clamp(1.7rem,3vw,2.6rem)",letterSpacing:"-0.035em",lineHeight:0.95}}>{project.title}</h3>
              <div className="mt-4" style={{fontFamily:MN,fontSize:"12.5px",color:"rgba(255,255,255,0.62)",letterSpacing:"0.1em",lineHeight:1.7}}>{project.meta}</div>
              <p className="mt-7" style={{fontFamily:BODY,fontSize:"16px",color:"rgba(255,255,255,0.76)",lineHeight:1.7}}>{project.body}</p>
              <ArrowUpRight size={18} className="absolute bottom-7 right-7 text-white/30 transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-white"/>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
