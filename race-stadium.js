import * as T from './three.module.js';
// One pooled stadium scenery group, independent of the five Endless maps.
export class RaceStadium{
 constructor(scene,theme='race'){const park=theme==='park';this.group=new T.Group();this.group.visible=false;scene.add(this.group);this.matrix=new T.Object3D();this.items=[];this.people=[];this.time=0;
 const add=(x,y,s,w,h,d,color)=>this.items.push({x,y,s,w,h,d,color});
 for(let i=0;i<80;i++)for(const side of [-1,1]){const s=i*12;
  add(side*8,.08,s,1,.08,12,i%2?'#f2f4f0':park?'#38aaa1':'#df3939');add(side*9.4,.55,s,.6,1.1,12,i%4<2?'#f0f2ec':'#3c5765');
  if(i%4===0){add(side*10,2.2,s,.09,3.3,.09,'#7a959e');add(side*10,3.8,s,.10,.08,48,'#7a959e')}
 }
 for(let i=0;i<(park?2:4);i++)for(const side of (park?[i%2?1:-1]:[-1,1])){const s=90+i*(park?480:240);
  add(side*18,1,s,12,2,45,'#414c60');
  for(let tier=0;tier<3;tier++)add(side*(14+tier*3),2+tier*.65,s,3,1.2,42,'#667887');
  add(side*18,6.6,s,15,.35,48,'#243f4d');
  for(const z of [-20,20]){add(side*24,3.2,s+z,.3,6.4,.3,'#81939e');add(side*12,3.2,s+z,.2,6.4,.2,'#81939e')}
  add(side*11,1.3,s, .1,1.1,42,'#85d74c');
  for(let j=0;j<18;j++){const tier=j%3;this.people.push({x:side*(14+tier*3),y:2.7+tier*.65,s:s-17+Math.floor(j/3)*6.5,color:['#d34e4a','#4c9ed1','#d4ad53','#8ed763','#ecdfcd','#976fb8'][j%6],phase:j*.8+i*2})}
 }
 // A fixed starting grid, plus checkered start paint unique to the speedway.
 if(!park)for(let row=0;row<2;row++)for(let col=0;col<20;col++)this.items.push({x:-7.3+col*.77,y:.025,s:18+row*.77,w:.77,h:.015,d:.77,color:(row+col)%2?'#eff3ed':'#20262b',fixed:true});
 if(!park)for(const x of [-5.84,-2.92,0,2.92,5.84]){this.items.push({x,y:.025,s:4,w:1.8,h:.015,d:.12,color:'#eff3ed',fixed:true});for(const side of [-1,1])this.items.push({x:x+side*.9,y:.025,s:2.6,w:.1,h:.015,d:2.8,color:'#eff3ed',fixed:true})}
 // Pit buildings and advertising pylons outside the safety barriers.
 for(let i=0;i<4;i++){add(33,4,30+i*240,14,8,30,park?'#d2ddd2':'#e4e7df');add(25.8,4.3,30+i*240,.2,2.5,26,'#38616f');add(33,8.25,30+i*240,15,.5,32,'#273c48');add(-13,7,180+i*240,.4,14,.4,'#7c939b');add(-12,13.8,180+i*240,4,.3,1,'#e8f0ed')}
 this.boxGeometry=new T.BoxGeometry(1,1,1);this.headGeometry=new T.SphereGeometry(1,8,5);this.material=new T.MeshStandardMaterial({color:0xffffff,roughness:.8});
 this.props=new T.InstancedMesh(this.boxGeometry,this.material,this.items.length);this.bodies=new T.InstancedMesh(this.boxGeometry,this.material,this.people.length*3);this.heads=new T.InstancedMesh(this.headGeometry,this.material,this.people.length);
 for(const mesh of [this.props,this.bodies,this.heads]){mesh.frustumCulled=false;mesh.castShadow=false;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);this.group.add(mesh)}
 this.items.forEach((p,i)=>this.props.setColorAt(i,new T.Color(p.color)));this.people.forEach((p,i)=>{for(let k=0;k<3;k++)this.bodies.setColorAt(i*3+k,new T.Color(p.color));this.heads.setColorAt(i,new T.Color(['#e1b28c','#ad7654','#7e523b'][i%3]))});
 this.plants=[];if(park){for(let i=0;i<24;i++){const side=i%2?1:-1;const s=180+Math.floor(i/2)*80;this.plants.push({x:side*29,s});}this.foliage=new T.InstancedMesh(this.headGeometry,this.material,this.plants.length);this.foliage.frustumCulled=false;this.foliage.instanceMatrix.setUsage(T.DynamicDrawUsage);this.plants.forEach((p,i)=>this.foliage.setColorAt(i,new T.Color(i%2?'#4e885e':'#72965f')));this.group.add(this.foliage)}
 const mat=new T.MeshStandardMaterial({color:park?'#718a5d':'#376d61',roughness:.95});this.runoff=new T.Mesh(new T.BoxGeometry(1,1,1),mat);this.runoff.position.set(0,-.15,-430);this.runoff.scale.set(58,.1,1100);this.group.add(this.runoff);
 }
 set(mesh,index,x,y,z,w,h,d,rotation=0){const m=this.matrix;m.position.set(x,y,z);m.scale.set(w,h,d);m.rotation.set(0,0,rotation);m.updateMatrix();mesh.setMatrixAt(index,m.matrix)}
 update(distance,dt,active,motion=true){this.group.visible=active;if(!active)return;if(motion)this.time+=dt;const z=s=>-(((s-distance+60)%960+960)%960-60);
 this.items.forEach((p,i)=>this.set(this.props,i,p.x,p.y,p.fixed?distance-p.s:z(p.s),p.w,p.h,p.d));
 if(this.foliage){this.plants.forEach((p,i)=>this.set(this.foliage,i,p.x,3,z(p.s),3,5,3));this.foliage.instanceMatrix.needsUpdate=true}
 this.people.forEach((p,i)=>{const wave=motion?Math.sin(this.time*4+p.phase)*.25:0,depth=z(p.s);this.set(this.bodies,i*3,p.x,p.y+.42,depth,.36,.8,.27);this.set(this.bodies,i*3+1,p.x-.27,p.y+.85,depth,.13,.62,.13,-.45+wave);this.set(this.bodies,i*3+2,p.x+.27,p.y+.85,depth,.13,.62,.13,.45-wave);this.set(this.heads,i,p.x,p.y+1,depth,.20,.23,.20)});
 for(const mesh of [this.props,this.bodies,this.heads])mesh.instanceMatrix.needsUpdate=true;
 }
 dispose(){this.foliage?.dispose();for(const mesh of [this.props,this.bodies,this.heads])mesh.dispose();this.boxGeometry.dispose();this.headGeometry.dispose();this.material.dispose();this.runoff.geometry.dispose();this.runoff.material.dispose();this.group.removeFromParent()}
}
