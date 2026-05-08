import { useEffect, useRef, useCallback, useState } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const PALETTE = [
  "#f4778a","#f4956d","#f5c97a","#f7d9a8",
  "#5ec8c8","#7bafd4","#c18fcf","#f49ac2",
  "#e8506a","#f07850","#6abfbf","#9b72cf",
  "#f7a8c4","#a8d8ea","#fddde6","#e8a0bf",
  "#c9a0dc","#b5ead7","#74b9ff","#e06090",
];
const FADE_DUR    = 480;
const STAGGER     = 11;
const SCALE_FROM  = 0.84;
const AUTO_SPEED  = (2 * Math.PI) / (240 * 60); // 240s per revolution
const ICON_MIN_PX = 16;
const FRICTION    = 0.94;   // momentum decay per frame after release
const MIN_VELOCITY = 0.00003; // below this velocity, resume auto-spin

function randomUserData() {
  return {
    contributions: Math.floor(Math.random() * 980) + 20,
    courses: Math.floor(Math.random() * 48) + 1,
  };
}

// ─── Green lines texture ──────────────────────────────────────────────────────
function makeGreenLinesTexture(sz = 500) {
  const oc = document.createElement("canvas");
  oc.width = oc.height = sz;
  const c = oc.getContext("2d");
  c.fillStyle = "#2e8b45"; c.fillRect(0,0,sz,sz);
  const sp=sz*.045, lw=sz*.012;
  c.save(); c.strokeStyle="rgba(255,255,255,0.12)"; c.lineWidth=lw; c.lineCap="square";
  for(let o=-sz;o<sz*2;o+=sp){c.beginPath();c.moveTo(o,0);c.lineTo(o+sz,sz);c.stroke();}
  c.restore();
  c.save(); c.strokeStyle="rgba(0,0,0,0.09)"; c.lineWidth=lw*.6;
  for(let o=-sz;o<sz*2;o+=sp*2){c.beginPath();c.moveTo(o+sp*.5,0);c.lineTo(o+sp*.5+sz,sz);c.stroke();}
  c.restore();
  const vg=c.createRadialGradient(sz*.5,sz*.42,0,sz*.5,sz*.5,sz*.58);
  vg.addColorStop(0,"rgba(255,255,255,0.10)"); vg.addColorStop(.5,"rgba(255,255,255,0.02)"); vg.addColorStop(1,"rgba(0,0,0,0.28)");
  c.fillStyle=vg; c.fillRect(0,0,sz,sz);
  return oc;
}

// ─── Packing ──────────────────────────────────────────────────────────────────
function buildSizes(thick) {
  const tiers=[
    {count:8,min:.34,max:.44},{count:12,min:.22,max:.32},
    {count:20,min:.14,max:.21},{count:35,min:.08,max:.13},
    {count:45,min:.04,max:.075},{count:30,min:.022,max:.038},
  ];
  const s=[];
  for(const t of tiers)
    for(let i=0;i<t.count;i++){
      const f=t.count>1?t.min+(t.max-t.min)*(i/(t.count-1)):(t.min+t.max)/2;
      const j=(Math.random()-.5)*(t.max-t.min)*.2;
      s.push(Math.max(t.min,Math.min(t.max,f+j))*thick);
    }
  s.sort((a,b)=>b-a); return s;
}

function pack(W) {
  const cx=W/2,cy=W/2,Ro=W*.468,Ri=W*.232,thick=Ro-Ri;
  const cell=Math.ceil(W*.012); const grid=new Map();
  const key=(gx,gy)=>gx*4096+gy;
  const reg=(c)=>{
    const x0=Math.floor((c.x-c.r)/cell),x1=Math.floor((c.x+c.r)/cell);
    const y0=Math.floor((c.y-c.r)/cell),y1=Math.floor((c.y+c.r)/cell);
    for(let gx=x0;gx<=x1;gx++) for(let gy=y0;gy<=y1;gy++){const k=key(gx,gy);if(!grid.has(k))grid.set(k,[]);grid.get(k).push(c);}
  };
  const hits=(x,y,r)=>{
    const gap=2.2;
    const x0=Math.floor((x-r-gap)/cell),x1=Math.floor((x+r+gap)/cell);
    const y0=Math.floor((y-r-gap)/cell),y1=Math.floor((y+r+gap)/cell);
    for(let gx=x0;gx<=x1;gx++) for(let gy=y0;gy<=y1;gy++){
      const b=grid.get(key(gx,gy));if(!b)continue;
      for(const o of b){const dx=x-o.x,dy=y-o.y;if(dx*dx+dy*dy<(r+o.r+gap)**2)return true;}
    }
    return false;
  };
  const inRing=(x,y,r)=>{const d=Math.sqrt((x-cx)**2+(y-cy)**2);return(d-r)>=Ri&&(d+r)<=Ro;};
  const maxRAt=(d)=>{const t=(d-Ri)/thick;return W*.006+(1-Math.abs(t*2-1)**1.8)*thick*.44;};

  const sizes=buildSizes(thick); const res=[]; let ci=0;
  for(let si=0;si<sizes.length;si++){
    const r=sizes[si]; let placed=false;
    for(let a=0;a<3000&&!placed;a++){
      const angle=Math.random()*Math.PI*2;
      const dMin=Ri+r,dMax=Ro-r; if(dMin>dMax)break;
      const d=dMin+Math.random()*(dMax-dMin);
      if(r>maxRAt(d)*1.15)continue;
      const x=cx+Math.cos(angle)*d,y=cy+Math.sin(angle)*d;
      if(inRing(x,y,r)&&!hits(x,y,r)){
        res.push({x,y,r,
          polarAngle:Math.atan2(y-cy,x-cx),
          polarDist:Math.sqrt((x-cx)**2+(y-cy)**2),
          color:PALETTE[ci%PALETTE.length],
          showIcon:r>=ICON_MIN_PX,
          userData:r>=ICON_MIN_PX?randomUserData():null,
        });
        ci++;reg({x,y,r});placed=true;
      }
    }
  }
  return res;
}

const easeOutCubic=(t)=>1-Math.pow(1-t,3);
const easeOutQuart=(t)=>1-Math.pow(1-t,4);

// ─── Canvas drawing ───────────────────────────────────────────────────────────
function drawBg(ctx,W){
  const g=ctx.createRadialGradient(W/2,W/2,0,W/2,W/2,W*.6);
  g.addColorStop(0,"#0f1519");g.addColorStop(1,"#060809");
  ctx.fillStyle=g;ctx.fillRect(0,0,W,W);
}

function drawUserIcon(ctx,x,y,r,alpha){
  ctx.save();ctx.globalAlpha=alpha;
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle="#dce8f0";ctx.fill();
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.clip();
  ctx.beginPath();ctx.arc(x,y-r*.18,r*.32,0,Math.PI*2);ctx.fillStyle="#8aafc2";ctx.fill();
  ctx.beginPath();ctx.arc(x,y+r*.72,r*.52,0,Math.PI*2);ctx.fillStyle="#8aafc2";ctx.fill();
  ctx.restore();
}

function drawCircle(ctx,c,alpha,scale,rot,cx,cy){
  const a=c.polarAngle+rot;
  const rx=cx+Math.cos(a)*c.polarDist;
  const ry=cy+Math.sin(a)*c.polarDist;
  const r=c.r*scale;
  if(r<0.4||alpha<0.01)return;
  if(!c.showIcon){
    ctx.save();ctx.globalAlpha=alpha;
    ctx.beginPath();ctx.arc(rx,ry,r,0,Math.PI*2);
    ctx.fillStyle="#4CAF50";ctx.fill();
    ctx.restore();
  } else {
    drawUserIcon(ctx,rx,ry,r,alpha);
  }
}

function drawCenter(ctx,W,alpha,scale,greenTex){
  const cx=W/2,cy=W/2,Ri=W*.232,Rc=Ri*.72,Rp=Rc*.60;
  const r=Rc*scale,rp=Rp*scale;
  if(r<1||alpha<0.01)return;
  ctx.save();ctx.globalAlpha=alpha;
  ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();
  const sc=(r*2)/greenTex.width;
  ctx.save();ctx.translate(cx-r,cy-r);ctx.scale(sc,sc);ctx.drawImage(greenTex,0,0);ctx.restore();
  ctx.restore();
  ctx.save();ctx.globalAlpha=alpha*.6;
  ctx.beginPath();ctx.arc(cx,cy,rp+r*.04,0,Math.PI*2);
  ctx.strokeStyle="rgba(0,0,0,0.4)";ctx.lineWidth=Math.max(1,r*.035);ctx.stroke();
  ctx.restore();
  drawUserIcon(ctx,cx,cy,rp,alpha);
  ctx.save();ctx.globalAlpha=alpha*.45;
  ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);
  ctx.strokeStyle="rgba(255,255,255,0.4)";ctx.lineWidth=W*.003;ctx.stroke();
  ctx.restore();
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────
function Tooltip({ info }) {
  if (!info) return null;
  const { x, y, data, rect } = info;
  const TW=182, TH=96, mg=16;
  let left=x+mg, top=y-TH/2;
  if(rect&&left+TW>rect.right-8) left=x-TW-mg;
  if(rect&&top<rect.top+8)        top=rect.top+8;
  if(rect&&top+TH>rect.bottom-8)  top=rect.bottom-TH-8;
  return (
    <div style={{
      position:"fixed",left,top,width:TW,
      background:"rgba(8,14,20,0.88)",
      backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",
      border:"1px solid rgba(255,255,255,0.09)",
      borderRadius:14,padding:"12px 13px",pointerEvents:"none",zIndex:100,
      boxShadow:"0 12px 40px rgba(0,0,0,0.6)",
    }}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <div style={{width:26,height:26,borderRadius:"50%",background:"#dce8f0",overflow:"hidden",flexShrink:0,position:"relative"}}>
          <div style={{position:"absolute",top:"16%",left:"50%",transform:"translateX(-50%)",width:"36%",height:"36%",borderRadius:"50%",background:"#8aafc2"}}/>
          <div style={{position:"absolute",bottom:"-18%",left:"50%",transform:"translateX(-50%)",width:"58%",height:"58%",borderRadius:"50%",background:"#8aafc2"}}/>
        </div>
        <span style={{fontFamily:"'DM Sans',system-ui,sans-serif",fontSize:"0.67rem",fontWeight:300,color:"rgba(255,255,255,0.45)",letterSpacing:"0.06em"}}>Member</span>
      </div>
      <div style={{display:"flex",gap:8}}>
        <StatPill label="Contributions" value={data.contributions} color="#74b9ff"/>
        <StatPill label="Courses" value={data.courses} color="#5ec8c8"/>
      </div>
    </div>
  );
}

function StatPill({label,value,color}){
  return(
    <div style={{flex:1,background:"rgba(255,255,255,0.045)",borderRadius:9,padding:"7px 9px",display:"flex",flexDirection:"column",gap:3}}>
      <span style={{fontSize:"0.56rem",color:"rgba(255,255,255,0.3)",fontFamily:"'DM Sans',sans-serif",letterSpacing:"0.07em",textTransform:"uppercase"}}>{label}</span>
      <span style={{fontSize:"0.95rem",fontWeight:400,color,fontFamily:"'DM Sans',sans-serif",lineHeight:1}}>{value.toLocaleString()}</span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function CircleRing() {
  const canvasRef   = useRef(null);
  const rafRef      = useRef(null);
  const greenTexRef = useRef(null);
  const countRef    = useRef(null);
  const sizeRef     = useRef(0);
  const circlesRef  = useRef([]);

  // Rotation state
  const rotRef      = useRef(0);
  const velocityRef = useRef(0);   // radians per frame — drag imparts velocity
  const stateRef    = useRef("auto"); // "auto" | "dragging" | "coasting"

  // Drag tracking
  const dragRef     = useRef({ prevAngle:0, prevTime:0 });

  const [tooltip, setTooltip] = useState(null);

  useEffect(() => { greenTexRef.current = makeGreenLinesTexture(500); }, []);

  // Convert client coords → angle relative to canvas center
  const clientToAngle = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left - rect.width  / 2;
    const y = clientY - rect.top  - rect.height / 2;
    return Math.atan2(y, x);
  }, []);

  const hitTest = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (clientX - rect.left) * scaleX;
    const my = (clientY - rect.top)  * scaleY;
    const W  = sizeRef.current;
    const cx=W/2,cy=W/2,rot=rotRef.current;
    for (const c of circlesRef.current) {
      if (!c.showIcon) continue;
      const a=c.polarAngle+rot;
      const rx=cx+Math.cos(a)*c.polarDist;
      const ry=cy+Math.sin(a)*c.polarDist;
      const dx=mx-rx,dy=my-ry;
      if(dx*dx+dy*dy<=c.r*c.r) return { c, rect };
    }
    return null;
  }, []);

  const onMouseMove = useCallback((e) => {
    if (stateRef.current === "dragging") {
      const now   = performance.now();
      const angle = clientToAngle(e.clientX, e.clientY);
      // Delta angle — handle wrap-around
      let delta = angle - dragRef.current.prevAngle;
      if (delta >  Math.PI) delta -= 2 * Math.PI;
      if (delta < -Math.PI) delta += 2 * Math.PI;
      const dt = Math.max(1, now - dragRef.current.prevTime);

      rotRef.current += delta;
      // Track instantaneous velocity (rad/ms → rad/frame at ~60fps = *16.67)
      velocityRef.current = (delta / dt) * 16.67;

      dragRef.current.prevAngle = angle;
      dragRef.current.prevTime  = now;
      setTooltip(null);
      return;
    }

    // Hover
    const hit = hitTest(e.clientX, e.clientY);
    if (hit) {
      setTooltip({ x:e.clientX, y:e.clientY, data:hit.c.userData, rect:hit.rect });
      canvasRef.current.style.cursor = "pointer";
    } else {
      setTooltip(null);
      canvasRef.current.style.cursor = "grab";
    }
  }, [clientToAngle, hitTest]);

  const onMouseDown = useCallback((e) => {
    const angle = clientToAngle(e.clientX, e.clientY);
    stateRef.current = "dragging";
    dragRef.current  = { prevAngle:angle, prevTime:performance.now() };
    velocityRef.current = 0;
    setTooltip(null);
    canvasRef.current.style.cursor = "grabbing";
  }, [clientToAngle]);

  const onMouseUp = useCallback(() => {
    if (stateRef.current !== "dragging") return;
    // Hand off to coasting — velocity already set in mousemove
    stateRef.current = Math.abs(velocityRef.current) > MIN_VELOCITY ? "coasting" : "auto";
    if (canvasRef.current) canvasRef.current.style.cursor = "grab";
  }, []);

  const onMouseLeave = useCallback(() => {
    if (stateRef.current === "dragging") {
      stateRef.current = Math.abs(velocityRef.current) > MIN_VELOCITY ? "coasting" : "auto";
    }
    setTooltip(null);
    if (canvasRef.current) canvasRef.current.style.cursor = "grab";
  }, []);

  const generate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !greenTexRef.current) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const S = Math.floor(Math.min(window.innerWidth, window.innerHeight) * 0.88);
    canvas.width = canvas.height = S;
    sizeRef.current = S;
    const ctx = canvas.getContext("2d");
    const W=S,cx=W/2,cy=W/2;

    stateRef.current = "auto";
    velocityRef.current = 0;
    drawBg(ctx,W);
    if (countRef.current) countRef.current.textContent="";
    setTooltip(null);

    setTimeout(()=>{
      const circles=pack(W);
      circlesRef.current=circles;
      const sorted=[...circles].sort((a,b)=>b.r-a.r);
      const total=sorted.length;
      const t0=performance.now();
      sorted.forEach((c,i)=>{c._delay=i*STAGGER+60;});

      function revealFrame(now){
        drawBg(ctx,W);
        let allDone=true;
        for(let i=0;i<total;i++){
          const c=sorted[i];const el=now-t0-c._delay;
          if(el<0){allDone=false;continue;}
          const t=Math.min(1,el/FADE_DUR);if(t<1)allDone=false;
          const e=easeOutCubic(t);
          drawCircle(ctx,c,e,SCALE_FROM+(1-SCALE_FROM)*e,rotRef.current,cx,cy);
        }
        const ct=Math.min(1,Math.max(0,(now-t0)/(FADE_DUR*1.1)));
        const ce=easeOutQuart(ct);
        drawCenter(ctx,W,ce,SCALE_FROM+(1-SCALE_FROM)*ce,greenTexRef.current);
        // Apply rotation based on state
        applyRotation();
        if(!allDone){ rafRef.current=requestAnimationFrame(revealFrame); }
        else{ if(countRef.current)countRef.current.textContent=`${total}`; rafRef.current=requestAnimationFrame(spinFrame); }
      }

      function spinFrame(){
        drawBg(ctx,W);
        const all=circlesRef.current;
        for(const c of all) drawCircle(ctx,c,1,1,rotRef.current,cx,cy);
        drawCenter(ctx,W,1,1,greenTexRef.current);
        applyRotation();
        rafRef.current=requestAnimationFrame(spinFrame);
      }

      rafRef.current=requestAnimationFrame(revealFrame);
    },16);
  }, []);

  // Centralised rotation logic called once per frame
  function applyRotation(){
    const s = stateRef.current;
    if (s === "auto"){
      rotRef.current += AUTO_SPEED;
    } else if (s === "coasting"){
      rotRef.current  += velocityRef.current;
      velocityRef.current *= FRICTION;
      if(Math.abs(velocityRef.current) < MIN_VELOCITY){
        velocityRef.current = 0;
        stateRef.current = "auto";
      }
    }
    // "dragging" → rotation is set directly in onMouseMove, nothing here
  }

  useEffect(()=>{
    generate();
    const onResize=()=>generate();
    window.addEventListener("resize",onResize);
    return()=>{
      window.removeEventListener("resize",onResize);
      if(rafRef.current)cancelAnimationFrame(rafRef.current);
    };
  },[generate]);

  return (
    <div style={{width:"100vw",height:"100vh",background:"#080b0e",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",position:"relative"}}>
      <canvas
        ref={canvasRef}
        style={{display:"block",cursor:"grab",userSelect:"none",touchAction:"none"}}
        onMouseMove={onMouseMove}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      />
      <Tooltip info={tooltip}/>
      <div style={{position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",display:"flex",gap:8,alignItems:"center",fontFamily:"'DM Sans',system-ui,sans-serif"}}>
        <button
          onClick={generate}
          style={{font:"300 0.65rem/1 inherit",letterSpacing:"0.22em",textTransform:"uppercase",border:"1px solid rgba(255,255,255,0.1)",background:"transparent",color:"rgba(255,255,255,0.35)",padding:"8px 20px",cursor:"pointer",borderRadius:100,transition:"color .2s,border-color .2s,background .2s"}}
          onMouseEnter={e=>{e.currentTarget.style.color="rgba(255,255,255,0.8)";e.currentTarget.style.borderColor="rgba(255,255,255,0.28)";e.currentTarget.style.background="rgba(255,255,255,0.04)";}}
          onMouseLeave={e=>{e.currentTarget.style.color="rgba(255,255,255,0.35)";e.currentTarget.style.borderColor="rgba(255,255,255,0.1)";e.currentTarget.style.background="transparent";}}
        >Regenerate</button>
        <span ref={countRef} style={{font:"300 0.58rem/1 inherit",color:"rgba(255,255,255,0.18)",letterSpacing:"0.15em",textTransform:"uppercase",minWidth:60,textAlign:"center"}}>—</span>
      </div>
    </div>
  );
}
