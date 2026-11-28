// Wartet zwei Animationsframes, bis Layout und Größenaufträge eines Frames abgeschlossen sind.
async function settle(page){await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
module.exports={settle};
