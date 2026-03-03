import { useId } from 'react';

// ─── Constants ────────────────────────────────────────────────────
const W         = 340;
const H         = 320;
const CR        = 28;
const G         = 8;
const SR        = 18;
const IR        = SR + G;   // 26 — concave inner corner
const BW        = 120;      // badge width
const BH        = 36;       // badge height
const TbW       = 110;      // read pill width
const TbH       = 38;       // read pill height
const GAP       = 10;       // image gap from notch/card edges
const PILL_PAD  = 14;       // pill internal horizontal padding
const TEXT_PUSH = 10;       // extra push right for both text rows

const TY = BH + G;           // top horizontal notch cut y
const BY = H - TbH - G;      // bottom horizontal notch cut y

const IMG_R      = 10;
const IMG_TOP    = TY + GAP;
const IMG_BOTTOM = (H - BY) + GAP;
const IMG_LEFT   = GAP;
const IMG_RIGHT  = GAP;

// Title: top=0, height=BH → same band as badge, left pushed past pill text
const TITLE_LEFT  = BW + PILL_PAD + TEXT_PUSH;
const TITLE_RIGHT = GAP;
const TITLE_H     = BH;

// Meta: bottom=0, height=TbH → same band as read pill, pushed right symmetrically
const META_LEFT  = GAP + TEXT_PUSH;
const META_RIGHT = TbW + PILL_PAD + TEXT_PUSH;
const META_H     = TbH;

// ─── Path builder ─────────────────────────────────────────────────
function buildCardPath() {
  const tx = BW + G, ty = BH + G;
  const bx = W - TbW - G, by = H - TbH - G;
  return [
    `M ${tx + SR} 0`,
    `L ${W - CR} 0`, `A ${CR} ${CR} 0 0 1 ${W} ${CR}`,
    `L ${W} ${by - SR}`, `A ${SR} ${SR} 0 0 1 ${W - SR} ${by}`,
    `L ${bx + IR} ${by}`, `A ${IR} ${IR} 0 0 0 ${bx} ${by + IR}`,
    `L ${bx} ${H - SR}`, `A ${SR} ${SR} 0 0 1 ${bx - SR} ${H}`,
    `L ${CR} ${H}`, `A ${CR} ${CR} 0 0 1 0 ${H - CR}`,
    `L 0 ${ty + SR}`, `A ${SR} ${SR} 0 0 1 ${SR} ${ty}`,
    `L ${tx - IR} ${ty}`, `A ${IR} ${IR} 0 0 0 ${tx} ${ty - IR}`,
    `L ${tx} ${SR}`, `A ${SR} ${SR} 0 0 1 ${tx + SR} 0`,
    'Z',
  ].join(' ');
}

// ─── Component ────────────────────────────────────────────────────
export default function NewsCard({
  title    = 'Untitled Article',
  category = 'General',
  image    = '',
  date     = '',
  readTime = '',
  href,
  children,
}) {
  const uid  = useId().replace(/:/g, '');
  const path = buildCardPath();
  const gid  = `nc-grad-${uid}`;

  const pillBase = {
    position: 'absolute',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#3aaa6a', color: '#fff', fontWeight: 700,
    whiteSpace: 'nowrap', gap: 6,
    padding: `0 ${PILL_PAD}px`,
    boxShadow: '0 2px 10px rgba(58,170,106,0.35)',
  };

  const card = (
    <div style={{ position: 'relative', width: W, height: H, cursor: 'pointer', flexShrink: 0 }}>

      {/* Card shape */}
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}
        style={{ display: 'block', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.07)) drop-shadow(0 8px 24px rgba(0,0,0,0.12))' }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0%"   stopColor="#ffffff" />
            <stop offset="100%" stopColor="#edf0f4" />
          </linearGradient>
        </defs>
        <path d={path} fill={`url(#${gid})`} />
      </svg>

      {/* Clipped content */}
      <div style={{ position: 'absolute', inset: 0, clipPath: `path('${path}')` }}>

        {/* Title — vertically centered in badge band, pushed right */}
        <div style={{
          position: 'absolute',
          top: 0, left: TITLE_LEFT, right: TITLE_RIGHT, height: TITLE_H,
          display: 'flex', alignItems: 'center', overflow: 'hidden',
        }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#1a1f2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {title}
          </span>
        </div>

        {/* Image */}
        <div style={{
          position: 'absolute',
          top: IMG_TOP, left: IMG_LEFT, right: IMG_RIGHT, bottom: IMG_BOTTOM,
          borderRadius: IMG_R,
          background: `url('${image}') center/cover #cdd5de`,
        }} />

        {/* Meta — vertically centered in read pill band, pushed right */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: META_LEFT, right: META_RIGHT, height: META_H,
          display: 'flex', alignItems: 'center', overflow: 'hidden',
        }}>
          {children || (
            <span style={{ fontSize: 11, color: '#8a97a8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {date}{date && readTime ? ' · ' : ''}{readTime}
            </span>
          )}
        </div>

      </div>

      {/* Badge pill — flush top-left */}
      <div style={{ ...pillBase, top: 0, left: 0, width: BW, height: BH, borderRadius: BH / 2, fontSize: 12.5 }}>
        {category}
      </div>

      {/* Read pill — flush bottom-right */}
      <div style={{ ...pillBase, bottom: 0, right: 0, width: TbW, height: TbH, borderRadius: TbH / 2, fontSize: 13 }}>
        READ
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"/>
          <polyline points="12 5 19 12 12 19"/>
        </svg>
      </div>

    </div>
  );

  if (href) return <a href={href} style={{ display: 'block', textDecoration: 'none' }}>{card}</a>;
  return card;
}
