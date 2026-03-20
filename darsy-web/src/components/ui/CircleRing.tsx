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
const AUTO_SPEED  = (2 * Math.PI) / (60 * 60); // 60s per revolution
const ICON_MIN_PX = 16;
const FRICTION    = 0.94;
const MIN_VELOCITY = 0.00003;

// ─── Green lines texture ──────────────────────────────────────────────────────
function makeGreenLinesTexture(sz = 500) {
  const oc = document.createElement("canvas");
  oc.width = oc.height = sz;
  const c = oc.getContext("2d");
  if (!c) return oc;
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
function buildSizes(thick: number) {
  const tiers=[
    {count:8,min:.34,max:.44},{count:12,min:.22,max:.32},
    {count:20,min:.14,max:.21},{count:35,min:.08,max:.13},
    {count:45,min:.04,max:.075},{count:30,min:.022,max:.038},
  ];
  const s: number[] = [];
  for(const t of tiers)
    for(let i=0;i<t.count;i++){
      const f=t.count>1?t.min+(t.max-t.min)*(i/(t.count-1)):(t.min+t.max)/2;
      const j=(Math.random()-.5)*(t.max-t.min)*.2;
      s.push(Math.max(t.min,Math.min(t.max,f+j))*thick);
    }
  s.sort((a,b)=>b-a); return s;
}

function pack(W: number, usersData: any[]) {
  const cx=W/2,cy=W/2,Ro=W*.468,Ri=W*.232,thick=Ro-Ri;
  const cell=Math.ceil(W*.012); const grid=new Map();
  const key=(gx: number,gy: number)=>gx*4096+gy;
  const reg=(c: any)=>{
    const x0=Math.floor((c.x-c.r)/cell),x1=Math.floor((c.x+c.r)/cell);
    const y0=Math.floor((c.y-c.r)/cell),y1=Math.floor((c.y+c.r)/cell);
    for(let gx=x0;gx<=x1;gx++) for(let gy=y0;gy<=y1;gy++){const k=key(gx,gy);if(!grid.has(k))grid.set(k,[]);grid.get(k).push(c);}
  };
  const hits=(x: number,y: number,r: number)=>{
    const gap=2.2;
    const x0=Math.floor((x-r-gap)/cell),x1=Math.floor((x+r+gap)/cell);
    const y0=Math.floor((y-r-gap)/cell),y1=Math.floor((y+r+gap)/cell);
    for(let gx=x0;gx<=x1;gx++) for(let gy=y0;gy<=y1;gy++){
      const b=grid.get(key(gx,gy));if(!b)continue;
      for(const o of b){const dx=x-o.x,dy=y-o.y;if(dx*dx+dy*dy<(r+o.r+gap)**2)return true;}
    }
    return false;
  };
  const inRing=(x: number,y: number,r: number)=>{const d=Math.sqrt((x-cx)**2+(y-cy)**2);return(d-r)>=Ri&&(d+r)<=Ro;};
  const maxRAt=(d: number)=>{const t=(d-Ri)/thick;return W*.006+(1-Math.abs(t*2-1)**1.8)*thick*.44;};

  const sizes=buildSizes(thick); const res=[]; let ci=0;
  let userIndex = 0;
  for(let si=0;si<sizes.length;si++){
    const r=sizes[si]; let placed=false;
    for(let a=0;a<3000&&!placed;a++){
      const angle=Math.random()*Math.PI*2;
      const dMin=Ri+r,dMax=Ro-r; if(dMin>dMax)break;
      const d=dMin+Math.random()*(dMax-dMin);
      if(r>maxRAt(d)*1.15)continue;
      const x=cx+Math.cos(angle)*d,y=cy+Math.sin(angle)*d;
      if(inRing(x,y,r)&&!hits(x,y,r)){
        const showIcon = r>=ICON_MIN_PX;
        let uData = null;
        if (showIcon && userIndex < usersData.length) {
          uData = usersData[userIndex];
          userIndex++;
        }
        res.push({x,y,r,
          polarAngle:Math.atan2(y-cy,x-cx),
          polarDist:Math.sqrt((x-cx)**2+(y-cy)**2),
          color:PALETTE[ci%PALETTE.length],
          showIcon,
          userData: uData,
        });
        ci++;reg({x,y,r});placed=true;
      }
    }
  }
  return res;
}

const easeOutCubic=(t: number)=>1-Math.pow(1-t,3);
const easeOutQuart=(t: number)=>1-Math.pow(1-t,4);

// ─── Canvas drawing ───────────────────────────────────────────────────────────
// Dark bg matches original inspiration exactly
// Transparent background instead of gradient
function drawBg(ctx: CanvasRenderingContext2D, W: number, theme: 'light' | 'dark' = 'dark'){
  ctx.clearRect(0,0,W,W);
}

// Draws the user placeholder icon
function drawUserIconPlaceholder(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha: number, theme: 'light' | 'dark' = 'dark'){
  ctx.save(); ctx.globalAlpha=alpha;
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); 
  ctx.fillStyle = theme === 'dark' ? "#dce8f0" : "#e4eff5";
  ctx.fill();
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.clip();
  ctx.beginPath(); ctx.arc(x,y-r*.18,r*.32,0,Math.PI*2); 
  ctx.fillStyle = theme === 'dark' ? "#8aafc2" : "#9bb8c7";
  ctx.fill();
  ctx.beginPath(); ctx.arc(x,y+r*.72,r*.52,0,Math.PI*2); 
  ctx.fillStyle = theme === 'dark' ? "#8aafc2" : "#9bb8c7";
  ctx.fill();
  ctx.restore();
}

// Draw a real photo avatar if available, fallback to placeholder
function drawUserIcon(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha: number, imgElement?: HTMLImageElement | null, theme: 'light' | 'dark' = 'dark'){
  if (imgElement && imgElement.complete && imgElement.naturalWidth > 0) {
    ctx.save(); ctx.globalAlpha=alpha;
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.clip();
    ctx.drawImage(imgElement, x-r, y-r, r*2, r*2);
    ctx.restore();
  } else {
    drawUserIconPlaceholder(ctx, x, y, r, alpha, theme);
  }
}

function drawCircle(ctx: CanvasRenderingContext2D, c: any, alpha: number, scale: number, rot: number, cx: number, cy: number, loadedImages: Map<string, HTMLImageElement>, theme: 'light' | 'dark' = 'dark'){
  const a=c.polarAngle+rot;
  const rx=cx+Math.cos(a)*c.polarDist;
  const ry=cy+Math.sin(a)*c.polarDist;
  const r=c.r*scale;
  if(r<0.4||alpha<0.01)return;

  if(!c.showIcon){
    // Original: small non-user circles are solid green
    ctx.save(); ctx.globalAlpha=alpha;
    ctx.beginPath(); ctx.arc(rx,ry,r,0,Math.PI*2);
    ctx.fillStyle="#4CAF50"; ctx.fill();
    ctx.restore();
  } else if (!c.userData) {
    // Large slot, no user assigned — draw placeholder
    drawUserIconPlaceholder(ctx,rx,ry,r,alpha, theme);
  } else {
    // Real user — draw photo or placeholder
    const imgEntity = c.userData.photoURL ? loadedImages.get(c.userData.photoURL) : null;
    drawUserIcon(ctx,rx,ry,r,alpha, imgEntity, theme);
    
    // Premium glow/border
    if (c.userData?.isPremium) {
      ctx.save(); ctx.globalAlpha=alpha;
      ctx.beginPath(); ctx.arc(rx,ry,r+1.5,0,Math.PI*2);
      ctx.strokeStyle = "#FFD700"; // Gold
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    }
  }
}

function drawCenter(ctx: CanvasRenderingContext2D, W: number, alpha: number, scale: number, greenTex: HTMLCanvasElement, currentUserImg: HTMLImageElement | null, theme: 'light' | 'dark' = 'dark', rot: number = 0){
  const cx=W/2, cy=W/2, Ri=W*.232, Rc=Ri*.72, Rp=Rc*.85; // Increased Rp for a bigger center image
  const r=Rc*scale, rp=Rp*scale;
  if(r<1||alpha<0.01)return;
  ctx.save(); ctx.globalAlpha=alpha;
  ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.clip();
  const sc=(r*2)/greenTex.width;
  ctx.save(); ctx.translate(cx-r,cy-r); ctx.scale(sc,sc); ctx.drawImage(greenTex,0,0); ctx.restore();
  ctx.restore();
  ctx.save(); ctx.globalAlpha=alpha*.6;
  ctx.beginPath(); ctx.arc(cx,cy,rp+r*.04,0,Math.PI*2);
  ctx.strokeStyle = theme === 'dark' ? "rgba(0,0,0,0.4)" : "rgba(46,139,69,0.2)";
  ctx.lineWidth=Math.max(1,r*.035); ctx.stroke();
  ctx.restore();
  drawUserIcon(ctx,cx,cy,rp,alpha, currentUserImg, theme);
  
  ctx.save(); ctx.globalAlpha=alpha;
  ctx.beginPath(); ctx.arc(cx,cy,rp+1.5,0,Math.PI*2);
  ctx.strokeStyle = theme === 'dark' ? "rgba(255,255,255,0.8)" : "#ffffff";
  ctx.lineWidth=W*.008; ctx.stroke();
  ctx.restore();

  // Spinning contour
  ctx.save(); ctx.globalAlpha=alpha * 0.5;
  ctx.translate(cx, cy);
  ctx.rotate(-rot * 1.5); // Spin in opposite direction or faster
  ctx.beginPath(); ctx.arc(0,0,rp+7,0,Math.PI*2);
  ctx.strokeStyle = theme === 'dark' ? "rgba(255,255,255,0.6)" : "rgba(46,139,69,0.5)";
  ctx.lineWidth=2;
  ctx.setLineDash([4, 6]);
  ctx.stroke();
  ctx.restore();

  ctx.save(); ctx.globalAlpha=alpha*.45;
  ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2);
  ctx.strokeStyle = theme === 'dark' ? "rgba(255,255,255,0.4)" : "rgba(46,139,69,0.3)";
  ctx.lineWidth=W*.003; ctx.stroke();
  ctx.restore();
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────
function Tooltip({ info, getPhotoURL, theme = 'dark' }: { info: any, getPhotoURL: (url: string | undefined | null) => string | null, theme?: 'light' | 'dark' }) {
  if (!info) return null;
  const { x, y, data, rect } = info;
  const TW=190, TH=110, mg=16;
  let left=x+mg, top=y-TH/2;
  if(rect&&left+TW>rect.right-8) left=x-TW-mg;
  if(rect&&top<rect.top+8)        top=rect.top+8;
  if(rect&&top+TH>rect.bottom-8)  top=rect.bottom-TH-8;

  const photoUrl = data.photoURL ? getPhotoURL(data.photoURL) : null;

  const bgColor = theme === 'dark' ? "rgba(8,14,20,0.92)" : "rgba(255,255,255,0.95)";
  const borderColor = theme === 'dark' ? "rgba(255,255,255,0.09)" : "rgba(46,139,69,0.1)";
  const textColor = theme === 'dark' ? "rgba(255,255,255,0.9)" : "#112A46";
  const subTextColor = theme === 'dark' ? "rgba(255,255,255,0.35)" : "rgba(17,42,70,0.5)";
  const statBg = theme === 'dark' ? "rgba(255,255,255,0.045)" : "rgba(46,139,69,0.05)";

  return (
    <div style={{
      position:"fixed",left,top,width:TW,
      background:bgColor,
      backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)",
      border:`1px solid ${borderColor}`,
      borderRadius:14, padding:"12px 13px", pointerEvents:"none", zIndex:100,
      boxShadow: theme === 'dark' ? "0 12px 40px rgba(0,0,0,0.6)" : "0 8px 30px rgba(46,139,69,0.12)",
    }}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <div style={{width:28,height:28,borderRadius:"50%",background:"#dce8f0",overflow:"hidden",flexShrink:0,position:"relative"}}>
          {photoUrl ? (
            <img src={photoUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} />
          ) : (
            <>
              <div style={{position:"absolute",top:"16%",left:"50%",transform:"translateX(-50%)",width:"36%",height:"36%",borderRadius:"50%",background:"#8aafc2"}}/>
              <div style={{position:"absolute",bottom:"-18%",left:"50%",transform:"translateX(-50%)",width:"58%",height:"58%",borderRadius:"50%",background:"#8aafc2"}}/>
            </>
          )}
        </div>
        <div style={{overflow:"hidden"}}>
          <div style={{fontFamily:"'DM Sans',system-ui,sans-serif",fontSize:"0.78rem",fontWeight:600,color:textColor,letterSpacing:"-0.01em",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{data.displayName || "Member"}</div>
          <div style={{fontFamily:"'DM Sans',system-ui,sans-serif",fontSize:"0.59rem",fontWeight:300,color:subTextColor,letterSpacing:"0.06em"}}>Contributor</div>
        </div>
      </div>
      <div style={{display:"flex",gap:8}}>
        <StatPill label="Contributions" value={data.contributions || 0} color={theme === 'dark' ? "#74b9ff" : "#2e8b45"} bg={statBg} />
      </div>
    </div>
  );
}

function StatPill({label,value,color,bg}: {label: string, value: number, color: string, bg: string}){
  return(
    <div style={{flex:1,background:bg,borderRadius:9,padding:"7px 9px",display:"flex",flexDirection:"column",gap:3}}>
      <span style={{fontSize:"0.56rem",color:"rgba(0,0,0,0.3)",fontFamily:"'DM Sans',sans-serif",letterSpacing:"0.07em",textTransform:"uppercase"}}>{label}</span>
      <span style={{fontSize:"0.95rem",fontWeight:400,color,fontFamily:"'DM Sans',sans-serif",lineHeight:1}}>{value.toLocaleString()}</span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CircleRingProps {
  users: any[];
  currentUser: any | null;
  getPhotoURL: (url: string | undefined | null) => string | null;
  theme?: 'light' | 'dark';
}

export default function CircleRing({ users, currentUser, getPhotoURL, theme = 'dark' }: CircleRingProps) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const rafRef      = useRef<number | null>(null);
  const greenTexRef = useRef<HTMLCanvasElement | null>(null);
  const sizeRef     = useRef(0);
  const circlesRef  = useRef<any[]>([]);

  const rotRef      = useRef(0);
  const velocityRef = useRef(0);
  const stateRef    = useRef("auto");

  const dragRef     = useRef({ prevAngle:0, prevTime:0 });

  const [tooltip, setTooltip] = useState<any>(null);

  // Image cache
  const loadedImages = useRef<Map<string, HTMLImageElement>>(new Map());
  const [currentUserImg, setCurrentUserImg] = useState<HTMLImageElement | null>(null);
  const currentUserImgRef = useRef<HTMLImageElement | null>(null);
  const usersRef = useRef<any[]>(users);
  const isInitialized = useRef(false);

  // Preload and monitor images
  useEffect(() => {
    users.forEach(u => {
      if (u.photoURL && !loadedImages.current.has(u.photoURL)) {
        const url = getPhotoURL(u.photoURL);
        if (url) {
          const img = new window.Image();
          img.crossOrigin = "anonymous";
          img.src = url;
          loadedImages.current.set(u.photoURL, img);
        }
      }
    });

    if (currentUser?.photoURL) {
      const url = getPhotoURL(currentUser.photoURL);
      if (url) {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.src = url;
        img.onload = () => {
             setCurrentUserImg(img);
             currentUserImgRef.current = img;
        };
      }
    }
  }, [users, currentUser, getPhotoURL]);

  // Update circle data when users change without reshuffling
  useEffect(() => {
    usersRef.current = users;
    if (circlesRef.current.length > 0) {
      let uIdx = 0;
      circlesRef.current.forEach((c: any) => {
        if (c.showIcon) {
          c.userData = uIdx < users.length ? users[uIdx] : null;
          uIdx++;
        }
      });
    }
  }, [users]);

  useEffect(() => { greenTexRef.current = makeGreenLinesTexture(500); }, []);

  const clientToAngle = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left - rect.width  / 2;
    const y = clientY - rect.top  - rect.height / 2;
    return Math.atan2(y, x);
  }, []);

  const hitTest = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (clientX - rect.left) * scaleX;
    const my = (clientY - rect.top)  * scaleY;
    const W  = sizeRef.current;
    const cx=W/2, cy=W/2, rot=rotRef.current;
    for (const c of circlesRef.current) {
      if (!c.userData) continue;
      const a=c.polarAngle+rot;
      const rx=cx+Math.cos(a)*c.polarDist;
      const ry=cy+Math.sin(a)*c.polarDist;
      const dx=mx-rx, dy=my-ry;
      if(dx*dx+dy*dy<=c.r*c.r) return { c, rect };
    }
    return null;
  }, []);

  const onMouseMove = useCallback((e: any) => {
    if (stateRef.current === "dragging") {
      const now   = performance.now();
      const angle = clientToAngle(e.clientX, e.clientY);
      let delta = angle - dragRef.current.prevAngle;
      if (delta >  Math.PI) delta -= 2 * Math.PI;
      if (delta < -Math.PI) delta += 2 * Math.PI;
      const dt = Math.max(1, now - dragRef.current.prevTime);
      rotRef.current += delta;
      velocityRef.current = (delta / dt) * 16.67;
      dragRef.current.prevAngle = angle;
      dragRef.current.prevTime  = now;
      setTooltip(null);
      return;
    }

    const hit = hitTest(e.clientX, e.clientY);
    if (hit && canvasRef.current) {
      setTooltip({ x:e.clientX, y:e.clientY, data:hit.c.userData, rect:hit.rect });
      canvasRef.current.style.cursor = "pointer";
    } else if (canvasRef.current) {
      setTooltip(null);
      canvasRef.current.style.cursor = "grab";
    }
  }, [clientToAngle, hitTest]);

  const onMouseDown = useCallback((e: any) => {
    const angle = clientToAngle(e.clientX, e.clientY);
    stateRef.current = "dragging";
    dragRef.current  = { prevAngle:angle, prevTime:performance.now() };
    velocityRef.current = 0;
    setTooltip(null);
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
  }, [clientToAngle]);

  const onMouseUp = useCallback(() => {
    if (stateRef.current !== "dragging") return;
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

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const angle = clientToAngle(touch.clientX, touch.clientY);
    stateRef.current = "dragging";
    dragRef.current = { prevAngle: angle, prevTime: performance.now() };
    velocityRef.current = 0;
    setTooltip(null);
  }, [clientToAngle]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (stateRef.current !== "dragging") return;
    const touch = e.touches[0];
    const now = performance.now();
    const angle = clientToAngle(touch.clientX, touch.clientY);
    let delta = angle - dragRef.current.prevAngle;
    if (delta >  Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;
    const dt = Math.max(1, now - dragRef.current.prevTime);
    rotRef.current += delta;
    velocityRef.current = (delta / dt) * 16.67;
    dragRef.current.prevAngle = angle;
    dragRef.current.prevTime = now;
    setTooltip(null);
  }, [clientToAngle]);

  const onTouchEnd = useCallback(() => {
    if (stateRef.current !== "dragging") return;
    stateRef.current = Math.abs(velocityRef.current) > MIN_VELOCITY ? "coasting" : "auto";
  }, []);

  const generate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !greenTexRef.current) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const S = Math.floor(Math.min(window.innerWidth, window.innerHeight) * 0.88);
    canvas.width = canvas.height = S;
    sizeRef.current = S;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W=S, cx=W/2, cy=W/2;

    stateRef.current = "auto";
    velocityRef.current = 0;
    drawBg(ctx, W, theme);
    setTooltip(null);

    // Always re-pack for the new canvas size to get correct positions.
    // Preserve existing user assignments from the old circles.
    const prevUserData: any[] = [];
    if (circlesRef.current.length > 0) {
      circlesRef.current.forEach((c: any) => {
        if (c.showIcon) prevUserData.push(c.userData ?? null);
      });
    }

    const circles = pack(W, []); // pack with empty user data → placeholders

    // Re-assign users from previous circles (or from current usersRef if first load)
    let uIdx = 0, uSrcIdx = 0;
    circles.forEach((c: any) => {
      if (c.showIcon) {
        if (prevUserData.length > 0) {
          c.userData = prevUserData[uSrcIdx] ?? null;
          uSrcIdx++;
        } else {
          c.userData = uIdx < usersRef.current.length ? usersRef.current[uIdx] : null;
          uIdx++;
        }
      }
    });
    circlesRef.current = circles;

    const sorted=[...circlesRef.current].sort((a,b)=>b.r-a.r);
    const total=sorted.length;
    const t0=performance.now();
    sorted.forEach((c: any,i: number)=>{c._delay=i*STAGGER+60;});

    function revealFrame(now: number){
      if (!ctx) return;
      drawBg(ctx, W, theme);
      let allDone=true;
      for(let i=0;i<total;i++){
        const c: any=sorted[i];const el=now-t0-c._delay;
        if(el<0){allDone=false;continue;}
        const t=Math.min(1,el/FADE_DUR);if(t<1)allDone=false;
        const e=easeOutCubic(t);
        drawCircle(ctx,c,e,SCALE_FROM+(1-SCALE_FROM)*e,rotRef.current,cx,cy, loadedImages.current, theme);
      }
      const ct=Math.min(1,Math.max(0,(now-t0)/(FADE_DUR*1.1)));
      const ce=easeOutQuart(ct);
      drawCenter(ctx,W,ce,SCALE_FROM+(1-SCALE_FROM)*ce,greenTexRef.current!, currentUserImgRef.current, theme, rotRef.current);
      applyRotation();
      if(!allDone){ rafRef.current=requestAnimationFrame(revealFrame); }
      else{ 
        isInitialized.current = true;
        rafRef.current=requestAnimationFrame(spinFrame); 
      }
    }

    function spinFrame(){
      if (!ctx) return;
      drawBg(ctx, W, theme);
      const all=circlesRef.current;
      for(const c of all) drawCircle(ctx,c,1,1,rotRef.current,cx,cy, loadedImages.current, theme);
      drawCenter(ctx,W,1,1,greenTexRef.current!, currentUserImgRef.current, theme, rotRef.current);
      applyRotation();
      rafRef.current=requestAnimationFrame(spinFrame);
    }

    if (!isInitialized.current) {
        // First ever render: play the reveal animation
        rafRef.current=requestAnimationFrame(revealFrame);
    } else {
        // Resize or update: jump straight to spinning (no flash/restart)
        rafRef.current=requestAnimationFrame(spinFrame);
    }
  }, [theme]);

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
    <div style={{width:"100%", background: theme === 'dark' ? "#080b0e" : "#ffffff", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", position:"relative", borderRadius:32}}>
      <canvas
        ref={canvasRef}
        style={{display:"block", cursor:"grab", userSelect:"none", touchAction:"none", maxWidth:"100%"}}
        onMouseMove={onMouseMove}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      />
      <Tooltip info={tooltip} getPhotoURL={getPhotoURL} theme={theme} />
    </div>
  );
}
