export function tiltAxis(beta,gamma,angle=0){const a=((angle%360)+360)%360;return a===90?beta:a===270?-beta:a===180?-gamma:gamma}
export function tiltSteer(degrees){const magnitude=Math.max(0,Math.abs(degrees)-2);return magnitude===0?0:Math.sign(degrees)*Math.min(1,magnitude/22)}
export class TiltControls{
 constructor(){this.neutral=null;this.axis=0;this.value=0;this.last=0;this.angle=null;this.ready=false;this.status='Hold your phone comfortably. Tilt gently to steer; acceleration is automatic.';this.listening=false}
 calibrate(){this.neutral=null;this.value=0}
 async enable(){
  if(typeof DeviceOrientationEvent==='undefined'){this.status='Motion sensors unavailable. Normal buttons are enabled.';return false}
  try{if(typeof DeviceOrientationEvent.requestPermission==='function'&&await DeviceOrientationEvent.requestPermission()!=='granted'){this.status='Motion permission declined. Normal buttons are enabled.';return false}}catch{this.status='Motion access unavailable. Normal buttons are enabled.';return false}
  if(!this.listening){window.addEventListener('deviceorientation',e=>{if(!Number.isFinite(e.beta)||!Number.isFinite(e.gamma))return;const angle=screen.orientation?.angle??window.orientation??0;if(angle!==this.angle){this.angle=angle;this.calibrate()}this.axis=tiltAxis(e.beta,e.gamma,angle);if(this.neutral===null)this.neutral=this.axis;this.last=performance.now();this.ready=true},{passive:true});this.listening=true}
  this.calibrate();const start=performance.now();while(performance.now()-start<1600){if(this.ready&&performance.now()-this.last<500){this.status='Tilt steering enabled. Hold Brake to slow down; release it to accelerate.';return true}await new Promise(r=>setTimeout(r,80))}
  this.status='No motion data received. Normal buttons are enabled.';return false;
 }
 read(dt){if(this.neutral===null)this.neutral=this.axis;let delta=this.axis-this.neutral;if(delta>180)delta-=360;if(delta< -180)delta+=360;const target=tiltSteer(delta);this.value+=(target-this.value)*(1-Math.exp(-dt*10));return this.value}
}
