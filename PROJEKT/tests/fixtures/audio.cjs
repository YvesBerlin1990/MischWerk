// Lokal erzeugte PCM-Testsignale. Keine Musikdateien und kein Bestandteil der UserApp.
function audioFixture() {
  const rate=44100, seconds=12, count=rate*seconds;
  const data=Buffer.alloc(44+count*2);
  data.write('RIFF',0);data.writeUInt32LE(data.length-8,4);data.write('WAVEfmt ',8);
  data.writeUInt32LE(16,16);data.writeUInt16LE(1,20);data.writeUInt16LE(1,22);
  data.writeUInt32LE(rate,24);data.writeUInt32LE(rate*2,28);data.writeUInt16LE(2,32);data.writeUInt16LE(16,34);
  data.write('data',36);data.writeUInt32LE(count*2,40);
  for(let i=0;i<count;i++){
    const t=i/rate;
    // Tiefer/leiser Ton, hoher/lauter Ton, echte Stille, danach wieder tiefer Ton.
    const frequency=t<3?220:t<6?6600:t<9?0:220;
    const amplitude=t<3?.08:t<6?.65:t<9?0:.65;
    const value=frequency?Math.sin(2*Math.PI*frequency*t)*amplitude:0;
    data.writeInt16LE(Math.round(value*32767),44+i*2);
  }
  return data;
}
module.exports={audioFixture};
