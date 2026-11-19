/* ─── TINY 3D ENGINE — flat-shaded canvas renderer ───────────────── */
export type V3=[number,number,number];
export type Face={pts:V3[];n:V3;c:V3;rim:boolean;tone:number;glow?:boolean};
export type Cam={eye:V3;r:V3;u:V3;f:V3;F:number;cx:number;cy:number};
export const m3T=(x:number,y:number,z:number)=>[1,0,0,x, 0,1,0,y, 0,0,1,z];
export const m3Rx=(a:number)=>{const c=Math.cos(a),s=Math.sin(a);return [1,0,0,0, 0,c,-s,0, 0,s,c,0];};
export const m3Ry=(a:number)=>{const c=Math.cos(a),s=Math.sin(a);return [c,0,s,0, 0,1,0,0, -s,0,c,0];};
export const m3Rz=(a:number)=>{const c=Math.cos(a),s=Math.sin(a);return [c,-s,0,0, s,c,0,0, 0,0,1,0];};
export function m3Mul(...ms:number[][]):number[] {
  return ms.reduce((a,b)=>{
    const r:number[]=new Array(12);
    for(let i=0;i<3;i++){
      const o=i*4;
      r[o]=a[o]*b[0]+a[o+1]*b[4]+a[o+2]*b[8];
      r[o+1]=a[o]*b[1]+a[o+1]*b[5]+a[o+2]*b[9];
      r[o+2]=a[o]*b[2]+a[o+1]*b[6]+a[o+2]*b[10];
      r[o+3]=a[o]*b[3]+a[o+1]*b[7]+a[o+2]*b[11]+a[o+3];
    }
    return r;
  });
}
export const m3P=(m:number[],x:number,y:number,z:number):V3=>[m[0]*x+m[1]*y+m[2]*z+m[3],m[4]*x+m[5]*y+m[6]*z+m[7],m[8]*x+m[9]*y+m[10]*z+m[11]];
export const v3Sub=(a:V3,b:V3):V3=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
export const v3Dot=(a:V3,b:V3)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
export const v3Cross=(a:V3,b:V3):V3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const v3Norm=(a:V3):V3=>{const l=Math.hypot(a[0],a[1],a[2])||1;return [a[0]/l,a[1]/l,a[2]/l];};

function pushPoly(out:Face[],pts:V3[],center:V3,rim:boolean,tone:number,glow?:boolean) {
  let n=v3Norm(v3Cross(v3Sub(pts[1],pts[0]),v3Sub(pts[2],pts[0])));
  const c:V3=[0,0,0];
  for(const p of pts){c[0]+=p[0];c[1]+=p[1];c[2]+=p[2];}
  c[0]/=pts.length;c[1]/=pts.length;c[2]/=pts.length;
  // primitives are convex, so "outward" = away from the primitive centre
  if(v3Dot(n,v3Sub(c,center))<0) n=[-n[0],-n[1],-n[2]];
  out.push({pts,n,c,rim,tone,glow});
}
export function addBox(out:Face[],m:number[],sx:number,sy:number,sz:number,tone=1,glow=false) {
  const x=sx/2,y=sy/2,z=sz/2;
  const v=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(([a,b,c])=>m3P(m,a*x,b*y,c*z));
  const ctr=m3P(m,0,0,0);
  [[0,1,2,3],[4,5,6,7],[0,1,5,4],[3,2,6,7],[0,3,7,4],[1,2,6,5]].forEach(f=>pushPoly(out,f.map(i=>v[i]),ctr,false,tone,glow));
}
export function addCyl(out:Face[],m:number[],r:number,h:number,seg=14,tone=1,glow=false) {
  const ctr=m3P(m,0,0,0),top:V3[]=[],bot:V3[]=[];
  for(let i=0;i<seg;i++){
    const a=(i/seg)*Math.PI*2,x=Math.cos(a)*r,z=Math.sin(a)*r;
    bot.push(m3P(m,x,-h/2,z));top.push(m3P(m,x,h/2,z));
  }
  for(let i=0;i<seg;i++){const j=(i+1)%seg;pushPoly(out,[bot[i],bot[j],top[j],top[i]],ctr,true,tone,glow);}
  pushPoly(out,top,ctr,false,tone,glow);pushPoly(out,bot,ctr,false,tone,glow);
}
/* low-poly UV sphere — used for eyes, joints and the loader core */
export function addSphere(out:Face[],m:number[],r:number,seg=10,tone=1,glow=false) {
  const ctr=m3P(m,0,0,0),rings=Math.max(4,Math.round(seg/2));
  const P=(i:number,j:number):V3=>{
    const th=(i/rings)*Math.PI,ph=(j/seg)*Math.PI*2;
    return m3P(m,Math.sin(th)*Math.cos(ph)*r,Math.cos(th)*r,Math.sin(th)*Math.sin(ph)*r);
  };
  for(let i=0;i<rings;i++)for(let j=0;j<seg;j++){
    const a=P(i,j),b=P(i,j+1),c=P(i+1,j+1),d=P(i+1,j);
    pushPoly(out,i===0?[a,c,d]:i===rings-1?[a,b,c]:[a,b,c,d],ctr,false,tone,glow);
  }
}
export function makeCam(target:V3,yaw:number,pitch:number,dist:number,F:number,cx:number,cy:number):Cam {
  const eye:V3=[target[0]+dist*Math.cos(pitch)*Math.sin(yaw),target[1]+dist*Math.sin(pitch),target[2]+dist*Math.cos(pitch)*Math.cos(yaw)];
  const f=v3Norm(v3Sub(target,eye)),r=v3Norm(v3Cross(f,[0,1,0])),u=v3Cross(r,f);
  return {eye,r,u,f,F,cx,cy};
}
export function proj(cam:Cam,p:V3):[number,number,number] {
  const d=v3Sub(p,cam.eye),z=Math.max(0.1,v3Dot(d,cam.f));
  return [cam.cx+v3Dot(d,cam.r)*cam.F/z,cam.cy-v3Dot(d,cam.u)*cam.F/z,z];
}

/* painter's-algorithm draw with dark-studio shading; glow faces render as emissive */
export function drawFaces(ctx:CanvasRenderingContext2D,faces:Face[],cam:Cam,opts:{light?:V3;dark?:boolean;glowAlpha?:number;max?:number}={}) {
  const L=opts.light??v3Norm([-0.45,0.8,0.5]);
  const dark=opts.dark??true,max=opts.max??180,ga=opts.glowAlpha??1;
  const vis=faces.filter(f=>v3Dot(f.n,v3Sub(cam.eye,f.c))>0)
    .map(f=>({f,z:v3Dot(v3Sub(f.c,cam.eye),cam.f)}))
    .sort((a,b)=>b.z-a.z);
  ctx.lineJoin="round";
  for(const {f} of vis){
    const s=f.pts.map(p=>proj(cam,p));
    const diff=Math.max(0,v3Dot(f.n,L));
    const fres=1-Math.abs(v3Dot(f.n,v3Norm(v3Sub(cam.eye,f.c))));
    let fill:string,edge:string;
    if(f.glow){
      // emissive parts: bright on dark scenes, ink-black on light ones
      const c=dark?"255,255,255":"12,12,12";
      fill=`rgba(${c},${(0.75+diff*0.25)*ga})`;edge=`rgba(${c},${0.9*ga})`;
    } else if(dark){
      const v=Math.min(max,Math.round((16+diff*68+fres*18)*f.tone));
      fill=`rgb(${v},${v},${v})`;edge=`rgba(255,255,255,${0.2+diff*0.42})`;
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
}

/* shared canvas loop: DPR sizing, offscreen pause, reduced-motion single frame */
export function runCanvas(el:HTMLCanvasElement,frame:(ctx:CanvasRenderingContext2D,W:number,H:number,dt:number,T:number)=>void,opts:{lowPower?:boolean;alwaysOn?:boolean}={}) {
  const ctx=el.getContext("2d");if(!ctx)return()=>{};
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dpr=Math.min(window.devicePixelRatio||1,opts.lowPower?1:2);
  let W=1,H=1,T=0,raf=0,last=performance.now(),visible=true;
  const resize=()=>{W=Math.max(1,el.offsetWidth);H=Math.max(1,el.offsetHeight);el.width=Math.round(W*dpr);el.height=Math.round(H*dpr);};
  const draw=(dt:number)=>{ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);frame(ctx,W,H,dt,T);};
  const loop=(now:number)=>{
    if(!visible)return;
    raf=requestAnimationFrame(loop);
    const raw=(now-last)/1000;
    if(opts.lowPower&&raw<1/30)return;
    last=now;const dt=Math.min(0.05,raw);T+=dt;draw(dt);
  };
  resize();
  const ro=new ResizeObserver(()=>{resize();if(reduced)draw(0);});ro.observe(el);
  const io=new IntersectionObserver(([en])=>{
    visible=opts.alwaysOn||en.isIntersecting;
    cancelAnimationFrame(raf);
    if(visible&&!reduced){last=performance.now();raf=requestAnimationFrame(loop);}
  },{rootMargin:"120px"});
  io.observe(el);
  draw(0);
  return()=>{cancelAnimationFrame(raf);ro.disconnect();io.disconnect();};
}
