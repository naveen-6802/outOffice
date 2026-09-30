import {spawnInterval,trafficLimit,reserves,initialiseTraffic,advanceTraffic} from './traffic-ai.js';
import {roadPoint,roadHeading} from './road-path.js';
import {T,makeCar,LANES} from './world.js';
export class TrafficManager{
 constructor(world){this.world=world;this.cars=[];this.ordered=[];this.aiPlayer={distance:0,speed:0};this.blinkClock=0;const indicatorGeo=new T.BoxGeometry(.22,.12,.07),indicatorMat=new T.MeshBasicMaterial({color:'#ffb52e'});const colors=['#d5d4c8','#4a667a','#873b30','#aaa59e','#263b44','#b69b66','#d2cba5'];for(let i=0;i<24;i++){const type=i%7===0?5:i%4===0?2:0,mesh=makeCar(colors[i%colors.length],type,{headlights:false});mesh.scale.setScalar(.78);world.scene.add(mesh);const indicators=[-1,1].map(side=>{const lamp=new T.Mesh(indicatorGeo,indicatorMat);lamp.position.set(side*mesh.userData.width*.4,.65,mesh.userData.length/2+.025);lamp.visible=false;mesh.add(lamp);return lamp});this.cars.push({mesh,active:false,lane:0,s:0,speed:0,passed:false,hit:false,change:0,oldLane:0,type,indicators})}this.pickups=[];const geo=new T.CylinderGeometry(.46,.46,.14,24);geo.rotateX(Math.PI/2);
 const glowSize=32,glowPixels=new Uint8Array(glowSize*glowSize*4);for(let y=0;y<glowSize;y++)for(let x=0;x<glowSize;x++){const d=Math.hypot((x+.5)/glowSize*2-1,(y+.5)/glowSize*2-1),n=(y*glowSize+x)*4;glowPixels[n]=255;glowPixels[n+1]=207;glowPixels[n+2]=91;glowPixels[n+3]=Math.round(Math.max(0,1-d)**2*100)}const glowTexture=new T.DataTexture(glowPixels,glowSize,glowSize,T.RGBAFormat);glowTexture.needsUpdate=true;const glowMaterial=new T.SpriteMaterial({map:glowTexture,transparent:true,depthWrite:false,blending:T.AdditiveBlending});for(let i=0;i<24;i++){let mesh=new T.Mesh(geo,new T.MeshStandardMaterial({color:'#edba4e',metalness:.65,roughness:.3,emissive:'#b57d1a',emissiveIntensity:.75}));const glow=new T.Sprite(glowMaterial);glow.scale.set(1.9,1.9,1);mesh.add(glow);world.scene.add(mesh);this.pickups.push({mesh,s:0,x:0,active:false,type:"coin"})}
 const healthPixels=glowPixels.slice();for(let n=0;n<healthPixels.length;n+=4){healthPixels[n]=110;healthPixels[n+1]=255;healthPixels[n+2]=160}const healthTexture=new T.DataTexture(healthPixels,glowSize,glowSize,T.RGBAFormat);healthTexture.needsUpdate=true;const healthGlow=new T.SpriteMaterial({map:healthTexture,transparent:true,depthWrite:false,blending:T.AdditiveBlending}),healthMat=new T.MeshStandardMaterial({color:'#a0ffbd',emissive:'#34d878',emissiveIntensity:.9,metalness:.2,roughness:.4}),crossGeo=new T.BoxGeometry(1,1,1);
 for(let i=0;i<3;i++){const mesh=new T.Group();for(const [w,h]of [[.9,.26],[.26,.9]]){const bar=new T.Mesh(crossGeo,healthMat);bar.scale.set(w,h,.2);mesh.add(bar)}const glow=new T.Sprite(healthGlow);glow.scale.set(2.2,2.2,1);mesh.add(glow);world.scene.add(mesh);this.pickups.push({mesh,s:0,x:0,active:false,type:'health'})}this.reset()}
 reset(){this.spawnTimer=0;this.pickupTimer=0;this.healthTimer=0;for(let c of this.cars){c.active=false;c.mesh.visible=false}for(let p of this.pickups){p.active=false;p.mesh.visible=false}}
 spawn(distance){const map=this.world.map||'coast';if(this.cars.filter(c=>c.active).length>=trafficLimit(map,distance))return;
 const car=this.cars.find(c=>!c.active);if(!car)return;
 for(let attempt=0;attempt<8;attempt++){const lane=Math.floor(Math.random()*LANES.length),s=distance+260+Math.random()*220;
 if(this.cars.some(c=>c.active&&reserves(c,lane)&&Math.abs(c.s-s)<65))continue;
 // Never spawn a four-wide wall, including vehicles already signalling.
 const occupied=new Set([lane]);for(const c of this.cars)if(c.active&&Math.abs(c.s-s)<24){occupied.add(c.lane);if(c.pendingLane!==null)occupied.add(c.pendingLane)}if(occupied.size>=LANES.length)continue;
 initialiseTraffic(car,lane,s,map);car.x=LANES[lane];const point=roadPoint(s,car.x,distance,map);car.mesh.position.set(point.x,0,point.z);car.mesh.rotation.y=roadHeading(s,distance,map);for(const lamp of car.indicators)lamp.visible=false;car.mesh.visible=true;return;
 }}
 pickupLaneClear(x,start,end){return !this.cars.some(c=>c.active&&Math.abs(c.x-x)<2.5&&c.s>start-25&&c.s<end+25)&&!this.pickups.some(p=>p.active&&Math.abs(p.x-x)<1&&p.s>start-8&&p.s<end+8)}

 update(dt,run,physics,onEvent){
 this.spawnTimer-=dt;if(this.spawnTimer<=0){this.spawn(run.distance);this.spawnTimer=spawnInterval(this.world.map,run.distance)}
 this.pickupTimer-=dt;if(this.pickupTimer<=0){this.pickupTimer=2.5+Math.random();const count=1+Math.floor(Math.random()*3),s=run.distance+Math.max(80,Math.min(150,physics.speed*2)),lane=LANES[Math.floor(Math.random()*LANES.length)];const free=this.pickups.filter(p=>!p.active&&p.type==='coin');if(free.length>=count&&this.pickupLaneClear(lane,s,s+(count-1)*10)){for(let i=0;i<count;i++){Object.assign(free[i],{active:true,s:s+i*10,x:lane});free[i].mesh.visible=true}}}
 this.healthTimer=Math.max(0,this.healthTimer-dt);if(physics.health>0&&physics.health<=70&&this.healthTimer===0&&!this.pickups.some(p=>p.active&&p.type==='health')){const s=run.distance+Math.max(65,Math.min(140,physics.speed*2)),lanes=[...LANES].sort((a,b)=>Math.abs(a-physics.x)-Math.abs(b-physics.x)),lane=lanes.find(x=>this.pickupLaneClear(x,s,s));if(lane!==undefined){const p=this.pickups.find(p=>!p.active&&p.type==='health');if(p){Object.assign(p,{active:true,s,x:lane});p.mesh.visible=true;this.healthTimer=15}}}

 this.aiPlayer.distance=run.distance;this.aiPlayer.speed=physics.speed;advanceTraffic(this.cars,dt,this.aiPlayer,LANES,Math.random,this.ordered);this.blinkClock+=dt;
 for(let c of this.cars){if(!c.active)continue;
 const turning=c.pendingLane!==null?c.pendingLane-c.lane:c.change?c.lane-c.oldLane:0;
 for(let i=0;i<2;i++)c.indicators[i].visible=!!turning&&Math.sign(turning)===(i?1:-1)&&this.blinkClock% .8<.4;
 let rel=c.s-run.distance;const point=roadPoint(c.s,c.x,run.distance,this.world.map);c.mesh.position.set(point.x,0,point.z);c.mesh.rotation.y=roadHeading(c.s,run.distance,this.world.map)+(c.change?-(LANES[c.lane]-LANES[c.oldLane])*.08*Math.sin(c.change*Math.PI):0);
 for(let w of c.mesh.userData.wheels){w.wheel.rotation.x-=c.speed*dt/.39;w.hub.rotation.x=w.wheel.rotation.x}c.mesh.userData.updateWheels();
 let dx=Math.abs(physics.x-c.mesh.position.x),length=(c.mesh.userData.length*c.mesh.scale.z+this.world.player.userData.length*this.world.player.scale.z)/2;
 // Swept longitudinal overlap prevents tunnelling during a fast pass.
 const prevRel=rel-(c.speed-physics.speed)*dt;
 if(Math.min(rel,prevRel)<length&&Math.max(rel,prevRel)>-length&&dx<(c.mesh.userData.width*c.mesh.scale.x+this.world.player.userData.width*this.world.player.scale.x)/2-.16&&!c.hit&&physics.invulnerable<=0){c.hit=true;physics.invulnerable=1.2;let severity=Math.max(8,Math.abs(physics.speed-c.speed)*1.5)*(dx>1.2?.5:1);physics.health=Math.max(0,physics.health-severity);physics.speed*=dx>1.2?.72:.4;physics.x+=physics.x>c.mesh.position.x?.45:-.45;physics.impactSide=physics.x>c.mesh.position.x?1:-1;this.world.player.position.x=physics.x;this.world.crashFX.impact(this.world.player,physics.health<=0,physics.impactSide);onEvent('collision',severity);if(physics.health<=0)return}
 if(rel<-length&&!c.passed){c.passed=true;if(!c.hit&&physics.speed>c.speed+1){let gap=dx-(c.mesh.userData.width*c.mesh.scale.x+this.world.player.userData.width*this.world.player.scale.x)/2;if(gap>0&&gap<.85)onEvent(gap<.35?'extreme':'near');else onEvent('overtake')}}
 if(rel<-65||rel>650){c.active=false;c.mesh.visible=false}
 }
 for(let p of this.pickups){if(!p.active)continue;const rel=p.s-run.distance,point=roadPoint(p.s,p.x,run.distance,this.world.map),x=point.x;p.mesh.position.set(x,.85,point.z);p.mesh.rotation.y+=dt*(p.type==='health'?.65:2.5);if(Math.abs(rel)<3+physics.speed*dt&&Math.abs(physics.x-x)<1.2){p.active=false;p.mesh.visible=false;if(p.type==='health'){if(physics.health>0){const healed=Math.min(25,100-physics.health);physics.health+=healed;onEvent('health',healed)}}else onEvent('coin')}else if(rel<-20){p.active=false;p.mesh.visible=false}}
 }
}
