export const ACHIEVEMENTS=[
 ['first-km','First Kilometre','Drive 1 km in one run.','longestRun',1000],
 ['five-km','Finding Your Rhythm','Drive 5 km in one run.','longestRun',5000],
 ['ten-km','First 10 km','Drive 10 km in one run.','longestRun',10000],
 ['twentyfive-km','Long Way Home','Drive 25 km in one run.','longestRun',25000],
 ['fifty-km','Marathon Driver','Drive 50 km in one run.','longestRun',50000],
 ['total-ten','Road Regular','Drive 10 km in total.','distance',10000],
 ['total-hundred','100 km Total','Drive 100 km in total.','distance',100000],
 ['total-fivehundred','Highway Veteran','Drive 500 km in total.','distance',500000],
 ['coins-hundred','Pocket Change','Earn 100 coins.','coins',100],
 ['coins-thousand','1,000 Coins Collected','Earn 1,000 coins across all runs.','coins',1000],
 ['coins-tenthousand','Building a Fortune','Earn 10,000 coins across all runs.','coins',10000],
 ['coins-fiftythousand','Road Riches','Earn 50,000 coins across all runs.','coins',50000],
 ['near-first','Close Call','Complete your first near miss.','near',1],
 ['near-twentyfive','Thread the Gap','Complete 25 near misses.','near',25],
 ['near-hundred','Precision Driver','Complete 100 near misses.','near',100],
 ['pass-hundred','Moving Ahead','Overtake 100 vehicles.','overtakes',100],
 ['pass-fivehundred','Passing Master','Overtake 500 vehicles.','overtakes',500],
 ['speed-onefifty','Picking Up Speed','Reach 150 km/h.','topSpeed',150],
 ['speed-twofifty','Full Send','Reach 250 km/h.','topSpeed',250],
 ['health-ten','Back in Shape','Collect 10 health packs.','healthPacks',10],
 ['cars-two','Second Set of Keys','Own 2 cars, including the starter.','cars',2],
 ['cars-all','Own All Cars','Own all 5 cars.','cars',5],
 ['maps-all','Every Horizon','Unlock all 6 maps.','maps',6],
 ['combo-five','In the Zone','Reach a ×5 multiplier.','maxCombo',5]
].map(([id,title,description,metric,target])=>({id,title,description,metric,target}));
export class Progression{
 constructor(save){this.save=save;const old=save.data.statistics||{};this.stats={since:new Date().toISOString(),distance:0,coins:0,longestRun:0,runs:0,crashes:0,collisions:0,healthPacks:0,near:0,overtakes:0,topSpeed:0,maxCombo:1,carDistance:{},mapDistance:{},...old};save.data.statistics=this.stats;save.data.achievements=save.data.achievements||{};this.pending=[];this.elapsed=0;this.checkClock=0;this.check();save.save()}
 metric(name){if(name==='cars')return new Set(this.save.data.unlocked).size;if(name==='maps')return new Set(this.save.data.unlockedMaps).size;return this.stats[name]||0}
 check(){for(const a of ACHIEVEMENTS)if(!this.save.data.achievements[a.id]&&this.metric(a.metric)>=a.target){this.save.data.achievements[a.id]=new Date().toISOString();this.pending.push(a.title)}}
 drive(dt,metres,run,car,map){if(metres>0){if(!run.started){run.started=true;this.stats.runs++}this.stats.distance+=metres;this.stats.carDistance[car]=(this.stats.carDistance[car]||0)+metres;this.stats.mapDistance[map]=(this.stats.mapDistance[map]||0)+metres}this.stats.longestRun=Math.max(this.stats.longestRun,run.distance);this.stats.topSpeed=Math.max(this.stats.topSpeed,run.topSpeed);this.stats.maxCombo=Math.max(this.stats.maxCombo,run.combo);this.elapsed+=dt;this.checkClock+=dt;if(this.checkClock>=1){this.check();this.checkClock=0}if(this.elapsed>=10)this.flush()}
 earn(amount){this.stats.coins+=amount}
 flush(){this.check();this.save.save();this.elapsed=0}
 favourite(metric){const entries=Object.entries(this.stats[metric]);entries.sort((a,b)=>b[1]-a[1]);return entries[0]?.[0]??null}
}
