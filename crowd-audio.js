// Quiet, generated crowd wash: layered vowel-like cheers and scattered claps.
export class CrowdAudio{
 constructor(audio){this.audio=audio;this.gain=null}
 update(active,time){const audio=this.audio;if(!audio.started||(!active&&!this.gain))return;const c=audio.ctx;
 if(!this.gain){const seconds=6,b=c.createBuffer(1,c.sampleRate*seconds,c.sampleRate),data=b.getChannelData(0);let smooth=0;
 for(let i=0;i<data.length;i++){const t=i/c.sampleRate;let voices=0;for(let n=0;n<5;n++){const phase=t*Math.PI*2/seconds,env=Math.pow(Math.max(0,Math.sin(phase*(n%2+1)+n)),3);const pitch=(135+n*27)*2*Math.PI*t+Math.sin(phase*2+n)*9;voices+=env*(Math.sin(pitch)+.3*Math.sin(pitch*3))*.055}smooth=smooth*.8+(Math.random()*2-1)*.2;const clap=Math.pow(Math.max(0,Math.sin(t*2*Math.PI*3)),24)*.1;const edge=Math.min(1,t/.1,(seconds-t)/.1);data[i]=(voices+smooth*.32+(Math.random()*2-1)*clap)*edge}
 const src=c.createBufferSource();src.buffer=b;src.loop=true;const filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1800;this.gain=c.createGain();this.gain.gain.value=0;src.connect(filter);filter.connect(this.gain);this.gain.connect(audio.master);src.start();this.source=src;this.filter=filter}
 const volume=active?this.audio.save.data.settings.effects*.075*(.8+.2*Math.sin(time*.4)):0;this.gain.gain.setTargetAtTime(volume,c.currentTime,.35);
 }
}
