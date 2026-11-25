import * as pdfjs from './vendor/pdf.min.mjs';
pdfjs.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdf.worker.min.mjs', import.meta.url).href;

const app = document.querySelector('#app');
const state = { screen: 'home', uploaded: false, page: 1, retryIndex: 0, tool: '펜', pdf: null, inkKey: null, inkByPage: {}, undoByPage: {} };
const wrongQuestionNumbers = [5,15,20,22,25,28];
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function header(right = '') {
  return `<header class="app-header"><button class="wordmark" data-action="home">NoteGuard</button>${right ? `<button class="header-link" data-action="${right.action}">${right.label}</button>` : ''}</header>`;
}
function nav(active = '책장') {
  return `<nav class="bottom-nav"><button class="${active === '책장' ? 'active' : ''}" data-action="home">내 책장</button><button class="${active === '오답노트' ? 'active' : ''}" data-action="wrongbook">오답노트</button><button data-action="mypage">마이페이지</button></nav>`;
}
function shell(body, active = '책장', right = '') {
  return `<section class="tablet">${header(right)}<main class="content">${body}</main>${nav(active)}</section>`;
}
function btn(label, action, cls = '') {
  return `<button class="btn ${cls}" data-action="${action}">${label}</button>`;
}
const exams = [
  ['2025년 6월 평가원 모의고사', '30문항 · 풀이 중', '이어 풀기', 'resume'],
  ['2024년 10월 교육청 모의고사', '30문항 · 풀이 완료', '결과 보기', 'result'],
  ['2024년 6월 평가원 모의고사', '30문항 · 풀이 완료', '결과 보기', 'result'],
  ['2025년 9월 평가원 모의고사', '30문항 · 풀이 완료', '결과 보기', 'result'],
];
function examCard([name, meta, label, action]) {
  return `<article class="exam-card"><h2>${name}</h2><p>${meta}</p><div class="exam-actions">${action === 'resume' ? btn(label, action, 'outline full') : `${btn(label, action, 'outline')}${btn('다시 풀기', 'resume', 'outline')}`}</div></article>`;
}
function home() {
  const cards = state.uploaded
    ? `<article class="exam-card"><h2>2026년 9월 평가원 모의고사</h2><p>30문항 · 풀이 중</p>${btn('풀이 시작', 'start', 'outline full')}</article>${exams.map(examCard).join('')}`
    : exams.map(examCard).join('');
  return shell(`<h1>내 책장</h1><div class="upload-banner">${btn('+ 모의고사 PDF 업로드', 'upload', 'primary full')}</div><h2 class="section-title">최근 모의고사</h2>${cards}`);
}
function upload(ready = false) {
  return shell(`<h1>모의고사를 불러오세요.</h1><p class="subtitle">풀이할 수학 모의고사 PDF를 선택해주세요.</p>
    <section class="upload-box ${ready ? 'ready' : ''}">${ready
      ? `<h2 class="ready-title">✓ 파일 준비 완료</h2><strong class="filename">math.pdf</strong><p class="muted">30문항</p>${btn('파일 다시 선택', 'file-empty', 'outline full')}`
      : `<h2 class="pdf-label">PDF</h2><strong>이곳에 PDF를 추가하세요</strong><p class="muted">모의고사 파일을 선택하면 미리보기를 확인할 수 있어요.</p>${btn('파일 선택', 'file-ready', 'outline full')}`}</section>
    <section class="name-box"><strong>시험 이름을 입력해주세요.</strong><p class="muted">예) 2024년 6월 평가원 모의고사</p><input aria-label="시험 이름" value="${ready ? '2026년 9월 평가원 모의고사' : ''}" placeholder="시험 이름" ${ready ? '' : 'readonly'}></section>
    ${btn('업로드', ready ? 'upload-done' : 'file-ready', 'primary full')}`, '책장', {action:'home', label:'← 내 모의고사'});
}
function wrongbook() {
  const names = [...(state.uploaded ? ['2026년 9월 평가원 모의고사'] : []),'2024년 10월 교육청 모의고사','2024년 6월 평가원 모의고사','2025년 9월 평가원 모의고사'];
  return shell(`<h1>오답노트</h1><h2 class="section-title">최근 모의고사</h2>${names.map((n,i)=>`<article class="exam-card notebook-card"><h2>${n}</h2><div class="paired">${btn('오답 다시 풀기', 'retry', 'outline')}${btn('AI 피드백', 'feedback', 'outline')}</div></article>`).join('')}`, '오답노트');
}
function result() {
  const answers = [4,3,2,5,1,2,2,3,5,4,3,5,4,4,2,7,9,6,4,10,6,12,2,3,4,1,2,3,5,4];
  const wrong = new Set(wrongQuestionNumbers);
  return shell(`<div class="result-heading"><div><h1>채점 결과</h1><p class="muted">2026년 9월 평가원 모의고사</p></div><strong class="score">24 / 30</strong></div><section class="table-card"><table class="result-table"><thead><tr><th>문제 번호</th><th>내 답</th><th>정답</th><th>결과</th><th></th></tr></thead><tbody>${answers.map((answer,i)=>{const n=i+1, miss=wrong.has(n); return `<tr><td>${n}</td><td>${miss ? (n === 5 ? 5 : (answer % 5) + 1) : answer}</td><td>${answer}</td><td class="${miss?'wrong':'correct'}">${miss?'X':'O'}</td><td><button class="row-link" data-action="review-question" data-question="${n}" aria-label="${n}번 풀이 보기">→</button></td></tr>`}).join('')}</tbody></table></section>`, '책장');
}
function feedback() {
  const items = [
    ['반복된 계산 실수','미분할 때 계수와 부호를 놓쳤어요.','접근 방법은 맞았지만, 계수를 곱하거나 음수를 계산하는 과정에서 실수가 반복됐어요.',['7번 ✓','12번 ✓']],
    ['개념 복습 필요','삼각함수의 주기를 다시 확인해요.','그래프가 변할 때 주기를 적용하는 데 어려움이 보여요. x 앞의 계수와 주기의 관계를 복습해보세요.',['9번 ✓','15번 ✓']],
    ['조건 확인 누락','구한 답이 조건에 맞는지 확인해요.','계산으로 구한 값을 문제의 범위와 대조하는 과정이 빠졌어요. 마지막 조건 확인만으로 줄일 수 있는 오답이에요.',['20번 ✓','22번 ✓']],
  ];
  return shell(`<h1>AI가 분석한 당신의 약점</h1><div class="metrics"><div><strong>24 / 30</strong><span>맞힌 문항</span></div><div><strong>6</strong><span>오답 문항</span></div><div><strong>3</strong><span>집중 학습 영역</span></div></div>${items.map(([tag,title,text,qs])=>`<article class="feedback-card"><div class="tag">● ${tag}</div><h2>${title}</h2><p>${text}</p><div class="related"><span>관련 문항</span>${qs.map(q=>`<button>${q}</button>`).join('')}</div></article>`).join('')}`, '오답노트');
}
function editorHeader(title = '2026년 9월 평가원 모의고사', action = '') {
  const label = action === 'reason' ? '틀린 이유' : action === 'close-reason' ? '닫기' : action ? '정답 확인' : '';
  const tools = action === 'close-reason' ? '' : `<div class="tools">${['펜','지우개','실행 취소'].map(t=>`<button class="tool ${state.tool===t?'selected':''}" data-tool="${t}">${t}</button>`).join('')}</div>`;
  return `<div class="editor-title"><h1>${title}</h1>${action ? btn(label, action, 'rust') : ''}</div>${tools}`;
}
function footer(left = '이전', middle = '채점', right = '다음') {
  return `<footer class="editor-footer"><button data-action="prev">← ${left}</button><button data-action="${middle==='채점'?'grade':middle==='유사 문제'?'similar':'result'}">${middle}</button><button data-action="next">${right} →</button></footer>`;
}
function editorScreen({title, image, markup, page, action = '', foot = true, middle = '채점', context = 'question', headerRight = ''}) {
  const writable = (!image && !markup && ['question','retry'].includes(context)) || (context === 'similar-write' && !!image);
  const source = markup || (writable && image ? `<img class="writing-background" src="assets/${image}" alt="유사 문제"><canvas id="ink-canvas" aria-label="유사 문제 풀이 필기 영역"></canvas>` : image ? `<img class="handwriting" src="assets/${image}" alt="미리 작성된 풀이 예시">` : writable ? `<canvas id="pdf-canvas" aria-label="모의고사 문제"></canvas><canvas id="ink-canvas" aria-label="풀이 필기 영역"></canvas>` : `<canvas id="pdf-canvas" aria-label="모의고사 문제"></canvas>`);
  return `<section class="tablet editor">${header(headerRight ? {action:headerRight.action,label:headerRight.label} : '')}<div class="editor-head">${editorHeader(title,action)}</div><main class="editor-scroll" data-context="${context}"><div class="paper ${writable ? 'writing-paper' : ''}" data-page="${page || state.page}">${source}</div></main>${foot ? footer('이전',middle,'다음') : ''}</section>`;
}
function questionClean(page) { state.page = page; return editorScreen({page, context:'question'}); }
function questionWritten(page) { state.page = page; return editorScreen({page, image:`solved-${page}.webp`, context:'written'}); }
function reviewQ1() { return editorScreen({title:'2026년 9월 평가원 모의고사',image:'solved-1.webp',page:1,foot:false,context:'review',headerRight:{action:'result',label:'← 채점 결과'}}); }
function reviewQ2() { return editorScreen({title:'2026년 9월 평가원 모의고사',image:'solved-2.webp',page:2,foot:false,context:'review',headerRight:{action:'result',label:'← 채점 결과'}}); }
function reviewQ5() { return editorScreen({title:'2026년 9월 평가원 모의고사',image:'solved-5.webp',page:5,foot:false,context:'review',headerRight:{action:'result',label:'← 채점 결과'}}); }
function reviewQuestion(page) {
  state.page = page;
  const image = ({1:'solved-1.webp',2:'solved-2.webp',5:'solved-5.webp'})[page];
  return editorScreen({title:'2026년 9월 평가원 모의고사',image,page,foot:false,context:'review',headerRight:{action:'result',label:'← 채점 결과'}});
}
function retry() {
  const page = wrongQuestionNumbers[state.retryIndex] || wrongQuestionNumbers[0];
  state.page = page;
  return editorScreen({title:`오답 다시 풀기 · ${page}번 (${state.retryIndex+1}/${wrongQuestionNumbers.length})`,page,action:'reason',middle:'유사 문제',context:'retry',headerRight:{action:'wrongbook',label:'← 오답노트'}});
}
function reason() { return editorScreen({title:'어디서 틀렸을까요?',image:'wrong-5.webp',page:5,action:'close-reason',foot:false,context:'reason'}); }
function similar(kind = 'similar1') {
  if (kind === 'similar1' || kind === 'similar2') {
    state.inkKey = kind;
    const background = kind === 'similar1' ? 'similar-2.webp' : 'similar-clean.png';
    const screen = editorScreen({title:'비슷한 문제 풀어보기',image:background,action:'check-similar',context:'similar-write',foot:false,headerRight:{action:'retry',label:'← 오답 문제'}});
    return screen.replace('</section>', `<footer class="editor-footer similar-footer"><button data-action="retry">← 오답 문제로 돌아가기</button><button data-action="grade">채점</button><button data-action="similar2">다른 유사 문제 풀기 →</button></footer></section>`);
  }
  if (kind === 'similarChecked2') {
    const screen = editorScreen({title:'유사 문제 채점 결과',image:'similar-clean.png',foot:false,context:'similar',headerRight:{action:'retry',label:'← 오답 문제'}});
    return screen.replace('</main>', `<section class="similar-feedback-card"><strong>풀이 예시 · 정답 16</strong><p>F(x)=x⁴−x²+4 이므로 F(2)=16</p></section></main>`).replace('</section>', `<footer class="editor-footer similar-footer"><button data-action="retry">← 오답 문제로 돌아가기</button><button data-action="similar2">유사 문제 다시 풀기</button></footer></section>`);
  }
  const data = kind === 'similar2'
    ? {image:'similar-clean.png', title:'비슷한 문제 풀어보기'}
    : kind === 'similarChecked'
      ? {image:'similar-checked.webp', title:'비슷한 문제 풀어보기'}
      : kind === 'similarSolved'
        ? {image:'similar-solved.webp', title:'비슷한 문제 풀어보기'}
        : {image:'similar-2.webp', title:'비슷한 문제 풀어보기'};
  const result = editorScreen({title:data.title,image:data.image,action:kind === 'similarSolved' ? 'check-similar' : '',foot:false,context:'similar',headerRight:{action:'wrongbook',label:'← 오답노트'}});
  return result.replace('</section>', `<footer class="editor-footer similar-footer"><button data-action="retry">← 오답 문제로 돌아가기</button><button data-action="similar2">다른 유사 문제 풀기 →</button></footer></section>`);
}
function grading() {
  return shell(`<div class="grading-panel"><h1>AI 자동 채점 중</h1><strong>손글씨 답 확인 완료</strong><p>답안을 명확히 표시하지 않으면 오류가 발생할 수 있습니다.</p><div class="progress-track"><span></span></div></div>`, '책장');
}
function render() {
  const views = {
    home, upload:()=>upload(false), fileReady:()=>upload(true), wrongbook, result, feedback,
    q1:()=>questionClean(1), q1Written:()=>questionWritten(1), q2:()=>questionClean(2), q2Written:()=>questionWritten(2), questionPage:()=>questionClean(state.page),
    reviewQ1, reviewQ2, reviewQ5, reviewQuestion:()=>reviewQuestion(state.page), retry, reason, similar1:()=>similar('similar1'), similarSolved:()=>similar('similarSolved'), similarChecked:()=>similar('similarChecked'), similarChecked2:()=>similar('similarChecked2'), similar2:()=>similar('similar2'), grading,
  };
  app.innerHTML = (views[state.screen] || home)();
  if (['q1','q2','questionPage','reviewQuestion','retry'].includes(state.screen)) drawPresetPage(state.page || (state.screen==='retry'?5:1));
  if (state.screen === 'similar1' || state.screen === 'similar2') {
    const inkCanvas = document.querySelector('#ink-canvas');
    if (inkCanvas) setupInkLayer(inkCanvas, state.inkKey || state.screen);
  }
  if (state.screen === 'grading') setTimeout(()=>{ if(state.screen==='grading'){state.screen='result';render()} },850);
  window.scrollTo(0,0);
}
async function drawPresetPage(page) {
  const canvas = document.querySelector('#pdf-canvas');
  if (!canvas) return;
  try {
    if (!state.pdf) state.pdf = await pdfjs.getDocument('assets/practice.pdf').promise;
    const pdfPage = await state.pdf.getPage(page);
    const box = canvas.parentElement.getBoundingClientRect();
    const base = pdfPage.getViewport({scale:1});
    const scale = Math.min((box.width - 1) / base.width, 1.8);
    const viewport = pdfPage.getViewport({scale:scale * Math.min(devicePixelRatio || 1, 2)});
    canvas.width = viewport.width; canvas.height = viewport.height;
    canvas.style.width = `${viewport.width / Math.min(devicePixelRatio || 1, 2)}px`;
    canvas.style.height = `${viewport.height / Math.min(devicePixelRatio || 1, 2)}px`;
    await pdfPage.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
    const inkCanvas = document.querySelector('#ink-canvas');
    if (inkCanvas) setupInkLayer(inkCanvas, page);
  } catch (error) { console.error(error); }
}
function restoreInk(canvas, data) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!data) return;
  const image = new Image();
  image.onload = () => ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  image.src = data;
}
function setupInkLayer(canvas, page) {
  const rect = canvas.getBoundingClientRect();
  const scale = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * scale);
  canvas.height = Math.round(rect.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  restoreInk(canvas, state.inkByPage[page]);
  let drawing = false;
  const point = event => {
    const box = canvas.getBoundingClientRect();
    return [(event.clientX - box.left) * canvas.width / box.width, (event.clientY - box.top) * canvas.height / box.height];
  };
  canvas.addEventListener('pointerdown', event => {
    if (state.tool === '실행 취소') return;
    event.preventDefault();
    drawing = true;
    canvas.setPointerCapture(event.pointerId);
    state.undoByPage[page] = canvas.toDataURL('image/png');
    const [x,y] = point(event);
    ctx.globalCompositeOperation = state.tool === '지우개' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = '#263d38';
    ctx.lineWidth = state.tool === '지우개' ? 28 * scale : (2.3 + (event.pressure || .5) * 1.4) * scale;
    ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+.1,y+.1); ctx.stroke();
  });
  canvas.addEventListener('pointermove', event => {
    if (!drawing) return;
    event.preventDefault();
    const [x,y] = point(event);
    ctx.lineTo(x,y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x,y);
  });
  const finish = event => {
    if (!drawing) return;
    drawing = false;
    ctx.closePath(); ctx.globalCompositeOperation = 'source-over';
    state.inkByPage[page] = canvas.toDataURL('image/png');
  };
  canvas.addEventListener('pointerup', finish);
  canvas.addEventListener('pointercancel', finish);
}
function go(screen) { state.screen = screen; render(); }

document.addEventListener('click', event => {
  const tool = event.target.closest('[data-tool]');
  if (tool) {
    const inkCanvas = document.querySelector('#ink-canvas');
    const inkKey = (state.screen === 'similar1' || state.screen === 'similar2') ? state.inkKey : state.page;
    if (tool.dataset.tool === '실행 취소' && inkCanvas) {
      restoreInk(inkCanvas, state.undoByPage[inkKey]);
      if (state.undoByPage[inkKey]) state.inkByPage[inkKey] = state.undoByPage[inkKey];
      else delete state.inkByPage[inkKey];
      state.undoByPage[inkKey] = null;
      state.tool = '펜';
    } else state.tool = tool.dataset.tool;
    document.querySelectorAll('[data-tool]').forEach(el=>el.classList.toggle('selected',el.dataset.tool===state.tool));
    return;
  }
  const paper = event.target.closest('.paper');
  if (paper) {
    return;
  }
  const button = event.target.closest('[data-action]');
  if (!button) return;
  switch (button.dataset.action) {
    case 'home': go('home'); break;
    case 'upload': go('upload'); break;
    case 'file-ready': go('fileReady'); break;
    case 'file-empty': go('upload'); break;
    case 'upload-done': state.uploaded = true; go('home'); break;
    case 'start': case 'resume': go('q1'); break;
    case 'prev': if(state.screen==='retry'){if(state.retryIndex>0){state.retryIndex--;go('retry')}else go('wrongbook')} else if(state.screen==='questionPage'&&state.page>3){state.page--;render()} else if(state.screen==='questionPage') go('q2'); else if(state.screen==='q2') go('q1'); else if(state.screen==='q2Written') go('q2'); else go('q1'); break;
    case 'next': if(state.screen==='retry'){if(state.retryIndex<wrongQuestionNumbers.length-1){state.retryIndex++;go('retry')}else go('result')} else if(state.screen==='q1'||state.screen==='q1Written') go('q2'); else if(state.screen==='q2'){state.page=3;go('questionPage')} else if(state.screen==='questionPage'&&state.page<30){state.page++;render()} break;
    case 'grade': if(state.screen==='similar1'){go('similarChecked')}else if(state.screen==='similar2'){go('similarChecked2')}else{state.inkByPage = {}; state.undoByPage = {}; state.tool = '펜'; go('grading')} break;
    case 'result': go('result'); break;
    case 'review-q1': go('reviewQ1'); break;
    case 'review-q2': go('reviewQ2'); break;
    case 'review-q5': go('reviewQ5'); break;
    case 'review-question': state.page=Number(button.dataset.question); go('reviewQuestion'); break;
    case 'wrongbook': go('wrongbook'); break;
    case 'retry': if(!['similar1','similarSolved','similarChecked','similar2'].includes(state.screen)) state.retryIndex=0; go('retry'); break;
    case 'reason': go('reason'); break;
    case 'close-reason': go('retry'); break;
    case 'feedback': go('feedback'); break;
    case 'similar': go('similar1'); break;
    case 'check-similar': if(state.screen==='similar1'||state.screen==='similarSolved') go('similarChecked'); else if(state.screen==='similar2') go('similarChecked2'); break;
    case 'similar2': go('similar2'); break;
    case 'mypage': break;
  }
});
go('home');
