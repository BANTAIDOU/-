// ライフゲーム (200x200) - main script
const ROWS = 200;
const COLS = 200;
const CELL_SIZE = 4; // 200 * 4 = 800 px

const canvas = document.getElementById('lifeCanvas');
const ctx = canvas.getContext('2d');
canvas.width = COLS * CELL_SIZE;
canvas.height = ROWS * CELL_SIZE;

// 二つのバッファ（現在と次）
let grid = new Uint8Array(ROWS * COLS);
let nextGrid = new Uint8Array(ROWS * COLS);

// UI要素
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const stepBtn = document.getElementById('stepBtn');
const clearBtn = document.getElementById('clearBtn');
const randomBtn = document.getElementById('randomBtn');
const applyPatternBtn = document.getElementById('applyPattern');
const patternSelect = document.getElementById('patternSelect');
const speedRange = document.getElementById('speedRange');
const speedVal = document.getElementById('speedVal');

let running = false;
let timerId = null;
let fps = Number(speedRange.value);

speedVal.textContent = fps;
speedRange.addEventListener('input', ()=>{
  fps = Number(speedRange.value);
  speedVal.textContent = fps;
  if(running){ restartLoop(); }
});

function idx(r,c){ return r*COLS + c; }

function clearGrid(){ grid.fill(0); draw(); }

function randomize(){
  for(let i=0;i<grid.length;i++) grid[i] = Math.random() < 0.2 ? 1 : 0;
  draw();
}

function draw(){
  const imageData = ctx.createImageData(canvas.width, canvas.height);
  const data = imageData.data;
  // Fill white background first (optional)
  for(let i=0;i<data.length;i+=4){ data[i]=255; data[i+1]=255; data[i+2]=255; data[i+3]=255; }

  for(let r=0;r<ROWS;r++){
    for(let c=0;c<COLS;c++){
      if(grid[idx(r,c)]){
        const x0 = c*CELL_SIZE;
        const y0 = r*CELL_SIZE;
        for(let y=0;y<CELL_SIZE;y++){
          let base = ((y0+y)*canvas.width + x0) * 4;
          for(let x=0;x<CELL_SIZE;x++){
            data[base] = 0; // R
            data[base+1] = 0; // G
            data[base+2] = 0; // B
            data[base+3] = 255; // A
            base += 4;
          }
        }
      }
    }
  }
  ctx.putImageData(imageData,0,0);
}

function step(){
  // Compute nextGrid
  for(let r=0;r<ROWS;r++){
    for(let c=0;c<COLS;c++){
      let n = 0;
      for(let dr=-1; dr<=1; dr++){
        for(let dc=-1; dc<=1; dc++){
          if(dr===0 && dc===0) continue;
          const rr = r + dr;
          const cc = c + dc;
          if(rr>=0 && rr<ROWS && cc>=0 && cc<COLS){
            n += grid[idx(rr,cc)];
          }
        }
      }
      const alive = grid[idx(r,c)];
      nextGrid[idx(r,c)] = (alive ? (n===2 || n===3) : (n===3)) ? 1 : 0;
    }
  }
  // swap
  const tmp = grid; grid = nextGrid; nextGrid = tmp;
  draw();
}

function startLoop(){
  if(running) return;
  running = true; startBtn.disabled = true; stopBtn.disabled = false;
  timerId = setInterval(step, 1000 / fps);
}

function stopLoop(){
  if(!running) return;
  running = false; startBtn.disabled = false; stopBtn.disabled = true;
  clearInterval(timerId); timerId = null;
}

function restartLoop(){
  if(running){ stopLoop(); startLoop(); }
}

startBtn.addEventListener('click', startLoop);
stopBtn.addEventListener('click', stopLoop);
stepBtn.addEventListener('click', ()=>{ if(!running) step(); });
clearBtn.addEventListener('click', ()=>{ stopLoop(); clearGrid(); });
randomBtn.addEventListener('click', ()=>{ stopLoop(); randomize(); });

applyPatternBtn.addEventListener('click', ()=>{
  applySelectedPattern();
});

patternSelect.addEventListener('change', ()=>{
  // optional: auto-apply on change
});

// Patterns: arrays of [r,c] coordinates
const PATTERNS = {
  glider: [
    [0,1],[1,2],[2,0],[2,1],[2,2]
  ],
  // タンブラー: 代表的な振る舞いをする小さな振動子（近似配置）
  tumbler: [
    [0,2],[0,3],[0,6],[0,7],
    [1,0],[1,1],[1,3],[1,4],[1,5],[1,7],[1,8],[1,9],
    [2,0],[2,1],[2,3],[2,4],[2,5],[2,7],[2,8],[2,9],
    [3,2],[3,3],[3,6],[3,7]
  ],
  // 銀河 (Galaxy): 中央に塊があり腕が伸びるような代表形（近似）
  galaxy: [
    [0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,7],[0,8],
    [1,0],[1,1],[1,2],[1,3],[1,4],[1,5],[1,7],[1,8],
    [2,7],[2,8],
    [3,0],[3,1],[3,7],[3,8],
    [4,0],[4,1],[4,7],[4,8],
    [5,0],[5,1],[5,7],[5,8],
    [6,0],[6,1],
    [7,0],[7,1],[7,3],[7,4],[7,5],[7,6],[7,7],[7,8],
    [8,0],[8,1],[8,3],[8,4],[8,5],[8,6],[8,7],[8,8]

  ],
  // シュシュポッポ列車: 小さなグライダー群が直列に並ぶ“列車”風（近似）
  chuchu:[
    [0,3],
    [1,4],
    [2,0],[2,4],
    [3,1],[3,2],[3,3],[3,4],
    [7,0],
    [8,1],[8,2],
    [9,2],
    [10,2],
    [11,1],
    [14,3],
    [15,4],
    [16,0],[16,4],
    [17,1],[17,2],[17,3],[17,4]
  ],
  // 重量級宇宙船 (HWSS): 軽量宇宙船を大きめに表現した近似形
  hwss: [
    [0,2],[0,3],
    [1,0],[1,5],
    [2,6],
    [3,0],[3,6],
    [4,1],[4,2],[4,3],[4,4],[4,5],[4,6]
  ],
  // スイッチ機関車: 前方に突出する部分と後方の尾で機関車っぽく表現（近似）
  switch: [
    [0,1],[0,3],
    [1,0],
    [2,1],[2,4],
    [3,3],[3,4],[3,5]
  ],
  gosper: [
    [5,1],[5,2],[6,1],[6,2],
    [3,13],[3,14],[4,12],[4,16],[5,11],[5,17],[6,11],[6,15],[6,17],[6,18],[7,11],[7,17],[8,12],[8,16],[9,13],[9,14],
    [1,25],[2,23],[2,25],[3,21],[3,22],[4,21],[4,22],[5,21],[5,22],[6,23],[6,25],[7,25],
    [3,35],[3,36],[4,35],[4,36]
  ],
  hline: (function(){
    const arr = [];
    // 左右それぞれ端から3マス内側から開始/終了する横一直線
    const left = 3;
    const rightExclusive = COLS - 3; // 右端から3マス内側まで（exclusive）
    for(let i = left; i < rightExclusive; i++) arr.push([0, i]);
    return arr;
  })()
};

function applyPattern(coordsName){
  const name = coordsName || patternSelect.value;
  if(!name || name==='none') return;
  stopLoop();
  // Clear
  grid.fill(0);
  const coords = PATTERNS[name];
  if(!coords) return;
  // compute bounding box
  let minR=Infinity,minC=Infinity,maxR=-Infinity,maxC=-Infinity;
  for(const [r,c] of coords){ if(r<minR) minR=r; if(c<minC) minC=c; if(r>maxR) maxR=r; if(c>maxC) maxC=c; }
  const ph = maxR - minR + 1;
  const pw = maxC - minC + 1;
  const baseR = Math.floor((ROWS - ph) / 2) - minR;
  const baseC = Math.floor((COLS - pw) / 2) - minC;
  for(const [r,c] of coords){
    const rr = baseR + r;
    const cc = baseC + c;
    if(rr>=0 && rr<ROWS && cc>=0 && cc<COLS) grid[idx(rr,cc)] = 1;
  }
  draw();
}

function applySelectedPattern(){ applyPattern(); }

// 初期描画
clearGrid();

// 小さなUX向上: クリックでセル反転
canvas.addEventListener('click', (ev)=>{
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((ev.clientX - rect.left) * (canvas.width / rect.width));
  const y = Math.floor((ev.clientY - rect.top) * (canvas.height / rect.height));
  const c = Math.floor(x / CELL_SIZE);
  const r = Math.floor(y / CELL_SIZE);
  if(r>=0 && r<ROWS && c>=0 && c<COLS){
    grid[idx(r,c)] = grid[idx(r,c)] ? 0 : 1;
    draw();
  }
});

// キーボードショートカット
window.addEventListener('keydown', (e)=>{
  if(e.key === ' ') { e.preventDefault(); running? stopLoop(): startLoop(); }
  if(e.key === 'ArrowRight') { if(!running) step(); }
});
