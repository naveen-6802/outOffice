// Small, deterministic-cost AI layer over the existing 24-car pool.
export const TRAFFIC_PROFILES={
 park:{interval:2.8,min:1.5,dynamic:.24,speed:1.05,cap:18},
 coast:{interval:2.5,min:1.3,dynamic:.28,speed:1,cap:19},
 forest:{interval:2.9,min:1.6,dynamic:.22,speed:.96,cap:17},
 city:{interval:2.15,min:1.15,dynamic:.4,speed:.88,cap:21},
 alpine:{interval:3.1,min:1.7,dynamic:.18,speed:.86,cap:16},
 harbour:{interval:2.65,min:1.4,dynamic:.32,speed:1.04,cap:19}
};
export function trafficProfile(map){return TRAFFIC_PROFILES[map]||TRAFFIC_PROFILES.coast}
export function spawnInterval(map,distance){const p=trafficProfile(map);return Math.max(p.min,p.interval-Math.max(0,distance)/16000)}
export function trafficLimit(map,distance){const p=trafficProfile(map);return Math.min(p.cap,10+Math.floor(Math.max(0,distance)/2000))}
export function reserves(c,lane){return c.lane===lane||(c.change>0&&c.oldLane===lane)||c.pendingLane===lane}
export function safeLane(c,lane,cars,lanes,player){
 if(lane<0||lane>=lanes.length||Math.abs(lane-c.lane)!==1)return false;
 // Do not cut across a player who is approaching or alongside.
 const reaction=Math.max(100,Math.max(0,player.speed-c.speed)*5+35);
 if(c.s-player.distance<reaction)return false;
 for(const o of cars){if(o===c||!o.active||!reserves(o,lane))continue;
  const gap=o.s-c.s,closing=o.speed-c.speed,future=gap+closing*5;
  if(Math.abs(gap)<32||Math.abs(future)<26||gap*future<=0)return false;
 }
 return true;
}
export function initialiseTraffic(c,lane,s,map,random=Math.random){
 const p=trafficProfile(map),roll=random(),band=roll<.28?'slow':roll<.8?'medium':'fast';
 const speed=({slow:16,medium:23,fast:31}[band]+random()*3)*p.speed;
 Object.assign(c,{active:true,lane,oldLane:lane,x:0,s,speed,targetSpeed:speed,band,dynamic:random()<p.dynamic,passed:false,hit:false,change:0,pendingLane:null,signal:0,wait:6+random()*10,decision:0,desired:speed});
}
export function advanceTraffic(cars,dt,player,lanes,random=Math.random,ordered=[]){
 ordered.length=0;for(const c of cars)if(c.active)ordered.push(c);
 ordered.sort((a,b)=>b.s-a.s);
 for(const c of ordered){
  c.wait-=dt;c.decision-=dt;
  let leader=null;
  for(const o of ordered){if(o===c||o.s<=c.s)continue;if(Math.abs(o.x-c.x)<2.5||reserves(o,c.lane)||(c.change&&reserves(o,c.oldLane))){if(!leader||o.s<leader.s)leader=o}}
  if(c.decision<=0){c.decision=.2;c.desired=c.targetSpeed;
   if(leader){const gap=leader.s-c.s,headway=12+c.speed*1.25;if(gap<headway+30)c.desired=Math.min(c.desired,Math.max(0,leader.speed+(gap-headway)*.45))}
   if(c.dynamic&&c.wait<=0&&!c.change&&c.pendingLane===null){
    c.wait=12+random()*14;
    if((leader&&leader.s-c.s<90&&c.targetSpeed>leader.speed+2)||random()<.22){
     const side=random()<.5?-1:1;
     for(const next of [c.lane+side,c.lane-side])if(safeLane(c,next,cars,lanes,player)){c.pendingLane=next;c.signal=1.25;break}
    }
   }
  }
  if(c.pendingLane!==null){
   if(!safeLane(c,c.pendingLane,cars,lanes,player)){c.pendingLane=null;c.signal=0;c.wait=8}
   else{c.signal-=dt;if(c.signal<=0){c.oldLane=c.lane;c.lane=c.pendingLane;c.pendingLane=null;c.change=.00001}}
  }
  c.speed+=Math.max(-5*dt,Math.min(1.5*dt,c.desired-c.speed));c.speed=Math.max(0,c.speed);
  let nextS=c.s+c.speed*dt;
  if(leader&&nextS>leader.s-9){nextS=Math.max(c.s,leader.s-9);c.speed=Math.min(c.speed,leader.speed)}
  c.s=nextS;
  if(c.change){c.change=Math.min(1,c.change+dt/4);const a=c.change*c.change*(3-2*c.change);c.x=lanes[c.oldLane]+(lanes[c.lane]-lanes[c.oldLane])*a;if(c.change>=1){c.change=0;c.oldLane=c.lane}}
 }
}
