const FPS = 30000/1001;
const clamp = (x,a=0,b=1)=>Math.min(b,Math.max(a,x));
// cubic-bezier(.2,.8,.2,1)
function bez(x1,y1,x2,y2){const cx=3*x1,bx=3*(x2-x1)-cx,ax=1-cx-bx,cy=3*y1,by=3*(y2-y1)-cy,ay=1-cy-by;
  const X=t=>((ax*t+bx)*t+cx)*t, Y=t=>((ay*t+by)*t+cy)*t, dX=t=>(3*ax*t+2*bx)*t+cx;
  return x=>{if(x<=0)return 0;if(x>=1)return 1;let t=x;for(let i=0;i<8;i++){const e=X(t)-x;if(Math.abs(e)<1e-6)break;t-=e/dX(t);}return Y(t);};}
const ease = bez(.2,.8,.2,1);
const prog = (t,start,frames=10)=>ease(clamp((t-start)/(frames/FPS)));
const lin = (t,start,dur)=>clamp((t-start)/dur);
function pop(el,p,dy=16,s0=.94){el.style.opacity=p;el.style.transform=`translateY(${(1-p)*dy}px) scale(${s0+(1-s0)*p})`;}
const CHECK = (c,w=3.2)=>`<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const CROSS = (c,w=3.2)=>`<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M7 7l10 10M17 7L7 17" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/></svg>`;
