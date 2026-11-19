import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useScroll, type MotionValue } from "motion/react";
import {
  type V3, type Face, type Cam, m3T, m3Rx, m3Ry, m3Rz, m3Mul, m3P,
  addBox, addCyl, addSphere, makeCam, proj, drawFaces, runCanvas,
} from "./engine";
import { t, onLang } from "../../i18n";

const BG="'Bricolage Grotesque', sans-serif";
const MN="'DM Mono', monospace";
const BODY="'Inter', system-ui, sans-serif";
const ID=m3T(0,0,0);
const m3S=(x:number,y:number,z:number)=>[x,0,0,0, 0,y,0,0, 0,0,z,0];
const clamp01=(v:number)=>Math.min(1,Math.max(0,v));
const ss=(a:number,b:number,v:number)=>{const t=clamp01((v-a)/(b-a));return t*t*(3-2*t);};
const easeOut=(t:number)=>1-Math.pow(1-clamp01(t),3);

/* ─── ROBOT BUST — shared by the loader and the contact companion ── */
type Part={id:string;kind:"box"|"cyl"|"sph";m:number[];d:number[];tone?:number;glow?:boolean;head:boolean;dir:V3};

function botParts(eyeX:number,eyeY:number,blink:number,ledOn:boolean):Part[] {
  const ex=eyeX*0.07,ey=eyeY*0.05;
  const P:Part[]=[
    {id:"skull",kind:"box",m:m3T(0,0,0),d:[1.5,1.12,1.3],head:true,dir:[0,1.5,0]},
    {id:"crest",kind:"box",m:m3T(0,0.66,-0.05),d:[0.18,0.2,0.95],tone:1.25,head:true,dir:[0,2.6,-0.6]},
    {id:"face",kind:"box",m:m3T(0,0.02,0.63),d:[1.26,0.62,0.08],tone:0.4,head:true,dir:[0,0,2.8]},
    {id:"brow",kind:"box",m:m3T(0,0.42,0.66),d:[1.32,0.08,0.1],tone:1.35,head:true,dir:[0,0.9,2.4]},
    {id:"earL",kind:"cyl",m:m3Mul(m3T(-0.82,0,0),m3Rz(Math.PI/2)),d:[0.3,0.16],tone:0.9,head:true,dir:[-2.8,0,0]},
    {id:"earR",kind:"cyl",m:m3Mul(m3T(0.82,0,0),m3Rz(Math.PI/2)),d:[0.3,0.16],tone:0.9,head:true,dir:[2.8,0,0]},
    {id:"earLi",kind:"cyl",m:m3Mul(m3T(-0.93,0,0),m3Rz(Math.PI/2)),d:[0.17,0.1],tone:1.35,head:true,dir:[-3.4,0.3,0]},
    {id:"earRi",kind:"cyl",m:m3Mul(m3T(0.93,0,0),m3Rz(Math.PI/2)),d:[0.17,0.1],tone:1.35,head:true,dir:[3.4,0.3,0]},
    {id:"ant",kind:"cyl",m:m3T(0.82,0.46,0),d:[0.025,0.56],tone:1.2,head:true,dir:[2.4,2.8,0]},
    {id:"antTip",kind:"sph",m:m3T(0.82,0.78,0),d:[0.075],tone:1.4,glow:ledOn,head:true,dir:[2.6,3.4,0]},
    {id:"eyeL",kind:"sph",m:m3Mul(m3T(-0.3+ex,0.05+ey,0.68),m3S(1,Math.max(0.08,blink),0.45)),d:[0.14],glow:true,head:true,dir:[-0.6,0,3.4]},
    {id:"eyeR",kind:"sph",m:m3Mul(m3T(0.3+ex,0.05+ey,0.68),m3S(1,Math.max(0.08,blink),0.45)),d:[0.14],glow:true,head:true,dir:[0.6,0,3.4]},
    {id:"jaw",kind:"box",m:m3T(0,-0.65,0.04),d:[1.12,0.2,1.12],tone:0.8,head:true,dir:[0,-1.7,0.7]},
    {id:"neck",kind:"cyl",m:m3T(0,-0.92,0),d:[0.28,0.42],tone:0.7,head:false,dir:[0,-1.9,0]},
    {id:"collar",kind:"cyl",m:m3T(0,-1.12,0),d:[0.56,0.12],tone:1.15,head:false,dir:[0,-2.5,0]},
    {id:"torso",kind:"box",m:m3T(0,-1.5,0),d:[2.3,0.62,1.15],head:false,dir:[0,-3.2,0]},
    {id:"chest",kind:"box",m:m3T(0,-1.42,0.59),d:[0.52,0.09,0.04],glow:true,head:false,dir:[0,-3.2,1.8]},
    {id:"shL",kind:"sph",m:m3T(-1.26,-1.44,0),d:[0.38],tone:1.1,head:false,dir:[-3.2,-1.4,0]},
    {id:"shR",kind:"sph",m:m3T(1.26,-1.44,0),d:[0.38],tone:1.1,head:false,dir:[3.2,-1.4,0]},
  ];
  for(let i=0;i<5;i++){
    const x=-0.3+i*0.15;
    P.push({id:`grill${i}`,kind:"box",m:m3T(x,-0.33,0.66),d:[0.07,0.12,0.06],tone:1.3,head:true,dir:[x*5,-1.2,2.6]});
  }
  return P;
}
function buildBot(out:Face[],parts:Part[],bodyM:number[],headM:number[],xf?:(p:Part)=>number[]) {
  const at:Record<string,V3>={};
  for(const p of parts){
    const m=m3Mul(p.head?headM:bodyM,xf?xf(p):ID,p.m);
    if(p.kind==="box")addBox(out,m,p.d[0],p.d[1],p.d[2],p.tone??1,p.glow);
    else if(p.kind==="cyl")addCyl(out,m,p.d[0],p.d[1],p.id.startsWith("ear")||p.id==="collar"?18:12,p.tone??1,p.glow);
    else addSphere(out,m,p.d[0],p.glow?8:10,p.tone??1,p.glow);
    at[p.id]=m3P(m,0,0,0);
  }
  return at;
}
function headMatrix(bodyM:number[],yaw:number,pitch:number) {
  return m3Mul(bodyM,m3T(0,-0.72,0),m3Ry(yaw),m3Rx(pitch),m3T(0,0.72,0));
}
function glowAt(ctx:CanvasRenderingContext2D,cam:Cam,p:V3,r:number,a:number,rgb="255,255,255") {
  const s=proj(cam,p),R=r*cam.F/s[2];
  const g=ctx.createRadialGradient(s[0],s[1],0,s[0],s[1],R);
  g.addColorStop(0,`rgba(${rgb},${a})`);g.addColorStop(1,`rgba(${rgb},0)`);
  ctx.globalCompositeOperation=rgb==="255,255,255"?"lighter":"multiply";ctx.fillStyle=g;
  ctx.beginPath();ctx.arc(s[0],s[1],R,0,Math.PI*2);ctx.fill();
  ctx.globalCompositeOperation="source-over";
}
function ring(ctx:CanvasRenderingContext2D,cam:Cam,c:V3,r:number,stroke:string,dash:number[]=[],fill?:string) {
  ctx.beginPath();
  for(let i=0;i<=64;i++){const a=(i/64)*Math.PI*2,s=proj(cam,[c[0]+Math.cos(a)*r,c[1],c[2]+Math.sin(a)*r]);i?ctx.lineTo(s[0],s[1]):ctx.moveTo(s[0],s[1]);}
  if(fill){ctx.fillStyle=fill;ctx.fill();}
  ctx.setLineDash(dash);ctx.strokeStyle=stroke;ctx.stroke();ctx.setLineDash([]);
}

/* ─── PRELOADER — the robot assembles itself while the site boots ── */
export function Preloader3D({onDone}:{onDone:()=>void}) {
  const [pct,setPct]=useState(0),[phase,setPhase]=useState<"count"|"exit">("count");
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const prog=useRef(0);
  const BOOT=[t("LOADING KINEMATIC MODEL","LADE KINEMATIKMODELL"),t("CALIBRATING DEPTH SENSORS","KALIBRIERE TIEFENSENSOREN"),t("SYNCING JOINT STATES","SYNCHRONISIERE GELENKZUSTÄNDE"),t("VISION PIPELINE ACTIVE","VISION-PIPELINE AKTIV"),t("ALL SYSTEMS NOMINAL","ALLE SYSTEME BEREIT")];
  useEffect(()=>{
    const s=performance.now(),d=2300;let r=0;
    const tick=(n:number)=>{
      const p=Math.min((n-s)/d,1);prog.current=p;setPct(Math.floor(p*100));
      if(p<1)r=requestAnimationFrame(tick);
      else{setPhase("exit");setTimeout(onDone,1000);}
    };
    r=requestAnimationFrame(tick);return()=>cancelAnimationFrame(r);
  },[onDone]);
  useEffect(()=>{
    const el=canvasRef.current;if(!el)return;
    return runCanvas(el,(ctx,W,H,_dt,T)=>{
      const p=prog.current;
      const F=Math.min(W*1.5,H*1.05),cam=makeCam([0,-0.45,0],0.55*Math.sin(T*0.55)+(1-easeOut(p))*1.2,0.14,8,F,W/2,H*0.47);
      // floor rings + radial ticks
      ring(ctx,cam,[0,-1.85,0],1.7,"rgba(0,0,0,0.22)");
      ring(ctx,cam,[0,-1.85,0],2.5,"rgba(0,0,0,0.13)",[3,7]);
      ring(ctx,cam,[0,-1.85,0],3.3,"rgba(0,0,0,0.07)");
      ctx.strokeStyle="rgba(0,0,0,0.16)";ctx.lineWidth=0.7;
      for(let i=0;i<36;i++){const a=i/36*Math.PI*2+T*0.1,A=proj(cam,[Math.cos(a)*1.7,-1.85,Math.sin(a)*1.7]),B=proj(cam,[Math.cos(a)*(i%3?1.85:2.05),-1.85,Math.sin(a)*(i%3?1.85:2.05)]);ctx.beginPath();ctx.moveTo(A[0],A[1]);ctx.lineTo(B[0],B[1]);ctx.stroke();}
      // per-part assembly window: parts arrive one after another
      const parts=botParts(Math.sin(T*1.3)*0.6,0,p<0.97?0.25:1,Math.sin(T*6)>0);
      const n=parts.length;
      const order=["torso","collar","neck","shL","shR","jaw","skull","face","earL","earR","earLi","earRi","brow","crest","grill0","grill1","grill2","grill3","grill4","chest","ant","antTip","eyeL","eyeR"];
      const xf=(pt:Part)=>{
        const i=Math.max(0,order.indexOf(pt.id)),st=(i/n)*0.62,e=1-easeOut((p-st)/0.32);
        return e<=0?ID:m3Mul(m3T(pt.dir[0]*e*1.3,pt.dir[1]*e*1.3,pt.dir[2]*e*1.3),m3Ry(e*2.2));
      };
      const bodyM=m3T(0,0,0),headM=headMatrix(bodyM,Math.sin(T*0.8)*0.18*p,Math.sin(T*0.6)*0.06);
      const faces:Face[]=[];
      const at=buildBot(faces,parts,bodyM,headM,xf);
      // vertical scan plane sweeping the build
      if(p<1){
        const y=0.95-((T*0.55)%1)*2.9;
        ring(ctx,cam,[0,y,0],1.55,"rgba(0,0,0,0.45)",[],"rgba(0,0,0,0.03)");
      }
      drawFaces(ctx,faces,cam,{dark:false});
      const eyeA=p>0.9?0.3:0.12;
      glowAt(ctx,cam,at.eyeL,0.42,eyeA,"0,0,0");glowAt(ctx,cam,at.eyeR,0.42,eyeA,"0,0,0");
      glowAt(ctx,cam,at.chest,0.5,0.18,"0,0,0");
      // screen-space lock brackets around the head
      const hc=proj(cam,m3P(headM,0,0,0)),b=F*0.16,k=14;
      ctx.strokeStyle=`rgba(0,0,0,${0.3+0.35*p})`;ctx.lineWidth=1.2;
      [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([sx,sy])=>{ctx.beginPath();ctx.moveTo(hc[0]+sx*b,hc[1]+sy*(b-k));ctx.lineTo(hc[0]+sx*b,hc[1]+sy*b);ctx.lineTo(hc[0]+sx*(b-k),hc[1]+sy*b);ctx.stroke();});
    },{alwaysOn:true});
  },[]);
  const msgs=BOOT.slice(0,Math.min(BOOT.length,Math.floor(pct/100*BOOT.length)+1));
  return (
    <motion.div className="fixed inset-0 z-[9999] overflow-hidden" style={{background:"radial-gradient(ellipse 70% 60% at 50% 45%,#ffffff 0%,#ece8e1 75%)"}}
      initial={{clipPath:"inset(0% 0 0 0)"}} animate={phase==="exit"?{clipPath:"inset(0 0 100% 0)"}:{clipPath:"inset(0% 0 0 0)"}} transition={{duration:1.0,ease:[0.76,0,0.24,1]}}>
      <div className="absolute inset-0 pointer-events-none" style={{backgroundImage:"repeating-linear-gradient(0deg,rgba(0,0,0,0.045) 0px,rgba(0,0,0,0.045) 1px,transparent 1px,transparent 56px),repeating-linear-gradient(90deg,rgba(0,0,0,0.045) 0px,rgba(0,0,0,0.045) 1px,transparent 1px,transparent 56px)"}}/>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true"/>
      <div className="relative flex items-center justify-between px-6 pt-8 md:px-14">
        <span style={{fontFamily:BG,fontWeight:900,fontSize:"1.05rem",color:"#0a0a0a",letterSpacing:"-0.02em"}}>ALPHIN FRANCIS</span>
        <span style={{fontFamily:MN,fontSize:"12px",color:"rgba(0,0,0,0.65)",letterSpacing:"0.2em"}}>UNIT AF-01 · BOOT</span>
      </div>
      <div className="absolute bottom-24 left-6 space-y-2 md:bottom-28 md:left-14">
        {msgs.map((m,i)=>(
          <motion.div key={m} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} className="flex items-center gap-3"
            style={{fontFamily:MN,fontSize:"12.5px",color:i===msgs.length-1?"#0a0a0a":"rgba(0,0,0,0.5)",letterSpacing:"0.12em"}}>
            <span style={{opacity:0.6}}>{i===msgs.length-1&&pct<100?"▸":"✓"}</span>{m}
          </motion.div>
        ))}
      </div>
      <div className="absolute bottom-7 right-6 flex items-baseline gap-2 md:right-14">
        <span style={{fontFamily:BG,fontWeight:900,color:"#0a0a0a",letterSpacing:"-0.065em",fontSize:"clamp(4.5rem,15vw,11rem)",lineHeight:0.82,fontVariantNumeric:"tabular-nums"}}>{String(pct).padStart(2,"0")}</span>
        <span style={{fontFamily:MN,fontSize:"14px",color:"rgba(0,0,0,0.6)",alignSelf:"flex-end",marginBottom:"0.8rem"}}>%</span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{background:"rgba(0,0,0,0.08)"}}>
        <div style={{height:"100%",background:"#0a0a0a",width:`${pct}%`}}/>
      </div>
    </motion.div>
  );
}

/* ─── SHOWCASE — exploded mobile manipulator, driven by scroll ───── */
const buildLabels=():{g:string;t:string;s:string}[]=>[
  {g:"base",t:t("DRIVE BASE","FAHRWERK"),s:t("Differential drive · ROS nav","Differentialantrieb · ROS-Navigation")},
  {g:"drive",t:t("WHEEL MODULES","RADMODULE"),s:t("Odometry · homing","Odometrie · Homing")},
  {g:"battery",t:t("POWER PACK","AKKUPACK"),s:t("48 V · hot-swap","48 V · im Betrieb tauschbar")},
  {g:"lidar",t:"2D LIDAR",s:t("SLAM · obstacle avoidance","SLAM · Hindernisvermeidung")},
  {g:"camera",t:t("RGB-D CAMERA","RGB-D-KAMERA"),s:"RealSense · Open3D"},
  {g:"arm",t:t("6-AXIS ARM","6-ACHS-ARM"),s:"URScript · Stäubli VAL3"},
  {g:"gripper",t:t("END EFFECTOR","ENDEFFEKTOR"),s:t("Vision-guided grasp","Bildgestütztes Greifen")},
];
const buildStages=()=>[
  {k:"01",t:t("Mobility","Mobilität"),groups:["base","drive","battery","lidar"],body:t("Obstacle avoidance, homing, path following, path planning and SLAM, implemented on mobile robot platforms in ROS and MATLAB.","Hindernisvermeidung, Homing, Pfadverfolgung, Pfadplanung und SLAM – umgesetzt auf mobilen Roboterplattformen in ROS und MATLAB.")},
  {k:"02",t:t("Perception","Wahrnehmung"),groups:["camera","lidar"],body:t("Intel RealSense, CubeEye and SensoPart sensors turned into calibrated OpenCV and Open3D pipelines on UR10 and UR20 cells.","Intel-RealSense-, CubeEye- und SensoPart-Sensoren als kalibrierte OpenCV- und Open3D-Pipelines in UR10- und UR20-Zellen.")},
  {k:"03",t:"Manipulation",groups:["arm","gripper"],body:t("Universal Robots through URScript and RTDE, and Stäubli TX2-140 in VAL3: workspace logic, kinematics databases and validated motion.","Universal Robots über URScript und RTDE sowie Stäubli TX2-140 in VAL3: Arbeitsraumlogik, Kinematikdatenbanken und validierte Bewegungen.")},
  {k:"04",t:"Integration",groups:["base","drive","battery","lidar","camera","arm","gripper"],body:t("My master thesis brings it together: a mobile manipulator that automates pharmaceutical cleaning validation using environment CAD data.","Meine Masterarbeit vereint alles: ein mobiler Manipulator, der die pharmazeutische Reinigungsvalidierung mithilfe von CAD-Umgebungsdaten automatisiert.")},
];
let AMR_LABELS=buildLabels(),STAGES=buildStages();
onLang(()=>{AMR_LABELS=buildLabels();STAGES=buildStages();});
const stageOf=(p:number)=>p<0.3?0:p<0.5?1:p<0.7?2:3;

function buildAMR(out:Face[],e:number,T:number,hl:string[]) {
  const all=hl.length>=AMR_LABELS.length;
  const tone=(g:string,t=1)=>all?t:hl.includes(g)?t*1.4:t*0.6;
  const at:Record<string,V3>={};
  // chassis
  addBox(out,m3T(0,0.5,0),2.4,0.46,1.5,tone("base"));
  addBox(out,m3T(0,0.76,0),2.2,0.06,1.36,tone("base",1.25));
  addBox(out,m3T(1.22,0.42,0),0.06,0.16,1.3,tone("base",0.7));
  addBox(out,m3T(-1.22,0.42,0),0.06,0.16,1.3,tone("base",0.7));
  addBox(out,m3T(0,0.56,0.756),1.6,0.04,0.02,1,true);
  addBox(out,m3T(0,0.56,-0.756),1.6,0.04,0.02,1,true);
  at.base=[-0.6,0.5,0.75];
  // wheels push outward
  const wo=0.75*e;
  [[0.8,0.82],[-0.8,0.82],[0.8,-0.82],[-0.8,-0.82]].forEach(([x,z])=>{
    const zz=z+Math.sign(z)*wo;
    addCyl(out,m3Mul(m3T(x,0.28,zz),m3Rx(Math.PI/2)),0.28,0.18,16,tone("drive",0.8));
    addCyl(out,m3Mul(m3T(x,0.28,zz+Math.sign(z)*0.07),m3Rx(Math.PI/2)),0.13,0.06,12,tone("drive",1.3));
  });
  at.drive=[0.8,0.28,0.98+wo];
  // battery slides out of the back
  const bx=-0.2-1.9*e;
  addBox(out,m3T(bx,0.48,0),1.2,0.3,0.9,tone("battery",1.1));
  addBox(out,m3T(bx-0.61,0.48,0),0.02,0.08,0.4,1,true);
  at.battery=[bx-0.6,0.5,0.45];
  // lidar lifts
  const ly=0.9+1.0*e;
  addCyl(out,m3T(0.85,ly-0.06,0),0.2,0.08,16,tone("lidar",0.9));
  addCyl(out,m3T(0.85,ly+0.06,0),0.15,0.16,16,tone("lidar",1.2));
  at.lidar=[0.85,ly+0.14,0];
  // camera mast slides forward
  const cx=1.05+0.85*e;
  addBox(out,m3T(cx,1.02,0),0.08,0.5,0.08,tone("camera"));
  addBox(out,m3T(cx+0.04,1.3,0),0.14,0.14,0.56,tone("camera",1.1));
  addCyl(out,m3Mul(m3T(cx+0.12,1.3,0.16),m3Rz(Math.PI/2)),0.045,0.04,10,1,true);
  addCyl(out,m3Mul(m3T(cx+0.12,1.3,-0.16),m3Rz(Math.PI/2)),0.045,0.04,10,1,true);
  at.camera=[cx+0.1,1.3,0.28];
  // arm rises off its mount
  const M=m3T(-0.35-0.25*e,0.79+1.35*e,0);
  addCyl(out,m3Mul(M,m3T(0,0.12,0)),0.3,0.24,18,tone("arm",0.9));
  const q0=0.5*Math.sin(T*0.5),q1=0.45+0.22*Math.sin(T*0.7),q2=1.25+0.28*Math.sin(T*0.9+1),q3=Math.PI-q1-q2-0.15*Math.sin(T*1.1);
  const yaw=m3Mul(M,m3Ry(q0));
  addCyl(out,m3Mul(yaw,m3T(0,0.36,0)),0.22,0.24,16,tone("arm"));
  const sh=m3Mul(yaw,m3T(0,0.52,0));
  addCyl(out,m3Mul(sh,m3Rx(Math.PI/2)),0.19,0.44,16,tone("arm",1.1));
  const up=m3Mul(sh,m3Rz(-q1));
  addBox(out,m3Mul(up,m3T(0,0.55,0)),0.2,0.92,0.24,tone("arm"));
  const el=m3Mul(up,m3T(0,1.1,0));
  addCyl(out,m3Mul(el,m3Rx(Math.PI/2)),0.15,0.36,14,tone("arm",1.1));
  const fo=m3Mul(el,m3Rz(-q2));
  addBox(out,m3Mul(fo,m3T(0,0.42,0)),0.15,0.72,0.17,tone("arm"));
  const wr=m3Mul(fo,m3T(0,0.86,0));
  addCyl(out,m3Mul(wr,m3Rx(Math.PI/2)),0.11,0.24,12,tone("arm",1.15));
  at.arm=m3P(el,0,0,0.2);
  // gripper separates from the flange
  const tl=m3Mul(wr,m3Rz(-q3),m3T(0,0.4*e,0));
  addCyl(out,m3Mul(tl,m3T(0,0.14,0)),0.1,0.08,12,tone("gripper",1.1));
  addBox(out,m3Mul(tl,m3T(0,0.21,0)),0.38,0.05,0.13,tone("gripper"));
  const g=0.12+0.04*Math.sin(T*2);
  addBox(out,m3Mul(tl,m3T(g,0.31,0)),0.04,0.17,0.1,tone("gripper",1.2));
  addBox(out,m3Mul(tl,m3T(-g,0.31,0)),0.04,0.17,0.1,tone("gripper",1.2));
  at.gripper=m3P(tl,0,0.32,0);
  return {at,lidar:[0.85,ly+0.06,0] as V3};
}

function ShowcaseCanvas({progress,lowPower}:{progress:MotionValue<number>;lowPower:boolean}) {
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    const el=ref.current;if(!el)return;
    const mouse={x:0,y:0};
    const onMove=(e:PointerEvent)=>{if(e.pointerType!=="mouse")return;mouse.x=e.clientX/window.innerWidth-0.5;mouse.y=e.clientY/window.innerHeight-0.5;};
    window.addEventListener("pointermove",onMove,{passive:true});
    const par={x:0,y:0};
    let pSm=progress.get();
    const stop=runCanvas(el,(ctx,W,H,dt,T)=>{
      const k=1-Math.exp(-dt*4);
      par.x+=(mouse.x-par.x)*k;par.y+=(mouse.y-par.y)*k;
      pSm+=(progress.get()-pSm)*(dt?1-Math.exp(-dt*8):1);
      const p=pSm,stage=stageOf(p),wide=W>=1024;
      const e=ss(0.04,0.2,p)*(1-ss(0.76,0.9,p));
      const F=Math.min(H*1.2,W*(wide?0.95:1.25));
      const cam=makeCam([0.1,0.95,0],-0.75+p*2.3+par.x*0.3,0.34-p*0.08+par.y*0.08,8.4,F,wide?W*0.63:W*0.5,wide?H*0.56:H*0.4);
      const P=(v:V3)=>proj(cam,v);
      const line=(a:V3,b:V3)=>{const A=P(a),B=P(b);ctx.beginPath();ctx.moveTo(A[0],A[1]);ctx.lineTo(B[0],B[1]);ctx.stroke();};
      // floor grid, faded radially
      ctx.lineWidth=0.6;ctx.strokeStyle="rgba(255,255,255,0.1)";
      for(let x=-4.8;x<=4.81;x+=0.6)line([x,0,-4.2],[x,0,4.2]);
      for(let z=-4.2;z<=4.21;z+=0.6)line([-4.8,0,z],[4.8,0,z]);
      const gc=P([0,0,0]);
      const fade=ctx.createRadialGradient(gc[0],gc[1],0,gc[0],gc[1],F*0.6);
      fade.addColorStop(0,"rgba(0,0,0,1)");fade.addColorStop(0.55,"rgba(0,0,0,0.55)");fade.addColorStop(1,"rgba(0,0,0,0)");
      ctx.globalCompositeOperation="destination-in";ctx.fillStyle=fade;ctx.fillRect(0,0,W,H);
      ctx.globalCompositeOperation="source-over";
      ring(ctx,cam,[0,0,0],2.2,"rgba(255,255,255,0.18)",[4,8]);

      const faces:Face[]=[];
      const {at,lidar}=buildAMR(faces,e,T,STAGES[stage].groups);
      // lidar sweep fan
      const lc=P(lidar),la=T*2.6;
      for(let i=0;i<26;i++){
        const a=la-i*0.035,r=2.4+0.5*Math.sin(i*1.7+T),q=P([lidar[0]+Math.cos(a)*r,lidar[1],lidar[2]+Math.sin(a)*r]);
        ctx.strokeStyle=`rgba(255,255,255,${(1-i/26)*(stage===0||stage===1?0.32:0.12)})`;ctx.lineWidth=0.8;
        ctx.beginPath();ctx.moveTo(lc[0],lc[1]);ctx.lineTo(q[0],q[1]);ctx.stroke();
        if(i===0){ctx.fillStyle="rgba(255,255,255,0.8)";ctx.beginPath();ctx.arc(q[0],q[1],2.2,0,Math.PI*2);ctx.fill();}
      }
      drawFaces(ctx,faces,cam,{dark:true,max:205});
      // camera frustum during perception
      if(stage===1){
        const c=at.camera,pulse=0.5+0.5*Math.sin(T*3);
        const far:V3[]=[[c[0]+2.2,0,c[2]-1.2],[c[0]+2.2,0,c[2]+0.6],[c[0]+2.2,1.6,c[2]+0.6],[c[0]+2.2,1.6,c[2]-1.2]];
        ctx.strokeStyle=`rgba(255,255,255,${0.18+pulse*0.12})`;ctx.lineWidth=0.8;
        const o:V3=[c[0]+0.05,c[1],c[2]-0.28];
        far.forEach(f=>line(o,f));
        ctx.beginPath();far.map(P).forEach((s,i)=>i?ctx.lineTo(s[0],s[1]):ctx.moveTo(s[0],s[1]));ctx.closePath();ctx.stroke();
      }
      // callout labels
      const la2=ss(0.08,0.2,p)*(1-ss(0.8,0.9,p))*(stage===3?0:1)+(stage===3?ss(0.9,1,p):0);
      if(la2>0.02){
        const small=W<640;
        STAGES[stage].groups.forEach(g=>{
          const L=AMR_LABELS.find(l=>l.g===g);if(!L)return;
          const s=P(at[g]),dir=s[0]<(wide?W*0.63:W*0.5)?-1:1;
          const ox=s[0]+dir*(small?26:48),oy=s[1]-(small?22:36),len=small?96:150;
          const ex=Math.min(W-8,Math.max(8,ox+dir*len));
          ctx.globalAlpha=la2;
          ctx.strokeStyle="rgba(255,255,255,0.55)";ctx.lineWidth=0.9;
          ctx.beginPath();ctx.moveTo(s[0],s[1]);ctx.lineTo(ox,oy);ctx.lineTo(ex,oy);ctx.stroke();
          ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(s[0],s[1],3,0,Math.PI*2);ctx.fill();
          ctx.strokeStyle="rgba(255,255,255,0.4)";ctx.beginPath();ctx.arc(s[0],s[1],7+2*Math.sin(T*3),0,Math.PI*2);ctx.stroke();
          // text sits on the horizontal leader, aligned to its outer end
          ctx.textAlign=dir<0?"left":"right";
          ctx.font=`500 ${small?11:13}px ${MN}`;ctx.fillStyle="#fff";
          ctx.fillText(L.t,ex,oy-8);
          ctx.font=`${small?10.5:12.5}px ${BODY}`;ctx.fillStyle="rgba(255,255,255,0.75)";
          ctx.fillText(L.s,ex,oy+17);
          ctx.textAlign="left";ctx.globalAlpha=1;
        });
      }
    },{lowPower});
    return()=>{stop();window.removeEventListener("pointermove",onMove);};
  },[progress,lowPower]);
  return <canvas ref={ref} className="absolute inset-0 h-full w-full pointer-events-none" aria-hidden="true"/>;
}

export function RobotShowcase({lowPower=false}:{lowPower?:boolean}) {
  const ref=useRef<HTMLElement>(null);
  const {scrollYProgress}=useScroll({target:ref,offset:["start start","end end"]});
  const [stage,setStage]=useState(0);
  const [pct,setPct]=useState(0);
  useEffect(()=>scrollYProgress.on("change",v=>{setStage(stageOf(v));setPct(Math.round(v*100));}),[scrollYProgress]);
  const S=STAGES[stage];
  return (
    <section ref={ref} id="anatomy" className="relative h-[280vh] md:h-[360vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden border-y" style={{borderColor:"rgba(255,255,255,0.065)",background:"radial-gradient(ellipse 60% 55% at 63% 55%,#141414 0%,#080808 72%)"}}>
        <ShowcaseCanvas progress={scrollYProgress} lowPower={lowPower}/>
        <div className="pointer-events-none absolute inset-0" style={{background:"linear-gradient(to right,rgba(8,8,8,0.85) 0%,rgba(8,8,8,0.35) 38%,transparent 60%)"}}/>
        {/* header */}
        <div className="relative z-10 flex h-full flex-col justify-between px-6 pb-8 pt-24 md:px-14 md:pb-12 md:pt-28">
          <div>
            <div style={{fontFamily:MN,fontSize:"12.5px",color:"rgba(255,255,255,0.78)",letterSpacing:"0.24em"}}>{t("SYSTEM ANATOMY / MOBILE MANIPULATOR","SYSTEMANATOMIE / MOBILER MANIPULATOR")}</div>
            <h2 className="mt-5" style={{fontFamily:BG,fontWeight:900,fontSize:"clamp(2.6rem,6.4vw,6.4rem)",letterSpacing:"-0.05em",lineHeight:0.86}}>
              {t("EVERY PART,","JEDES TEIL")}<br/><span style={{color:"rgba(255,255,255,0.45)"}}>{t("ENGINEERED.","DURCHDACHT.")}</span>
            </h2>
          </div>
          {/* stage panel */}
          <div className="flex items-end justify-between gap-6">
            <div className="max-w-[460px] border border-white/15 bg-black/50 p-5 backdrop-blur-md md:p-7">
              <AnimatePresence mode="wait">
                <motion.div key={stage} initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:0.4,ease:[0.22,1,0.36,1]}}>
                  <div className="flex items-baseline gap-4">
                    <span style={{fontFamily:MN,fontSize:"13px",color:"rgba(255,255,255,0.6)",letterSpacing:"0.16em"}}>{S.k} / 04</span>
                    <span style={{fontFamily:BG,fontWeight:900,fontSize:"clamp(1.7rem,3vw,2.4rem)",letterSpacing:"-0.035em",lineHeight:1}}>{S.t}</span>
                  </div>
                  <p className="mt-4" style={{fontFamily:BODY,fontSize:"clamp(15px,1.25vw,17px)",lineHeight:1.65,color:"rgba(255,255,255,0.82)"}}>{S.body}</p>
                </motion.div>
              </AnimatePresence>
              <div className="mt-5 flex gap-1.5">
                {STAGES.map((s,i)=><span key={s.k} className="h-[2px] flex-1" style={{background:i<=stage?"#fff":"rgba(255,255,255,0.18)",transition:"background .3s"}}/>)}
              </div>
            </div>
            <div className="hidden text-right md:block">
              <div style={{fontFamily:BG,fontWeight:900,fontSize:"3.4rem",letterSpacing:"-0.05em",lineHeight:1,fontVariantNumeric:"tabular-nums"}}>{String(pct).padStart(2,"0")}<span style={{fontSize:"1.2rem",color:"rgba(255,255,255,0.5)"}}>%</span></div>
              <div className="mt-2" style={{fontFamily:MN,fontSize:"12px",color:"rgba(255,255,255,0.6)",letterSpacing:"0.18em"}}>{t("SCROLL TO DISASSEMBLE","SCROLLEN ZUM ZERLEGEN")}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── COMPANION — a robot bust that watches the visitor ──────────── */
const lines=()=>[t("Hello, human.","Hallo, Mensch."),t("I track your cursor in real time.","Ich verfolge Ihren Cursor in Echtzeit."),t("Built from boxes, cylinders and math.","Gebaut aus Quadern, Zylindern und Mathematik."),t("Ready when you are.","Bereit, wenn Sie es sind.")];
export function RobotHeadCompanion({lowPower=false}:{lowPower?:boolean}) {
  const ref=useRef<HTMLCanvasElement>(null);
  const [line,setLine]=useState(0);
  useEffect(()=>{const id=setInterval(()=>setLine(i=>(i+1)%4),3400);return()=>clearInterval(id);},[]);
  useEffect(()=>{
    const el=ref.current;if(!el)return;
    const look={x:0,y:0,t:-1e9};
    const onMove=(e:PointerEvent)=>{
      const r=el.getBoundingClientRect();
      look.x=Math.max(-1,Math.min(1,(e.clientX-(r.left+r.width/2))/(window.innerWidth*0.45)));
      look.y=Math.max(-1,Math.min(1,(e.clientY-(r.top+r.height*0.4))/(window.innerHeight*0.5)));
      look.t=performance.now();
    };
    window.addEventListener("pointermove",onMove,{passive:true});
    const s={yaw:0,pitch:0,ex:0,ey:0};
    let nextBlink=2,blinkT=-1;
    const stop=runCanvas(el,(ctx,W,H,dt,T)=>{
      const idle=performance.now()-look.t>2500;
      const tx=idle?Math.sin(T*0.5)*0.6:look.x,ty=idle?Math.sin(T*0.37)*0.3:look.y;
      const k=1-Math.exp(-dt*5);
      s.yaw+=(tx*0.75-s.yaw)*k;s.pitch+=(ty*0.35-s.pitch)*k;
      s.ex+=(tx-s.ex)*Math.min(1,k*2);s.ey+=(-ty-s.ey)*Math.min(1,k*2);
      if(T>nextBlink){blinkT=T;nextBlink=T+2.5+Math.random()*3;}
      const bt=T-blinkT,blink=bt>=0&&bt<0.18?Math.abs(bt-0.09)/0.09:1;
      const F=Math.min(W*1.25,H*1.15),cam=makeCam([0,-0.55,0],0,0.1,8,F,W/2,H*0.46);
      ring(ctx,cam,[0,-1.85,0],1.6,"rgba(255,255,255,0.16)");
      ring(ctx,cam,[0,-1.85,0],2.3,"rgba(255,255,255,0.08)",[3,7]);
      const bodyM=m3Mul(m3T(0,Math.sin(T*1.2)*0.04,0),m3Ry(s.yaw*0.25));
      const headM=headMatrix(bodyM,s.yaw*0.75,s.pitch);
      const faces:Face[]=[];
      const at=buildBot(faces,botParts(s.ex,s.ey,blink,Math.sin(T*5)>0.2),bodyM,headM);
      drawFaces(ctx,faces,cam,{dark:true,max:195});
      glowAt(ctx,cam,at.eyeL,0.45,0.45*blink);glowAt(ctx,cam,at.eyeR,0.45,0.45*blink);
      glowAt(ctx,cam,at.chest,0.55,0.2+0.15*Math.sin(T*2));
    },{lowPower});
    return()=>{stop();window.removeEventListener("pointermove",onMove);};
  },[lowPower]);
  return (
    <div className="relative">
      <div className="relative h-[260px] w-full md:h-[320px]">
        <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden="true"/>
      </div>
      <div className="flex items-center justify-center gap-3" style={{minHeight:28}}>
        <span className="h-1.5 w-1.5 rounded-full bg-white" style={{animation:"ledBlink 1.6s ease-in-out infinite"}}/>
        <AnimatePresence mode="wait">
          <motion.span key={line} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} transition={{duration:0.3}}
            style={{fontFamily:MN,fontSize:"13px",color:"rgba(255,255,255,0.8)",letterSpacing:"0.06em"}}>
            UNIT AF-01: {lines()[line]}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}
