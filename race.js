import {VehiclePhysics,steeringRate} from './systems.js';
import {roadSlope} from './road-path.js';
export const RACE_DISTANCE=10000,RACE_PRIZE=2500;
export const RACE_SCALE=.78;
export const RACE_LANES=[-5.84,-2.92,0,2.92,5.84];
const lanes=RACE_LANES;
export class Race{
 constructor(car,map,settings){
  this.car=car;this.map=map;this.settings={...settings,auto:false,sensitivity:1,tapAssist:false,map};this.time=0;this.playerFinish=null;this.done=false;this.rewardClaimed=false;
  this.rivals=[-5.84,-2.92,2.92,5.84].map((x,i)=>{const physics=new VehiclePhysics();physics.x=x;return {id:i+1,physics,distance:0,target:x,finish:null,hits:new Set()}});
  this.obstacles=[];for(let s=280,i=0;s<RACE_DISTANCE-150;s+=115+(i++%4)*13){const lane=(i*3+Math.floor(i/3))%5;this.obstacles.push({s,x:lanes[lane]});if(i%4===2)this.obstacles.push({s:s+12,x:lanes[(lane+1)%5]})}
  this.playerHits=new Set();this.bumpTimer=0;
 }
 hitObstacles(p,previous,distance,hits,onHit=()=>{}){
  for(let i=0;i<this.obstacles.length;i++){const o=this.obstacles[i];if(hits.has(i)||previous>o.s+3||distance<o.s-3||Math.abs(p.x-o.x)>1.55)continue;hits.add(i);p.speed*=.7;p.health=Math.max(0,p.health-8);onHit(8);if(!p.health)break}
 }
 update(dt,previous,distance,player,onHit){
  if(this.done)return;
  if(!player.boost)player.nitro=Math.min(100,player.nitro+dt*3);
  this.hitObstacles(player,previous,distance,this.playerHits,onHit);
  for(const r of this.rivals){if(r.finish!==null||r.physics.health<=0)continue;const p=r.physics;if(!p.boost)p.nitro=Math.min(100,p.nitro+dt*3);
   const ahead=this.obstacles.filter(o=>o.s>r.distance-3&&o.s<r.distance+Math.max(100,p.speed*2.8));
   const options=lanes.map(x=>({x,cost:Math.abs(x-p.x)*.4+(x===r.target?0:.5)+ahead.reduce((n,o)=>n+(Math.abs(o.x-x)<1.7?100:0),0)+this.rivals.reduce((n,o)=>n+(o!==r&&Math.abs(o.distance-r.distance)<9&&Math.abs(o.physics.x-x)<1.9?1:0),0)+(Math.abs(distance-r.distance)<10&&Math.abs(player.x-x)<1.9?1:0)}));
   options.sort((a,b)=>a.cost-b.cost);r.target=options[0].x;
   const desired=-Math.atan(roadSlope(r.distance+p.speed*.5,this.map))-Math.atan2(r.target-p.x,Math.max(25,p.speed*.85));
   const steer=Math.max(-1,Math.min(1,(p.yaw-desired)*3/Math.max(.08,steeringRate(p.speed))/this.car.handling));
   const nitro=p.speed>30&&!ahead.some(o=>Math.abs(o.x-r.target)<1.7)&&Math.abs(r.target-p.x)<.7&&Math.abs(roadSlope(r.distance,this.map))<.02&&this.time>12+r.id*2;
   const danger=ahead.some(o=>Math.abs(o.x-p.x)<1.8&&o.s-r.distance<Math.max(35,p.speed*1.4));
   const old=r.distance;r.distance+=p.update(dt,{throttle:danger?.25:1,brake:danger?.45:0,steer,nitro:nitro&&!danger,handbrake:false},this.car,this.settings,r.distance);
   this.hitObstacles(p,old,r.distance,r.hits);
   if(r.distance>=RACE_DISTANCE)r.finish=this.time+dt*(RACE_DISTANCE-old)/(r.distance-old);
  }
  this.bumpTimer=Math.max(0,this.bumpTimer-dt);
  if(!this.bumpTimer)for(const r of this.rivals){if(r.finish!==null||r.physics.health<=0)continue;if(Math.abs(r.distance-distance)<3.3&&Math.abs(r.physics.x-player.x)<1.5){const side=player.x>=r.physics.x?1:-1;player.x+=side*.25;r.physics.x-=side*.25;player.speed*=.94;r.physics.speed*=.94;this.bumpTimer=.6;break}}
  if(distance>=RACE_DISTANCE&&player.health>0)this.playerFinish=this.time+dt*(RACE_DISTANCE-previous)/Math.max(.0001,distance-previous);
  this.time+=dt;
  if(this.playerFinish!==null||player.health<=0)this.done=true;
 }
 position(distance){return 1+this.rivals.filter(r=>r.finish!==null?(this.playerFinish===null||r.finish<=this.playerFinish):(r.physics.health>0&&r.distance>distance)).length}
 claimPrize(){if(this.rewardClaimed||this.playerFinish===null||this.position(RACE_DISTANCE)!==1)return 0;this.rewardClaimed=true;return RACE_PRIZE}
}
