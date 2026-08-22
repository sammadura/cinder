'use strict';
/* rendering only */
function drawWorld(ctx){
  const g=G,w=g.W,h=g.H,t=g.t,cx=w*0.5,cy=h*0.5,T=Math.PI*2;
  ctx.setTransform(1,0,0,1,0,0);
  ctx.fillStyle='#0b0d10';
  ctx.fillRect(0,0,w,h);
  if(g.shake){
    ctx.translate((Math.random()-0.5)*g.shake,(Math.random()-0.5)*g.shake);
  }
  ctx.strokeStyle='rgba(201,194,178,0.07)';
  ctx.lineWidth=1;
  for(let i=1;i<5;i++){
    ctx.beginPath();
    ctx.ellipse(cx,cy,i*42,i*30,0,0,T);
    ctx.stroke();
  }
  ctx.strokeStyle='rgba(186,196,206,0.16)';
  ctx.lineWidth=1.1;
  for(const k of g.ticks){
    ctx.beginPath();
    ctx.moveTo(k.x,k.y);
    ctx.lineTo(k.x+Math.cos(k.a)*k.l,k.y-k.l*0.65);
    ctx.stroke();
  }
  for(const p of g.posts){
    ctx.fillStyle='#171310';
    ctx.fillRect(p.x-3,p.y-15,6,22);
    ctx.fillStyle='#2c241c';
    ctx.fillRect(p.x-4,p.y-17,8,4);
  }
  const fl=1+Math.sin(t*9)*0.07+Math.sin(t*14.2)*0.04;
  const heat=78+(g.fireHp/100)*46;
  ctx.beginPath();ctx.arc(cx,cy,heat,0,T);
  ctx.fillStyle='rgba(232,93,4,'+(0.045+0.03*fl)+')';ctx.fill();
  ctx.beginPath();ctx.arc(cx,cy,heat*0.52,0,T);
  ctx.fillStyle='rgba(232,93,4,'+(0.06+0.05*fl)+')';ctx.fill();
  ctx.beginPath();ctx.ellipse(cx,cy+7,22,10,0,0,T);
  ctx.fillStyle='#3d1f0f';ctx.fill();
  ctx.fillStyle='#e85d04';
  ctx.beginPath();ctx.ellipse(cx,cy-2*fl,13,17*fl,0,0,T);ctx.fill();
  ctx.fillStyle='#f48c06';
  ctx.beginPath();ctx.ellipse(cx+0.8,cy-7*fl,7.5,12*fl,0,0,T);ctx.fill();
  ctx.fillStyle='#c9c2b2';
  ctx.beginPath();ctx.ellipse(cx,cy-10*fl,3.4,6.2*fl,0,0,T);ctx.fill();
  for(const b of g.bits){
    ctx.globalAlpha=Math.max(0,b.z);
    ctx.fillStyle=b.c;
    ctx.beginPath();ctx.arc(b.x,b.y,b.s,0,T);ctx.fill();
  }
  ctx.globalAlpha=1;
  for(const s of g.sparks){
    ctx.strokeStyle='rgba(255,210,140,0.5)';
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.moveTo(s.x,s.y);
    ctx.lineTo(s.x-s.vx*0.028,s.y-s.vy*0.028);
    ctx.stroke();
    ctx.fillStyle='#ffe7b3';
    ctx.beginPath();ctx.arc(s.x,s.y,2.5,0,T);ctx.fill();
  }
  for(const f of g.foes){
    ctx.fillStyle='#101820';
    ctx.beginPath();ctx.ellipse(f.x,f.y+2,15,7.5,0,0,T);ctx.fill();
    ctx.fillStyle='#0a1016';
    ctx.beginPath();ctx.ellipse(f.x-1,f.y-3,9,6.4,-0.28,0,T);ctx.fill();
    ctx.fillStyle='#dfe6ee';
    ctx.beginPath();ctx.arc(f.x-3.2,f.y-2.6,1.45,0,T);ctx.fill();
    ctx.beginPath();ctx.arc(f.x+4.1,f.y-1.8,1.45,0,T);ctx.fill();
  }
  if(!(g.inv>0&&((t*18)|0)%2)){
    ctx.save();
    ctx.translate(g.px,g.py);
    ctx.rotate(g.pa);
    ctx.fillStyle='#a44b16';
    ctx.beginPath();ctx.ellipse(0,2.2,10,13,0,0,T);ctx.fill();
    ctx.fillStyle='#3d1f0f';
    ctx.beginPath();ctx.arc(0,-4.2,6.1,0,T);ctx.fill();
    ctx.fillStyle='#140e0b';
    ctx.beginPath();ctx.arc(0,-3.2,3.1,0,T);ctx.fill();
    const arm=g.flick>0?1.05:0.28;
    ctx.strokeStyle='#c45c1a';
    ctx.lineWidth=3;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(4,2);ctx.lineTo(11,-7*arm);ctx.stroke();
    ctx.restore();
  }
  const vg=ctx.createRadialGradient(cx,cy,Math.min(w,h)*0.22,cx,cy,Math.max(w,h)*0.72);
  vg.addColorStop(0,'rgba(0,0,0,0)');
  vg.addColorStop(1,'rgba(0,0,0,0.58)');
  ctx.fillStyle=vg;ctx.fillRect(-20,-20,w+40,h+40);
  if(g.dawn>0){
    ctx.fillStyle='rgba(214,204,184,'+(g.dawn*0.38)+')';
    ctx.fillRect(0,0,w,h);
  }
}
