const path = require("path");
const fs = require("fs");
const pptxgen = require("C:/Users/kiwis/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/pptxgenjs@4.0.1/node_modules/pptxgenjs");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "outputs", "final-report");
const outPath = path.join(outDir, "Sport_Analysis_Dashboard_발표자료.pptx");
const heroPath = path.join(root, "frontend", "src", "assets", "hero.png");

fs.mkdirSync(outDir, { recursive: true });

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "Sport Analysis Dashboard Team";
pptx.subject = "웹프로그래밍2 팀 프로젝트 발표 자료";
pptx.title = "Sport Analysis Dashboard";
pptx.company = "Web Programming 2";
pptx.lang = "ko-KR";
pptx.theme = {
  headFontFace: "Malgun Gothic",
  bodyFontFace: "Malgun Gothic",
  lang: "ko-KR",
};
pptx.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });

const C = {
  bg: "070B1A",
  panel: "111A33",
  panel2: "17213F",
  text: "F8FAFC",
  muted: "CBD5E1",
  subtle: "64748B",
  accent: "7C4DFF",
  cyan: "22D3EE",
  green: "22C55E",
  pink: "F43F5E",
  yellow: "FACC15",
  line: "334155",
  white: "FFFFFF",
};

function addBg(slide) {
  slide.background = { color: C.bg };
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: C.bg }, line: { transparency: 100 } });
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: "0B1224", transparency: 25 }, line: { transparency: 100 } });
  slide.addShape(pptx.ShapeType.arc, { x: -1.2, y: -1.0, w: 5.2, h: 5.2, line: { color: C.accent, transparency: 72, width: 2 } });
  slide.addShape(pptx.ShapeType.arc, { x: 9.6, y: 4.2, w: 4.6, h: 4.6, line: { color: C.cyan, transparency: 80, width: 2 } });
}

function footer(slide, n) {
  slide.addText("Sport Analysis Dashboard", { x: 0.55, y: 7.05, w: 4, h: 0.22, fontFace: "Malgun Gothic", fontSize: 8, color: C.subtle });
  slide.addText(String(n).padStart(2, "0"), { x: 12.28, y: 7.02, w: 0.5, h: 0.25, fontFace: "Malgun Gothic", fontSize: 8, bold: true, color: C.subtle, align: "right" });
}

function title(slide, text, sub) {
  slide.addText(text, { x: 0.65, y: 0.52, w: 8.2, h: 0.45, fontFace: "Malgun Gothic", fontSize: 25, bold: true, color: C.text, margin: 0 });
  if (sub) slide.addText(sub, { x: 0.68, y: 1.05, w: 8.5, h: 0.35, fontFace: "Malgun Gothic", fontSize: 10.5, color: C.muted, margin: 0 });
}

function pill(slide, text, x, y, color = C.accent, w = 1.15) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h: 0.32, rectRadius: 0.08, fill: { color, transparency: 10 }, line: { color, transparency: 20, width: 0.8 } });
  slide.addText(text, { x, y: y + 0.07, w, h: 0.16, fontFace: "Malgun Gothic", fontSize: 7.2, bold: true, color: C.white, align: "center", margin: 0 });
}

function card(slide, x, y, w, h, heading, body, accent = C.accent) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.08, fill: { color: C.panel, transparency: 4 }, line: { color: C.line, transparency: 10, width: 1 } });
  slide.addShape(pptx.ShapeType.rect, { x, y, w: 0.08, h, fill: { color: accent }, line: { transparency: 100 } });
  slide.addText(heading, { x: x + 0.25, y: y + 0.25, w: w - 0.45, h: 0.35, fontFace: "Malgun Gothic", fontSize: 14, bold: true, color: C.text, margin: 0 });
  slide.addText(body, { x: x + 0.25, y: y + 0.72, w: w - 0.45, h: h - 0.9, fontFace: "Malgun Gothic", fontSize: 9.6, color: C.muted, breakLine: false, fit: "shrink", valign: "mid" });
}

function stat(slide, label, value, x, y, color) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 2.25, h: 1.05, rectRadius: 0.08, fill: { color: C.panel2, transparency: 0 }, line: { color: C.line, transparency: 10 } });
  slide.addText(value, { x: x + 0.18, y: y + 0.18, w: 1.8, h: 0.32, fontFace: "Malgun Gothic", fontSize: 20, bold: true, color });
  slide.addText(label, { x: x + 0.2, y: y + 0.66, w: 1.75, h: 0.2, fontFace: "Malgun Gothic", fontSize: 8.2, color: C.muted });
}

function bullets(slide, items, x, y, w, h, size = 11) {
  const runs = [];
  items.forEach((item) => runs.push({ text: item, options: { bullet: { type: "bullet" }, breakLine: true } }));
  slide.addText(runs, { x, y, w, h, fontFace: "Malgun Gothic", fontSize: size, color: C.muted, paraSpaceAfterPt: 6, fit: "shrink", valign: "top" });
}

function slide1() {
  const s = pptx.addSlide();
  addBg(s);
  if (fs.existsSync(heroPath)) {
    s.addImage({ path: heroPath, x: 8.1, y: 0.45, w: 4.6, h: 6.4, transparency: 12 });
    s.addShape(pptx.ShapeType.rect, { x: 8.1, y: 0.45, w: 4.6, h: 6.4, fill: { color: C.bg, transparency: 48 }, line: { transparency: 100 } });
  }
  pill(s, "WEB PROGRAMMING 2", 0.75, 0.8, C.pink, 1.6);
  s.addText("Sport Analysis\nDashboard", { x: 0.75, y: 1.45, w: 6.8, h: 1.6, fontFace: "Malgun Gothic", fontSize: 40, bold: true, color: C.text, margin: 0, fit: "shrink" });
  s.addText("축구·야구·e스포츠 데이터를 한 화면에서 탐색하고, 경기 결과를 AI 리포트로 이해하는 통합 스포츠 분석 웹 서비스", { x: 0.82, y: 3.35, w: 6.5, h: 0.55, fontFace: "Malgun Gothic", fontSize: 14, color: C.muted, fit: "shrink" });
  stat(s, "종목", "3", 0.82, 4.45, C.cyan);
  stat(s, "핵심 화면", "9+", 3.25, 4.45, C.accent);
  stat(s, "검증", "PASS", 5.68, 4.45, C.green);
  footer(s, 1);
}

function slide2() {
  const s = pptx.addSlide(); addBg(s); title(s, "문제 정의", "사용자는 종목마다 다른 사이트와 데이터 기준을 오가야 했습니다.");
  card(s, 0.75, 1.65, 3.7, 2.0, "흩어진 정보", "축구, MLB, LCK의 일정·결과·순위가 서로 다른 형식으로 제공되어 비교가 어렵습니다.", C.cyan);
  card(s, 4.82, 1.65, 3.7, 2.0, "부족한 맥락", "스코어만으로는 경기 흐름, 주요 선수, 전술 포인트를 빠르게 이해하기 어렵습니다.", C.accent);
  card(s, 8.88, 1.65, 3.7, 2.0, "운영 부담", "외부 API 데이터와 DB 반영 여부를 관리자가 직접 확인할 수 있는 화면이 필요했습니다.", C.pink);
  addBgDiagram(s, ["경기 데이터", "통합 API", "React 화면", "AI 리포트"], 1.0, 4.55);
  footer(s, 2);
}

function addBgDiagram(s, labels, x, y) {
  labels.forEach((label, i) => {
    const px = x + i * 2.75;
    s.addShape(pptx.ShapeType.roundRect, { x: px, y, w: 2.2, h: 0.72, rectRadius: 0.07, fill: { color: C.panel2 }, line: { color: C.line } });
    s.addText(label, { x: px, y: y + 0.22, w: 2.2, h: 0.22, fontFace: "Malgun Gothic", fontSize: 10, bold: true, color: C.text, align: "center", margin: 0 });
    if (i < labels.length - 1) s.addText("→", { x: px + 2.28, y: y + 0.19, w: 0.35, h: 0.2, fontSize: 16, color: C.cyan, bold: true, margin: 0 });
  });
}

function slide3() {
  const s = pptx.addSlide(); addBg(s); title(s, "평가항목 대응 전략", "산출물, 과정, 성찰/발표 기준을 각각 코드·문서·시연 증거로 연결했습니다.");
  const rows = [
    ["산출물", "React + Spring Boot 서비스", "홈, 경기센터, 종목 허브, 상세, 관리자"],
    ["과정", "프롬프트 로그와 설계 기록", "PROMPT_LOG, MLB/LCK/K리그 설계 문서"],
    ["검증", "빌드·컴파일·체크리스트", "frontend lint/build, backend compile"],
    ["발표", "시연 흐름과 의사결정 설명", "문제 → 구조 → 기능 → 검증 → 개선"],
  ];
  rows.forEach((r, i) => {
    const y = 1.58 + i * 1.05;
    s.addShape(pptx.ShapeType.roundRect, { x: 0.85, y, w: 11.5, h: 0.78, rectRadius: 0.06, fill: { color: i % 2 ? C.panel : C.panel2 }, line: { color: C.line, transparency: 20 } });
    s.addText(r[0], { x: 1.05, y: y + 0.21, w: 1.4, h: 0.22, fontSize: 11, bold: true, color: C.cyan, fontFace: "Malgun Gothic" });
    s.addText(r[1], { x: 2.65, y: y + 0.2, w: 3.1, h: 0.24, fontSize: 11, bold: true, color: C.text, fontFace: "Malgun Gothic" });
    s.addText(r[2], { x: 6.0, y: y + 0.2, w: 5.8, h: 0.24, fontSize: 10, color: C.muted, fontFace: "Malgun Gothic" });
  });
  footer(s, 3);
}

function slide4() {
  const s = pptx.addSlide(); addBg(s); title(s, "시스템 아키텍처", "종목별 데이터 구조는 분리하고, 사용자 경험은 공통 화면으로 통합했습니다.");
  addBgDiagram(s, ["외부 API\nMLB·Cito·K리그", "Spring Boot\nREST API", "Oracle DB\n경기·팀·사용자", "React SPA\n화면·상태"], 0.9, 1.75);
  card(s, 0.9, 3.35, 3.6, 1.55, "Backend", "Controller, Service, Repository를 도메인별로 분리하고 공통 API 응답 형식을 유지했습니다.", C.cyan);
  card(s, 4.85, 3.35, 3.6, 1.55, "Frontend", "라우터, 공통 컴포넌트, 종목별 페이지로 구성해 화면 확장성을 확보했습니다.", C.accent);
  card(s, 8.8, 3.35, 3.6, 1.55, "Data", "외부 API 실패 시 화면 단위 오류 상태를 제공하고, 관리자 동기화로 DB 반영을 확인합니다.", C.green);
  footer(s, 4);
}

function slide5() {
  const s = pptx.addSlide(); addBg(s); title(s, "주요 기능", "사용자 흐름은 ‘찾기 → 보기 → 이해하기 → 참여하기’로 정리됩니다.");
  const items = [
    ["경기센터", "날짜·종목·상태 필터로 오늘 또는 선택 날짜의 경기 목록 조회", C.cyan],
    ["경기 상세", "스코어보드, 라인스코어, 핵심 선수, 팬 투표, 채팅", C.accent],
    ["AI 분석", "종료 경기 중심으로 경기 요약과 전술 포인트 제공", C.green],
    ["관리자", "외부 데이터 동기화, API 상태, 권한 기반 접근 제어", C.pink],
  ];
  items.forEach((it, i) => card(s, 0.8 + (i % 2) * 6.0, 1.62 + Math.floor(i / 2) * 2.05, 5.45, 1.52, it[0], it[1], it[2]));
  footer(s, 5);
}

function slide6() {
  const s = pptx.addSlide(); addBg(s); title(s, "종목별 구현 포인트", "같은 화면 기준 안에서 종목마다 다른 데이터 깊이를 살렸습니다.");
  card(s, 0.75, 1.55, 3.8, 3.6, "축구 K리그", "일정, 순위, 상세 경기, AI 분석\n\n실제 K리그 데이터와 시즌 순위를 연결해 스포츠 허브와 순위 탭에서 같은 기준으로 표시합니다.", C.green);
  card(s, 4.78, 1.55, 3.8, 3.6, "야구 MLB", "오늘 경기, 라인스코어, 선발 투수, 핵심 타자, 분석 리포트\n\nMLB Stats API 기반으로 경기 상세 기록의 시인성을 개선했습니다.", C.cyan);
  card(s, 8.82, 1.55, 3.8, 3.6, "e스포츠 LCK", "오늘 경기, 시즌 결과, 팀 정보, 게임별 통계, Groq 요약\n\nCito API와 DB 선수 지표를 함께 사용해 분석 흐름을 구성했습니다.", C.accent);
  footer(s, 6);
}

function slide7() {
  const s = pptx.addSlide(); addBg(s); title(s, "AI 활용 투명성", "AI는 보조 도구로 사용했고, 최종 판단과 검증은 팀원이 수행했습니다.");
  bullets(s, [
    "기획: 기능 범위, REST 전환 계획, 화면 구성 초안 제안",
    "구현: Controller, Service, DTO, React 컴포넌트 초안 생성",
    "검증: 오류 메시지 기반 수정안과 체크리스트 정리",
    "사람의 역할: 요구사항 확정, API 응답 확인, 화면 검증, 최종 채택 판단",
  ], 0.9, 1.55, 5.8, 3.7, 12);
  card(s, 7.2, 1.55, 4.9, 2.0, "프롬프트 전략", "목표, 제한조건, 구현 파일, 검증 명령을 함께 제시해 AI가 기존 구조를 깨지 않도록 유도했습니다.", C.cyan);
  card(s, 7.2, 3.85, 4.9, 1.55, "윤리 기준", "개인 성찰은 AI가 대신 쓰지 않고, 프롬프트 로그는 실제 작업 흐름에 맞춰 기록합니다.", C.pink);
  footer(s, 7);
}

function slide8() {
  const s = pptx.addSlide(); addBg(s); title(s, "문제 해결 사례", "발표 질문에 대비할 수 있는 실제 디버깅 포인트입니다.");
  const fixes = [
    ["Maven wrapper", "mvnw.cmd가 .m2 Target[0]을 읽다 실패 → null/empty 방어"],
    ["실시간 표시", "예정/종료 경기가 LIVE로 보이던 기준을 실제 LIVE 상태만 집계"],
    ["로고 통일", "화면별 텍스트 로고와 실제 로고 혼재 → TeamLogo 기준 통일"],
    ["LCK 오늘 경기", "TBD placeholder와 날짜 기준 불일치 → 서울 시간 오늘 날짜로 고정"],
  ];
  fixes.forEach((f, i) => {
    const y = 1.45 + i * 1.13;
    s.addText(`${i + 1}`, { x: 0.95, y, w: 0.45, h: 0.35, fontSize: 18, bold: true, color: [C.cyan, C.accent, C.green, C.pink][i], fontFace: "Malgun Gothic", margin: 0 });
    s.addText(f[0], { x: 1.55, y: y + 0.02, w: 2.4, h: 0.24, fontSize: 12, bold: true, color: C.text, fontFace: "Malgun Gothic", margin: 0 });
    s.addText(f[1], { x: 4.05, y: y + 0.03, w: 7.7, h: 0.25, fontSize: 10.5, color: C.muted, fontFace: "Malgun Gothic", margin: 0 });
    s.addShape(pptx.ShapeType.line, { x: 0.95, y: y + 0.62, w: 11.2, h: 0, line: { color: C.line, transparency: 30 } });
  });
  footer(s, 8);
}

function slide9() {
  const s = pptx.addSlide(); addBg(s); title(s, "검증 결과", "제출 전 기준으로 프론트와 백엔드 모두 빌드 검증을 통과했습니다.");
  stat(s, "Backend compile", "PASS", 1.05, 1.75, C.green);
  stat(s, "Frontend lint", "PASS", 3.75, 1.75, C.green);
  stat(s, "Frontend build", "PASS", 6.45, 1.75, C.green);
  stat(s, "공유 ZIP", "완료", 9.15, 1.75, C.cyan);
  card(s, 1.05, 3.35, 10.35, 1.65, "검증 명령", "cd frontend && npm.cmd run lint\ncd frontend && npm.cmd run build\n.\\mvnw.cmd -q -DskipTests compile", C.accent);
  footer(s, 9);
}

function slide10() {
  const s = pptx.addSlide(); addBg(s); title(s, "발표 시연 순서", "데모는 기능을 많이 보여주기보다 기준이 맞는 흐름을 보여주는 것이 좋습니다.");
  addBgDiagram(s, ["홈", "경기센터", "경기 상세", "스포츠 허브"], 0.8, 1.55);
  addBgDiagram(s, ["AI 분석", "관리자", "검증 결과", "향후 개선"], 0.8, 3.05);
  bullets(s, [
    "홈: 실제 LIVE 경기와 3일 내 예정 경기 기준 설명",
    "경기센터: 날짜·종목·상태 필터 작동 확인",
    "상세: MLB 기록, 팬 투표, 채팅, AI 분석 흐름 시연",
    "관리자: 데이터 동기화와 권한 제한 설명",
  ], 0.95, 4.75, 11.0, 1.35, 10.5);
  footer(s, 10);
}

function slide11() {
  const s = pptx.addSlide(); addBg(s); title(s, "한계와 개선 방향", "현실적인 제한을 인정하고 다음 단계 개선 계획을 제시합니다.");
  card(s, 0.8, 1.55, 3.7, 3.4, "현재 한계", "외부 API 키와 호출 제한에 따라 최신 데이터 동기화가 달라질 수 있습니다.\n\nOracle DB 로컬 환경 준비가 필요합니다.", C.pink);
  card(s, 4.82, 1.55, 3.7, 3.4, "개선 계획", "통합 테스트, 배포 환경, 모바일 화면 최적화, API 실패 시 캐시 전략을 추가할 수 있습니다.", C.cyan);
  card(s, 8.85, 1.55, 3.7, 3.4, "발표 메시지", "AI 분석은 예측 확정이 아니라 경기 이해를 돕는 보조 리포트라는 점을 분명히 설명합니다.", C.green);
  footer(s, 11);
}

function slide12() {
  const s = pptx.addSlide(); addBg(s);
  s.addText("Q&A", { x: 0.85, y: 1.2, w: 5.5, h: 0.9, fontFace: "Malgun Gothic", fontSize: 50, bold: true, color: C.text, margin: 0 });
  s.addText("핵심 질문 대비", { x: 0.9, y: 2.45, w: 3, h: 0.3, fontFace: "Malgun Gothic", fontSize: 14, bold: true, color: C.cyan });
  bullets(s, [
    "왜 Spring Security 대신 HttpSession을 사용했나요?",
    "AI 분석과 팬 투표 결과를 어떻게 구분했나요?",
    "외부 API 실패 시 화면은 어떻게 대응하나요?",
    "종목별 데이터 구조가 다른데 어떻게 통합했나요?",
  ], 0.95, 2.95, 7.3, 2.2, 12);
  s.addShape(pptx.ShapeType.roundRect, { x: 8.45, y: 1.45, w: 3.65, h: 3.75, rectRadius: 0.08, fill: { color: C.panel2 }, line: { color: C.line } });
  s.addText("마무리 문장", { x: 8.78, y: 1.85, w: 3, h: 0.25, fontSize: 13, bold: true, color: C.text, fontFace: "Malgun Gothic" });
  s.addText("이 프로젝트는 단순 경기 목록이 아니라, 종목별 데이터를 하나의 사용자 흐름으로 연결하고 AI를 설명 가능한 보조 분석 도구로 활용한 웹 서비스입니다.", { x: 8.78, y: 2.42, w: 3.0, h: 1.7, fontSize: 12, color: C.muted, fontFace: "Malgun Gothic", fit: "shrink" });
  footer(s, 12);
}

[slide1, slide2, slide3, slide4, slide5, slide6, slide7, slide8, slide9, slide10, slide11, slide12].forEach((fn) => fn());

pptx.writeFile({ fileName: outPath }).then(() => {
  console.log(outPath);
});
