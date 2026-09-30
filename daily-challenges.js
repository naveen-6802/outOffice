// Local calendar days; the existing save record remains the single source of truth.
export const localDay=(date=new Date())=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const hash=s=>{let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0};
export function makeChallenges(date,data){
 const seed=hash(date),maps=(data.unlockedMaps||['coast','forest','city']),cars=(data.unlocked||[0]);
 const map=maps[seed%maps.length],car=cars[seed%cars.length];
 const groups=[[
  {id:'distance',title:'The Long Drive',description:'Drive 10 km across any runs.',metric:'distance',target:10000,reward:300,unit:'km'},
  {id:'map',title:'Local Explorer',description:'Drive 5 km on today’s chosen map.',metric:'distance',map,target:5000,reward:200,unit:'km'},
  {id:'car',title:'Take the Keys',description:'Drive 5 km with today’s chosen vehicle.',metric:'distance',car,target:5000,reward:200,unit:'km'}
 ],[
  {id:'near',title:'Close Calls',description:'Perform 10 near misses in Endless.',metric:'near',target:10,reward:300},
  {id:'nitro',title:'Boost Break',description:'Activate nitro 5 times while driving.',metric:'nitro',target:5,reward:150},
  {id:'clean',title:'Clean Getaway',description:'Drive 5 km in one run without a collision.',metric:'clean',target:5000,reward:350,unit:'km'},
  {id:'speed',title:'Up to Speed',description:'Reach 180 km/h in either mode.',metric:'speed',target:180,reward:100,unit:'km/h'}
 ],[
  {id:'coins',title:'Pocket Money',description:'Earn 100 coins from driving. Claim rewards do not count.',metric:'coins',target:100,reward:200},
  {id:'health',title:'Back on the Road',description:'Collect 3 health packs in Endless.',metric:'health',target:3,reward:250},
  {id:'race',title:'Finish Line',description:'Complete a 10 km race.',metric:'race',target:1,reward:350},
  {id:'podium',title:'Podium Finish',description:'Finish a race in the top three.',metric:'podium',target:1,reward:500}
 ]];
 return groups.map((g,i)=>({...g[hash(date+':'+i)%g.length],progress:0,completed:false,claimed:false,milestone:0}));
}
export class DailyChallenges{
 constructor(save,now=()=>new Date()){this.save=save;this.now=now;this.pending=[];this.clean=0;this.boosting=false;this.nitroCooldown=0;this.saveClock=0;this.dateClock=0;this.dirty=false;this.ensureDay()}
 ensureDay(){const day=localDay(this.now()),old=this.save.data.dailyChallenges;
  // A clock moved backwards must not reopen a previously claimed calendar day.
  if(old?.date&&old.date>=day&&Array.isArray(old.challenges)&&old.challenges.length===3)return false;
  this.save.data.dailyChallenges={date:day,challenges:makeChallenges(day,this.save.data)};this.pending.length=0;this.clean=0;this.dirty=true;this.flush();return true;
 }
 get data(){return this.save.data.dailyChallenges}
 record(metric,amount=1,context={},checkDate=true){if(!Number.isFinite(amount)||amount<=0)return;if(checkDate)this.ensureDay();
  for(const c of this.data.challenges){if(c.metric!==metric||c.completed||c.claimed||c.map!==undefined&&c.map!==context.map||c.car!==undefined&&c.car!==context.car)continue;
   c.progress=Math.min(c.target,['clean','speed'].includes(metric)?Math.max(c.progress,amount):c.progress+amount);this.dirty=true;
   if(c.progress>=c.target){c.completed=true;c.milestone=2;this.pending=this.pending.filter(n=>n.id!==c.id);this.pending.push({id:c.id,title:c.title,complete:true,reward:c.reward});this.flush()}
   else if(c.progress>=c.target/2&&!c.milestone){c.milestone=1;this.pending.push({id:c.id,title:c.title,complete:false});}
  }
 }
 drive(dt,metres,speed,boost,context){this.dateClock+=dt;this.saveClock+=dt;this.nitroCooldown=Math.max(0,this.nitroCooldown-dt);if(this.dateClock>=1){this.ensureDay();this.dateClock=0}
  // Drive events share the current date; no synthetic input counts as an activation.
  this.record('distance',metres,context,false);this.clean+=Math.max(0,metres);this.record('clean',this.clean,{},false);this.record('speed',speed,{},false);
  if(boost&&!this.boosting&&this.nitroCooldown===0){this.record('nitro');this.nitroCooldown=1}this.boosting=boost;
  if(this.saveClock>=2){this.flush();this.saveClock=0}
 }
 collision(){this.clean=0}
 newRun(){this.ensureDay();this.clean=0;this.boosting=false;this.nitroCooldown=0}
 raceFinished(position){this.record('race');if(position<=3)this.record('podium')}
 claim(id,date){this.ensureDay();if(date!==this.data.date)return 0;const c=this.data.challenges.find(c=>c.id===id);if(!c||!c.completed||c.claimed)return 0;c.claimed=true;this.save.data.coins+=c.reward;this.dirty=true;this.flush();return c.reward}
 flush(){if(this.dirty){this.save.save();this.dirty=false}}
}
