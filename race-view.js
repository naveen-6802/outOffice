import {T,makeCar} from './world.js';
import {roadPoint,roadHeading} from './road-path.js';
import {RACE_DISTANCE,RACE_SCALE} from './race.js';
export class RaceView{
 constructor(world,race){
  this.world=world;this.race=race;this.root=new T.Group();world.scene.add(this.root);
  this.cars=['#dc493a','#4e9edd','#ebe5d5','#9472d8'].map(color=>{const m=makeCar(color,race.car.type,{headlights:false});m.scale.setScalar(RACE_SCALE);this.root.add(m);return m});
  this.dummy=new T.Object3D();const count=race.obstacles.length;
  this.barriers=[{size:[2.1,.85,.6],y:.43,color:'#ea782e'},{size:[2.16,.18,.64],y:.65,color:'#e9eee5'},{size:[2.4,.15,.9],y:.075,color:'#20272a'}].map(b=>{const m=new T.InstancedMesh(new T.BoxGeometry(...b.size),new T.MeshStandardMaterial({color:b.color,roughness:.65}),count);m.castShadow=true;m.receiveShadow=true;m.frustumCulled=false;this.root.add(m);return {mesh:m,y:b.y}});
  this.finish=new T.Group();this.root.add(this.finish);
  const material=new T.MeshStandardMaterial({color:'#ccd3d5',metalness:.6,roughness:.4});for(const x of [-8,8]){const p=new T.Mesh(new T.BoxGeometry(.18,6,.18),material);p.position.set(x,3,0);this.finish.add(p)}
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#111a1d';ctx.fillRect(0,0,1024,128);for(let y=0;y<4;y++)for(let x=0;x<32;x++)if((x+y)%2===0){ctx.fillStyle='#f2f5ed';ctx.fillRect(x*32,y*32,32,32)}ctx.fillStyle='#111a1d';ctx.fillRect(300,0,424,128);ctx.fillStyle='#85ff42';ctx.textAlign='center';ctx.font='bold 72px sans-serif';ctx.fillText('FINISH',512,89);
  const flag=new T.Mesh(new T.PlaneGeometry(16,2),new T.MeshBasicMaterial({map:new T.CanvasTexture(canvas),side:T.DoubleSide}));flag.position.y=5;this.finish.add(flag);
 }
 update(distance,dt){const race=this.race;
  race.rivals.forEach((r,i)=>{const m=this.cars[i],p=roadPoint(r.distance,r.physics.x,distance,race.map);m.position.set(p.x,0,p.z);m.rotation.y=roadHeading(r.distance,distance,race.map)+(r.physics.roadYaw??0);m.visible=Math.abs(r.distance-distance)<650;for(const w of m.userData.wheels){w.wheel.rotation.x-=r.physics.speed*dt/.39;w.hub.rotation.x=w.wheel.rotation.x}m.userData.updateWheels();for(const f of m.userData.flames)f.visible=!!r.physics.boost&&r.finish===null;});
  for(const part of this.barriers){let index=0;for(const o of race.obstacles){if(o.s<distance-35||o.s>distance+620)continue;const p=roadPoint(o.s,o.x,distance,race.map);this.dummy.position.set(p.x,part.y,p.z);this.dummy.rotation.set(0,roadHeading(o.s,distance,race.map),0);this.dummy.updateMatrix();part.mesh.setMatrixAt(index++,this.dummy.matrix)}part.mesh.count=index;part.mesh.instanceMatrix.needsUpdate=true}
  const p=roadPoint(RACE_DISTANCE,0,distance,race.map);this.finish.position.set(p.x,0,p.z);this.finish.rotation.y=roadHeading(RACE_DISTANCE,distance,race.map);this.finish.visible=Math.abs(RACE_DISTANCE-distance)<650;
 }
 dispose(){this.root.removeFromParent();const geometries=new Set(),materials=new Set();this.root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material)});geometries.forEach(g=>g.dispose());materials.forEach(m=>{m.map?.dispose();m.dispose()})}
}
