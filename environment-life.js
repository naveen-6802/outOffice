import * as T from './three.module.js';
// Fixed-size scenery pool. The current map uses at most four instanced draws;
// no added shadow casters, lights, textures, or per-frame object creation.
const THEMES={
 coast:{green:'#77845a',stone:'#8c8b79',board:'#345f59',structure:'#89918b'},
 forest:{green:'#477b43',stone:'#747d68',board:'#6e563a',structure:'#6f6250'},
 city:{green:'#526e55',stone:'#a0a6a4',board:'#315e7a',structure:'#68717a'},
 alpine:{green:'#52756f',stone:'#c9d8df',board:'#326679',structure:'#758995'},
 harbour:{green:'#465c65',stone:'#687b88',board:'#734e8a',structure:'#355567'}
};
export class EnvironmentLife{
 constructor(scene){this.scene=scene;this.group=new T.Group();scene.add(this.group);this.map=null;this.batches=[];this.matrix=new T.Object3D();this.geometries={box:new T.BoxGeometry(1,1,1),rock:new T.SphereGeometry(1,8,4),tree:new T.ConeGeometry(1,1,5)};const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([-1,0,0,0,0,.25,0,0,-.1, 0,0,-.1,0,0,.25,1,0,0],3));g.computeVertexNormals();this.geometries.bird=g;}
 clear(){for(const b of this.batches){this.group.remove(b.mesh);b.mesh.dispose();b.mesh.material.dispose()}this.batches=[]}
 setMap(map){if(map===this.map)return;this.clear();this.map=map;const theme=THEMES[map]||THEMES.coast,sets=new Map();
 const add=(kind,color,x,y,s,w,h,d,sway=false)=>{const key=kind;let set=sets.get(key);if(!set){set={kind,color,items:[]};sets.set(key,set)}set.items.push({x,y,s,w,h,d,sway,color})};
 const box=(color,x,y,s,w,h,d)=>add('box',color,x,y,s,w,h,d);
 for(let i=0;i<12;i++){const s=i*64,side=i%2?1:-1;
  // The carriageway is always clear: every roadside item is beyond the rails.
  box(theme.structure,side*11,1.8,s,.16,3.6,.16);box(theme.board,side*11,3.25,s,2.2,1.05,.15);
  box('#dce5d8',side*11,3.25,s+.09,1.4,.1,.05);box('#dce5d8',side*10.4,3.4,s+.09,.15,.4,.05);
  if(map==='forest'||map==='coast'||map==='alpine'){
   for(let j=0;j<(map==='forest'?6:3);j++){const x=(j%2?1:-1)*(12+j*2+(i*3)%5),z=s+j*7;
    add('rock',j%3?theme.green:theme.stone,x,.45,z,1.2+(j%2),.65,1.1,true);
    if(map==='forest'){add('tree',theme.green,x+Math.sign(x)*6,3,z+3,1.8,6,1.8,true);box(theme.green,x,.3,z+2,.12,.6,1.1)}
   }
  }
  if(map==='city'){
   for(const sign of [-1,1]){box(theme.stone,sign*10,.5,s+15,.7,1,8);box(theme.structure,sign*13,1,s+24,1,2,1);box(theme.green,sign*14,.5,s+30,3,1,2)}
   if(i%4===0){box(theme.structure,-14,5,s,1.2,10,2);box(theme.structure,14,5,s,1.2,10,2);box(theme.stone,0,10,s,36,1,7);box(theme.board,0,8.6,s+4,7,1.5,.2)}
  }
  if(map==='forest'&&i%4===1){for(const sign of [-1,1]){box(theme.structure,sign*9.3,1.2,s, .28,.25,24);for(let k=0;k<4;k++)box(theme.structure,sign*9.3,.65,s-9+k*6,.25,1.3,.25)}}
  if(map==='coast'&&i%4===0){box(theme.structure,28,3,s,8,6,6);box(theme.board,28,6.1,s,10,.25,8)}
  if(map==='alpine'){
   for(const sign of [-1,1]){box('#dc8150',sign*9.6,1,s+20,.12,2,.12);box('#e8eff0',sign*9.6,1.65,s+20,.15,.4,.15)}
   if(i%4===0){box(theme.structure,19,2,s,6,4,5);add('tree','#ecf2f3',19,5,s,5,3,5)}
   if(i===6){box(theme.stone,-10,4.5,s,1,9,16);box(theme.stone,10,4.5,s,1,9,16);box(theme.stone,0,9,s,21,1,16)}
  }
  if(map==='harbour'){
   box(theme.structure,-12,1,s,1,2,1);box('#68cddd',-12,2.1,s,1.1,.12,1.1);
   if(i%3===0){box(theme.structure,-38,5,s,1,10,1);box(theme.structure,-31,10,s,15,.6,.6);box(theme.board,-25,7,s,.2,6,.2)}
   box(theme.stone,11,.5,s,1,1,7);
  }
 }
 if(map==='coast'||map==='forest'||map==='alpine')for(let i=0;i<6;i++)add('bird','#7d8b92',-40+i*13,24+i%3*5,100+i*70,1.3,.5,1.3,true);
 for(const set of sets.values()){const material=new T.MeshStandardMaterial({color:0xffffff,roughness:.9,side:set.kind==='bird'?T.DoubleSide:T.FrontSide});const mesh=new T.InstancedMesh(this.geometries[set.kind],material,set.items.length);set.items.forEach((p,i)=>mesh.setColorAt(i,new T.Color(p.color)));mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=false;this.group.add(mesh);this.batches.push({mesh,items:set.items,kind:set.kind})}
 }
 update(distance,time,map,quality='High',motion=true){this.setMap(map);const m=this.matrix,span=768,range=quality==='Low'?280:quality==='Medium'?400:600;
 for(const b of this.batches){for(let i=0;i<b.items.length;i++){const p=b.items[i],relative=((p.s-distance+48)%span+span)%span-48;
 const sway=motion&&p.sway?Math.sin(time*(b.kind==='bird'?2:1.1)+p.s)*.035:0;
 m.position.set(p.x+(b.kind==='bird'&&motion?Math.sin(time*.2+i)*5:0),p.y, -relative);m.rotation.set(0,0,sway);m.scale.set(p.w,p.h,p.d);if(relative>range)m.scale.setScalar(0);m.updateMatrix();b.mesh.setMatrixAt(i,m.matrix)}b.mesh.instanceMatrix.needsUpdate=true}
 }
 dispose(){this.clear();for(const g of Object.values(this.geometries))g.dispose();this.group.removeFromParent()}
}
