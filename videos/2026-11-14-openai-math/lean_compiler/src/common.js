const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const easeOut=x=>1-Math.pow(1-clamp(x),3);
// cubic-bezier(.2,.8,.2,1) approximation via solve
function bez(x){x=clamp(x);let lo=0,hi=1,t=.5;for(let i=0;i<24;i++){t=(lo+hi)/2;const bx=3*(1-t)*(1-t)*t*.2+3*(1-t)*t*t*.2+t*t*t;if(bx<x)lo=t;else hi=t;}return 3*(1-t)*(1-t)*t*.8+3*(1-t)*t*t*1+t*t*t;}
const FPS=30000/1001;
const prog=(t,t0,frames)=>clamp((t-t0)/(frames/FPS));
const enter=(t,t0,frames=10)=>bez(prog(t,t0,frames));
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const CHECK='<svg viewBox="0 0 24 24" width="1em" height="1em" style="vertical-align:-.14em"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CROSS='<svg viewBox="0 0 24 24" width="1em" height="1em" style="vertical-align:-.14em"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/></svg>';
// typed string at chars/sec from t0
const typed=(s,t,t0,cps=32)=>s.slice(0,Math.max(0,Math.min(s.length,Math.floor((t-t0)*cps))));
const blink=t=>(Math.floor(t*1.9)%2===0);
window.ready=document.fonts.ready.then(()=>Promise.all([...document.fonts].map(f=>f.load().catch(()=>{}))));
