import { useState, useEffect, useRef, useCallback } from "react";
import {
  motion, useScroll, useTransform, useSpring,
  useMotionValue, useInView, AnimatePresence, useMotionTemplate,
  type MotionValue,
} from "motion/react";
import Lenis from "lenis";
import { ArrowUpRight, Github, Linkedin, Mail, ExternalLink } from "lucide-react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import alphinPhoto from "@/imports/Picture3.png";
import alphinCV from "@/imports/AlphinFrancis.pdf";
import alphinCVPage1 from "@/imports/AlphinFrancis-page-1.png";
import alphinCVPage2 from "@/imports/AlphinFrancis-page-2.png";
import { type V3, type Face, type Cam, m3T, m3Ry, m3Rx, m3Rz, m3Mul, m3P, v3Sub, v3Dot, v3Norm, addBox, addCyl, makeCam, proj, runCanvas } from "@/app/components/robot3d/engine";
import { Preloader3D, RobotShowcase, RobotHeadCompanion } from "@/app/components/robot3d/robots";

import { BG, MN, SC, scrollToTarget, SKILLS_DOMAINS, SIMPLE } from "../lib";

/* ─── GEAR ───────────────────────────────────────────────────────── */
export function GearDecor({ size=200, teeth=16, speed=26, opacity=0.045, reverse=false, x=0, y=0, dark=true }:
  { size?:number; teeth?:number; speed?:number; opacity?:number; reverse?:boolean; x?:number|string; y?:number|string; dark?:boolean }) {
  if(SIMPLE)return null;
  const r=size/2, outer=r*0.88, inner=r*0.63, bore=r*0.18, hub=r*0.28;
  const stroke = dark ? "white" : "rgba(0,0,0,0.55)";
  let d="";
  for(let i=0;i<teeth;i++){
    const a1=((i+0.09)/teeth)*Math.PI*2, a2=((i+0.38)/teeth)*Math.PI*2;
    const a3=((i+0.62)/teeth)*Math.PI*2, a4=((i+0.91)/teeth)*Math.PI*2;
    const c=Math.cos,s=Math.sin;
    if(i===0) d+=`M ${r+inner*c(a1)} ${r+inner*s(a1)} `;
    d+=`L ${r+outer*c(a2)} ${r+outer*s(a2)} L ${r+outer*c(a3)} ${r+outer*s(a3)} L ${r+inner*c(a4)} ${r+inner*s(a4)} `;
  }
  d+="Z";
  const spk=(a:number)=>`M ${r+Math.cos(a)*bore} ${r+Math.sin(a)*bore} L ${r+Math.cos(a)*hub*2.2} ${r+Math.sin(a)*hub*2.2}`;
  return (
    <svg width={size} height={size} style={{position:"absolute",left:x,top:y,opacity,pointerEvents:"none"}}>
      <style>{`@keyframes gs{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <g style={{transformOrigin:`${r}px ${r}px`,animation:`gs ${speed}s linear infinite${reverse?" reverse":""}`}}>
        <path d={d} fill="none" stroke={stroke} strokeWidth="0.9"/>
        <circle cx={r} cy={r} r={inner*0.72} fill="none" stroke={stroke} strokeWidth="0.65"/>
        <circle cx={r} cy={r} r={hub} fill="none" stroke={stroke} strokeWidth="0.8"/>
        <circle cx={r} cy={r} r={bore} fill="none" stroke={stroke} strokeWidth="0.65"/>
        {[0,1,2,3,4,5].map(i=><path key={i} d={spk((i/6)*Math.PI*2)} stroke={stroke} strokeWidth="0.55" fill="none"/>)}
      </g>
    </svg>
  );
}

/* ─── TYPEBOT: robotic typewriter ────────────────────────────────── */
export function TypeBot({ text, delay=0, speed=48, className="", style={}, cursor=true }:
  { text:string; delay?:number; speed?:number; className?:string; style?:React.CSSProperties; cursor?:boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once:false, margin:"-8% 0px" });
  const [chars, setChars] = useState<Array<{ch:string, locked:boolean}>>([]);
  const [active, setActive] = useState(false);
  const [done, setDone] = useState(false);

  // replays every time it scrolls back into view; all pending timers die with the effect
  useEffect(()=>{
    setChars([]);setDone(false);setActive(false);
    if(!inView) return;
    let dead=false;
    const timers:number[]=[];
    const later=(fn:()=>void,ms:number)=>{timers.push(window.setTimeout(()=>{if(!dead)fn();},ms));};
    later(()=>{
      setActive(true);
      let idx=0;
      const type=()=>{
        if(idx>=text.length){ setDone(true); later(()=>setActive(false),900); return; }
        const i=idx,target=text[i];
        if(target===" "){ setChars(p=>[...p,{ch:" ",locked:true}]); idx++; later(type, speed*0.5); return; }
        // flash wrong char then lock in correct
        const wrong = SC[Math.floor(Math.random()*SC.length)];
        setChars(p=>[...p,{ch:wrong,locked:false}]);
        later(()=>{
          setChars(p=>{ const n=[...p]; n[i]={ch:target,locked:true}; return n; });
          idx++;
          later(type, speed*(0.85+Math.random()*0.35));
        }, 62);
      };
      type();
    }, delay*1000);
    return ()=>{dead=true;timers.forEach(clearTimeout);};
  },[inView,text,delay,speed]);

  if(SIMPLE)return <span ref={ref} className={className} style={style}>{text}</span>;
  return (
    <span ref={ref} className={className} style={style}>
      {chars.map((c,i)=>(
        <span key={i} style={{color:c.locked?"inherit":"rgba(255,255,255,0.3)"}}>{c.ch}</span>
      ))}
      {cursor&&active&&!done&&(
        <span style={{display:"inline-block",width:"2px",height:"0.82em",background:"currentColor",marginLeft:"2px",verticalAlign:"text-bottom",animation:"termBlink 0.55s step-end infinite"}}/>
      )}
    </span>
  );
}

/* shared between the hero arm canvas, the writer and the projection overlay (client coords) */
/* ─── PARTICLE FIELD ─────────────────────────────────────────────── */
export function ParticleField() {
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    const el=ref.current; if(!el) return;
    const ctx=el.getContext("2d"); if(!ctx) return;
    const resize=()=>{el.width=el.offsetWidth;el.height=el.offsetHeight;};
    resize(); window.addEventListener("resize",resize);
    const N=52;
    const pts=Array.from({length:N},()=>({x:Math.random()*el.width,y:Math.random()*el.height,vx:(Math.random()-0.5)*0.21,vy:(Math.random()-0.5)*0.21,r:Math.random()*1.1+0.35}));
    const packets:Array<{fi:number,ti:number,t:number,spd:number}>=[];
    let raf:number,vis=true;
    const io=new IntersectionObserver(([e])=>{vis=e.isIntersecting;});io.observe(el);
    const draw=()=>{
      if(!vis){raf=requestAnimationFrame(draw);return;}
      const W=el.width,H=el.height;
      ctx.clearRect(0,0,W,H);
      for(const p of pts){p.x+=p.vx;p.y+=p.vy;if(p.x<0)p.x=W;if(p.x>W)p.x=0;if(p.y<0)p.y=H;if(p.y>H)p.y=0;}
      for(let i=0;i<N;i++) for(let j=i+1;j<N;j++){
        const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y,d=Math.sqrt(dx*dx+dy*dy);
        if(d<105){ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);ctx.strokeStyle=`rgba(255,255,255,${(1-d/105)*0.05})`;ctx.lineWidth=0.5;ctx.stroke();}
      }
      for(const p of pts){ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle="rgba(255,255,255,0.07)";ctx.fill();}
      if(Math.random()<0.01&&packets.length<5){
        const fi=Math.floor(Math.random()*N);
        for(let j=0;j<N;j++){if(j===fi) continue;const dx=pts[fi].x-pts[j].x,dy=pts[fi].y-pts[j].y;if(Math.sqrt(dx*dx+dy*dy)<105){packets.push({fi,ti:j,t:0,spd:0.016+Math.random()*0.01});break;}}
      }
      for(let i=packets.length-1;i>=0;i--){
        const pk=packets[i]; pk.t+=pk.spd;
        if(pk.t>=1){packets.splice(i,1);continue;}
        const px=pts[pk.fi].x+(pts[pk.ti].x-pts[pk.fi].x)*pk.t;
        const py=pts[pk.fi].y+(pts[pk.ti].y-pts[pk.fi].y)*pk.t;
        ctx.beginPath();ctx.arc(px,py,2,0,Math.PI*2);ctx.fillStyle="rgba(255,255,255,0.5)";ctx.fill();
      }
      raf=requestAnimationFrame(draw);
    };
    raf=requestAnimationFrame(draw);
    return()=>{cancelAnimationFrame(raf);io.disconnect();window.removeEventListener("resize",resize);};
  },[]);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none"/>;
}

/* ─── SCAN SWEEP ─────────────────────────────────────────────────── */
export function ScanSweep() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{zIndex:4}}>
      <motion.div className="absolute left-0 right-0"
        style={{height:1.5,background:"linear-gradient(to right,transparent 0%,rgba(255,255,255,0.04) 10%,rgba(255,255,255,0.16) 50%,rgba(255,255,255,0.04) 90%,transparent 100%)",boxShadow:"0 0 14px rgba(255,255,255,0.1)"}}
        animate={{top:["-2%","102%"]}} transition={{duration:7,repeat:Infinity,repeatDelay:13,ease:"linear"}}/>
      <motion.div className="absolute left-0 right-0"
        style={{height:64,background:"linear-gradient(to bottom,rgba(255,255,255,0.024) 0%,transparent 100%)"}}
        animate={{top:["-10%","94%"]}} transition={{duration:7,repeat:Infinity,repeatDelay:13,ease:"linear"}}/>
    </div>
  );
}

/* ─── DATA STREAM ────────────────────────────────────────────────── */
export function DataStream() {
  const [rows,setRows]=useState<string[]>([]);
  useEffect(()=>{
    const gen=()=>{
      const r=Math.random();
      if(r<0.2) return "0x"+Math.floor(Math.random()*0xFFFF).toString(16).padStart(4,"0").toUpperCase();
      if(r<0.4) return (Math.random()*999.9).toFixed(2);
      if(r<0.6) return Math.floor(Math.random()*2).toString().repeat(8);
      return ["SYNC","IDLE","READ","EXEC","WAIT","LOAD","INIT","POLL","ACK","NACK","BUSY","DONE"][Math.floor(Math.random()*12)];
    };
    setRows(Array.from({length:26},gen));
    const id=setInterval(()=>setRows(r=>{const n=[...r];n[Math.floor(Math.random()*n.length)]=gen();return n;}),150);
    return()=>clearInterval(id);
  },[]);
  return (
    <div className="absolute right-4 top-20 bottom-14 hidden lg:flex flex-col justify-between pointer-events-none" style={{width:80,zIndex:5}}>
      <div style={{fontFamily:MN,fontSize:"11.5px",color:"rgba(255,255,255,0.11)",letterSpacing:"0.15em",borderBottom:"1px solid rgba(255,255,255,0.05)",paddingBottom:4,marginBottom:3}}>SYS_DATA</div>
      {rows.map((d,i)=>(
        <div key={i} style={{fontFamily:MN,fontSize:"11.5px",color:"rgba(255,255,255,0.07)",letterSpacing:"0.05em",textAlign:"right",animation:"dataFlicker 3s infinite",animationDelay:`${i*0.12}s`}}>{d}</div>
      ))}
      <div style={{fontFamily:MN,fontSize:"11.5px",color:"rgba(255,255,255,0.08)",letterSpacing:"0.12em",borderTop:"1px solid rgba(255,255,255,0.05)",paddingTop:4,marginTop:3}}>RDY◆</div>
    </div>
  );
}

/* ─── HUD FRAME ──────────────────────────────────────────────────── */
/* ─── SECTION COUNTER ────────────────────────────────────────────── */
export function SectionCounter() {
  const SECS=["home","work","about","skills","contact"];
  const [cur,setCur]=useState(0);
  useEffect(()=>{
    const fn=()=>{
      for(let i=SECS.length-1;i>=0;i--){
        const el=document.getElementById(SECS[i]);
        if(el&&el.getBoundingClientRect().top<=window.innerHeight*0.55){setCur(i);break;}
      }
    };
    window.addEventListener("scroll",fn,{passive:true});fn();
    return()=>window.removeEventListener("scroll",fn);
  },[]);
  return (
    <div className="hidden md:flex" style={{position:"fixed",right:20,top:"50%",transform:"translateY(-50%)",zIndex:30,
      flexDirection:"column",alignItems:"center",gap:14,pointerEvents:"none"}}>
      {/* Dots */}
      {SECS.map((_,i)=>(
        <motion.div key={i} animate={{height:i===cur?20:6,background:i===cur?"rgba(255,255,255,0.65)":"rgba(255,255,255,0.14)"}}
          transition={{duration:0.35,ease:[0.22,1,0.36,1]}}
          style={{width:1.5,borderRadius:2}}/>
      ))}
      {/* Counter text — rotated */}
      <div style={{transform:"rotate(90deg)",marginTop:12,whiteSpace:"nowrap",
        fontFamily:"'DM Mono', monospace",fontSize:"11.5px",letterSpacing:"0.28em",
        color:"rgba(255,255,255,0.2)"}}>
        {String(cur+1).padStart(2,"0")} / {String(SECS.length).padStart(2,"0")}
      </div>
    </div>
  );
}

/* ─── ROBOTIC TRANSITION ─────────────────────────────────────────── */
export function RoboticTransition({onDone,tone,label}:{onDone:()=>void;tone:"black"|"white";label:string}) {
  const COLS=14,ROWS=8;
  const CHARS="01⬡⬢◈▣◉░▒▓";
  const [cells,setCells]=useState<number[]>(Array(COLS*ROWS).fill(0));
  const cover=tone==="black"?"#080808":"#f2f0ea";
  const ink=tone==="black"?"255,255,255":"8,8,8";
  useEffect(()=>{
    const cx=COLS/2,cy=ROWS/2;
    const order=[...Array(COLS*ROWS).keys()].sort((a,b)=>{
      const ax=a%COLS,ay=Math.floor(a/COLS);
      const bx=b%COLS,by=Math.floor(b/COLS);
      return Math.hypot(ax-cx,ay-cy)-Math.hypot(bx-cx,by-cy);
    });
    let i=0;
    const id=setInterval(()=>{
      if(i>=order.length){clearInterval(id);setTimeout(onDone,90);return;}
      setCells(p=>{
        const n=[...p];
        for(let batch=0;batch<12&&i<order.length;batch++,i++)n[order[i]]=1;
        return n;
      });
    },14);
    return()=>clearInterval(id);
  },[onDone]);
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.12}}
      style={{position:"fixed",inset:0,zIndex:9999,display:"grid",
        gridTemplateColumns:`repeat(${COLS},1fr)`,gridTemplateRows:`repeat(${ROWS},1fr)`}}>
      {cells.map((on,i)=>(
        <motion.div key={i} animate={{background:on?cover:"rgba(0,0,0,0)"}}
          transition={{duration:0.1}}
          style={{display:"flex",alignItems:"center",justifyContent:"center",
            border:on?`1px solid rgba(${ink},0.055)`:"1px solid transparent",
            fontFamily:"'DM Mono',monospace",fontSize:"11.5px",
            color:`rgba(${ink},0.2)`,lineHeight:1}}>
          {on?CHARS[Math.floor(Math.random()*CHARS.length)]:""}
        </motion.div>
      ))}
      <motion.div initial={{opacity:0,scaleX:0.8}} animate={{opacity:[0,1,1,0],scaleX:[0.8,1,1,1.08]}} transition={{duration:0.42,times:[0,0.3,0.74,1]}}
        style={{position:"absolute",left:"50%",top:"50%",transform:"translate(-50%,-50%)",color:`rgb(${ink})`,textAlign:"center",pointerEvents:"none",whiteSpace:"nowrap"}}>
        <div style={{fontFamily:MN,fontSize:"11.5px",letterSpacing:"0.38em",opacity:0.58}}>ROUTE EXECUTION</div>
        <div style={{fontFamily:BG,fontWeight:900,fontSize:"clamp(2rem,6vw,5.5rem)",letterSpacing:"-0.05em",lineHeight:0.9,marginTop:10}}>{label.toUpperCase()}</div>
        <motion.div initial={{scaleX:0}} animate={{scaleX:1}} transition={{duration:0.28}} style={{height:1,background:`rgba(${ink},0.5)`,marginTop:16,transformOrigin:"left"}}/>
      </motion.div>
      <motion.div initial={{scaleY:0}} animate={{scaleY:1}} transition={{duration:0.3}} style={{position:"absolute",left:"4vw",top:"8vh",bottom:"8vh",width:1,background:`rgba(${ink},0.28)`,transformOrigin:"top"}}/>
      <motion.div initial={{scaleY:0}} animate={{scaleY:1}} transition={{duration:0.3,delay:0.04}} style={{position:"absolute",right:"4vw",top:"8vh",bottom:"8vh",width:1,background:`rgba(${ink},0.28)`,transformOrigin:"bottom"}}/>
    </motion.div>
  );
}

/* ─── WORK MINI CANVAS ───────────────────────────────────────────── */
export function WorkMiniCanvas({type}:{type:number}) {
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    const canvas=ref.current;if(!canvas)return;
    const ctx=canvas.getContext("2d");if(!ctx)return;
    const W=canvas.width,H=canvas.height;
    let raf:number,T=0,vis=true;
    const io=new IntersectionObserver(([e])=>{vis=e.isIntersecting;});io.observe(canvas);
    const draw=()=>{
      if(!vis){raf=requestAnimationFrame(draw);return;}
      ctx.clearRect(0,0,W,H);T+=0.015;
      if(type===0){
        // Exoskeleton — 3-joint arm
        const base={x:W*0.5,y:H*0.78};
        const a1=Math.sin(T*0.7)*0.5+1.0,a12=a1+Math.sin(T*1.2+1)*0.6,a123=a12+Math.sin(T*0.9+2)*0.4;
        const j2={x:base.x+Math.cos(a1)*48,y:base.y-Math.sin(a1)*48};
        const j3={x:j2.x+Math.cos(a12)*38,y:j2.y-Math.sin(a12)*38};
        const ee={x:j3.x+Math.cos(a123)*24,y:j3.y-Math.sin(a123)*24};
        ctx.strokeStyle="rgba(255,255,255,0.55)";ctx.lineWidth=2;ctx.lineCap="round";
        ctx.beginPath();ctx.moveTo(base.x,base.y);ctx.lineTo(j2.x,j2.y);ctx.lineTo(j3.x,j3.y);ctx.lineTo(ee.x,ee.y);ctx.stroke();
        [base,j2,j3].forEach((p,i)=>{
          const r=[7,6,5][i];
          ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);
          ctx.strokeStyle="rgba(255,255,255,0.7)";ctx.lineWidth=1.4;ctx.stroke();
          ctx.beginPath();ctx.arc(p.x,p.y,2.2,0,Math.PI*2);ctx.fillStyle="rgba(255,255,255,0.8)";ctx.fill();
        });
        // Workspace arc
        ctx.setLineDash([3,6]);ctx.strokeStyle="rgba(255,255,255,0.12)";ctx.lineWidth=0.8;
        ctx.beginPath();ctx.arc(base.x,base.y,100,Math.PI*1.8,Math.PI*0.1);ctx.stroke();ctx.setLineDash([]);
        // Crosshair at EE
        const ch=8;ctx.strokeStyle="rgba(255,255,255,0.35)";ctx.lineWidth=0.8;
        ctx.beginPath();ctx.moveTo(ee.x-ch,ee.y);ctx.lineTo(ee.x-3,ee.y);ctx.moveTo(ee.x+3,ee.y);ctx.lineTo(ee.x+ch,ee.y);
        ctx.moveTo(ee.x,ee.y-ch);ctx.lineTo(ee.x,ee.y-3);ctx.moveTo(ee.x,ee.y+3);ctx.lineTo(ee.x,ee.y+ch);ctx.stroke();
      } else if(type===1){
        // Mobile robot — radar sweep
        const cx=W/2,cy=H/2,maxR=Math.min(W,H)*0.44;
        // Grid rings
        [0.33,0.66,1].forEach(f=>{
          ctx.beginPath();ctx.arc(cx,cy,maxR*f,0,Math.PI*2);
          ctx.strokeStyle=`rgba(255,255,255,${0.06+f*0.04})`;ctx.lineWidth=0.6;ctx.stroke();
        });
        // Cross
        ctx.strokeStyle="rgba(255,255,255,0.06)";ctx.lineWidth=0.5;
        ctx.beginPath();ctx.moveTo(cx-maxR,cy);ctx.lineTo(cx+maxR,cy);ctx.moveTo(cx,cy-maxR);ctx.lineTo(cx,cy+maxR);ctx.stroke();
        // Sweep
        const sweep=T*2;
        ctx.save();ctx.translate(cx,cy);ctx.rotate(sweep);
        const g=ctx.createLinearGradient(0,-maxR,0,0);
        g.addColorStop(0,"rgba(255,255,255,0)");g.addColorStop(0.4,"rgba(255,255,255,0.0)");
        g.addColorStop(1,"rgba(255,255,255,0.18)");
        ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,maxR,-Math.PI*0.4,0);ctx.closePath();ctx.fill();
        ctx.restore();
        // Blips
        const blips=[{r:0.45,a:0.8},{r:0.72,a:2.1},{r:0.28,a:4.5},{r:0.6,a:3.8}];
        blips.forEach(b=>{
          const age=((sweep-b.a)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);
          if(age<Math.PI*0.7){
            const alpha=(1-age/(Math.PI*0.7))*0.85;
            const px=cx+Math.cos(b.a)*maxR*b.r,py=cy+Math.sin(b.a)*maxR*b.r;
            ctx.beginPath();ctx.arc(px,py,3,0,Math.PI*2);
            ctx.fillStyle=`rgba(255,255,255,${alpha})`;ctx.fill();
          }
        });
        // Center dot
        ctx.beginPath();ctx.arc(cx,cy,3,0,Math.PI*2);ctx.fillStyle="rgba(255,255,255,0.7)";ctx.fill();
      } else if(type===2){
        // Perception system — hex pulse rings
        const cx=W/2,cy=H/2;
        for(let r=0;r<3;r++){
          const phase=((T*0.8)+r*0.35)%1;
          const rad=20+phase*70;const alpha=(1-phase)*0.5;
          ctx.beginPath();
          for(let s=0;s<6;s++){
            const a=(s/6)*Math.PI*2-Math.PI/6;
            const x=cx+Math.cos(a)*rad,y=cy+Math.sin(a)*rad;
            s===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
          }
          ctx.closePath();ctx.strokeStyle=`rgba(255,255,255,${alpha})`;ctx.lineWidth=1;ctx.stroke();
        }
        // Circuit nodes
        const nodes=[{x:0.2,y:0.25},{x:0.75,y:0.3},{x:0.15,y:0.7},{x:0.8,y:0.72},{x:0.5,y:0.5}];
        nodes.forEach((n,i)=>{
          const px=n.x*W,py=n.y*H;const pulse=Math.sin(T*2+i*1.2)*0.5+0.5;
          ctx.beginPath();ctx.arc(px,py,3+pulse*2,0,Math.PI*2);
          ctx.strokeStyle=`rgba(255,255,255,${0.2+pulse*0.3})`;ctx.lineWidth=1;ctx.stroke();
          ctx.beginPath();ctx.arc(px,py,1.5,0,Math.PI*2);ctx.fillStyle="rgba(255,255,255,0.6)";ctx.fill();
        });
        // Connecting traces
        [[0,4],[1,4],[2,4],[3,4]].forEach(([a,b])=>{
          const pa=nodes[a],pb=nodes[b];
          const flow=(T*1.5)%1;
          const gx=ctx.createLinearGradient(pa.x*W,pa.y*H,pb.x*W,pb.y*H);
          gx.addColorStop(Math.max(0,flow-0.25),"rgba(255,255,255,0)");
          gx.addColorStop(flow,"rgba(255,255,255,0.35)");
          gx.addColorStop(Math.min(1,flow+0.25),"rgba(255,255,255,0)");
          ctx.beginPath();ctx.moveTo(pa.x*W,pa.y*H);ctx.lineTo(pb.x*W,pb.y*H);
          ctx.strokeStyle=gx;ctx.lineWidth=1;ctx.stroke();
        });
      } else if(type===3) {
        // Voice assistant — neural signal network
        const layers=[[0.15],[0.35,0.58],[0.55,0.35,0.72],[0.75,0.5,0.62,0.38]];
        const xs=[0.18,0.38,0.62,0.82];
        const nodes:Array<{x:number,y:number,l:number,i:number}>=[];
        layers.forEach((ys,li)=>ys.forEach((y,ni)=>nodes.push({x:xs[li]*W,y:y*H,l:li,i:ni})));
        // Connections
        layers.forEach((ys,li)=>{
          if(li===layers.length-1)return;
          ys.forEach((_,ni)=>{
            layers[li+1].forEach((_,nj)=>{
              const from=nodes.find(n=>n.l===li&&n.i===ni)!;
              const to=nodes.find(n=>n.l===li+1&&n.i===nj)!;
              const pulse=((T*0.8+li*0.4+ni*0.2+nj*0.15)%1);
              const alpha=(Math.sin(T+li+ni*0.7))*0.5+0.5;
              ctx.beginPath();ctx.moveTo(from.x,from.y);ctx.lineTo(to.x,to.y);
              ctx.strokeStyle=`rgba(255,255,255,${alpha*0.12})`;ctx.lineWidth=0.7;ctx.stroke();
              // Pulse bead
              const bx=from.x+(to.x-from.x)*pulse,by=from.y+(to.y-from.y)*pulse;
              ctx.beginPath();ctx.arc(bx,by,1.5,0,Math.PI*2);
              ctx.fillStyle=`rgba(255,255,255,${alpha*0.45})`;ctx.fill();
            });
          });
        });
        // Nodes
        nodes.forEach(n=>{
          const pulse=Math.sin(T*1.5+n.l*0.8+n.i*0.5)*0.5+0.5;
          ctx.beginPath();ctx.arc(n.x,n.y,5+pulse*2,0,Math.PI*2);
          ctx.strokeStyle=`rgba(255,255,255,${0.3+pulse*0.4})`;ctx.lineWidth=1.2;ctx.stroke();
          ctx.beginPath();ctx.arc(n.x,n.y,2,0,Math.PI*2);ctx.fillStyle="rgba(255,255,255,0.7)";ctx.fill();
        });
      } else {
        // Load regulation — live weight gauge
        const cx=W/2,cy=H*0.62,r=54;
        const load=0.68+Math.sin(T*1.2)*0.17;
        ctx.lineWidth=8;ctx.lineCap="round";
        ctx.beginPath();ctx.arc(cx,cy,r,Math.PI*0.85,Math.PI*2.15);
        ctx.strokeStyle="rgba(255,255,255,0.08)";ctx.stroke();
        ctx.beginPath();ctx.arc(cx,cy,r,Math.PI*0.85,Math.PI*(0.85+1.3*load));
        ctx.strokeStyle="rgba(255,255,255,0.55)";ctx.stroke();
        for(let i=0;i<=12;i++){
          const a=Math.PI*(0.85+(i/12)*1.3);
          ctx.beginPath();
          ctx.moveTo(cx+Math.cos(a)*(r-12),cy+Math.sin(a)*(r-12));
          ctx.lineTo(cx+Math.cos(a)*(r-5),cy+Math.sin(a)*(r-5));
          ctx.strokeStyle="rgba(255,255,255,0.24)";ctx.lineWidth=0.8;ctx.stroke();
        }
        const needle=Math.PI*(0.85+1.3*load);
        ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(needle)*(r-15),cy+Math.sin(needle)*(r-15));
        ctx.strokeStyle="rgba(255,255,255,0.75)";ctx.lineWidth=1.5;ctx.stroke();
        ctx.beginPath();ctx.arc(cx,cy,4,0,Math.PI*2);ctx.fillStyle="white";ctx.fill();
        ctx.font="10px 'DM Mono',monospace";ctx.textAlign="center";
        ctx.fillStyle="rgba(255,255,255,0.5)";ctx.fillText(`${Math.round(load*100)}% LOAD`,cx,cy+27);
      }
      raf=requestAnimationFrame(draw);
    };
    raf=requestAnimationFrame(draw);
    return()=>{cancelAnimationFrame(raf);io.disconnect();};
  },[type]);
  return (
    <canvas ref={ref} width={200} height={140} className="hidden md:block"
      style={{position:"absolute",top:16,right:16,width:200,height:140,
        opacity:0.55,mixBlendMode:"screen",pointerEvents:"none"}}/>
  );
}

export function GlobalScanLine() {
  return (
    <motion.div style={{position:"fixed",left:0,right:0,height:2,pointerEvents:"none",zIndex:9998,
      background:"linear-gradient(to bottom,transparent,rgba(255,255,255,0.045) 50%,transparent)"}}
      animate={{top:["-1%","101%"]}} transition={{duration:8,repeat:Infinity,repeatDelay:10,ease:"linear"}}/>
  );
}
export function HUDCorners({lCol="rgba(255,255,255,0.35)",size=14}:{lCol?:string;size?:number}) {
  const s={position:"absolute" as const,width:size,height:size,pointerEvents:"none" as const};
  const b=`1px solid ${lCol}`;
  return (
    <>
      <div style={{...s,top:0,left:0,borderTop:b,borderLeft:b}}/>
      <div style={{...s,top:0,right:0,borderTop:b,borderRight:b}}/>
      <div style={{...s,bottom:0,left:0,borderBottom:b,borderLeft:b}}/>
      <div style={{...s,bottom:0,right:0,borderBottom:b,borderRight:b}}/>
    </>
  );
}
export function HUDFrame({dark=true}:{label?:string;sublabel?:string;dark?:boolean}) {
  if(SIMPLE)return null;
  const col=dark?"rgba(255,255,255,0.28)":"rgba(0,0,0,0.28)";
  const L=18,S=18;
  const corner=(sx:number,sy:number)=>{
    const x=sx>0?`right-3`:`left-3`, y=sy>0?`bottom-3`:`top-3`;
    return (
      <div className={`absolute ${x} ${y} pointer-events-none`}>
        <svg width={L+S} height={L+S} viewBox={`0 0 ${L+S} ${L+S}`} fill="none"
          style={{transform:`scale(${sx},${sy})`,transformOrigin:"50% 50%"}}>
          <path d={`M ${S} 0 L 0 0 L 0 ${S}`} stroke={col} strokeWidth="1"/>
          <path d={`M ${L} ${S+L} L ${L+S} ${S+L} L ${L+S} ${L}`} stroke={col} strokeWidth="1" opacity="0.4"/>
        </svg>
      </div>
    );
  };
  return (
    <>
      {corner(1,1)} {corner(-1,1)} {corner(1,-1)} {corner(-1,-1)}
    </>
  );
}

/* ─── BACKGROUNDS ────────────────────────────────────────────────── */
export function CircuitBg({opacity=0.04}:{opacity?:number}) {
  if(SIMPLE)return null;
  return <div className="absolute inset-0 pointer-events-none" style={{opacity,backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cg fill='none' stroke='white' stroke-width='0.6'%3E%3Cpath d='M0 60 H38 Q42 60 42 56 V0'/%3E%3Cpath d='M120 60 H82 Q78 60 78 56 V0'/%3E%3Cpath d='M60 120 V82 Q60 78 56 78 H0'/%3E%3Cpath d='M60 0 V38 Q60 42 64 42 H120'/%3E%3Cpath d='M0 20 H18 Q22 20 22 24 V38 Q22 42 26 42 H40'/%3E%3Cpath d='M120 100 H102 Q98 100 98 96 V82 Q98 78 94 78 H80'/%3E%3C/g%3E%3Ccircle cx='42' cy='28' r='3' fill='none' stroke='white' stroke-width='0.6'/%3E%3Ccircle cx='78' cy='28' r='3' fill='none' stroke='white' stroke-width='0.6'/%3E%3Ccircle cx='22' cy='38' r='2' fill='white' opacity='0.4'/%3E%3Ccircle cx='98' cy='82' r='2' fill='white' opacity='0.4'/%3E%3C/svg%3E")`,backgroundSize:"120px 120px"}}/>;
}
export function HexDotBg({opacity=0.04,dark=true}:{opacity?:number;dark?:boolean}) {
  if(SIMPLE)return null;
  const c=dark?"255,255,255":"0,0,0";
  return <div className="absolute inset-0 pointer-events-none" style={{opacity,backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='70'%3E%3Ccircle cx='20' cy='17' r='1.1' fill='rgba(${c},1)'/%3E%3Ccircle cx='0' cy='52' r='1.1' fill='rgba(${c},1)'/%3E%3Ccircle cx='40' cy='52' r='1.1' fill='rgba(${c},1)'/%3E%3C/svg%3E")`,backgroundSize:"40px 70px"}}/>;
}

/* ─── SKILL RADAR ────────────────────────────────────────────────── */
export function SkillRadar() {
  const ref=useRef<SVGSVGElement>(null);
  const inView=useInView(ref,{once:false,margin:"-15%"});
  const SZ=260,C=SZ/2,R=SZ*0.4;
  const levels=[0.28,0.52,0.75,1.0];
  const pts=SKILLS_DOMAINS.map((d,i)=>{
    const a=((i/SKILLS_DOMAINS.length)*Math.PI*2)-Math.PI/2;
    return {x:C+Math.cos(a)*R*d.score,y:C+Math.sin(a)*R*d.score,lx:C+Math.cos(a)*(R+22),ly:C+Math.sin(a)*(R+22),lbl:d.label,score:d.score,ang:a};
  });
  const poly=pts.map(p=>`${p.x},${p.y}`).join(" ");
  return (
    <svg ref={ref} width={SZ} height={SZ} viewBox={`0 0 ${SZ} ${SZ}`} className="shrink-0">
      {levels.map(l=><circle key={l} cx={C} cy={C} r={R*l} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="0.7" strokeDasharray={l===1?"4 6":""}/>)}
      {SKILLS_DOMAINS.map((_,i)=>{const a=((i/SKILLS_DOMAINS.length)*Math.PI*2)-Math.PI/2;return <line key={i} x1={C} y1={C} x2={C+Math.cos(a)*R} y2={C+Math.sin(a)*R} stroke="rgba(255,255,255,0.12)" strokeWidth="0.7"/>;}) }
      <motion.polygon points={poly} fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" initial={{scale:0,opacity:0}} animate={inView?{scale:1,opacity:1}:{}} style={{transformOrigin:`${C}px ${C}px`}} transition={{duration:1.4,ease:[0.22,1,0.36,1]}}/>
      {pts.map((p,i)=>(
        <g key={i}>
          <motion.circle cx={p.x} cy={p.y} r={4.5} fill="rgba(255,255,255,0.55)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" initial={{scale:0}} animate={inView?{scale:1}:{}} transition={{delay:0.9+i*0.1,type:"spring",stiffness:160,damping:14}}/>
          <motion.text x={p.lx} y={p.ly} textAnchor={Math.cos(p.ang)>0.1?"start":Math.cos(p.ang)<-0.1?"end":"middle"} fill="rgba(255,255,255,0.35)" fontSize="10" fontFamily="'DM Mono',monospace" letterSpacing="0.15em" initial={{opacity:0}} animate={inView?{opacity:1}:{}} transition={{delay:1.1+i*0.08}}>{p.lbl.toUpperCase()}</motion.text>
        </g>
      ))}
      <g style={{transformOrigin:`${C}px ${C}px`,animation:"gs 5s linear infinite"}}>
        <path d={`M${C} ${C} L${C-R*Math.sin(0.55)} ${C-R*Math.cos(0.55)} A${R} ${R} 0 0 1 ${C} ${C-R} Z`} fill="rgba(255,255,255,0.07)"/>
        <line x1={C} y1={C} x2={C} y2={C-R} stroke="rgba(255,255,255,0.55)" strokeWidth="0.9"/>
      </g>
      <circle cx={C} cy={C} r={3} fill="rgba(255,255,255,0.3)"/>
    </svg>
  );
}

/* ─── ANIMATION HELPERS ──────────────────────────────────────────── */
export function WordReveal({text,delay=0,stagger=0.07,color}:{text:string;delay?:number;stagger?:number;color?:string}) {
  const ref=useRef<HTMLSpanElement>(null);
  const inView=useInView(ref,{once:false,margin:"-6% 0px"});
  return (
    <span ref={ref} aria-label={text} style={{display:"inline"}}>
      {text.split(" ").map((w,i)=>(
        <span key={i} style={{display:"inline-block",overflow:"hidden",verticalAlign:"bottom",marginRight:"0.22em"}}>
          <motion.span style={{display:"inline-block",color:color||"inherit"}} initial={{y:"112%",skewY:5}} animate={inView?{y:"0%",skewY:0}:{}} transition={{delay:delay+i*stagger,duration:0.85,ease:[0.22,1,0.36,1]}}>{w}</motion.span>
        </span>
      ))}
    </span>
  );
}
export function Counter({to,suffix=""}:{to:number;suffix?:string}) {
  const ref=useRef<HTMLSpanElement>(null);const inView=useInView(ref,{once:false});
  const mv=useMotionValue(0);const sp=useSpring(mv,{stiffness:48,damping:18});
  const [d,setD]=useState("0");
  useEffect(()=>{if(inView)mv.set(to);else mv.jump(0);},[inView,to,mv]);
  useEffect(()=>sp.on("change",v=>setD(Math.round(v)+suffix)),[sp,suffix]);
  return <span ref={ref}>{d}</span>;
}
export function Mag({children,str=0.24}:{children:React.ReactElement;str?:number}) {
  const ref=useRef<HTMLDivElement>(null);
  const x=useMotionValue(0),y=useMotionValue(0);
  const sx=useSpring(x,{stiffness:200,damping:16}),sy=useSpring(y,{stiffness:200,damping:16});
  return (
    <motion.div ref={ref} style={{x:sx,y:sy,display:"inline-block"}} onMouseMove={e=>{const r=ref.current!.getBoundingClientRect();x.set((e.clientX-r.left-r.width/2)*str);y.set((e.clientY-r.top-r.height/2)*str);}} onMouseLeave={()=>{x.set(0);y.set(0);}}>{children}</motion.div>
  );
}

/* ─── CURSOR ─────────────────────────────────────────────────────── */
export function Cursor() {
  const mx=useMotionValue(-400),my=useMotionValue(-400);
  const srx=useSpring(mx,{stiffness:180,damping:22}),sry=useSpring(my,{stiffness:180,damping:22});
  const sbx=useSpring(mx,{stiffness:90,damping:20}),sby=useSpring(my,{stiffness:90,damping:20});
  const [label,setLabel]=useState(""),[active,setActive]=useState(false);
  useEffect(()=>{
    if(window.matchMedia("(pointer:coarse)").matches)return;
    const mv=(e:PointerEvent)=>{mx.set(e.clientX);my.set(e.clientY);};
    // one delegated listener instead of per-element wiring
    const over=(e:PointerEvent)=>{
      const t=(e.target as Element|null)?.closest?.("[data-cur],a,button,input[type=range],[data-drag]");
      setActive(Boolean(t));
      setLabel(t?.getAttribute("data-cur")??"");
    };
    window.addEventListener("pointermove",mv,{passive:true});
    document.addEventListener("pointerover",over,{passive:true});
    return()=>{window.removeEventListener("pointermove",mv);document.removeEventListener("pointerover",over);};
  },[mx,my]);
  const S=active?64:40,B=active?84:58,bL=active?9:12;
  return (
    <>
      <motion.div className="robot-cursor fixed z-[9999] pointer-events-none rounded-full" animate={{scale:active?0.65:1}} style={{x:mx,y:my,translateX:"-50%",translateY:"-50%",width:10,height:10,background:"#fff",border:"2px solid #080808",boxShadow:"0 0 0 1px rgba(255,255,255,0.95),0 0 12px rgba(0,0,0,0.65)"}}/>
      <motion.svg className="robot-cursor fixed z-[9998] pointer-events-none overflow-visible" style={{x:srx,y:sry,translateX:"-50%",translateY:"-50%",width:S,height:S,transition:"width .15s,height .15s",filter:"drop-shadow(0 0 1px #000) drop-shadow(0 0 3px rgba(0,0,0,0.7))"}}>
        <line x1={0} y1={S/2} x2={S*0.28} y2={S/2} stroke="white" strokeWidth="0.9" opacity="0.55"/>
        <line x1={S*0.72} y1={S/2} x2={S} y2={S/2} stroke="white" strokeWidth="0.9" opacity="0.55"/>
        <line x1={S/2} y1={0} x2={S/2} y2={S*0.28} stroke="white" strokeWidth="0.9" opacity="0.55"/>
        <line x1={S/2} y1={S*0.72} x2={S/2} y2={S} stroke="white" strokeWidth="0.9" opacity="0.55"/>
        <circle cx={S/2} cy={S/2} r={active?9:6} fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.8)" strokeWidth="1"/>
      </motion.svg>
      <motion.svg className="robot-cursor fixed z-[9997] pointer-events-none overflow-visible" style={{x:sbx,y:sby,translateX:"-50%",translateY:"-50%",width:B,height:B,transition:"width .2s,height .2s",filter:"drop-shadow(0 0 1px #000)"}}>
        {/* orbit is CSS-driven: no React re-render per frame */}
        <g style={{transformOrigin:`${B/2}px ${B/2}px`,animation:"gs 9s linear infinite"}}>
          <circle cx={B/2} cy={B/2} r={B/2-2} fill="none" stroke="rgba(255,255,255,0.48)" strokeWidth="0.9" strokeDasharray="3 8"/>
          <circle cx={B-2} cy={B/2} r="2.2" fill="white"/>
        </g>
        <path d={`M${bL} 2 L2 2 L2 ${bL}`} fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.4" strokeLinecap="round"/>
        <path d={`M${B-bL} 2 L${B-2} 2 L${B-2} ${bL}`} fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.4" strokeLinecap="round"/>
        <path d={`M${bL} ${B-2} L2 ${B-2} L2 ${B-bL}`} fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.4" strokeLinecap="round"/>
        <path d={`M${B-bL} ${B-2} L${B-2} ${B-2} L${B-2} ${B-bL}`} fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.4" strokeLinecap="round"/>
        {(active||label)&&<text x={B/2} y={B/2+3.5} textAnchor="middle" fill="white" stroke="#080808" strokeWidth="2.5" paintOrder="stroke" fontSize="9" fontFamily="'DM Mono',monospace" letterSpacing="1.3">{label||"OPEN"}</text>}
      </motion.svg>
    </>
  );
}

/* ─── ROBOT BUDDY — scroll companion / back-to-top ───────────────── */
export const BUDDY_SECTIONS:[string,string][]=[["home","HOME"],["work","WORK"],["lab","LAB"],["anatomy","ANATOMY"],["about","ABOUT"],["experience","EXPERIENCE"],["skills","SKILLS"],["contact","CONTACT"]];
export function RobotBuddy() {
  const [show,setShow]=useState(false);
  const [sec,setSec]=useState("HOME");
  const [talk,setTalk]=useState(false);
  const {scrollYProgress}=useScroll();
  const ring=useSpring(scrollYProgress,{stiffness:80,damping:20});
  const dash=useTransform(ring,v=>`${(v*182.2).toFixed(1)} 182.2`);
  const lx=useMotionValue(0),ly=useMotionValue(0);
  const sx=useSpring(lx,{stiffness:120,damping:14}),sy=useSpring(ly,{stiffness:120,damping:14});
  const rotY=useTransform(sx,v=>v*26),rotX=useTransform(sy,v=>-v*20);
  const px=useTransform(sx,v=>v*4.2),py=useTransform(sy,v=>v*3.4);
  const ref=useRef<HTMLButtonElement>(null);
  useEffect(()=>{
    let raf=0;
    const check=()=>{
      raf=0;
      setShow(window.scrollY>window.innerHeight*0.7);
      let cur="HOME";
      for(const [id,name] of BUDDY_SECTIONS){
        const el=document.getElementById(id);
        if(el&&el.getBoundingClientRect().top<=window.innerHeight*0.45)cur=name;
      }
      setSec(cur);
    };
    const onScroll=()=>{if(!raf)raf=requestAnimationFrame(check);};
    const onMove=(e:PointerEvent)=>{
      const r=ref.current?.getBoundingClientRect();if(!r)return;
      const dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);
      lx.set(Math.max(-1,Math.min(1,dx/320)));ly.set(Math.max(-1,Math.min(1,dy/320)));
    };
    window.addEventListener("scroll",onScroll,{passive:true});
    window.addEventListener("pointermove",onMove,{passive:true});
    check();
    return()=>{cancelAnimationFrame(raf);window.removeEventListener("scroll",onScroll);window.removeEventListener("pointermove",onMove);};
  },[lx,ly]);
  // announce each new section briefly
  useEffect(()=>{setTalk(true);const id=setTimeout(()=>setTalk(false),2200);return()=>clearTimeout(id);},[sec]);
  return (
    <AnimatePresence>
      {show&&(
        <motion.button ref={ref} key="buddy" aria-label="Back to top" data-cur="TOP"
          initial={{opacity:0,y:40,scale:0.6}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:40,scale:0.6}}
          transition={{type:"spring",stiffness:260,damping:22}}
          whileHover="hover" whileTap={{scale:0.9}}
          onClick={()=>scrollToTarget(0)}
          className="group fixed bottom-4 right-4 z-[60] flex items-center md:bottom-7 md:right-7"
          style={{background:"transparent",border:0,padding:0}}>
          <AnimatePresence>
            {talk&&(
              <motion.span key={sec} initial={{opacity:0,x:10}} animate={{opacity:1,x:0}} exit={{opacity:0,x:6}} transition={{duration:0.3}}
                className="mr-3 hidden whitespace-nowrap border border-white/20 bg-[#080808]/90 px-3 py-2 backdrop-blur-md sm:block"
                style={{fontFamily:MN,fontSize:"11.5px",letterSpacing:"0.18em",color:"rgba(255,255,255,0.8)"}}>
                SCANNING // {sec}
              </motion.span>
            )}
          </AnimatePresence>
          <span className="relative block h-[58px] w-[58px] md:h-[66px] md:w-[66px]" style={{perspective:300}}>
            <svg viewBox="0 0 66 66" className="absolute inset-0 h-full w-full" style={{transform:"rotate(-90deg)"}}>
              <circle cx="33" cy="33" r="29" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.2"/>
              <motion.circle cx="33" cy="33" r="29" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" style={{strokeDasharray:dash}}/>
            </svg>
            <motion.svg viewBox="0 0 66 66" className="absolute inset-0 h-full w-full" style={{rotateX:rotX,rotateY:rotY}}
              variants={{hover:{y:-3}}}>
              <line x1="33" y1="17" x2="33" y2="10" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2"/>
              <circle cx="33" cy="9" r="2.4" fill="#fff" style={{animation:"ledBlink 1.6s ease-in-out infinite"}}/>
              <rect x="13" y="17" width="40" height="32" rx="9" fill="#0b0b0b" stroke="rgba(255,255,255,0.85)" strokeWidth="1.3"/>
              <rect x="9" y="27" width="4" height="12" rx="1.5" fill="#0b0b0b" stroke="rgba(255,255,255,0.6)" strokeWidth="1"/>
              <rect x="53" y="27" width="4" height="12" rx="1.5" fill="#0b0b0b" stroke="rgba(255,255,255,0.6)" strokeWidth="1"/>
              <rect x="18" y="23" width="30" height="18" rx="6" fill="#000" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>
              <g style={{transformOrigin:"33px 32px",animation:"buddyBlink 4.5s infinite"}}>
                <circle cx="33" cy="32" r="6.2" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.1"/>
                <motion.circle cx="33" cy="32" r="2.7" fill="#fff" style={{x:px,y:py}}/>
              </g>
              <path d="M27 45 H39" stroke="rgba(255,255,255,0.35)" strokeWidth="1" strokeDasharray="1.5 2"/>
            </motion.svg>
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/* ─── SCAN REVEAL — top-down "scanner" wipe ──────────────────────── */
export function ScanReveal({children,className="",style={},delay=0,dark=true}:
  {children:React.ReactNode;className?:string;style?:React.CSSProperties;delay?:number;dark?:boolean}) {
  const ref=useRef<HTMLDivElement>(null);
  const inView=useInView(ref,{once:false,margin:"-10% 0px"});
  const c=dark?"255,255,255":"0,0,0";
  const ease=[0.65,0,0.35,1] as const;
  return (
    <div ref={ref} className={`relative ${className}`} style={style}>
      <motion.div className="h-full" initial={{clipPath:"inset(0 0 100% 0)"}} animate={inView?{clipPath:"inset(0 0 0% 0)"}:{}} transition={{duration:1.15,delay,ease}}>
        {children}
      </motion.div>
      <motion.div aria-hidden className="pointer-events-none absolute left-0 right-0 z-20" initial={{top:"0%",opacity:0}}
        animate={inView?{top:"100%",opacity:[0,1,1,0]}:{}}
        transition={{top:{duration:1.15,delay,ease},opacity:{duration:1.15,delay,times:[0,0.08,0.85,1]}}}
        style={{height:2,background:`linear-gradient(90deg,transparent,rgba(${c},0.9),transparent)`,boxShadow:`0 0 18px rgba(${c},0.55)`}}/>
    </div>
  );
}

/* ─── TILT — pointer-driven 3D tilt with glare ───────────────────── */
export function useTilt(max=6) {
  const rx=useMotionValue(0),ry=useMotionValue(0),gx=useMotionValue(50),gy=useMotionValue(50);
  const srx=useSpring(rx,{stiffness:150,damping:18}),sry=useSpring(ry,{stiffness:150,damping:18});
  const glare=useMotionTemplate`radial-gradient(700px circle at ${gx}% ${gy}%,rgba(255,255,255,0.1),transparent 45%)`;
  const onMouseMove=(e:React.MouseEvent<HTMLElement>)=>{
    const r=e.currentTarget.getBoundingClientRect();
    const px=(e.clientX-r.left)/r.width,py=(e.clientY-r.top)/r.height;
    ry.set((px-0.5)*max);rx.set(-(py-0.5)*max*0.85);gx.set(px*100);gy.set(py*100);
  };
  const onMouseLeave=()=>{rx.set(0);ry.set(0);gx.set(50);gy.set(50);};
  return {style:{rotateX:srx,rotateY:sry,transformPerspective:1400},glare,handlers:{onMouseMove,onMouseLeave}};
}
export function ProgressBar() {
  const {scrollYProgress}=useScroll();
  const sx=useSpring(scrollYProgress,{stiffness:50,damping:18});
  return <motion.div className="fixed top-0 left-0 right-0 z-[9997] origin-left" style={{scaleX:sx,height:1.5,background:"#fff"}}/>;
}
