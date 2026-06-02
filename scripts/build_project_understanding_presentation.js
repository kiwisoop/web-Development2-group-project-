const path = require("path");
const fs = require("fs");
const pptxgen = require("C:/Users/kiwis/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/pptxgenjs@4.0.1/node_modules/pptxgenjs");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "outputs", "final-report");
const outPath = path.join(outDir, "Sport_Analysis_Dashboard_전체이해_발표자료.pptx");
const heroPath = path.join(root, "frontend", "src", "assets", "hero.png");

fs.mkdirSync(outDir, { recursive: true });

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "Sport Analysis Dashboard Team";
pptx.subject = "프로젝트 전체 이해 발표자료";
pptx.title = "Sport Analysis Dashboard 전체 이해 발표자료";
pptx.lang = "ko-KR";
pptx.theme = {
  headFontFace: "Malgun Gothic",
  bodyFontFace: "Malgun Gothic",
  lang: "ko-KR",
};

const C = {
  bg: "060A16",
  panel: "111A32",
  panel2: "18233F",
  line: "334155",
  text: "F8FAFC",
  muted: "CBD5E1",
  subtle: "94A3B8",
  blue: "38BDF8",
  violet: "7C3AED",
  green: "22C55E",
  rose: "F43F5E",
  amber: "F59E0B",
  white: "FFFFFF",
};

function bg(slide) {
  slide.background = { color: C.bg };
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: C.bg }, line: { transparency: 100 } });
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: "111827", transparency: 28 }, line: { transparency: 100 } });
  slide.addShape(pptx.ShapeType.line, { x: 0.65, y: 6.95, w: 11.9, h: 0, line: { color: C.line, transparency: 38, width: 0.8 } });
}

function footer(slide, n) {
  slide.addText("Sport Analysis Dashboard | 프로젝트 전체 이해", { x: 0.65, y: 7.06, w: 5.5, h: 0.18, fontFace: "Malgun Gothic", fontSize: 7.2, color: C.subtle, margin: 0 });
  slide.addText(`${n}/16`, { x: 12.18, y: 7.06, w: 0.75, h: 0.18, fontFace: "Malgun Gothic", fontSize: 7.2, color: C.subtle, bold: true, align: "right", margin: 0 });
}

function title(slide, main, sub) {
  slide.addText(main, { x: 0.65, y: 0.45, w: 9.3, h: 0.5, fontFace: "Malgun Gothic", fontSize: 24, bold: true, color: C.text, margin: 0, fit: "shrink" });
  if (sub) slide.addText(sub, { x: 0.68, y: 1.05, w: 10.3, h: 0.3, fontFace: "Malgun Gothic", fontSize: 9.5, color: C.muted, margin: 0, fit: "shrink" });
}

function pill(slide, text, x, y, color, w = 1.25) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h: 0.3, rectRadius: 0.08, fill: { color }, line: { color, transparency: 25 } });
  slide.addText(text, { x, y: y + 0.075, w, h: 0.12, fontFace: "Malgun Gothic", fontSize: 6.8, bold: true, color: C.white, align: "center", margin: 0 });
}

function card(slide, x, y, w, h, head, body, color = C.violet) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.08, fill: { color: C.panel }, line: { color: C.line, transparency: 10, width: 0.8 } });
  slide.addShape(pptx.ShapeType.rect, { x, y, w: 0.08, h, fill: { color }, line: { transparency: 100 } });
  slide.addText(head, { x: x + 0.25, y: y + 0.23, w: w - 0.45, h: 0.3, fontFace: "Malgun Gothic", fontSize: 12.2, bold: true, color: C.text, margin: 0, fit: "shrink" });
  slide.addText(body, { x: x + 0.25, y: y + 0.65, w: w - 0.45, h: h - 0.82, fontFace: "Malgun Gothic", fontSize: 8.7, color: C.muted, fit: "shrink", valign: "top" });
}

function metric(slide, x, y, value, label, color) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 2.1, h: 1.0, rectRadius: 0.06, fill: { color: C.panel2 }, line: { color: C.line, transparency: 15 } });
  slide.addText(value, { x: x + 0.18, y: y + 0.17, w: 1.7, h: 0.32, fontFace: "Malgun Gothic", fontSize: 18.5, bold: true, color, margin: 0, fit: "shrink" });
  slide.addText(label, { x: x + 0.18, y: y + 0.65, w: 1.75, h: 0.18, fontFace: "Malgun Gothic", fontSize: 7.7, color: C.muted, margin: 0 });
}

function bullets(slide, items, x, y, w, h, size = 10.2) {
  const runs = [];
  items.forEach((item) => runs.push({ text: item, options: { bullet: { type: "bullet" }, breakLine: true } }));
  slide.addText(runs, { x, y, w, h, fontFace: "Malgun Gothic", fontSize: size, color: C.muted, paraSpaceAfterPt: 5.5, fit: "shrink", valign: "top" });
}

function flow(slide, labels, y, startX = 0.8, gap = 2.45) {
  labels.forEach((label, i) => {
    const x = startX + i * gap;
    slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 1.95, h: 0.72, rectRadius: 0.06, fill: { color: i % 2 ? C.panel : C.panel2 }, line: { color: C.line, transparency: 15 } });
    slide.addText(label, { x: x + 0.08, y: y + 0.16, w: 1.78, h: 0.28, fontFace: "Malgun Gothic", fontSize: 8.8, bold: true, color: C.text, align: "center", margin: 0, fit: "shrink" });
    if (i < labels.length - 1) slide.addText("→", { x: x + 2.02, y: y + 0.18, w: 0.28, h: 0.18, fontFace: "Malgun Gothic", fontSize: 14, bold: true, color: C.blue, margin: 0 });
  });
}

function row(slide, y, a, b, c, color) {
  slide.addShape(pptx.ShapeType.roundRect, { x: 0.85, y, w: 11.65, h: 0.72, rectRadius: 0.05, fill: { color: C.panel2 }, line: { color: C.line, transparency: 18 } });
  slide.addText(a, { x: 1.05, y: y + 0.2, w: 2.0, h: 0.2, fontFace: "Malgun Gothic", fontSize: 9.6, bold: true, color, margin: 0 });
  slide.addText(b, { x: 3.25, y: y + 0.2, w: 4.1, h: 0.2, fontFace: "Malgun Gothic", fontSize: 8.8, color: C.muted, margin: 0, fit: "shrink" });
  slide.addText(c, { x: 7.65, y: y + 0.2, w: 4.0, h: 0.2, fontFace: "Malgun Gothic", fontSize: 8.8, color: C.text, bold: true, margin: 0, fit: "shrink" });
}

function s1() {
  const s = pptx.addSlide(); bg(s);
  if (fs.existsSync(heroPath)) {
    s.addImage({ path: heroPath, x: 8.3, y: 0.35, w: 4.55, h: 6.55, transparency: 10 });
    s.addShape(pptx.ShapeType.rect, { x: 8.3, y: 0.35, w: 4.55, h: 6.55, fill: { color: C.bg, transparency: 43 }, line: { transparency: 100 } });
  }
  pill(s, "PROJECT BRIEFING", 0.75, 0.8, C.rose, 1.5);
  s.addText("Sport Analysis\nDashboard", { x: 0.75, y: 1.45, w: 6.8, h: 1.55, fontFace: "Malgun Gothic", fontSize: 39, bold: true, color: C.text, margin: 0, fit: "shrink" });
  s.addText("전체 구조, API, DB 저장 방식, 화면 작동 원리까지 설명하는 발표자료", { x: 0.82, y: 3.3, w: 6.4, h: 0.45, fontFace: "Malgun Gothic", fontSize: 12.8, color: C.muted, margin: 0 });
  metric(s, 0.82, 4.35, "React", "Frontend", C.blue);
  metric(s, 3.25, 4.35, "Spring", "Backend", C.green);
  metric(s, 5.68, 4.35, "Oracle", "Database", C.violet);
  footer(s, 1);
}

function s2() {
  const s = pptx.addSlide(); bg(s); title(s, "프로젝트 한 줄 설명", "사용자가 무엇을 할 수 있는지부터 잡고 들어갑니다.");
  card(s, 0.8, 1.55, 5.7, 2.2, "무엇을 만든 서비스인가?", "축구, 야구, e스포츠 경기 정보를 하나의 웹사이트에서 확인하고 경기 상세 기록, 팀 순위, 팬 참여, AI 분석까지 제공하는 통합 스포츠 분석 웹서비스입니다.", C.blue);
  card(s, 6.85, 1.55, 5.7, 2.2, "사용자에게 주는 가치", "여러 사이트를 오가지 않고 경기 일정, 결과, 상세 기록, 순위, 즐겨찾기 팀 정보를 한 흐름에서 확인할 수 있습니다.", C.green);
  bullets(s, ["오늘 경기 확인", "종목별 경기 일정 확인", "팀 순위와 상세 기록 확인", "팬 투표·채팅·AI 분석 확인", "관리자 데이터 동기화"], 1.0, 4.25, 11, 1.25, 11.5);
  footer(s, 2);
}

function s3() {
  const s = pptx.addSlide(); bg(s); title(s, "전체 시스템 구조", "외부 API → 백엔드 → DB → 프론트엔드 순서로 이해하면 됩니다.");
  flow(s, ["외부 스포츠 API", "Spring Boot", "Oracle DB", "React 화면", "사용자"], 1.75);
  card(s, 0.8, 3.15, 3.75, 1.7, "외부 API", "MLB Stats API, Cito LCK API, K리그/TheSportsDB 데이터에서 경기 정보를 가져옵니다.", C.blue);
  card(s, 4.82, 3.15, 3.75, 1.7, "백엔드", "외부 API 호출, 데이터 가공, DB 저장, 인증, AI 분석 API를 담당합니다.", C.green);
  card(s, 8.85, 3.15, 3.75, 1.7, "프론트엔드", "홈, 경기센터, 상세, 스포츠 허브, 관리자 화면을 렌더링합니다.", C.violet);
  footer(s, 3);
}

function s4() {
  const s = pptx.addSlide(); bg(s); title(s, "왜 React + Spring Boot인가?", "화면과 API 역할을 분리해서 확장성과 검증 가능성을 확보했습니다.");
  card(s, 0.8, 1.55, 3.75, 2.25, "React 역할", "화면 구성, 라우팅, 버튼/필터 상태, 로그인 상태별 UI, API 호출을 담당합니다.", C.blue);
  card(s, 4.82, 1.55, 3.75, 2.25, "Spring Boot 역할", "REST API, DB 처리, 외부 API 연동, 인증, 관리자 권한, AI 분석 요청을 담당합니다.", C.green);
  card(s, 8.85, 1.55, 3.75, 2.25, "트레이드오프", "CORS와 서버 분리 실행이 필요하지만, 화면 수정과 API 검증이 쉬워졌습니다.", C.amber);
  bullets(s, ["화면이 많고 종목별 기능이 달라 프론트 분리가 유리함", "백엔드는 데이터 기준과 보안을 담당", "프론트는 사용자 경험과 화면 흐름을 담당"], 0.95, 4.55, 11.2, 1.2, 11);
  footer(s, 4);
}

function s5() {
  const s = pptx.addSlide(); bg(s); title(s, "외부 데이터 수집 흐름", "외부 데이터를 그대로 보여주지 않고 우리 서비스 기준으로 가공합니다.");
  flow(s, ["관리자 클릭", "백엔드 API", "외부 API 호출", "DB 저장", "화면 조회"], 1.65);
  card(s, 0.9, 3.0, 5.45, 1.75, "예: MLB 일정 가져오기", "관리자가 동기화 버튼을 누르면 Spring Boot가 MLB Stats API를 호출하고 경기, 팀, 날짜, 점수 데이터를 추출합니다.", C.blue);
  card(s, 6.75, 3.0, 5.45, 1.75, "왜 DB에 저장하나?", "외부 API 응답을 서비스 기준으로 통일하고, 중복 저장을 막고, 경기센터/분석/상세 화면에서 재사용하기 위해서입니다.", C.green);
  footer(s, 5);
}

function s6() {
  const s = pptx.addSlide(); bg(s); title(s, "DB 저장 방식", "핵심은 Match를 중심으로 팀, 사용자, 투표, 채팅이 연결되는 구조입니다.");
  row(s, 1.55, "Match", "경기 ID, 종목, 홈팀, 원정팀, 날짜, 상태, 점수", "홈·경기센터·상세·AI 분석의 기준", C.blue);
  row(s, 2.45, "Team / League", "팀명, 로고, 리그, 종목 정보", "로고 통일과 순위 표시 기준", C.green);
  row(s, 3.35, "User", "아이디, 비밀번호, 권한, 프로필", "로그인과 관리자 권한 기준", C.violet);
  row(s, 4.25, "Favorite / Vote", "즐겨찾기 팀, 팬 승부 예측", "사용자 참여 기능", C.amber);
  row(s, 5.15, "Chat / Analysis", "경기 채팅, AI 분석 결과", "상세 화면 부가 기능", C.rose);
  footer(s, 6);
}

function s7() {
  const s = pptx.addSlide(); bg(s); title(s, "externalId와 중복 저장 방지", "외부 API에서 같은 경기를 여러 번 가져와도 같은 경기로 업데이트해야 합니다.");
  card(s, 0.85, 1.55, 5.2, 2.3, "문제", "외부 API 동기화는 반복 실행될 수 있습니다. 같은 경기를 매번 새로 저장하면 경기센터에 중복 경기들이 생깁니다.", C.rose);
  card(s, 6.45, 1.55, 5.2, 2.3, "해결", "외부 API의 경기 ID를 externalId로 저장하고, 같은 externalId가 있으면 새로 만들지 않고 업데이트합니다.", C.green);
  bullets(s, ["예: MLB-123456", "예: CITO-987654", "예: SOCCER-2416469", "핵심: 외부 API ID와 우리 DB Match를 연결"], 1.0, 4.35, 10.8, 1.2, 12);
  footer(s, 7);
}

function s8() {
  const s = pptx.addSlide(); bg(s); title(s, "API 사용 방식", "React는 외부 API를 직접 부르지 않고 Spring Boot API만 호출합니다.");
  card(s, 0.8, 1.55, 3.8, 2.4, "왜 직접 호출하지 않나?", "API 키 노출, CORS, 복잡한 응답 구조, 데이터 기준 불일치 문제가 생길 수 있습니다.", C.rose);
  card(s, 4.82, 1.55, 3.8, 2.4, "React 호출", "GET /api/matches\nGET /api/rankings/{sport}\nGET /api/lck/cito/today", C.blue);
  card(s, 8.85, 1.55, 3.8, 2.4, "관리자 호출", "POST /api/admin/mlb/sync/schedule\nPOST /api/admin/lck/sync\nPOST /api/admin/soccer/sync", C.green);
  flow(s, ["React", "Spring API", "DB 조회", "JSON 응답", "화면 표시"], 4.85);
  footer(s, 8);
}

function s9() {
  const s = pptx.addSlide(); bg(s); title(s, "홈과 경기센터 작동 방식", "가장 많이 보이는 화면은 데이터 기준이 정확해야 합니다.");
  card(s, 0.8, 1.5, 5.65, 2.35, "홈", "실제 LIVE 상태인 경기만 진행 경기로 표시하고, 예정 경기는 3일 내 경기만 보여줍니다. AI 분석 수는 종료 경기 기준으로 맞췄습니다.", C.blue);
  card(s, 6.85, 1.5, 5.65, 2.35, "경기센터", "날짜, 종목, 상태 필터가 React 상태를 바꾸고 /api/matches 요청에 반영되어 조건에 맞는 경기만 표시합니다.", C.green);
  bullets(s, ["수정한 문제: LIVE 기준 오류", "수정한 문제: 날짜 버튼/필터 오류", "수정한 문제: e스포츠만 나오던 문제", "수정한 문제: 팀 로고 누락"], 1.0, 4.45, 10.8, 1.15, 11);
  footer(s, 9);
}

function s10() {
  const s = pptx.addSlide(); bg(s); title(s, "경기 상세 화면", "종목별로 다른 정보를 보여주되, 상세 화면 흐름은 비슷하게 유지했습니다.");
  card(s, 0.75, 1.45, 3.85, 3.55, "야구 MLB", "스코어보드, 이닝별 라인스코어, 선발 투수, 핵심 타자 Top 3, 팬 투표, 채팅, AI 분석", C.blue);
  card(s, 4.78, 1.45, 3.85, 3.55, "e스포츠 LCK", "시즌 경기, 팀 정보, 게임별 통계, 선수 KDA/딜 기여도, AI 경기 요약", C.violet);
  card(s, 8.82, 1.45, 3.85, 3.55, "축구 K리그", "경기 정보, 팀 정보, 순위, 경기 상세 분석", C.green);
  footer(s, 10);
}

function s11() {
  const s = pptx.addSlide(); bg(s); title(s, "AI 분석 작동 방식", "AI 분석은 승부 예측이 아니라 경기 이해를 돕는 보조 리포트입니다.");
  flow(s, ["종료 경기", "기록 조회", "Groq API", "요약 생성", "화면 표시"], 1.65);
  card(s, 0.9, 3.0, 5.45, 1.8, "왜 종료 경기 중심인가?", "예정 경기는 실제 기록이 없기 때문에 신뢰할 수 있는 분석 근거가 부족합니다.", C.amber);
  card(s, 6.75, 3.0, 5.45, 1.8, "왜 AI 분석을 넣었나?", "단순 점수보다 경기 흐름, 주요 선수, 전술 포인트를 쉽게 이해하도록 돕기 위해서입니다.", C.violet);
  footer(s, 11);
}

function s12() {
  const s = pptx.addSlide(); bg(s); title(s, "인증과 관리자 권한", "사용자 기능과 운영 기능을 분리하기 위해 권한을 나눴습니다.");
  card(s, 0.8, 1.55, 3.75, 2.25, "HttpSession", "로그인 성공 시 서버 세션에 사용자 정보를 저장하고 React는 로그인 상태 API로 확인합니다.", C.blue);
  card(s, 4.82, 1.55, 3.75, 2.25, "관리자 권한", "일반 사용자는 관리자 화면에 접근하지 못하고, 관리자만 데이터 동기화를 실행합니다.", C.green);
  card(s, 8.85, 1.55, 3.75, 2.25, "선택 이유", "JWT보다 확장성은 낮지만 기존 구조와 프로젝트 기간을 고려하면 구현과 검증이 단순했습니다.", C.amber);
  bullets(s, ["ProtectedRoute: 로그인 필요 화면 보호", "AdminRoute: 관리자 전용 화면 보호", "withCredentials: 세션 쿠키 기반 API 호출"], 1.0, 4.65, 11, 1.0, 11);
  footer(s, 12);
}

function s13() {
  const s = pptx.addSlide(); bg(s); title(s, "기능을 만든 이유", "기능은 많아 보이지만 각각 사용자 흐름 안에서 역할이 있습니다.");
  row(s, 1.45, "홈", "전체 경기 상태를 빠르게 파악", "서비스 첫 화면", C.blue);
  row(s, 2.25, "경기센터", "날짜/종목/상태별 경기 탐색", "핵심 목록 화면", C.green);
  row(s, 3.05, "상세", "단순 스코어보다 깊은 정보 제공", "분석과 참여 연결", C.violet);
  row(s, 3.85, "AI 분석", "경기 결과 이해 보조", "요약 리포트", C.amber);
  row(s, 4.65, "투표/채팅", "사용자 참여", "커뮤니티 요소", C.rose);
  row(s, 5.45, "관리자", "외부 데이터 동기화와 운영 관리", "권한 기반 기능", C.blue);
  footer(s, 13);
}

function s14() {
  const s = pptx.addSlide(); bg(s); title(s, "개선할 점", "발표에서 한계를 인정하면 오히려 설계 이해도가 높아 보입니다.");
  card(s, 0.75, 1.45, 3.85, 1.55, "테스트", "JUnit, React Testing Library, API 통합 테스트 추가", C.blue);
  card(s, 4.78, 1.45, 3.85, 1.55, "배포", "프론트/백엔드 배포와 운영 환경변수 관리", C.green);
  card(s, 8.82, 1.45, 3.85, 1.55, "API 실패 대응", "캐시 데이터, 재시도 정책, 관리자 오류 로그", C.amber);
  card(s, 0.75, 3.45, 3.85, 1.55, "모바일", "작은 화면용 필터 UI와 접근성 색상 대비 개선", C.violet);
  card(s, 4.78, 3.45, 3.85, 1.55, "AI 신뢰성", "분석 근거 데이터 표시, 공식 기록 기반 문장 제한", C.rose);
  card(s, 8.82, 3.45, 3.85, 1.55, "통계 확장", "종목별 선수/팀 시즌 통계와 비교 대시보드", C.blue);
  footer(s, 14);
}

function s15() {
  const s = pptx.addSlide(); bg(s); title(s, "예상 질문 답변", "발표에서 가장 자주 나올 질문입니다.");
  card(s, 0.8, 1.35, 5.85, 1.25, "Q. 외부 API 데이터는 어떻게 저장되나요?", "관리자가 동기화 버튼을 누르면 백엔드가 외부 API를 호출하고 externalId 기준으로 중복 확인 후 DB에 저장하거나 업데이트합니다.", C.blue);
  card(s, 6.95, 1.35, 5.85, 1.25, "Q. 왜 HttpSession인가요?", "기간과 기존 구조를 고려하면 구현과 검증이 단순했습니다. JWT는 향후 확장 과제로 볼 수 있습니다.", C.green);
  card(s, 0.8, 3.0, 5.85, 1.25, "Q. AI 분석은 예측인가요?", "아닙니다. 종료 경기 기록을 바탕으로 경기 흐름을 설명하는 보조 리포트입니다.", C.violet);
  card(s, 6.95, 3.0, 5.85, 1.25, "Q. 가장 어려웠던 점은?", "종목마다 다른 LIVE, 날짜, 순위, 로고 기준을 하나의 화면 기준으로 맞추는 것이 어려웠습니다.", C.rose);
  footer(s, 15);
}

function s16() {
  const s = pptx.addSlide(); bg(s);
  s.addText("핵심 요약", { x: 0.85, y: 1.0, w: 4.8, h: 0.55, fontFace: "Malgun Gothic", fontSize: 34, bold: true, color: C.text, margin: 0 });
  bullets(s, [
    "서로 다른 종목 데이터를 하나의 사용자 흐름으로 통합",
    "React는 화면, Spring Boot는 API/DB/인증/AI 분석 담당",
    "외부 API 데이터는 백엔드에서 가공 후 Oracle DB에 저장",
    "AI 분석은 승부 예측이 아니라 경기 이해를 위한 보조 리포트",
    "개선 방향은 테스트, 배포, 캐시, 모바일, AI 신뢰성 강화",
  ], 0.95, 2.0, 8.0, 3.0, 13);
  card(s, 9.25, 1.55, 3.2, 3.3, "마무리 문장", "이 프로젝트는 스포츠 데이터를 단순히 모은 것이 아니라, 종목별 데이터 기준을 하나의 웹서비스 경험으로 정리한 프로젝트입니다.", C.green);
  footer(s, 16);
}

[s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13, s14, s15, s16].forEach((fn) => fn());

pptx.writeFile({ fileName: outPath }).then(() => console.log(outPath));
