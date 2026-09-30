import {migratePaints} from './coin-shop.js';
import {roadSlope} from './road-path.js';
export const CARS=[{name:'Swift GT',desc:'Mid-engine supercar · sculpted fenders & compact cockpit.',price:0,speed:210,accel:10.5,handling:1,brake:24,nitro:1,type:0},{name:'Nova',desc:'Track supercar · split LEDs & raised rear aero.',price:2000,speed:255,accel:12,handling:1.12,brake:27,nitro:1.05,type:1},{name:'Falcon',desc:'Aero supercar · floating buttresses & low canopy.',price:4000,speed:235,accel:10,handling:.85,brake:25,nitro:1.25,type:2},{name:'Velar V8',desc:'V8 grand tourer · long sculpted hood & swept roof.',price:6000,speed:295,accel:14,handling:1.15,brake:29,nitro:1.15,type:3},{name:'Phantom V12',desc:'V12 flagship · wide haunches & carbon rear wing.',price:10000,speed:330,accel:16,handling:1.2,brake:32,nitro:1.4,type:4}];
export const DEFAULT_KEYS={throttle:'KeyW',brake:'KeyS',left:'KeyA',right:'KeyD',handbrake:'KeyF',nitro:'ShiftLeft',camera:'KeyC',horn:'KeyH',lights:'KeyL'};
export class SaveManager{constructor(){let d={};try{d=JSON.parse(localStorage.getItem('endless-highway-v1')||'{}')}catch{}this.data={best:0,coins:0,unlocked:[0],car:0,paint:'#edb03a',wheel:'Alloy',tint:.5,settings:{quality:innerWidth<700?'Medium':'High',map:'coast',weather:'Sunset',master:.65,music:.22,engine:.45,effects:.55,sensitivity:1,motion:true,unit:'km/h',auto:false},keys:{...DEFAULT_KEYS},...d};this.data.settings={quality:'High',map:'coast',weather:'Sunset',master:.65,music:.22,engine:.45,effects:.55,sensitivity:1,motion:true,unit:'km/h',auto:false,...d.settings};this.data.keys={...DEFAULT_KEYS,...d.keys};delete this.data.keys.reset;for(const name of Object.keys(this.data.keys))if(['Space','Escape'].includes(this.data.keys[name]))this.data.keys[name]=DEFAULT_KEYS[name];this.data.unlockedMaps=[...new Set(['coast','forest','city','park',...(Array.isArray(d.unlockedMaps)?d.unlockedMaps.filter(id=>Object.hasOwn(MAPS,id)):[])])];if(!Object.hasOwn(MAPS,this.data.settings.map))this.data.settings.map='coast';if(!CARS[this.data.car])this.data.car=0;migratePaints(this.data);}save(){try{localStorage.setItem('endless-highway-v1',JSON.stringify(this.data));return true}catch{return false}}}
export class InputManager{constructor(keys,onAction,canPause=()=>true){this.keys=keys;this.down=new Set();this.touch={};this.pointerHolds=new Map();this.onAction=onAction;this.binding=null;addEventListener('keydown',e=>{if(e.code==='Escape')return;if(e.code==='Space'&&(this.binding||canPause())){e.preventDefault();e.stopPropagation();if(!this.binding&&!e.repeat)onAction('pause');return}if(this.binding){if(!['Escape','Tab'].includes(e.code)){e.preventDefault();const b=this.binding;this.binding=null;b(e.code)}return}if(e.target.matches('input,select,button')&&e.code!=='Escape')return;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(!this.down.has(e.code)){for(let [a,k]of Object.entries(this.keys))if(k===e.code&&!['throttle','brake','left','right','handbrake','nitro'].includes(a))onAction(a)}this.down.add(e.code)});addEventListener('keyup',e=>this.down.delete(e.code));addEventListener('blur',()=>{this.clear();onAction('blur')});document.addEventListener('visibilitychange',()=>{if(document.hidden){this.clear();onAction('blur')}});for(const b of document.querySelectorAll('[data-control]')){const a=b.dataset.control,held=new Set();this.pointerHolds.set(b,held);b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);held.add(e.pointerId);this.touch[a]=true;b.classList.add('pressed')});for(const n of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(n,e=>{held.delete(e.pointerId);this.touch[a]=held.size>0;b.classList.toggle('pressed',held.size>0)})}this.padWas=[]}
 clear(){this.down.clear();this.touch={};for(const [button,held]of this.pointerHolds){held.clear();button.classList.remove('pressed')}}
 read(){const hit=(a,arrow)=>!!(this.touch[a]||this.down.has(this.keys[a])||(arrow&&this.down.has(arrow)));let v={throttle:+hit('throttle','ArrowUp'),brake:+hit('brake','ArrowDown'),steer:+hit('right','ArrowRight')-hit('left','ArrowLeft'),nitro:hit('nitro'),handbrake:hit('handbrake')};let p=navigator.getGamepads?.()[0];if(p){v.steer=Math.abs(p.axes[0])>.1?p.axes[0]:v.steer;v.throttle=Math.max(v.throttle,p.buttons[7]?.value||0);v.brake=Math.max(v.brake,p.buttons[6]?.value||0);v.nitro ||=p.buttons[0]?.pressed;for(let [i,a]of [[9,'pause'],[3,'camera'],[1,'handbrake']]){if(p.buttons[i]?.pressed&&!this.padWas[i])this.onAction(a);this.padWas[i]=p.buttons[i]?.pressed}}return v}}
export const steeringRate=speed=>.42*Math.abs(speed)/(Math.abs(speed)+10)/(1+Math.abs(speed)/50);
export class VehiclePhysics{constructor(){this.reset()}reset(){this.x=1.75;this.speed=0;this.yaw=0;this.roadYaw=0;this.steer=0;this.steerDirection=0;this.steerDuration=0;this.settleHeading=null;this.nitro=100;this.boost=false;this.nitroNeedsRelease=false;this.health=100;this.invulnerable=0;this.acceleration=0}update(dt,input,car,settings,distance=0){this.invulnerable=Math.max(0,this.invulnerable-dt);const old=this.speed;const throttle=Math.max(input.throttle,settings.auto&&!input.brake?1:0);if(!input.nitro)this.nitroNeedsRelease=false;const wasBoosting=this.boost;if(input.nitro&&!wasBoosting&&this.nitro<5)this.nitroNeedsRelease=true;const boost=!!(input.nitro&&!this.nitroNeedsRelease&&this.nitro>0&&this.speed>8);this.boost=boost;const max=car.speed/3.6+(boost?19:0);let force=throttle*car.accel*(1-Math.min(1,Math.max(0,this.speed)/max)**1.7);if(boost){force+=8;this.nitro=Math.max(0,this.nitro-dt*10/car.nitro);if(this.nitro===0){this.boost=false;this.nitroNeedsRelease=true}}if(input.brake){if(this.speed>1)force-=car.brake*input.brake;else if(!throttle)force-=4*input.brake}if(input.handbrake&&this.speed>0)force-=car.brake*.7;force-=this.speed*.012+Math.sign(this.speed)*.28;if(this.speed>max)force-=5;this.speed=Math.max(-3.5,Math.min(car.speed/3.6+21,this.speed+force*dt));if(!throttle&&!input.brake&&Math.abs(this.speed)<.03)this.speed=0;this.acceleration=(this.speed-old)/dt;
 // Player steering is a bounded deflection, not an accumulating rotation.
 // Every release settles to the tangent captured at that instant, then keeps that world heading.
 const sensitivity=settings.sensitivity*car.handling*(settings.weather==='Rain'?.88:1);
 const direction=Math.abs(input.steer)>.08?Math.sign(input.steer):0;
 const steeringInput=direction?input.steer:0;
 this.steerDuration=direction?(direction===this.steerDirection?this.steerDuration+dt:dt):0;
 this.steer+=(steeringInput*sensitivity-this.steer)*(1-Math.exp(-dt*(direction?(settings.tapAssist===false?8:14):24)));
 if(settings.tapAssist===false){
  this.yaw-=this.steer*steeringRate(this.speed)*dt*Math.sign(this.speed)*(input.handbrake?1.25:1);
 }else if(direction){
  this.settleHeading=null;
  // Control lateral speed directly so high-speed cars do not feel heavy to steer.
  const hold=Math.max(0,Math.min(1,(this.steerDuration-.12)/.25));
  const lateral=(2+5.2*hold*hold*(3-2*hold))*Math.max(-1.3,Math.min(1.3,this.steer))*Math.min(1,Math.abs(this.speed)/20);
  const deflection=Math.atan2(lateral,Math.max(1,Math.abs(this.speed)));
  const target=-Math.atan(roadSlope(distance,settings.map))-deflection;
  this.yaw+=(target-this.yaw)*(1-Math.exp(-dt*18));
 }else{
  if(this.steerDirection)this.settleHeading=-Math.atan(roadSlope(distance,settings.map));
  if(this.settleHeading!==null){this.yaw+=(this.settleHeading-this.yaw)*(1-Math.exp(-dt*32));if(Math.abs(this.yaw-this.settleHeading)<.00001){this.yaw=this.settleHeading;this.settleHeading=null}}
 }
 this.steerDirection=direction;
 const slope=roadSlope(distance,settings.map),angle=Math.atan(slope),relative=this.yaw+angle;
 const curvature=(Math.atan(roadSlope(distance+.5,settings.map))-Math.atan(roadSlope(distance-.5,settings.map)))/Math.hypot(1,slope);
 const travelled=Math.max(0,this.speed*Math.cos(relative)*dt/Math.hypot(1,slope)/Math.max(.8,1-curvature*this.x));
 this.x-=Math.sin(relative)*this.speed*dt;
 this.roadYaw=this.yaw+Math.atan(roadSlope(distance+travelled,settings.map));
 if(Math.abs(this.x)>7.15){this.x=Math.max(-7.8,Math.min(7.8,this.x));this.speed*=Math.max(0,1-dt*.8)}
 return travelled} }
export {AudioManager} from './engine-audio.js';

export const MAPS={park:'Motor Park',coast:'Pacific Coast',forest:'Greenwood Forest',city:'Metro City',alpine:'Alpine Pass',harbour:'Neon Harbour'};
export const MAP_PRICES={park:0,coast:0,forest:0,city:0,alpine:15000,harbour:30000};
export function ownsMap(data,id){return Object.hasOwn(MAP_PRICES,id)&&(MAP_PRICES[id]===0||data.unlockedMaps?.includes(id))}
export function purchaseMap(data,id){if(!Object.hasOwn(MAP_PRICES,id))return {ok:false,reason:'invalid'};if(ownsMap(data,id))return {ok:true,charged:0};const price=MAP_PRICES[id];if(!Number.isFinite(data.coins)||data.coins<price)return {ok:false,reason:'coins'};data.coins-=price;data.unlockedMaps=[...(data.unlockedMaps||[]),id];return {ok:true,charged:price}}
export function awardDistanceCoins(run){
 const reached=Math.floor(Math.max(0,run.distance)/2000);
 const unpaid=Math.max(0,reached-(run.milestonesPaid||0));
 if(!unpaid)return 0;
 const award=unpaid*50;run.coins+=award;run.milestonesPaid=reached;return award;
}

const integerFormatter=new Intl.NumberFormat('en-US',{maximumFractionDigits:0});
const distanceFormatter=new Intl.NumberFormat('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
export const formatNumber=value=>integerFormatter.format(Math.floor(value));
export const formatDistance=value=>distanceFormatter.format(value);
