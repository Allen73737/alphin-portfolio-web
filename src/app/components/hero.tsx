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
import alphinPhoto from "@/imports/Picture3.png";
import alphinCV from "@/imports/AlphinFrancis.pdf";
import alphinCVPage1 from "@/imports/AlphinFrancis-page-1.png";
import alphinCVPage2 from "@/imports/AlphinFrancis-page-2.png";
import { type V3, type Face, type Cam, m3T, m3Ry, m3Rx, m3Rz, m3Mul, m3P, v3Sub, v3Dot, v3Norm, addBox, addCyl, makeCam, proj, runCanvas } from "@/app/components/robot3d/engine";
import { Preloader3D, RobotShowcase, RobotHeadCompanion } from "@/app/components/robot3d/robots";

import { BG, MN, BRD, NOISE, ROLES, SIMPLE } from "../lib";
import { TypeBot, ParticleField, ScanSweep, HUDFrame, Mag } from "./fx";

export const heroWrite={active:false,px:0,py:0,tcpX:0,tcpY:0,tcpOk:false,ch:"",i:0,n:13,t0:0,until:0};

/* ─── PROJECTION — light cone from the hero arm's lens onto the letter ─ */
export function ProjectionOverlay() {
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    const el=ref.current;if(!el)return;
    const motes:{t:number;sp:number;ox:number;oy:number}[]=[];
    let glow=0;
    return runCanvas(el,(ctx,_W,_H,dt,T)=>{
      let hit:HTMLElement|null=null;
      if(performance.now()<heroWrite.until)document.querySelectorAll<HTMLElement>("[data-pen]").forEach(p=>{
        if(parseFloat(getComputedStyle(p).opacity)>0.05)hit=p;
      });
      heroWrite.active=!!hit;
      glow+=((hit?1:0)-glow)*(1-Math.exp(-dt*12));
      if(!hit||!heroWrite.tcpOk){motes.length=0;return;}
      const h=hit as HTMLElement,r=h.getBoundingClientRect(),cr=el.getBoundingClientRect();
      heroWrite.px=r.left+r.width/2;heroWrite.py=r.top+r.height/2;
      heroWrite.ch=h.dataset.ch??"";heroWrite.i=Number(h.dataset.i??0);
      const pad=r.height*0.04;
      const x0=r.left-cr.left-pad,x1=r.right-cr.left+pad,y0=r.top-cr.top+r.height*0.08,y1=r.bottom-cr.top-r.height*0.04;
      const lx=heroWrite.tcpX-cr.left,ly=heroWrite.tcpY-cr.top;
      const fl=(0.85+0.15*Math.sin(T*70))*glow;
      ctx.globalCompositeOperation="lighter";
      // volumetric cone: each face of the frustum, bright at the lens
      const corners:[number,number][]=[[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
      for(let i=0;i<4;i++){
        const a=corners[i],b=corners[(i+1)%4];
        const g=ctx.createLinearGradient(lx,ly,(a[0]+b[0])/2,(a[1]+b[1])/2);
        g.addColorStop(0,`rgba(255,255,255,${0.32*fl})`);g.addColorStop(1,`rgba(255,255,255,${0.05*fl})`);
        ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(lx,ly);ctx.lineTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.closePath();ctx.fill();
      }
      ctx.strokeStyle=`rgba(255,255,255,${0.55*fl})`;ctx.lineWidth=1;
      corners.forEach(c=>{ctx.beginPath();ctx.moveTo(lx,ly);ctx.lineTo(c[0],c[1]);ctx.stroke();});
      // projected frame on the letter: brackets + sweeping scanline
      ctx.fillStyle=`rgba(255,255,255,${0.05*fl})`;ctx.fillRect(x0,y0,x1-x0,y1-y0);
      const k=Math.min(28,(x1-x0)*0.3);
      ctx.strokeStyle=`rgba(255,255,255,${0.9*fl})`;ctx.lineWidth=2;
      [[x0,y0,1,1],[x1,y0,-1,1],[x1,y1,-1,-1],[x0,y1,1,-1]].forEach(([x,y,sx,sy])=>{
        ctx.beginPath();ctx.moveTo(x+sx*k,y);ctx.lineTo(x,y);ctx.lineTo(x,y+sy*k);ctx.stroke();
      });
      const sy=y0+((T*2.2)%1)*(y1-y0);
      const sg=ctx.createLinearGradient(0,sy-26,0,sy);
      sg.addColorStop(0,"rgba(255,255,255,0)");sg.addColorStop(1,`rgba(255,255,255,${0.45*fl})`);
      ctx.fillStyle=sg;ctx.fillRect(x0,sy-26,x1-x0,26);
      ctx.fillStyle=`rgba(255,255,255,${0.95*fl})`;ctx.fillRect(x0,sy,x1-x0,1.5);
      // light motes streaming down the beam
      for(let i=0;i<3;i++)motes.push({t:0,sp:2.2+Math.random()*2.5,ox:Math.random(),oy:Math.random()});
      for(let i=motes.length-1;i>=0;i--){
        const m=motes[i];m.t+=dt*m.sp;if(m.t>=1){motes.splice(i,1);continue;}
        const tx=x0+m.ox*(x1-x0),ty=y0+m.oy*(y1-y0),e=m.t*m.t;
        ctx.fillStyle=`rgba(255,255,255,${(1-m.t)*0.9*fl})`;
        ctx.beginPath();ctx.arc(lx+(tx-lx)*e,ly+(ty-ly)*e,1.6+m.t*1.4,0,Math.PI*2);ctx.fill();
      }
      // lens flare
      const lf=ctx.createRadialGradient(lx,ly,0,lx,ly,60);
      lf.addColorStop(0,`rgba(255,255,255,${0.9*fl})`);lf.addColorStop(0.2,`rgba(255,255,255,${0.3*fl})`);lf.addColorStop(1,"rgba(255,255,255,0)");
      ctx.fillStyle=lf;ctx.beginPath();ctx.arc(lx,ly,60,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=`rgba(255,255,255,${0.35*fl})`;ctx.fillRect(lx-90,ly-0.75,180,1.5);
      ctx.globalCompositeOperation="source-over";
    },{alwaysOn:false});
  },[]);
  return <canvas ref={ref} className="pointer-events-none absolute inset-0 h-full w-full" style={{zIndex:11}} aria-hidden="true"/>;
}

/* ─── ROBOT WRITE: the hero arm projects the name, one letter at a time ─ */
export const CHAR_DUR=0.38,CHAR_GAP=0.1;
export const writeTime=(n:number)=>n*(CHAR_DUR+CHAR_GAP);
// lead time lets the arm swing into its projection stance before the first letter
export const WRITE_LEAD=1.3,LINE_GAP=0.35;
export const charAt=(k:number)=>WRITE_LEAD+writeTime(k)+(k>=6?LINE_GAP:0);
export function RobotWrite({text,start,delay=0,offset=0}:{text:string;start:boolean;delay?:number;offset?:number}) {
  if(SIMPLE)return <span aria-hidden className="relative block w-fit whitespace-nowrap">{text}</span>;
  return (
    <span aria-hidden data-word="" className="relative block w-fit whitespace-nowrap">
      {text.split("").map((ch,i)=>{
        const d=delay+i*(CHAR_DUR+CHAR_GAP);
        return (
          <span key={i} className="relative inline-block">
            <span style={{visibility:"hidden"}}>{ch}</span>
            {/* hologram: scans in top-down, flickers and jitters while the beam is on it */}
            <motion.span className="absolute inset-0" style={{color:"rgba(255,255,255,0.12)",WebkitTextStroke:"clamp(1px,0.12vw,2px) #fff",textShadow:"0 0 22px rgba(255,255,255,0.85)"}}
              initial={{clipPath:"inset(0% 0% 100% 0%)",opacity:0,x:"0em"}}
              animate={start?{clipPath:"inset(0% 0% 0% 0%)",opacity:[0,1,0.3,1,0.55,1,0],x:["0em","0.035em","-0.025em","0.012em","0em"]}:{}}
              transition={{clipPath:{delay:d,duration:CHAR_DUR*0.7,ease:"linear"},opacity:{delay:d,duration:CHAR_DUR*1.7,times:[0,0.08,0.18,0.3,0.4,0.62,1]},x:{delay:d,duration:CHAR_DUR*0.8}}}>{ch}</motion.span>
            {/* the solid letter condenses out of the light */}
            <motion.span className="absolute inset-0" style={{color:"#fff"}}
              initial={{opacity:0,filter:"blur(14px)",scale:1.06}} animate={start?{opacity:1,filter:"blur(0px)",scale:1}:{}}
              transition={{delay:d+CHAR_DUR*0.5,duration:CHAR_DUR*1.1,ease:[0.22,1,0.36,1]}}>{ch}</motion.span>
            {/* projection target the hero arm aims at */}
            <motion.span data-pen="" data-ch={ch} data-i={offset+i+1} className="pointer-events-none absolute inset-0"
              initial={{opacity:0}} animate={start?{opacity:[0,1,1,0]}:{}} transition={{delay:d,duration:CHAR_DUR+0.08,times:[0,0.05,0.9,1]}}/>
          </span>
        );
      })}
    </span>
  );
}

/* ─── 3D INDUSTRIAL ARM ──────────────────────────────────────────── */
export const ARM={sh:1.15,L1:2.0,L2:1.7,tool:0.62};
export const PEN_TOOL=0.91;
export function buildArm(out:Face[],q0:number,q1:number,q2:number,q3:number,roll:number,grip:number,pen=false,inkOn=false) {
  addCyl(out,m3T(0,0.12,0),0.95,0.24,20,0.8);                       // plinth
  const yaw=m3Ry(q0);
  if(pen){
    // base: anchor bolts, cable junction box and conduit feeding the turret
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2+Math.PI/8;addCyl(out,m3T(Math.cos(a)*0.82,0.27,Math.sin(a)*0.82),0.05,0.06,8,1.4);}
    addBox(out,m3T(-1.08,0.17,0.38),0.34,0.34,0.42,0.85);
    addCyl(out,m3Mul(m3T(-0.84,0.2,0.38),m3Rz(Math.PI/2)),0.06,0.34,10,0.6);
  }
  addCyl(out,m3Mul(yaw,m3T(0,0.55,0)),0.62,0.62,18);                 // turret
  if(pen){
    addCyl(out,m3Mul(yaw,m3T(0,0.87,0)),0.635,0.035,24,1,true);      // J1 status ring
    addCyl(out,m3Mul(yaw,m3T(-0.52,0.62,0)),0.2,0.46,14,1.15);        // J1 drive motor
    addCyl(out,m3Mul(yaw,m3T(-0.52,0.88,0)),0.14,0.06,14,1.35);
  }
  addBox(out,m3Mul(yaw,m3T(0,0.98,0)),0.72,0.3,0.98,0.9);            // shoulder yoke
  if(pen){
    addBox(out,m3Mul(yaw,m3T(0,1.12,0.52)),0.66,0.56,0.06,1.2);      // yoke cheek plates
    addBox(out,m3Mul(yaw,m3T(0,1.12,-0.52)),0.66,0.56,0.06,1.2);
  }
  const sh=m3Mul(yaw,m3T(0,ARM.sh,0));
  addCyl(out,m3Mul(sh,m3Rx(Math.PI/2)),0.4,0.92,18);                 // J2 axis
  addCyl(out,m3Mul(sh,m3T(0,0,-0.62),m3Rx(Math.PI/2)),0.26,0.32,14,1.15); // J2 motor
  if(pen)addCyl(out,m3Mul(sh,m3T(0,0,0.56),m3Rx(Math.PI/2)),0.36,0.035,24,1,true); // J2 status ring
  const up=m3Mul(sh,m3Rz(-q1));
  addBox(out,m3Mul(up,m3T(0,ARM.L1/2,0)),0.38,ARM.L1-0.5,0.46);      // upper arm
  if(pen){
    const L=ARM.L1;
    addBox(out,m3Mul(up,m3T(0,L/2,0.245)),0.26,L-0.85,0.04,1.3);     // cover panels
    addBox(out,m3Mul(up,m3T(0,L/2,-0.245)),0.26,L-0.85,0.04,1.3);
    // gas-spring counterbalance riding behind the upper arm
    addCyl(out,m3Mul(up,m3T(-0.34,L*0.32,0)),0.09,L*0.42,12,1.1);
    addCyl(out,m3Mul(up,m3T(-0.34,L*0.66,0)),0.045,L*0.34,10,1.4);
    addBox(out,m3Mul(up,m3T(-0.25,L*0.1,0)),0.22,0.12,0.14,0.9);
    addBox(out,m3Mul(up,m3T(-0.25,L*0.86,0)),0.22,0.12,0.14,0.9);
    // dress pack: cable bundle clipped along the arm
    addCyl(out,m3Mul(up,m3T(0,L/2,0.31)),0.04,L-0.3,8,0.55);
    for(let i=1;i<=4;i++)addBox(out,m3Mul(up,m3T(0,L*i/5,0.3)),0.14,0.07,0.1,0.8);
  }
  const el=m3Mul(up,m3T(0,ARM.L1,0));
  addCyl(out,m3Mul(el,m3Rx(Math.PI/2)),0.32,0.74,16);                // J3 axis
  addBox(out,m3Mul(el,m3T(0,0,0.5)),0.3,0.3,0.26,1.15);              // J3 motor
  if(pen)addCyl(out,m3Mul(el,m3T(0,0,-0.39),m3Rx(Math.PI/2)),0.3,0.035,24,1,true); // J3 status ring
  const fo=m3Mul(el,m3Rz(-q2));
  if(pen){
    addBox(out,m3Mul(fo,m3T(0,0.6,0)),0.32,0.8,0.38);                // forearm body
    addCyl(out,m3Mul(fo,m3T(0,0.28,0)),0.23,0.14,18,1.3);            // J4 roll joint
    addCyl(out,m3Mul(fo,m3T(0,0.36,0)),0.235,0.025,24,1,true);
    addBox(out,m3Mul(fo,m3T(0,1.28,0)),0.24,0.6,0.28,1.05);          // tapered wrist housing
    addCyl(out,m3Mul(fo,m3T(0,0.85,0.24)),0.03,1.0,8,0.55);          // cable run
  } else {
    addBox(out,m3Mul(fo,m3T(0,ARM.L2/2,0)),0.3,ARM.L2-0.4,0.36);     // forearm
  }
  const wr=m3Mul(fo,m3T(0,ARM.L2,0));
  addCyl(out,m3Mul(wr,m3Rx(Math.PI/2)),0.24,0.56,14);                // J5 axis
  if(pen)addCyl(out,m3Mul(wr,m3T(0,0,0.3),m3Rx(Math.PI/2)),0.22,0.03,20,1,true);
  const tl=m3Mul(wr,m3Rz(-q3),m3Ry(roll));
  addBox(out,m3Mul(tl,m3T(0,0.22,0)),0.26,0.26,0.26);                // wrist block
  addCyl(out,m3Mul(tl,m3T(0,0.4,0)),0.2,0.1,14,1.1);                 // tool flange
  if(pen){
    // projector head: finned housing, status strip, lens barrel with focus ring, lit lens
    addBox(out,m3Mul(tl,m3T(0,0.58,0)),0.34,0.26,0.3,1.05);
    for(let i=0;i<4;i++){
      const y=0.48+i*0.065;
      addBox(out,m3Mul(tl,m3T(0,y,0.175)),0.3,0.03,0.05,1.3);
      addBox(out,m3Mul(tl,m3T(0,y,-0.175)),0.3,0.03,0.05,1.3);
    }
    addBox(out,m3Mul(tl,m3T(0.18,0.6,0)),0.03,0.08,0.14,1,true);
    addCyl(out,m3Mul(tl,m3T(0,0.76,0)),0.13,0.12,18,0.85);
    addCyl(out,m3Mul(tl,m3T(0,0.845,0)),0.15,0.05,20,1.4);
    addCyl(out,m3Mul(tl,m3T(0,0.88,0)),0.095,0.05,16,1.4,inkOn);
  } else {
    addBox(out,m3Mul(tl,m3T(0,0.48,0)),0.82,0.07,0.18,0.95);         // gripper palm
    addBox(out,m3Mul(tl,m3T(grip,0.6,0)),0.06,0.22,0.15,1.1);        // fingers
    addBox(out,m3Mul(tl,m3T(-grip,0.6,0)),0.06,0.22,0.15,1.1);
  }
  return {
    base:m3P(yaw,0,0.6,0),sh:m3P(sh,0,0,0),el:m3P(el,0,0,0),
    wr:m3P(wr,0,0,0),tip:m3P(tl,0,pen?PEN_TOOL:ARM.tool,0),
  };
}

export function RobotArm3D({variant="hero",lowPower=false}:{variant?:"hero"|"footer";lowPower?:boolean}) {
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    const el=ref.current;if(!el)return;
    const ctx=el.getContext("2d");if(!ctx)return;
    const hero=variant==="hero";
    const ink=hero?"255,255,255":"0,0,0";
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse=window.matchMedia("(pointer: coarse)").matches;
    const dpr=Math.min(window.devicePixelRatio||1,lowPower?1:2);
    let W=1,H=1;
    const resize=()=>{W=Math.max(1,el.offsetWidth);H=Math.max(1,el.offsetHeight);el.width=Math.round(W*dpr);el.height=Math.round(H*dpr);};
    resize();

    /* pick & place work cell */
    const PADS:V3[]=[[2.35,0,1.2],[2.0,0,-1.45]];
    const CUBE=0.36,HOVER=1.35,OPEN=0.34,SHUT=0.215;
    const PH=[{d:1.2,s:"SCAN"},{d:0.85,s:"DESCEND"},{d:0.45,s:"GRIP"},{d:0.75,s:"LIFT"},{d:1.5,s:"TRANSFER"},{d:0.85,s:"PLACE"},{d:0.45,s:"RELEASE"},{d:0.75,s:"RETRACT"}];
    const seq={p:0,t:0,from:[1.7,2.1,0.4] as V3,src:0,carry:false};
    let cube:V3=[PADS[0][0],CUBE/2,PADS[0][2]];
    const dest=(p:number):V3=>{
      const pad=PADS[p<=3?seq.src:1-seq.src];
      const low=p===1||p===2||p===5||p===6;
      return [pad[0],low?CUBE/2:HOVER,pad[2]];
    };
    const ik=(t:V3):[number,number,number]=>{
      const q0=Math.atan2(-t[2],t[0]);
      const dx=Math.max(0.9,Math.hypot(t[0],t[2])),dy=t[1]+(hero?PEN_TOOL:ARM.tool)-ARM.sh;
      const {L1,L2}=ARM;
      const D=Math.min(L1+L2-0.02,Math.max(Math.abs(L1-L2)+0.05,Math.hypot(dx,dy)));
      const cl=(v:number)=>Math.min(1,Math.max(-1,v));
      const beta=Math.acos(cl((L1*L1+D*D-L2*L2)/(2*L1*D)));
      const inner=Math.acos(cl((L1*L1+L2*L2-D*D)/(2*L1*L2)));
      return [q0,Math.atan2(dx,dy)-beta,Math.PI-inner];
    };
    let [q0,q1,q2]=ik(seq.from);
    // hero motion state: wrist joint, joint velocities, limits (rad/s, rad/s²)
    let qw=Math.PI-q1-q2,settled=false;
    const qv=[0,0,0,0],VMAX=[1.7,1.2,1.6,2.6],AMAX=[3.2,2.6,3.8,7];
    let aim:V3=[2.6,0,0.4];
    const IDLE:V3[]=[[2.3,1.25,0.8],[2.7,0.8,-0.3],[1.9,1.55,-1.05],[2.45,1.0,0.35]];
    const idle={i:0,dwell:0};
    let grip=OPEN,tgt:V3=[...seq.from],lastTip:V3=[...seq.from],wasManual=false,T=0;
    const par={x:0,y:0};
    const mouse={x:0,y:0,t:-1e9,inside:false};

    const onMove=(e:PointerEvent)=>{
      if(e.pointerType!=="mouse")return;
      const r=el.getBoundingClientRect();
      mouse.x=e.clientX-r.left;mouse.y=e.clientY-r.top;
      mouse.inside=mouse.x>=0&&mouse.y>=0&&mouse.x<=r.width&&mouse.y<=r.height;
      mouse.t=performance.now();
    };
    if(hero&&!coarse)window.addEventListener("pointermove",onMove,{passive:true});

    let cam:Cam=makeCam([1.1,1.3,0],0.42,0.3,8.6,500,W/2,H/2);
    let manual=false,status="SCAN";
    // projection path: where on screen the beam should be at time s (seconds into the write).
    // Pans at constant speed through the letter centres, eased over the line break.
    const pens:{x:number;y:number}[]=[];
    const pathPoint=(s:number):[number,number]|null=>{
      pens.length=0;
      const r=el.getBoundingClientRect();
      document.querySelectorAll<HTMLElement>("[data-pen]").forEach(p=>{
        const b=p.getBoundingClientRect(),i=Number(p.dataset.i??0)-1;
        if(i>=0)pens[i]={x:(b.left+b.width/2-r.left)*W/r.width,y:(b.top+b.height*0.55-r.top)*H/r.height};
      });
      const n=heroWrite.n;
      for(let i=0;i<n;i++)if(!pens[i])return null;
      const c=(k:number)=>charAt(k)+CHAR_DUR*0.45;
      if(s<=c(0))return [pens[0].x,pens[0].y];
      if(s>=c(n-1))return [pens[n-1].x,pens[n-1].y];
      let k=0;while(k<n-2&&s>=c(k+1))k++;
      let u=(s-c(k))/(c(k+1)-c(k));
      if(k===5)u=u*u*(3-2*u);
      return [pens[k].x+(pens[k+1].x-pens[k].x)*u,pens[k].y+(pens[k+1].y-pens[k].y)*u];
    };
    const ff=[0,0,0,0],ptq=[0,0,0,0];
    let pathPrev=false;

    const step=(dt:number)=>{
      T+=dt;
      const now=performance.now();
      const path=hero&&now<heroWrite.until&&heroWrite.t0>0;
      const pp=path?pathPoint((now-heroWrite.t0)/1000):null;
      const writing=!!pp;
      manual=writing||(hero&&!coarse&&mouse.inside&&now-mouse.t<3200);
      const k=1-Math.exp(-dt*3);
      par.x+=((manual&&!writing?mouse.x/W-0.5:0)-par.x)*k;
      par.y+=((manual&&!writing?mouse.y/H-0.5:0)-par.y)*k;
      const sc=hero?Math.min(1,window.scrollY/H):0;
      const wide=W>=1024;
      const F=Math.min(H*1.25,W*1.45)*(hero?(wide?1.02:0.9):1.08);
      cam=makeCam([1.1,1.3,0],0.42+Math.sin(T*0.09)*0.12+par.x*0.35+sc*0.9,0.3+par.y*0.1+sc*0.12,hero?8.6:8.2,F,
        hero?W*(wide?0.8:0.74):W*0.5,hero?H*(wide?0.56:0.62):H*0.56);

      if(writing&&pp){
        // projection stance: shoulder and elbow hold a raised pose, the base pans and
        // the wrist tilts so the lens stays on the beam path, like a stage-light robot
        const xc=(pp[0]-cam.cx)/cam.F,yc=-(pp[1]-cam.cy)/cam.F;
        const dir=v3Norm([cam.f[0]+cam.r[0]*xc+cam.u[0]*yc,cam.f[1]+cam.r[1]*xc+cam.u[1]*yc,cam.f[2]+cam.r[2]*xc+cam.u[2]*yc]);
        aim=[cam.eye[0]+dir[0]*7,cam.eye[1]+dir[1]*7,cam.eye[2]+dir[2]*7];
        const ya=Math.atan2(-aim[2],aim[0]),R=1.85;
        tgt=[R*Math.cos(ya),1.5,-R*Math.sin(ya)];
        status="PROJECTING";
      } else if(manual){
        // ray from the eye through the cursor, intersected with a working plane
        const xc=(mouse.x-cam.cx)/cam.F,yc=-(mouse.y-cam.cy)/cam.F,PY=0.95;
        const dir=v3Norm([cam.f[0]+cam.r[0]*xc+cam.u[0]*yc,cam.f[1]+cam.r[1]*xc+cam.u[1]*yc,cam.f[2]+cam.r[2]*xc+cam.u[2]*yc]);
        const kk=dir[1]<-0.02?(PY-cam.eye[1])/dir[1]:30;
        const hx=cam.eye[0]+dir[0]*kk,hz=cam.eye[2]+dir[2]*kk;
        const rr=Math.hypot(hx,hz)||1,cl=Math.min(3.25,Math.max(1.15,rr));
        tgt=[hx/rr*cl,PY,hz/rr*cl];
        // aim point: along the same ray, at roughly the arm's depth
        aim=[cam.eye[0]+dir[0]*8.6,cam.eye[1]+dir[1]*8.6,cam.eye[2]+dir[2]*8.6];
        grip+=((seq.carry?SHUT:OPEN)-grip)*(1-Math.exp(-dt*12));
        status="CURSOR TRACK";
        wasManual=true;
      } else {
        if(wasManual){seq.from=[...tgt];seq.t=0;wasManual=false;}
        if(hero){
          // idle program: point-to-point moves between scan poses, dwelling at each
          const w=IDLE[idle.i];
          tgt=[...w];aim=[w[0]+0.7,0,w[2]*1.2];
          if(settled){idle.dwell+=dt;if(idle.dwell>1.2){idle.i=(idle.i+1)%IDLE.length;idle.dwell=0;}}
          status=settled?`SCAN · P${idle.i+1}`:`PTP MOVE → P${idle.i+1}`;
        } else {
        const ph=PH[seq.p];
        seq.t+=dt;
        const kp=Math.min(1,seq.t/ph.d),e=kp<0.5?4*kp*kp*kp:1-Math.pow(-2*kp+2,3)/2;
        const d=dest(seq.p);
        tgt=[seq.from[0]+(d[0]-seq.from[0])*e,seq.from[1]+(d[1]-seq.from[1])*e,seq.from[2]+(d[2]-seq.from[2])*e];
        const g=seq.p===2?OPEN+(SHUT-OPEN)*e:seq.p===6?SHUT+(OPEN-SHUT)*e:seq.carry?SHUT:OPEN;
        grip+=(g-grip)*(1-Math.exp(-dt*14));
        status=ph.s;
        if(kp>=1){
          if(seq.p===2)seq.carry=true;
          if(seq.p===6){seq.carry=false;cube=[lastTip[0],CUBE/2,lastTip[2]];}
          seq.from=d;seq.t=0;seq.p=(seq.p+1)%PH.length;
          if(seq.p===0)seq.src=1-seq.src;
        }
        }
      }
      const [t0,t1,t2]=ik(tgt);
      const wrap=(a:number)=>Math.atan2(Math.sin(a),Math.cos(a));
      if(!hero){
        const kq=1-Math.exp(-dt*(manual?4.5:10));
        q0+=wrap(t0-q0)*kq;q1+=(t1-q1)*kq;q2+=(t2-q2)*kq;
        return;
      }
      // wrist pitch: point the lens at the aim point instead of straight down
      const rw=ARM.L1*Math.sin(t1)+ARM.L2*Math.sin(t1+t2),yw=ARM.sh+ARM.L1*Math.cos(t1)+ARM.L2*Math.cos(t1+t2);
      const ar=aim[0]*Math.cos(t0)-aim[2]*Math.sin(t0);
      const t3=Math.max(-0.4,Math.min(2.9,Math.atan2(ar-rw,aim[1]-yw)))-t1-t2;
      // feed-forward of the path's joint velocity, so a moving target is followed
      // without lag or start-stop jerks (zero for PTP moves to fixed waypoints)
      const tq=[t0,t1,t2,t3];
      for(let i=0;i<4;i++){
        const dq=i===0?wrap(tq[i]-ptq[i]):tq[i]-ptq[i];
        let v=dt>0&&writing&&pathPrev?dq/dt:0;
        if(Math.abs(v)>VMAX[i]*1.5)v=0;
        ff[i]+=(Math.max(-VMAX[i]*0.8,Math.min(VMAX[i]*0.8,v))-ff[i])*(1-Math.exp(-dt*10));
        ptq[i]=tq[i];
      }
      pathPrev=writing;
      // synchronised PTP with per-joint velocity / acceleration limits
      const d=[wrap(t0-q0),t1-q1,t2-q2,t3-qw];
      let Ts=0;for(let i=0;i<4;i++)Ts=Math.max(Ts,Math.abs(d[i])/VMAX[i]);
      const q=[q0,q1,q2,qw];
      for(let i=0;i<4;i++){
        const ad=Math.abs(d[i]);
        const vl=Math.max(0.03,Ts>1e-4?Math.min(VMAX[i],ad/Ts):VMAX[i]),al=writing?AMAX[i]:Math.max(0.6,AMAX[i]*vl/VMAX[i]);
        const vdes=Math.max(-VMAX[i],Math.min(VMAX[i],ff[i]+Math.sign(d[i])*Math.min(vl,Math.sqrt(2*al*ad))));
        qv[i]+=Math.max(-al*dt,Math.min(al*dt,vdes-qv[i]));
        if(ad<2e-4&&Math.abs(qv[i])<0.02){qv[i]=0;q[i]+=d[i];}
        else q[i]+=qv[i]*dt;
      }
      [q0,q1,q2,qw]=q;
      settled=d.every(v=>Math.abs(v)<0.012)&&qv.every(v=>Math.abs(v)<0.06);
    };

    const L=v3Norm([-0.45,0.8,0.5]);
    const render=()=>{
      ctx.setTransform(dpr,0,0,dpr,0,0);
      ctx.clearRect(0,0,W,H);
      const P=(p:V3)=>proj(cam,p);
      const line=(a:V3,b:V3)=>{const A=P(a),B=P(b);ctx.beginPath();ctx.moveTo(A[0],A[1]);ctx.lineTo(B[0],B[1]);ctx.stroke();};

      // floor grid, faded radially with destination-in
      ctx.lineWidth=0.6;ctx.strokeStyle=`rgba(${ink},${hero?0.09:0.1})`;
      for(let x=-3;x<=6.01;x+=0.6)line([x,0,-4.2],[x,0,4.2]);
      for(let z=-4.2;z<=4.21;z+=0.6)line([-3,0,z],[6,0,z]);
      const gc=P([1.1,0,0]);
      const fade=ctx.createRadialGradient(gc[0],gc[1],0,gc[0],gc[1],cam.F*0.62);
      fade.addColorStop(0,"rgba(0,0,0,1)");fade.addColorStop(0.55,"rgba(0,0,0,0.6)");fade.addColorStop(1,"rgba(0,0,0,0)");
      ctx.globalCompositeOperation="destination-in";ctx.fillStyle=fade;ctx.fillRect(0,0,W,H);
      ctx.globalCompositeOperation="source-over";

      // reach envelope
      ctx.setLineDash([4,7]);ctx.strokeStyle=`rgba(${ink},0.14)`;ctx.lineWidth=0.8;ctx.beginPath();
      for(let i=0;i<=72;i++){const a=(i/72)*Math.PI*2,s=P([Math.cos(a)*3.4,0,Math.sin(a)*3.4]);i?ctx.lineTo(s[0],s[1]):ctx.moveTo(s[0],s[1]);}
      ctx.stroke();ctx.setLineDash([]);

      // pick / place pads (footer cell only)
      if(!hero)PADS.forEach((pad,i)=>{
        const h=0.34,corners:V3[]=[[pad[0]-h,0,pad[2]-h],[pad[0]+h,0,pad[2]-h],[pad[0]+h,0,pad[2]+h],[pad[0]-h,0,pad[2]+h]];
        ctx.strokeStyle=`rgba(${ink},0.3)`;ctx.lineWidth=0.9;ctx.beginPath();
        corners.forEach((c,j)=>{const s=P(c);j?ctx.lineTo(s[0],s[1]):ctx.moveTo(s[0],s[1]);});
        ctx.closePath();ctx.stroke();
        const lp=P([pad[0]+h+0.12,0,pad[2]+h]);
        ctx.fillStyle=`rgba(${ink},0.42)`;ctx.font=`11px ${MN}`;ctx.fillText(i===0?"PAD_A":"PAD_B",lp[0],lp[1]);
      });

      // arm + cube
      const faces:Face[]=[];
      const q3=hero?qw:Math.PI-q1-q2;
      const pts=buildArm(faces,q0,q1,q2,q3,q0,grip,hero,hero&&heroWrite.active);
      lastTip=pts.tip;
      if(!hero){
        if(seq.carry)cube=[pts.tip[0],pts.tip[1],pts.tip[2]];
        addBox(faces,m3T(cube[0],cube[1],cube[2]),CUBE,CUBE,CUBE,1.3);
      }

      // floor projection (shadow trace)
      ctx.strokeStyle=hero?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.12)";ctx.lineWidth=hero?1:3;ctx.setLineDash(hero?[2,5]:[]);
      ctx.beginPath();
      [[0,0,0] as V3,pts.sh,pts.el,pts.wr,pts.tip].forEach((p,i)=>{const s=P([p[0],0,p[2]]);i?ctx.lineTo(s[0],s[1]):ctx.moveTo(s[0],s[1]);});
      ctx.stroke();ctx.setLineDash([]);

      const vis=faces.filter(f=>v3Dot(f.n,v3Sub(cam.eye,f.c))>0)
        .map(f=>({f,z:v3Dot(v3Sub(f.c,cam.eye),cam.f)}))
        .sort((a,b)=>b.z-a.z);
      ctx.lineJoin="round";
      for(const {f} of vis){
        const s=f.pts.map(P);
        const diff=Math.max(0,v3Dot(f.n,L));
        const fres=1-Math.abs(v3Dot(f.n,v3Norm(v3Sub(cam.eye,f.c))));
        let fill:string,edge:string;
        if(f.glow){
          fill="#fff";edge="#fff";
        } else if(hero){
          const v=Math.min(170,Math.round((16+diff*68+fres*18)*f.tone));
          fill=`rgb(${v},${v},${v})`;edge=`rgba(255,255,255,${0.22+diff*0.45})`;
        } else {
          const v=Math.round(252-((1-diff)*40+fres*10)*f.tone);
          fill=`rgb(${v},${v},${v})`;edge=`rgba(0,0,0,${0.3+(1-diff)*0.22})`;
        }
        ctx.beginPath();s.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();
        ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=fill;ctx.lineWidth=0.6;ctx.stroke();
        ctx.strokeStyle=edge;ctx.lineWidth=f.rim?0.7:0.9;
        if(f.rim){ctx.beginPath();ctx.moveTo(s[0][0],s[0][1]);ctx.lineTo(s[1][0],s[1][1]);ctx.moveTo(s[2][0],s[2][1]);ctx.lineTo(s[3][0],s[3][1]);ctx.stroke();}
        else ctx.stroke();
      }

      // vision cone from the wrist camera
      const pulse=0.5+0.5*Math.sin(T*3);
      const tp=P(pts.tip),hw=0.5;
      if(hero){
        // lens position in client coords for the projection overlay
        const r=el.getBoundingClientRect();
        heroWrite.tcpX=r.left+tp[0]*r.width/W;heroWrite.tcpY=r.top+tp[1]*r.height/H;heroWrite.tcpOk=true;
      }
      if(!hero){
      const fc:V3[]=[[pts.tip[0]-hw,0,pts.tip[2]-hw],[pts.tip[0]+hw,0,pts.tip[2]-hw],[pts.tip[0]+hw,0,pts.tip[2]+hw],[pts.tip[0]-hw,0,pts.tip[2]+hw]];
      const fs=fc.map(P);
      ctx.fillStyle=`rgba(${ink},${0.02+pulse*0.025})`;
      ctx.beginPath();fs.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fill();
      ctx.strokeStyle=`rgba(${ink},0.1)`;ctx.lineWidth=0.6;
      fs.forEach(p=>{ctx.beginPath();ctx.moveTo(tp[0],tp[1]);ctx.lineTo(p[0],p[1]);ctx.stroke();});
      const sl=(T*0.8)%1,sa=P([pts.tip[0]-hw,0,pts.tip[2]-hw+sl*hw*2]),sb=P([pts.tip[0]+hw,0,pts.tip[2]-hw+sl*hw*2]);
      ctx.strokeStyle=`rgba(${ink},0.35)`;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(sa[0],sa[1]);ctx.lineTo(sb[0],sb[1]);ctx.stroke();
      return;
      }
      // TCP lock-on
      const lk=14+pulse*3;
      ctx.strokeStyle=`rgba(255,255,255,${manual?0.85:0.55})`;ctx.lineWidth=1.1;
      [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([sx,sy])=>{
        ctx.beginPath();ctx.moveTo(tp[0]+sx*lk,tp[1]+sy*(lk-6));ctx.lineTo(tp[0]+sx*lk,tp[1]+sy*lk);ctx.lineTo(tp[0]+sx*(lk-6),tp[1]+sy*lk);ctx.stroke();
      });
    };

    let raf=0,last=performance.now(),visible=true;
    const frame=(now:number)=>{
      if(!visible)return;
      raf=requestAnimationFrame(frame);
      const raw=(now-last)/1000;
      if(lowPower&&raw<1/30)return;
      last=now;
      step(Math.min(0.05,raw));render();
    };
    const ro=new ResizeObserver(()=>{resize();if(reduced){step(0);render();}});
    ro.observe(el);
    const io=new IntersectionObserver(([en])=>{
      visible=en.isIntersecting;
      cancelAnimationFrame(raf);
      if(visible&&!reduced){last=performance.now();raf=requestAnimationFrame(frame);}
    },{rootMargin:"120px"});
    io.observe(el);
    step(0);render();
    return()=>{cancelAnimationFrame(raf);ro.disconnect();io.disconnect();window.removeEventListener("pointermove",onMove);};
  },[variant,lowPower]);
  return <canvas ref={ref} className="absolute inset-0 h-full w-full pointer-events-none" aria-hidden="true"/>;
}

/* ─── HERO ───────────────────────────────────────────────────────── */
export function Hero({ready,lowPower,onViewCV}:{ready:boolean;lowPower:boolean;onViewCV:()=>void}) {
  const ref=useRef<HTMLElement>(null);
  const {scrollYProgress}=useScroll({target:ref,offset:["start start","end start"]});
  const nameY=useTransform(scrollYProgress,[0,1],[0,-280]);
  const nameOp=useTransform(scrollYProgress,[0,0.5],[1,0]);
  const armOp=useTransform(scrollYProgress,[0,0.7],[1,0]);
  const armSc=useTransform(scrollYProgress,[0,1],[1,1.18]);
  const [roleIdx,setRoleIdx]=useState(0);
  // the arm rewrites the name every time the hero comes back into view
  const nameRef=useRef<HTMLHeadingElement>(null);
  const nameIn=useInView(nameRef,{amount:0.25});
  const [writeRun,setWriteRun]=useState(0);
  useEffect(()=>{if(ready&&nameIn)setWriteRun(r=>r+1);},[ready,nameIn]);
  // keep the plotter on stage for the whole write, plus time to park
  useEffect(()=>{
    if(writeRun<1)return;
    heroWrite.t0=performance.now();
    heroWrite.until=heroWrite.t0+(charAt(12)+CHAR_DUR+1.4)*1000;
  },[writeRun]);
  // subtle 3D tilt of the name block toward the pointer
  const tx=useMotionValue(0),ty=useMotionValue(0);
  const stx=useSpring(tx,{stiffness:60,damping:18}),sty=useSpring(ty,{stiffness:60,damping:18});
  const tiltY=useTransform(stx,v=>v*7),tiltX=useTransform(sty,v=>-v*5);
  useEffect(()=>{
    if(lowPower||window.matchMedia("(pointer:coarse)").matches)return;
    const fn=(e:PointerEvent)=>{tx.set(e.clientX/window.innerWidth-0.5);ty.set(e.clientY/window.innerHeight-0.5);};
    window.addEventListener("pointermove",fn,{passive:true});
    return()=>window.removeEventListener("pointermove",fn);
  },[lowPower,tx,ty]);
  useEffect(()=>{if(!ready)return;const id=setInterval(()=>setRoleIdx(i=>(i+1)%ROLES.length),3200);return()=>clearInterval(id);},[ready]);
  return (
    <section ref={ref} id="home" className="min-h-[100svh] flex flex-col overflow-hidden" style={{position:"relative"}}>
      {/* Particle field */}
      {!lowPower&&<motion.div className="absolute inset-0" style={{opacity:armOp}}><ParticleField/></motion.div>}
      {/* Robot arm canvas */}
      {!SIMPLE&&<motion.div className="absolute inset-0" style={{opacity:armOp,scale:armSc}}>
        <RobotArm3D variant="hero" lowPower={lowPower}/>
      </motion.div>}
      {/* Scan sweep */}
      {!lowPower&&<ScanSweep/>}
      {!SIMPLE&&<ProjectionOverlay/>}
      {/* HUD frame corners */}
      <HUDFrame label="CTRL_SYS_ACTIVE" sublabel="TU·DORTMUND·2026"/>
      {/* Gradient masks */}
      <div className="absolute inset-0 pointer-events-none" style={{background:"radial-gradient(ellipse 80% 70% at 60% 55%,transparent 25%,rgba(8,8,8,0.75) 100%)",zIndex:2}}/>
      <div className="absolute inset-0 pointer-events-none" style={{background:"linear-gradient(to right,rgba(8,8,8,0.96) 0%,rgba(8,8,8,0.62) 42%,rgba(8,8,8,0.08) 68%,transparent 100%)",zIndex:2}}/>
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{height:"40%",background:"linear-gradient(to top,#080808,transparent)",zIndex:2}}/>
      <div className="absolute inset-0 pointer-events-none opacity-[0.018]" style={{backgroundImage:NOISE,backgroundSize:"256px 256px",zIndex:3}}/>
      {/* CRT scanlines */}
      <div className="absolute inset-0 pointer-events-none" style={{backgroundImage:"repeating-linear-gradient(0deg,rgba(0,0,0,0.035) 0px,rgba(0,0,0,0.035) 1px,transparent 1px,transparent 3px)",backgroundSize:"100% 3px",zIndex:6}}/>

      {/* Top bar */}
      <motion.div initial={{opacity:0}} animate={{opacity:ready?1:0}} transition={{delay:0.6,duration:0.8}} className="relative px-5 pt-24 md:px-14 md:pt-28" style={{zIndex:10}}>
        <TypeBot text={t("ROBOTICS / AUTOMATION","ROBOTIK / AUTOMATION")} delay={0.8} speed={22} style={{fontFamily:MN,fontSize:"12.5px",color:"rgba(255,255,255,0.65)",letterSpacing:"0.22em"}}/>
      </motion.div>

      {/* Main content */}
      <motion.div style={{y:nameY,opacity:nameOp,zIndex:10}} className="relative mt-2 flex flex-1 items-center px-5 py-5 md:px-10 md:py-0">
        <div style={{perspective:"1400px"}}>
          <motion.div style={{rotateX:tiltX,rotateY:tiltY}}>
          <motion.div initial={{rotateX:8,opacity:0}} animate={{rotateX:0,opacity:ready?1:0}} transition={{delay:0.2,duration:1.2,ease:[0.22,1,0.36,1]}}>
            <h1 ref={nameRef} aria-label="Alphin Francis" style={{fontFamily:"'Stalinist One', sans-serif",fontWeight:400,fontStyle:"normal",letterSpacing:"0",lineHeight:1.02,fontSize:"clamp(2.1rem,9.5vw,10.5rem)"}}>
              <RobotWrite key={`a${writeRun}`} text="ALPHIN" start={writeRun>0} delay={charAt(0)}/>
              <RobotWrite key={`f${writeRun}`} text="FRANCIS" start={writeRun>0} delay={charAt(6)} offset={6}/>
            </h1>
          </motion.div>
          </motion.div>

          {ready&&(
            <motion.div initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{delay:0.9,duration:0.85,ease:[0.22,1,0.36,1]}}
              className="relative mt-8 inline-flex max-w-full items-center gap-4 border border-white/20 bg-white/[0.04] py-3 pl-4 pr-6 backdrop-blur-md md:mt-10 md:gap-5 md:py-4 md:pl-5 md:pr-8"
              style={{borderLeft:"3px solid #fff"}}>
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-40"/>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white"/>
              </span>
              <div className="min-w-0">
                <div style={{fontFamily:MN,fontSize:"11.5px",color:"rgba(255,255,255,0.6)",letterSpacing:"0.22em"}}>{t("CURRENT FOCUS","AKTUELLER FOKUS")}</div>
                <div style={{fontSize:"clamp(0.95rem,2.1vw,1.8rem)",height:"1.3em",overflow:"hidden",position:"relative",width:"min(76vw,620px)",marginTop:4}}>
                  <AnimatePresence mode="wait">
                    <motion.p key={roleIdx} initial={{y:"110%",opacity:0}} animate={{y:"0%",opacity:1}} exit={{y:"-110%",opacity:0}} transition={{duration:0.52,ease:[0.22,1,0.36,1]}}
                      style={{fontFamily:BG,fontWeight:700,fontSize:"1em",lineHeight:1.3,color:"#fff",letterSpacing:"-0.015em",position:"absolute",whiteSpace:"nowrap"}}>
                      {ROLES[roleIdx]}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}

          {ready&&(
            <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:1.15,duration:0.75,ease:[0.22,1,0.36,1]}} className="mt-8 flex flex-wrap gap-2.5">
              <Mag str={0.12}>
                <a href="#work" data-cur="VIEW" className="group flex items-center gap-3 bg-white px-5 py-3 text-black transition-colors hover:bg-white/90 md:px-6"
                  style={{fontFamily:BG,fontWeight:800,fontSize:"0.82rem",textDecoration:"none"}}>
                  {t("View selected work","Ausgewählte Projekte")} <ArrowUpRight size={13} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"/>
                </a>
              </Mag>
              <Mag str={0.1}>
                <button onClick={onViewCV} data-cur="CV" className="group flex items-center gap-3 border border-white/20 bg-black/20 px-5 py-3 text-white backdrop-blur-sm transition-colors hover:border-white/45 hover:bg-white/[0.06] md:px-6"
                  style={{fontFamily:BG,fontWeight:750,fontSize:"0.82rem"}}>
                  {t("View CV","Lebenslauf")}
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                    <path d="M1.5 6.5s1.8-3 5-3 5 3 5 3-1.8 3-5 3-5-3-5-3Z M6.5 5.2a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6Z" stroke="currentColor" strokeWidth="1"/>
                  </svg>
                </button>
              </Mag>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Bottom bar */}
      <motion.div initial={{opacity:0,y:22}} animate={{opacity:ready?1:0,y:ready?0:22}} transition={{delay:1.05,duration:0.9,ease:[0.22,1,0.36,1]}}
        className="flex justify-between items-end px-5 pb-6 pt-4 md:px-14 md:pb-10" style={{borderTop:`1px solid ${BRD}`,position:"relative",zIndex:10}}>
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-30"/>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"/>
          </span>
          <TypeBot text={t("OPEN TO ROLES · LEVERKUSEN, DE","OFFEN FÜR NEUE ROLLEN · LEVERKUSEN")} delay={1.4} speed={30} style={{fontFamily:MN,fontSize:"clamp(11.5px,2.8vw,13px)",color:"rgba(255,255,255,0.72)",letterSpacing:"0.1em"}}/>
        </div>
        <span className="hidden sm:block" style={{fontFamily:MN,fontSize:"11.5px",color:"rgba(255,255,255,0.71)",letterSpacing:"0.16em"}}>{t("SCROLL TO EXPLORE · 01","SCROLLEN ZUM ENTDECKEN · 01")}</span>
      </motion.div>

      {/* Scroll dot */}
      <motion.div initial={{opacity:0}} animate={{opacity:ready?1:0}} transition={{delay:1.9}} className="absolute bottom-12 left-1/2 hidden -translate-x-1/2 pointer-events-none md:block" style={{zIndex:10}}>
        <div style={{width:1,height:55,background:"linear-gradient(to bottom,rgba(255,255,255,0.25),transparent)",position:"relative",overflow:"hidden"}}>
          <motion.div style={{position:"absolute",top:0,width:"100%",background:"#fff",height:"38%"}} animate={{y:[0,38,0]}} transition={{duration:2.5,repeat:Infinity,ease:"easeInOut"}}/>
        </div>
      </motion.div>
    </section>
  );
}
