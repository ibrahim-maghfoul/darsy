const { useState, useEffect, useRef } = React;

const W = 340, H_COLLAPSED = 180, H_EXPANDED = 400, r = 56;
const triW = 120, triH = 90, CX = W / 2, bottomCornerR = 56;
const tipR = 16, baseR = 32, circleR = 28, GAP = 80, COL_GAP = 40;
const TRAIL_LEN = 10;

function buildPath(H) {
  const lx = W/2-triW/2, rx = W/2+triW/2, ty = H-triH;
  return {
    path:`M${r},0 H${W-r} Q${W},0 ${W},${r} V${H-bottomCornerR} Q${W},${H} ${W-bottomCornerR},${H} H${rx+baseR} Q${rx},${H} ${rx-baseR},${H-baseR*(triH/(triW/2))} L${CX+tipR},${ty+tipR} Q${CX},${ty} ${CX-tipR},${ty+tipR} L${lx+baseR},${H-baseR*(triH/(triW/2))} Q${lx},${H} ${lx-baseR},${H} H${bottomCornerR} Q0,${H} 0,${H-bottomCornerR} V${r} Q0,0 ${r},0 Z`,
    ty, circleY:ty-circleR-10, greenDotY:ty+32,
    flippedCircleY:H-(ty-circleR-10)-circleR, flippedGreenDotY:H-(ty+32),
  };
}

function bezier(t,from,cp1,cp2,to){
  const mt=1-t;
  return{x:mt*mt*mt*from.x+3*mt*mt*t*cp1.x+3*mt*t*t*cp2.x+t*t*t*to.x,y:mt*mt*mt*from.y+3*mt*mt*t*cp1.y+3*mt*t*t*cp2.y+t*t*t*to.y};
}
function bezierSegments(t,segs){
  const tw=segs.reduce((s,g)=>s+g.weight,0);let rem=t*tw;
  for(const g of segs){if(rem<=g.weight)return bezier(rem/g.weight,g.from,g.cp1,g.cp2,g.to);rem-=g.weight;}
  const l=segs[segs.length-1];return bezier(1,l.from,l.cp1,l.cp2,l.to);
}

function AnimOrb({segments,duration,startTime}){
  const[trail,setTrail]=useState([]);const rafRef=useRef();
  useEffect(()=>{
    const tick=(now)=>{
      const elapsed=now-startTime;
      if(elapsed<0){rafRef.current=requestAnimationFrame(tick);return;}
      const t=Math.min(elapsed/duration,1);
      const et=t*t*(3-2*t);
      const opacity=t<0.12?t/0.12:t>0.85?(1-t)/0.15:1;
      const pos=bezierSegments(et,segments);
      setTrail(prev=>[...prev,{...pos,opacity}].slice(-TRAIL_LEN));
      if(t<1)rafRef.current=requestAnimationFrame(tick);
    };
    rafRef.current=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(rafRef.current);
  },[]);
  if(trail.length===0)return null;
  const head=trail[trail.length-1];
  return(
    <g>
      {trail.map((p,i)=>{const ratio=i/(TRAIL_LEN-1);return<circle key={i}cx={p.x}cy={p.y}r={1+ratio*3.5}fill="#22c55e"opacity={p.opacity*ratio*0.6}/>;})}
      <circle cx={head.x}cy={head.y}r={9}fill="#22c55e"opacity={head.opacity*0.12}/>
      <circle cx={head.x}cy={head.y}r={5}fill="#22c55e"opacity={head.opacity*0.85}/>
      <circle cx={head.x}cy={head.y}r={2}fill="white"opacity={head.opacity}/>
    </g>
  );
}

function OrbCanvas({dots,canvasW,canvasH}){
  const[orbs,setOrbs]=useState([]);const orbIdRef=useRef(0);
  useEffect(()=>{
    if(!dots.a_top)return;
    const{a_top,a_bot,b_top,b_bot}=dots;
    const KAPPA=0.5523,CAP_R=90;
    function makeSigmoid(a,b){
      const sY=Math.sign(b.y-a.y),sX=Math.sign(b.x-a.x);
      const p1={x:a.x+sX*CAP_R,y:a.y+sY*CAP_R},p2={x:b.x-sX*CAP_R,y:b.y-sY*CAP_R};
      return[
        {from:a,cp1:{x:a.x,y:a.y+sY*CAP_R*KAPPA},cp2:{x:p1.x-sX*CAP_R*KAPPA,y:p1.y},to:p1,weight:CAP_R},
        {from:p1,cp1:{x:p1.x+(p2.x-p1.x)/3,y:p1.y+(p2.y-p1.y)/3},cp2:{x:p1.x+(p2.x-p1.x)*2/3,y:p1.y+(p2.y-p1.y)*2/3},to:p2,weight:Math.hypot(p2.x-p1.x,p2.y-p1.y)},
        {from:p2,cp1:{x:p2.x+sX*CAP_R*KAPPA,y:p2.y},cp2:{x:b.x,y:b.y-sY*CAP_R*KAPPA},to:b,weight:CAP_R},
      ];
    }
    function seg1(from,to,cp1,cp2){return[{from,cp1,cp2,to,weight:1}];}
    const routes=[
      {segments:seg1(a_top,a_bot,{x:a_top.x-80,y:a_top.y+(a_bot.y-a_top.y)*0.25},{x:a_bot.x-80,y:a_top.y+(a_bot.y-a_top.y)*0.75})},
      {segments:seg1(a_bot,a_top,{x:a_bot.x-80,y:a_bot.y-(a_bot.y-a_top.y)*0.25},{x:a_top.x-80,y:a_bot.y-(a_bot.y-a_top.y)*0.75})},
      {segments:seg1(b_top,b_bot,{x:b_top.x+80,y:b_top.y+(b_bot.y-b_top.y)*0.25},{x:b_bot.x+80,y:b_top.y+(b_bot.y-b_top.y)*0.75})},
      {segments:seg1(b_bot,b_top,{x:b_bot.x+80,y:b_bot.y-(b_bot.y-b_top.y)*0.25},{x:b_top.x+80,y:b_bot.y-(b_bot.y-b_top.y)*0.75})},
      {segments:seg1(a_top,b_top,{x:a_top.x,y:a_top.y+180},{x:b_top.x,y:b_top.y+180})},
      {segments:seg1(b_top,a_top,{x:b_top.x,y:b_top.y+180},{x:a_top.x,y:a_top.y+180})},
      {segments:seg1(a_bot,b_bot,{x:a_bot.x,y:a_bot.y-180},{x:b_bot.x,y:b_bot.y-180})},
      {segments:seg1(b_bot,a_bot,{x:b_bot.x,y:b_bot.y-180},{x:a_bot.x,y:a_bot.y-180})},
      {segments:makeSigmoid(a_bot,b_top)},{segments:makeSigmoid(b_top,a_bot)},
      {segments:makeSigmoid(b_bot,a_top)},{segments:makeSigmoid(a_top,b_bot)},
    ];
    const spawn=()=>{
      const route=routes[Math.floor(Math.random()*routes.length)];
      const id=orbIdRef.current++;const dur=1600+Math.random()*900;
      setOrbs(prev=>[...prev,{id,segments:route.segments,duration:dur,startTime:performance.now()+Math.random()*100}]);
      setTimeout(()=>setOrbs(prev=>prev.filter(o=>o.id!==id)),dur+400);
    };
    const interval=setInterval(spawn,480);return()=>clearInterval(interval);
  },[dots.a_top&&dots.a_top.x,dots.a_top&&dots.a_top.y,dots.b_top&&dots.b_top.x]);
  return(
    <svg width={canvasW}height={canvasH}viewBox={`0 0 ${canvasW} ${canvasH}`}style={{position:"absolute",top:0,left:0,pointerEvents:"none",zIndex:20}}>
      {orbs.map(o=><AnimOrb key={o.id}segments={o.segments}duration={o.duration}startTime={o.startTime}/>)}
    </svg>
  );
}

function GreenCard({position,texture,content,visible}){
  const people=[{color:"#f87171"},{color:"#fb923c"},{color:"#facc15"},{color:"#4ade80"},{color:"#60a5fa"}];
  const stars=[{color:"#a78bfa"},{color:"#c4b5fd"},{color:"#7c3aed"},{color:"#ddd6fe"},{color:"#8b5cf6"}];
  const avatars=content==="star"?stars:people;
  return(
    <div style={{position:"absolute",...(position==="top"?{top:20}:{bottom:20}),left:20,right:20,height:H_EXPANDED*0.5,background:"linear-gradient(135deg,#22c55e 0%,#16a34a 60%,#15803d 100%)",borderRadius:22,padding:"16px 16px 14px",display:"flex",flexDirection:"column",justifyContent:"space-between",boxShadow:"0 8px 32px rgba(34,197,94,0.3)",boxSizing:"border-box",overflow:"hidden",opacity:visible?1:0,transform:visible?"translateY(0px)":position==="top"?"translateY(-30px)":"translateY(30px)",transition:"opacity 0.45s ease, transform 0.5s cubic-bezier(0.22,1,0.36,1)",pointerEvents:visible?"auto":"none"}}>
      <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(circle,rgba(255,255,255,0.18)1.2px,transparent 1.2px)",backgroundSize:"12px 12px",borderRadius:22,pointerEvents:"none"}}/>
      <div style={{display:"flex",alignItems:"flex-start",gap:12,position:"relative",zIndex:1}}>
        <div style={{width:48,height:48,borderRadius:content==="star"?14:"50%",background:"rgba(255,255,255,0.2)",border:"2px solid rgba(255,255,255,0.4)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          {content==="star"
            ?<svg width="26"height="26"viewBox="0 0 26 26"fill="none"><polygon points="13,2 16,10 24,10 18,15 20,23 13,18 6,23 8,15 2,10 10,10"fill="white"/></svg>
            :<svg width="28"height="28"viewBox="0 0 28 28"fill="none"><circle cx="14"cy="10"r="5.5"fill="white"/><ellipse cx="14"cy="23"rx="9"ry="6"fill="white"/></svg>}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <p style={{margin:"0 0 4px",fontSize:14,fontWeight:700,color:"#fff"}}>{content==="star"?"New milestone! ⚡":"Keep it up, champ! 🏆"}</p>
          <p style={{margin:0,fontSize:11,color:"rgba(255,255,255,0.75)",lineHeight:1.4}}>{content==="star"?"You've unlocked Level 5":"You're on a 7-day streak 🔥"}</p>
        </div>
        <span style={{fontSize:10,color:"rgba(255,255,255,0.55)",flexShrink:0,marginTop:2}}>{content==="star"?"2m ago":"now"}</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:6,position:"relative",zIndex:1}}>
        <div style={{display:"flex"}}>
          {avatars.map((p,i)=>(
            <div key={i}style={{width:32,height:32,borderRadius:"50%",background:p.color,border:"2px solid rgba(255,255,255,0.6)",marginLeft:i===0?0:-10,display:"flex",alignItems:"center",justifyContent:"center",zIndex:5-i,position:"relative"}}>
              {content==="star"
                ?<svg width="14"height="14"viewBox="0 0 14 14"fill="none"><polygon points="7,1 8.5,5 13,5 9.5,8 10.5,12 7,9.5 3.5,12 4.5,8 1,5 5.5,5"fill="white"/></svg>
                :<svg width="16"height="16"viewBox="0 0 16 16"fill="none"><circle cx="8"cy="6"r="3"fill="white"/><ellipse cx="8"cy="13"rx="5"ry="3.5"fill="white"/></svg>}
            </div>
          ))}
        </div>
        <span style={{fontSize:11,color:"rgba(255,255,255,0.75)",marginLeft:4}}>{content==="star"?"+94 top players":"+128 joined"}</span>
      </div>
    </div>
  );
}

function renderPatternDef(id,type){
  const pid="pat-"+id,c="rgba(0,0,0,0.07)";
  if(type==="dots")return<pattern id={pid}x="0"y="0"width="18"height="18"patternUnits="userSpaceOnUse"><circle cx="9"cy="9"r="2"fill={c}/></pattern>;
  if(type==="dashes")return<pattern id={pid}x="0"y="0"width="24"height="12"patternUnits="userSpaceOnUse"><line x1="2"y1="6"x2="14"y2="6"stroke={c}strokeWidth="1.5"strokeLinecap="round"strokeDasharray="4 3"/></pattern>;
  if(type==="triangles")return<pattern id={pid}x="0"y="0"width="28"height="24"patternUnits="userSpaceOnUse"><polygon points="14,3 25,21 3,21"fill="none"stroke={c}strokeWidth="1.2"/></pattern>;
  if(type==="crosshatch")return<pattern id={pid}x="0"y="0"width="16"height="16"patternUnits="userSpaceOnUse"><line x1="0"y1="0"x2="16"y2="16"stroke={c}strokeWidth="1"/><line x1="16"y1="0"x2="0"y2="16"stroke={c}strokeWidth="1"/></pattern>;
  if(type==="stripes")return<pattern id={pid}x="0"y="0"width="12"height="12"patternUnits="userSpaceOnUse"patternTransform="rotate(45)"><line x1="0"y1="0"x2="0"y2="12"stroke={c}strokeWidth="3"/></pattern>;
  return<pattern id={pid}x="0"y="0"width="18"height="18"patternUnits="userSpaceOnUse"><circle cx="9"cy="9"r="2"fill={c}/></pattern>;
}

function CardPair({hoverTop,hoverBot,setHoverTop,setHoverBot,textureTop,textureBot,content,gradientTop,gradientBot,introTop,introBot}){
  const topData=buildPath(H_EXPANDED),botData=buildPath(H_EXPANDED);
  const clipTop=hoverTop?H_EXPANDED:H_COLLAPSED,clipBot=hoverBot?H_EXPANDED:H_COLLAPSED;
  const uid=content;
  const gTop="gc-"+uid+"-top",gBot="gc-"+uid+"-bot";
  const tmTop="tm-"+uid+"-top",tmBot="tm-"+uid+"-bot";
  const mTop="mask-"+uid+"-top",mBot="mask-"+uid+"-bot";
  const clTop="clip-"+uid+"-top",clBot="clip-"+uid+"-bot";
  const vg="vg-"+content;
  return(
    <div style={{position:"relative",width:W,flexShrink:0}}>
      <div style={introTop}>
        <div style={{position:"relative",width:W,cursor:"pointer"}}onMouseEnter={()=>setHoverTop(true)}onMouseLeave={()=>setHoverTop(false)}>
          <div style={{overflow:"hidden",height:clipTop,transition:"height 0.5s cubic-bezier(0.4,0,0.2,1)",position:"relative",borderRadius:r+"px "+r+"px 0 0"}}>
            <svg width={W}height={H_EXPANDED}viewBox={"0 0 "+W+" "+H_EXPANDED}style={{display:"block",transform:"translateY("+(-(H_EXPANDED-clipTop))+"px)",transition:"transform 0.5s cubic-bezier(0.4,0,0.2,1)"}}>
              <defs>
                {renderPatternDef(uid+"-top",textureTop)}
                <clipPath id={clTop}><path d={topData.path}/></clipPath>
                <linearGradient id={gTop}x1={gradientTop.x1}y1={gradientTop.y1}x2={gradientTop.x2}y2={gradientTop.y2}gradientUnits="objectBoundingBox">
                  <stop offset="0%"stopColor="#22c55e"stopOpacity="0.4"/><stop offset="60%"stopColor="#22c55e"stopOpacity="0"/>
                </linearGradient>
                <linearGradient id={tmTop}x1={gradientTop.x1}y1={gradientTop.y1}x2={gradientTop.x2}y2={gradientTop.y2}gradientUnits="objectBoundingBox">
                  <stop offset="0%"stopColor="white"stopOpacity="1"/><stop offset="100%"stopColor="white"stopOpacity="0"/>
                </linearGradient>
                <mask id={mTop}><rect x="0"y="0"width={W}height={H_EXPANDED}fill={"url(#"+tmTop+")"}/></mask>
              </defs>
              <path d={topData.path}fill="white"/>
              <rect x="0"y="0"width={W}height={H_EXPANDED}fill={"url(#pat-"+uid+"-top)"}clipPath={"url(#"+clTop+")"}mask={"url(#"+mTop+")"}/>
              <rect x="0"y="0"width={W}height={H_EXPANDED}fill={"url(#"+gTop+")"}clipPath={"url(#"+clTop+")"}/>
              <circle cx={CX}cy={topData.circleY}r={circleR}fill="#111"/>
              <circle cx={CX}cy={topData.circleY-6}r={7}fill="white"/>
              <ellipse cx={CX}cy={topData.circleY+14}rx={11}ry={8}fill="white"/>
              <circle cx={CX}cy={topData.greenDotY}r={6}fill="#22c55e"className="glow-dot"/>
              <circle cx={CX}cy={topData.greenDotY}r={6}fill="none"stroke="#22c55e"strokeWidth="2"className="ripple-dot"/>
            </svg>
            <GreenCard position="top"texture={textureTop}content={content}visible={hoverTop}/>
          </div>
        </div>
      </div>
      <div style={{height:GAP}}/>
      <div style={introBot}>
        <div style={{position:"relative",width:W,cursor:"pointer"}}onMouseEnter={()=>setHoverBot(true)}onMouseLeave={()=>setHoverBot(false)}>
          <div style={{overflow:"hidden",height:clipBot,transition:"height 0.5s cubic-bezier(0.4,0,0.2,1)",position:"relative",borderRadius:"0 0 "+r+"px "+r+"px"}}>
            <svg width={W}height={H_EXPANDED}viewBox={"0 0 "+W+" "+H_EXPANDED}style={{display:"block",transform:"scaleY(-1)",transformOrigin:"center"}}>
              <defs>
                {renderPatternDef(uid+"-bot",textureBot)}
                <clipPath id={clBot}><path d={botData.path}/></clipPath>
                <linearGradient id={gBot}x1={gradientBot.x1}y1={gradientBot.y1}x2={gradientBot.x2}y2={gradientBot.y2}gradientUnits="objectBoundingBox">
                  <stop offset="0%"stopColor="#22c55e"stopOpacity="0.4"/><stop offset="60%"stopColor="#22c55e"stopOpacity="0"/>
                </linearGradient>
                <linearGradient id={tmBot}x1={gradientBot.x1}y1={gradientBot.y1}x2={gradientBot.x2}y2={gradientBot.y2}gradientUnits="objectBoundingBox">
                  <stop offset="0%"stopColor="white"stopOpacity="1"/><stop offset="100%"stopColor="white"stopOpacity="0"/>
                </linearGradient>
                <mask id={mBot}><rect x="0"y="0"width={W}height={H_EXPANDED}fill={"url(#"+tmBot+")"}/></mask>
              </defs>
              <path d={botData.path}fill="white"/>
              <rect x="0"y="0"width={W}height={H_EXPANDED}fill={"url(#pat-"+uid+"-bot)"}clipPath={"url(#"+clBot+")"}mask={"url(#"+mBot+")"}/>
              <rect x="0"y="0"width={W}height={H_EXPANDED}fill={"url(#"+gBot+")"}clipPath={"url(#"+clBot+")"}/>
            </svg>
            <div style={{position:"absolute",top:botData.flippedCircleY,left:CX-circleR,width:circleR*2,height:circleR*2}}>
              <svg width={circleR*2}height={circleR*2}viewBox={"0 0 "+(circleR*2)+" "+(circleR*2)}>
                <circle cx={circleR}cy={circleR}r={circleR}fill="#111"/>
                <circle cx={circleR}cy={circleR-6}r={7}fill="white"/>
                <ellipse cx={circleR}cy={circleR+14}rx={11}ry={8}fill="white"/>
              </svg>
            </div>
            <svg width={W}height={H_EXPANDED}viewBox={"0 0 "+W+" "+H_EXPANDED}style={{position:"absolute",top:0,left:0,pointerEvents:"none"}}>
              <circle cx={CX}cy={botData.flippedGreenDotY}r={6}fill="#22c55e"className="glow-dot"style={{animationDelay:"0.5s"}}/>
              <circle cx={CX}cy={botData.flippedGreenDotY}r={6}fill="none"stroke="#22c55e"strokeWidth="2"className="ripple-dot"style={{animationDelay:"0.5s"}}/>
            </svg>
            <GreenCard position="bottom"texture={textureBot}content={content}visible={hoverBot}/>
          </div>
        </div>
      </div>
      <svg width={W}height={clipTop+GAP+clipBot}viewBox={"0 0 "+W+" "+(clipTop+GAP+clipBot)}style={{position:"absolute",top:0,left:0,pointerEvents:"none",zIndex:5}}>
        <defs>
          <linearGradient id={vg}x1="0"y1="0"x2="0"y2="1">
            <stop offset="0%"stopColor="#22c55e"stopOpacity="0.1"/>
            <stop offset="50%"stopColor="#22c55e"stopOpacity="0.6"/>
            <stop offset="100%"stopColor="#22c55e"stopOpacity="0.1"/>
          </linearGradient>
        </defs>
        <line x1={CX}y1={topData.greenDotY}x2={CX}y2={clipTop+GAP+botData.flippedGreenDotY}stroke={"url(#"+vg+")"}strokeWidth="1.5"strokeDasharray="6 5"/>
      </svg>
    </div>
  );
}

export default function App(){
  const[hA_top,setHA_top]=useState(false);
  const[hA_bot,setHA_bot]=useState(false);
  const[hB_top,setHB_top]=useState(false);
  const[hB_bot,setHB_bot]=useState(false);
  const[settled,setSettled]=useState(false);

  useEffect(()=>{const t=setTimeout(()=>setSettled(true),800);return()=>clearTimeout(t);},[]);

  const PAGE_PAD_V=120;
  const Htop_A=hA_top?H_EXPANDED:H_COLLAPSED,Hbot_A=hA_bot?H_EXPANDED:H_COLLAPSED;
  const Htop_B=hB_top?H_EXPANDED:H_COLLAPSED,Hbot_B=hB_bot?H_EXPANDED:H_COLLAPSED;
  const topDataA=buildPath(Htop_A),botDataA=buildPath(Hbot_A);
  const topDataB=buildPath(Htop_B),botDataB=buildPath(Hbot_B);
  const colBX=W+COL_GAP,canvasW=W*2+COL_GAP,canvasH=Math.max(Htop_A+GAP+Hbot_A,Htop_B+GAP+Hbot_B)+PAGE_PAD_V*2;

  const dots={
    a_top:{x:CX,       y:PAGE_PAD_V+topDataA.greenDotY},
    a_bot:{x:CX,       y:PAGE_PAD_V+Htop_A+GAP+botDataA.flippedGreenDotY},
    b_top:{x:colBX+CX, y:PAGE_PAD_V+topDataB.greenDotY},
    b_bot:{x:colBX+CX, y:PAGE_PAD_V+Htop_B+GAP+botDataB.flippedGreenDotY},
  };

  const introOrigin=["bottom right","bottom left","top right","top left"];
  const introRot=["rotateZ(-90deg)","rotateZ(90deg)","rotateZ(-90deg)","rotateZ(90deg)"];
  const makeIntro=(idx)=>({
    transformOrigin:introOrigin[idx],
    transform:settled?"rotateZ(0deg)":introRot[idx],
    transition:settled?"transform 0.9s cubic-bezier(0.22,1,0.36,1) "+(idx*150)+"ms":"none",
    willChange:"transform",
  });

  const replay=()=>{setSettled(false);setTimeout(()=>setSettled(true),800);};

  return(
    <div style={{minHeight:"100vh",background:"#111",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif",overflow:"hidden"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"rel="stylesheet"/>
      <style>{`
        @keyframes glow{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes ripple{0%{r:6;opacity:0.9}100%{r:22;opacity:0}}
        .glow-dot{animation:glow 1.8s ease-in-out infinite;filter:drop-shadow(0 0 5px #22c55e)}
        .ripple-dot{animation:ripple 1.8s ease-out infinite}
      `}</style>
      <div style={{position:"relative",paddingTop:PAGE_PAD_V,paddingBottom:PAGE_PAD_V}}>
        <div style={{display:"flex",flexDirection:"row",gap:COL_GAP,alignItems:"flex-start"}}>
          <CardPair
            hoverTop={hA_top}hoverBot={hA_bot}setHoverTop={setHA_top}setHoverBot={setHA_bot}
            textureTop="dots"textureBot="triangles"content="people"
            gradientTop={{x1:"1",y1:"1",x2:"0",y2:"0"}}gradientBot={{x1:"1",y1:"1",x2:"0",y2:"0"}}
            introTop={makeIntro(0)}introBot={makeIntro(1)}
          />
          <CardPair
            hoverTop={hB_top}hoverBot={hB_bot}setHoverTop={setHB_top}setHoverBot={setHB_bot}
            textureTop="crosshatch"textureBot="dashes"content="star"
            gradientTop={{x1:"0",y1:"1",x2:"1",y2:"0"}}gradientBot={{x1:"0",y1:"1",x2:"1",y2:"0"}}
            introTop={makeIntro(2)}introBot={makeIntro(3)}
          />
        </div>
        {settled&&<OrbCanvas dots={dots}canvasW={canvasW}canvasH={canvasH}/>}
        <div style={{display:"flex",justifyContent:"center",marginTop:36}}>
          <button onClick={replay}style={{background:"transparent",border:"1px solid rgba(34,197,94,0.5)",borderRadius:99,color:"#22c55e",fontSize:13,fontFamily:"'DM Sans',sans-serif",fontWeight:500,padding:"8px 22px",cursor:"pointer",letterSpacing:"0.04em",display:"flex",alignItems:"center",gap:7,transition:"background 0.2s"}}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(34,197,94,0.08)"}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <svg width="13"height="13"viewBox="0 0 13 13"fill="none">
              <path d="M11.5 6.5A5 5 0 1 1 8 2.1"stroke="#22c55e"strokeWidth="1.5"strokeLinecap="round"/>
              <polyline points="8,0.5 8,2.5 10,2.5"stroke="#22c55e"strokeWidth="1.5"strokeLinecap="round"strokeLinejoin="round"/>
            </svg>
            Replay
          </button>
        </div>
      </div>
    </div>
  );
}
