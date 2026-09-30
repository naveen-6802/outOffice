import {RaceStadium} from './race-stadium.js';
import {EnvironmentLife} from './environment-life.js';
import * as T from './three.module.js';
import {createPremiumScenery} from './premium-maps.js';
import {makeCar} from './vehicle-models.js';
import {texturedMaterial,reflectionEnvironment,pineGeometry,mountainGeometry,setupWater} from './visuals.js';
import {roadCenter,roadPoint,roadHeading,roadMode} from './road-path.js';
import {mergeStaticScenery} from './render-optimization.js';
import {CrashEffects} from './crash-effects.js';
import {mergeGeometries} from './geometry-utils.js';
function batch(group){for(const child of [...group.children])if(child.isGroup)batch(child);const sets=new Map();for(const m of [...group.children])if(m.isMesh&&!m.children.length){m.updateMatrix();const list=sets.get(m.material)||[];list.push(m);sets.set(m.material,list)}for(const [material,meshes] of sets){if(meshes.length<2)continue;const parts=meshes.map(m=>m.geometry.clone().applyMatrix4(m.matrix));const geometry=mergeGeometries(parts);parts.forEach(p=>p.dispose());if(!geometry)continue;meshes.forEach(m=>group.remove(m));const combined=new T.Mesh(geometry,material);combined.castShadow=true;combined.receiveShadow=true;group.add(combined)}}
const mat=(color,metalness=0,roughness=.8)=>new T.MeshStandardMaterial({color,metalness,roughness,vertexColors:true});
const boxGeo=new T.BoxGeometry(1,1,1),roadBoxGeo=new T.BoxGeometry(1,1,1,1,1,6);
for(const geometry of [boxGeo,roadBoxGeo])geometry.setAttribute('color',new T.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count*3).fill(1),3));
export function box(parent,x,y,z,w,h,d,material){const m=new T.Mesh(d>=29&&d<=31&&w<=20?roadBoxGeo:boxGeo,material);m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
export const curve=roadCenter;
export const LANES=[-5.25,-1.75,1.75,5.25];
export {makeCar};
export class World{
 constructor(canvas){
 this.renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.08;
 this.scene=new T.Scene();this.environment=reflectionEnvironment(this.renderer);this.scene.environment=this.environment.texture;this.scene.environmentIntensity=.8;this.scene.fog=new T.FogExp2('#b9a49a',.0028);this.camera=new T.PerspectiveCamera(55,innerWidth/innerHeight,.1,1700);this.hemi=new T.HemisphereLight('#b7d3e0','#4c5142',1.3);this.scene.add(this.hemi);this.sun=new T.DirectionalLight('#ffd4a0',3.2);this.sun.position.set(-75,65,-130);this.sun.castShadow=true;this.sun.shadow.mapSize.set(1024,1024);Object.assign(this.sun.shadow.camera,{left:-32,right:32,top:38,bottom:-38,near:1,far:220});this.sun.shadow.bias=-.0002;this.sun.shadow.normalBias=.035;this.sun.shadow.radius=2;this.scene.add(this.sun,this.sun.target);
 const sky=new T.Mesh(new T.SphereGeometry(1500,32,20),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{night:{value:0},alpine:{value:0},cloudTime:{value:0}},vertexShader:'varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 v;uniform float night;uniform float alpine;uniform float cloudTime;float skyHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float skyNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(skyHash(i),skyHash(i+vec2(1.,0.)),f.x),mix(skyHash(i+vec2(0.,1.)),skyHash(i+vec2(1.)),f.x),f.y);}void main(){vec3 n=normalize(v);float h=max(n.y,0.);vec3 c=mix(vec3(.94,.66,.43),vec3(.29,.47,.61),pow(h,.5));c=mix(c,mix(vec3(.76,.86,.93),vec3(.13,.39,.65),pow(h,.5)),alpine);float s=pow(max(dot(n,normalize(vec3(-.5,.14,-1.))),0.),380.);c+=vec3(1.,.7,.32)*s*1.6;vec2 cloudUV=n.xz/max(.14,n.y)*2.7+vec2(cloudTime*.006,cloudTime*.002);float cloud=skyNoise(cloudUV)*.55+skyNoise(cloudUV*2.1)*.28+skyNoise(cloudUV*4.3)*.17;float veil=smoothstep(.48,.74,cloud)*smoothstep(.015,.2,n.y)*.34;c=mix(c,vec3(.95,.87,.76),veil);gl_FragColor=vec4(mix(c,vec3(.025,.047,.085)+vec3(.02,.025,.04)*h,night),1.);}'}));this.scene.add(sky);this.sky=sky;
 this.groundMat=texturedMaterial(mat('#74735b'),'ground');const ground=box(this.scene,0,-.35,-500,3500,.3,2800,this.groundMat);ground.receiveShadow=true;ground.castShadow=false;
 const water=box(this.scene,-210,-.17,-500,315,.1,2600,mat('#607e85',.65,.22));water.castShadow=false;this.water=water;this.waterClock=setupWater(water.material);this.visualTime=0;
 this.roadMat=texturedMaterial(mat('#565b60',.06,.82),'road');this.edgeMat=mat('#8e8b7c');const line=mat('#e3dbba'),rail=mat('#8b9698',.7,.45),trunk=mat('#535749'),leaf=mat('#405a4a'),rock=texturedMaterial(mat('#7d8079'),'stone');this.chunks=[];const line4=line.clone(),line5=line.clone();const forestLeaves=[mat('#386e37'),mat('#568742'),mat('#72994d')],forestBark=mat('#51432e'),cityStone=texturedMaterial(mat('#71828d',.25,.65),'building'),cityGlass=texturedMaterial(mat('#355667',.5,.3),'building'),cityTrim=mat('#bbc2ba',.3,.5),cityWindows=new T.MeshStandardMaterial({color:'#d7c498',emissive:'#edc278',emissiveIntensity:.4});
 for(let i=0;i<38;i++){let g=new T.Group();g.userData.s=i*30;this.scene.add(g);box(g,0,-.05,0,16,.15,30.2,this.roadMat);box(g,-8.3,0,0,.6,.1,30.2,this.edgeMat);box(g,8.3,0,0,.6,.1,30.2,this.edgeMat);
 for(let x of [-7.3,7.3])box(g,x,.04,0,.12,.02,30.2,line);
 for(const [xs,material] of [[[-3.5,0,3.5],line4],[[-4.38,-1.46,1.46,4.38],line5]])for(let x of xs)for(let z of [-10,0,10])box(g,x,.045,z,.105,.025,4,material);
 for(const side of [-1,1]){box(g,side*8.8,.7,0,.13,.19,30.2,rail);for(const z of [-12,0,12]){box(g,side*8.8,.38,z,.1,.75,.1,rail);box(g,side*7.7,.05,z,.12,.04,.2,line)}
 if(i%2===0){box(g,side*9.5,4.9,0,.12,9.8,.12,rail);box(g,side*8.4,9.6,0,2.2,.08,.13,rail);box(g,side*7.4,9.55,0,.75,.07,.3,new T.MeshStandardMaterial({color:'#ffe4b3',emissive:'#ffdf94',emissiveIntensity:1}))}}
 const scenery=new T.Group();g.add(scenery);for(let j=0;j<3;j++){let tree=new T.Group();tree.position.set(17+(i*17+j*13)%70,0,j*10-10);box(tree,0,2.8,0,.5,5.6,.5,trunk);for(let k=0;k<3;k++){let cone=new T.Mesh(pineGeometry(2.3-k*.5,4.7,i+k),leaf);cone.position.y=4+k*1.8;tree.add(cone)}scenery.add(tree)}
 if(i%4===0){let mountain=new T.Mesh(mountainGeometry(55+(i%3)*20,80+(i%5)*12,i),rock);mountain.position.set(145,0,0);mountain.rotation.y=i;scenery.add(mountain)}

 // Pooled scenery for each selectable map; only the selected group is rendered.
 const forest=new T.Group();g.add(forest);g.userData.forest=forest;
 for(const side of [-1,1])for(let j=0;j<12;j++){
  const x=side*(12+(j%4)*9+(i*7+j*3)%5),z=-13+Math.floor(j/4)*12+(i+j)%4;
  const height=6+(i*3+j*7)%7,radius=2.3+(j%3)*.7;
  box(forest,x,height*.3,z,.5,height*.6,.5,forestBark);
  for(let k=0;k<3;k++){const crown=new T.Mesh(pineGeometry(radius-k*.4,height*.55,i+j+k),forestLeaves[(i+j+k)%3]);crown.position.set(x,height*.46+k*height*.19,z);crown.castShadow=true;forest.add(crown)}
 }
 const city=new T.Group();g.add(city);g.userData.city=city;
 for(const side of [-1,1]){
  box(city,side*12,.08,0,5,.25,30.2,cityTrim);
  for(let j=0;j<2;j++){
   const x=side*(21+j*23),z=(j===0?-4:7),height=12+(i*13+j*19)%55,w=10+(i+j)%5,d=13;
   box(city,x,height/2,z,w,height,d,(i+j)%2?cityGlass:cityStone);
   box(city,x,height+.3,z,w+.6,.6,d+.6,cityTrim);box(city,x,1.2,z+d/2+.16,w+1.2,2.4,.35,cityStone);for(const sideX of [-1,1])box(city,x+sideX*w*.46,height/2,z+d/2+.08,.18,height,.18,cityTrim);if(i%3===0)box(city,x,3.4,z+d/2+1,w*.8,.18,2,cityTrim);
   if((i+j)%3===0)box(city,x,height+2,z,w*.4,4,d*.5,cityStone);
   for(let y=3;y<height-1;y+=3.5)for(let col=-1;col<=1;col++){
    box(city,x+col*w*.25,y,z+d/2+.03,w*.14,1.35,.06,cityWindows);
    box(city,x-side*(w/2+.03),y,z+col*d*.26,.06,1.35,d*.16,cityWindows);
   }
  }
 }
 forest.visible=false;city.visible=false;
 const tunnel=new T.Group();g.add(tunnel);box(tunnel,-9,4.5,0,1.2,9,30.2,rock);box(tunnel,9,4.5,0,1.2,9,30.2,rock);box(tunnel,0,9.3,0,19,1,30.2,rock);for(let z of [-10,0,10])box(tunnel,0,8.7,z,1.8,.06,.3,line);tunnel.visible=false;g.userData.tunnel=tunnel;g.userData.scenery=scenery;
 if(i%10===4){box(g,0,7.8,0,19,.15,.15,rail);box(g,-9,3.9,0,.2,7.8,.2,rail);box(g,9,3.9,0,.2,7.8,.2,rail);const cv=document.createElement('canvas');cv.width=512;cv.height=128;const c=cv.getContext('2d');c.fillStyle='#254b46';c.fillRect(0,0,512,128);c.strokeStyle='#d9e2d3';c.lineWidth=5;c.strokeRect(6,6,500,116);c.fillStyle='#f3f1db';c.textAlign='center';c.font='bold 37px Arial';c.fillText(i%20===4?'OUT OFFICE':'THE OPEN ROAD',256,55);c.font='28px Arial';c.fillText('↑       KEEP DRIVING       ↑',256,99);const sign=new T.Mesh(new T.PlaneGeometry(7.6,1.9),new T.MeshBasicMaterial({map:new T.CanvasTexture(cv)}));sign.position.set(0,7.1,.12);g.add(sign);g.userData.highwaySign=sign;sign.userData.normalMap=sign.material.map;const rc=document.createElement('canvas');rc.width=512;rc.height=128;const rctx=rc.getContext('2d');rctx.fillStyle='#162c38';rctx.fillRect(0,0,512,128);for(let row=0;row<8;row++)for(let col=0;col<4;col++)if((row+col)%2===0){rctx.fillStyle='#eef3eb';rctx.fillRect(col*16,row*16,16,16);rctx.fillRect(448+col*16,row*16,16,16)}rctx.fillStyle='#85ff42';rctx.textAlign='center';rctx.font='bold 28px Arial';rctx.fillText('OUT OFFICE',256,49);rctx.fillStyle='#eef3eb';rctx.font='bold 35px Arial';rctx.fillText('SPEEDWAY',256,95);sign.userData.raceMap=new T.CanvasTexture(rc);const pc=document.createElement('canvas');pc.width=512;pc.height=128;const pctx=pc.getContext('2d');pctx.fillStyle='#204c50';pctx.fillRect(0,0,512,128);pctx.fillStyle='#e7f3df';pctx.textAlign='center';pctx.font='bold 36px Arial';pctx.fillText('MOTOR PARK',256,54);pctx.font='24px Arial';pctx.fillText('ENDLESS DRIVE   ↑',256,96);sign.userData.parkMap=new T.CanvasTexture(pc)}
 batch(g);g.userData.lines4=g.children.find(m=>m.material===line4);g.userData.lines5=g.children.find(m=>m.material===line5);for(const variant of [scenery,forest,city,tunnel]){mergeStaticScenery(variant);variant.removeFromParent()}g.traverse(o=>{if(o!==g){o.updateMatrix();o.matrixAutoUpdate=false}});this.chunks.push(g)}
 this.particles=[];for(let i=0;i<24;i++){let p=new T.Mesh(new T.SphereGeometry(.07,4,3),new T.MeshBasicMaterial({color:'#ffbe50'}));p.visible=false;p.userData.life=0;this.scene.add(p);this.particles.push(p)}
 this.stadium=new RaceStadium(this.scene);this.motorPark=null;this.life=new EnvironmentLife(this.scene);this.crashFX=new CrashEffects(this.scene);this.player=makeCar();this.needsRender=true;this.scene.add(this.player);this.night=0;this.resize();window.addEventListener('resize',()=>this.resize());
 }
 resize(){this.needsRender=true;this.renderer.setSize(innerWidth,innerHeight);this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix()}
 quality(q){this.qualityLevel=q;const n={Low:.85,Medium:1,High:1.5,Ultra:2}[q]||1.5;this.renderer.setPixelRatio(Math.min(devicePixelRatio,n));this.renderer.shadowMap.enabled=q!=='Low';const size=q==='Ultra'?2048:q==='High'?1536:1024;if(this.sun.shadow.mapSize.x!==size){this.sun.shadow.mapSize.set(size,size);this.sun.shadow.map?.dispose();this.sun.shadow.map=null}this.resize()}
 setCar(type,color){this.needsRender=true;this.crashFX.reset();this.scene.remove(this.player);const old=this.player;old.traverse(o=>{if(o.isMesh){if(o.geometry!==boxGeo)o.geometry.dispose();}});const materials=new Set();old.traverse(o=>{if(o.material)materials.add(o.material)});materials.forEach(m=>m.dispose());this.player=makeCar(color,type);this.scene.add(this.player)}
 burst(x,z){for(let p of this.particles){p.position.set(x,.6,z);p.visible=true;p.userData={life:.35+Math.random()*.5,vx:(Math.random()-.5)*8,vy:Math.random()*5,vz:(Math.random()-.5)*8}}}
 update(distance,dt,map='coast',weather='Sunset',motion=true){
 this.map=map;this.visualTime+=dt;this.waterClock.value=this.visualTime;this.sky.material.uniforms.cloudTime.value=motion?this.visualTime:0;this.life.group.visible=map!=='race'&&map!=='park';if(map!=='race'&&map!=='park')this.life.update(distance,this.visualTime,map,this.qualityLevel,motion);this.stadium.update(distance,dt,map==='race',motion);if(map==='park'&&!this.motorPark)this.motorPark=new RaceStadium(this.scene,'park');this.motorPark?.update(distance,dt,map==='park',motion);this.crashFX.update(dt);
 let target=weather==='Night'?1:weather==='Cycle'?(Math.sin(distance/2200-1)+1)*.4:0;if(map==='harbour')target=Math.max(.78,target);this.night+=(target-this.night)*dt*1.4;this.sky.material.uniforms.alpine.value=map==='alpine'?1:0;this.sun.color.set(map==='alpine'?'#e5f3ff':map==='harbour'?'#afc7fa':'#ffd4a0');this.sky.material.uniforms.night.value=this.night;this.sun.intensity=3.2*(1-this.night)+.25;this.hemi.intensity=1.3-this.night*.7;this.scene.environmentIntensity=.8-this.night*.5;this.fogNight??=new T.Color('#152331');this.scene.fog.color.set(map==='alpine'?'#bdcedd':'#b9a49a').lerp(this.fogNight,this.night);this.scene.fog.density=weather==='Fog'?.006:weather==='Rain'?.004:.0028;
 this.roadMat.roughness=map==='harbour'?.3:weather==='Rain'?.24:.82;this.roadMat.color.set(map==='park'?'#48545a':map==='race'?'#404650':map==='harbour'?'#293640':'#565b60');this.groundMat.color.set(map==='park'?'#8d9a70':map==='race'?'#688665':map==='forest'?'#548244':map==='city'?'#677078':map==='alpine'?'#d2e1e9':map==='harbour'?'#1b2e3b':'#74735b');this.water.visible=map==='coast'||map==='harbour';this.water.position.x=map==='harbour'?-130:-210;this.water.scale.x=map==='harbour'?180:315;this.water.material.color.set(map==='harbour'?'#153b52':'#607e85');
 for(let g of this.chunks){if(g.userData.highwaySign){const sign=g.userData.highwaySign;sign.material.map=map==='park'?sign.userData.parkMap:map==='race'?sign.userData.raceMap:sign.userData.normalMap;}g.userData.lines4.visible=roadMode!=='race';g.userData.lines5.visible=roadMode==='race';if((map==='alpine'||map==='harbour')&&!g.userData[map]){const scenery=createPremiumScenery(map,this.chunks.indexOf(g));batch(scenery);mergeStaticScenery(scenery);g.userData[map]=scenery}while(g.userData.s<distance-70)g.userData.s+=38*30;while(g.userData.s>distance+1100)g.userData.s-=38*30;const s=g.userData.s;const point=roadPoint(s,0,distance,map);g.position.set(point.x,0,point.z);g.rotation.y=roadHeading(s,distance,map);g.userData.tunnel.visible=map==='coast'&&(Math.floor(s/30)%120+120)%120>=78&&(Math.floor(s/30)%120+120)%120<87;g.userData.scenery.visible=map==='coast'&&!g.userData.tunnel.visible;g.userData.forest.visible=map==='forest';g.userData.city.visible=map==='city';const selected=map==='coast'?(g.userData.tunnel.visible?g.userData.tunnel:g.userData.scenery):g.userData[map];if(g.userData.activeVariant!==selected){g.userData.activeVariant?.removeFromParent();if(selected){selected.visible=true;g.add(selected)}g.userData.activeVariant=selected}}
 for(const p of this.particles){if(p.userData.life>0){p.userData.life-=dt;p.position.x+=p.userData.vx*dt;p.position.y+=p.userData.vy*dt;p.position.z+=p.userData.vz*dt;p.userData.vy-=10*dt;p.visible=p.userData.life>0}}
 }
 render(){this.renderer.render(this.scene,this.camera)}
}
export {T};
