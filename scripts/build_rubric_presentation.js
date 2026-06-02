const path = require("path");
const fs = require("fs");
const pptxgen = require("C:/Users/kiwis/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/pptxgenjs@4.0.1/node_modules/pptxgenjs");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "outputs", "final-report");
const outPath = path.join(outDir, "Sport_Analysis_Dashboard_평가기준_발표자료.pptx");
const heroPath = path.join(root, "frontend", "src", "assets", "hero.png");

fs.mkdirSync(outDir, { recursive: true });

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "Sport Analysis Dashboard Team";
pptx.subject = "웹프로그래밍2 팀 프로젝트 평가기준 맞춤 발표자료";
pptx.title = "Sport Analysis Dashboard 평가기준 발표자료";
pptx.lang = "ko-KR";
pptx.theme = {
  headFontFace: "Malgun Gothic",
  bodyFontFace: "Malgun Gothic",
  lang: "ko-KR",
};

const C = {
  bg: "070A16",
  deep: "0D1428",
  panel: "111B35",
  panel2: "17233F",
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
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: "101B33", transparency: 18 }, line: { transparency: 100 } });
  slide.addShape(pptx.ShapeType.line, { x: 0.6, y: 6.95, w: 11.9, h: 0, line: { color: C.line, transparency: 35, width: 0.8 } });
}

function footer(slide, n) {
  slide.addText("웹프로그래밍2 팀 프로젝트 | Sport Analysis Dashboard", { x: 0.65, y: 7.05, w: 6, h: 0.2, fontFace: "Malgun Gothic", fontSize: 7.2, color: C.subtle, margin: 0 });
  slide.addText(`${n}/14`, { x: 12.25, y: 7.05, w: 0.65, h: 0.2, fontFace: "Malgun Gothic", fontSize: 7.2, bold: true, color: C.subtle, align: "right", margin: 0 });
}

function heading(slide, title, subtitle) {
  slide.addText(title, { x: 0.65, y: 0.45, w: 8.8, h: 0.46, fontFace: "Malgun Gothic", fontSize: 24, bold: true, color: C.text, margin: 0 });
  if (subtitle) {
    slide.addText(subtitle, { x: 0.67, y: 1.02, w: 9.2, h: 0.32, fontFace: "Malgun Gothic", fontSize: 9.8, color: C.muted, margin: 0 });
  }
}

function pill(slide, text, x, y, color, w = 1.2) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h: 0.3, rectRadius: 0.08, fill: { color, transparency: 4 }, line: { color, transparency: 20 } });
  slide.addText(text, { x, y: y + 0.075, w, h: 0.13, fontFace: "Malgun Gothic", fontSize: 6.8, bold: true, color: C.white, align: "center", margin: 0 });
}

function card(slide, x, y, w, h, title, body, color = C.violet) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.08, fill: { color: C.panel, transparency: 0 }, line: { color: C.line, transparency: 12, width: 0.8 } });
  slide.addShape(pptx.ShapeType.rect, { x, y, w: 0.08, h, fill: { color }, line: { transparency: 100 } });
  slide.addText(title, { x: x + 0.24, y: y + 0.22, w: w - 0.45, h: 0.3, fontFace: "Malgun Gothic", fontSize: 12.5, bold: true, color: C.text, margin: 0 });
  slide.addText(body, { x: x + 0.24, y: y + 0.62, w: w - 0.45, h: h - 0.76, fontFace: "Malgun Gothic", fontSize: 8.8, color: C.muted, fit: "shrink", valign: "top", breakLine: false });
}

function metric(slide, x, y, value, label, color) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 2.1, h: 1.02, rectRadius: 0.06, fill: { color: C.panel2 }, line: { color: C.line, transparency: 15 } });
  slide.addText(value, { x: x + 0.18, y: y + 0.17, w: 1.7, h: 0.32, fontFace: "Malgun Gothic", fontSize: 19, bold: true, color, margin: 0 });
  slide.addText(label, { x: x + 0.18, y: y + 0.66, w: 1.72, h: 0.2, fontFace: "Malgun Gothic", fontSize: 7.8, color: C.muted, margin: 0 });
}

function bullets(slide, items, x, y, w, h, size = 10) {
  const runs = [];
  items.forEach((it) => runs.push({ text: it, options: { bullet: { type: "bullet" }, breakLine: true } }));
  slide.addText(runs, { x, y, w, h, fontFace: "Malgun Gothic", fontSize: size, color: C.muted, paraSpaceAfterPt: 6, fit: "shrink", valign: "top" });
}

function arrowFlow(slide, labels, y) {
  labels.forEach((label, i) => {
    const x = 0.75 + i * 2.55;
    slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 2.0, h: 0.72, rectRadius: 0.06, fill: { color: i % 2 ? C.panel : C.panel2 }, line: { color: C.line, transparency: 15 } });
    slide.addText(label, { x: x + 0.1, y: y + 0.18, w: 1.8, h: 0.24, fontFace: "Malgun Gothic", fontSize: 9.2, bold: true, color: C.text, align: "center", margin: 0, fit: "shrink" });
    if (i < labels.length - 1) slide.addText("→", { x: x + 2.08, y: y + 0.18, w: 0.35, h: 0.2, fontFace: "Malgun Gothic", fontSize: 15, bold: true, color: C.blue, margin: 0 });
  });
}

function slide1() {
  const s = pptx.addSlide(); bg(s);
  if (fs.existsSync(heroPath)) {
    s.addImage({ path: heroPath, x: 8.25, y: 0.35, w: 4.55, h: 6.55, transparency: 8 });
    s.addShape(pptx.ShapeType.rect, { x: 8.25, y: 0.35, w: 4.55, h: 6.55, fill: { color: C.bg, transparency: 42 }, line: { transparency: 100 } });
  }
  pill(s, "KCC2024 RUBRIC", 0.75, 0.8, C.rose, 1.45);
  s.addText("Sport Analysis\nDashboard", { x: 0.75, y: 1.45, w: 6.7, h: 1.55, fontFace: "Malgun Gothic", fontSize: 40, bold: true, color: C.text, margin: 0, fit: "shrink" });
  s.addText("축구 · 야구 · e스포츠 경기 데이터를 통합하고 AI 분석으로 경기 맥락을 설명하는 웹 서비스", { x: 0.82, y: 3.35, w: 6.55, h: 0.55, fontFace: "Malgun Gothic", fontSize: 13, color: C.muted, fit: "shrink" });
  metric(s, 0.82, 4.45, "3", "지원 종목", C.blue);
  metric(s, 3.25, 4.45, "8", "평가 항목 대응", C.violet);
  metric(s, 5.68, 4.45, "PASS", "빌드 검증", C.green);
  footer(s, 1);
}

function slide2() {
  const s = pptx.addSlide(); bg(s); heading(s, "평가 기준에 맞춘 발표 구조", "완성된 기능보다 설계 판단, AI 협업 과정, 검증 증거를 앞에 둡니다.");
  card(s, 0.75, 1.6, 3.8, 1.6, "산출물 30%", "시스템 완성도와 아키텍처 판단을 실제 화면과 코드 구조로 증명합니다.", C.blue);
  card(s, 4.82, 1.6, 3.8, 1.6, "과정 45%", "프롬프트 전략, AI 오류 검증, 팀 협업 과정을 로그와 사례로 보여줍니다.", C.violet);
  card(s, 8.9, 1.6, 3.8, 1.6, "성찰/발표 25%", "개인 성찰은 직접 작성하고, 발표는 시연과 질문 대응 중심으로 준비합니다.", C.green);
  arrowFlow(s, ["문제", "설계", "구현", "AI 협업", "검증"], 4.25);
  footer(s, 2);
}

function slide3() {
  const s = pptx.addSlide(); bg(s); heading(s, "문제 정의", "종목마다 다른 데이터 기준을 하나의 사용자 흐름으로 묶는 것이 핵심 문제였습니다.");
  card(s, 0.8, 1.55, 3.7, 2.15, "사용자 문제", "경기 일정, 결과, 순위, 선수 기록을 확인하려면 종목별 사이트를 따로 봐야 했습니다.", C.blue);
  card(s, 4.82, 1.55, 3.7, 2.15, "기술적 문제", "MLB, K리그, LCK는 API 응답 구조와 기록 항목이 달라 단일 화면 기준을 잡기 어렵습니다.", C.violet);
  card(s, 8.85, 1.55, 3.7, 2.15, "운영 문제", "외부 API 동기화와 DB 반영 여부를 관리자가 확인할 수 있어야 했습니다.", C.rose);
  bullets(s, ["목표: 경기 탐색 → 상세 기록 → AI 분석 → 사용자 참여까지 이어지는 통합 서비스", "중요 기준: 실제 LIVE 상태, 3일 내 예정 경기, 종목별 순위 기준 통일"], 0.9, 4.45, 11.2, 1.2, 11);
  footer(s, 3);
}

function slide4() {
  const s = pptx.addSlide(); bg(s); heading(s, "아키텍처 결정", "종목별 복잡도는 분리하고, 사용자는 공통 화면에서 탐색하도록 설계했습니다.");
  arrowFlow(s, ["External API", "Spring Boot", "Oracle DB", "React SPA", "User"], 1.65);
  card(s, 0.8, 3.0, 3.7, 1.65, "왜 REST API인가?", "Thymeleaf 화면보다 React SPA와 API 서버를 분리하면 종목별 화면 확장과 오류 검증이 쉬워집니다.", C.blue);
  card(s, 4.82, 3.0, 3.7, 1.65, "왜 세션 인증인가?", "팀 프로젝트 기간과 기존 구조를 고려해 Spring Security/JWT 대신 HttpSession을 유지했습니다.", C.green);
  card(s, 8.85, 3.0, 3.7, 1.65, "왜 종목별 패키지인가?", "MLB, LCK, K리그 응답 구조가 달라 독립 구현이 안전했습니다. 대신 화면 기준은 통합했습니다.", C.violet);
  footer(s, 4);
}

function slide5() {
  const s = pptx.addSlide(); bg(s); heading(s, "주요 구현 범위", "평가기준의 시스템 완성도 항목에 직접 대응되는 기능입니다.");
  const items = [
    ["홈", "실제 LIVE 경기와 3일 내 예정 경기만 요약"],
    ["경기센터", "날짜·종목·상태 필터와 상세 이동"],
    ["경기 상세", "스코어, 기록, 팬 투표, 채팅, AI 분석"],
    ["스포츠 허브", "축구·야구·e스포츠 전용 화면"],
    ["순위", "종목별 순위 기준 통일"],
    ["관리자", "데이터 동기화와 권한 제어"],
  ];
  items.forEach((it, i) => card(s, 0.72 + (i % 3) * 4.15, 1.5 + Math.floor(i / 3) * 2.12, 3.55, 1.45, it[0], it[1], [C.blue, C.violet, C.green, C.rose, C.amber, C.blue][i]));
  footer(s, 5);
}

function slide6() {
  const s = pptx.addSlide(); bg(s); heading(s, "종목별 차별화", "같은 대시보드 안에서 종목별 데이터의 깊이를 살렸습니다.");
  card(s, 0.75, 1.45, 3.85, 3.65, "축구 K리그", "K리그 일정·순위·상세 경기\n\n실제 K리그 DB와 상세 분석을 연결해 순위 탭과 스포츠 탭의 기준을 맞췄습니다.", C.green);
  card(s, 4.78, 1.45, 3.85, 3.65, "야구 MLB", "오늘 경기·라인스코어·선발 투수·핵심 타자\n\nMLB Stats API 기반으로 상세 기록과 AI 리포트를 제공합니다.", C.blue);
  card(s, 8.82, 1.45, 3.85, 3.65, "e스포츠 LCK", "오늘 LCK 경기·시즌 결과·팀 정보·게임별 통계\n\nCito API와 DB 선수 지표를 함께 사용합니다.", C.violet);
  footer(s, 6);
}

function slide7() {
  const s = pptx.addSlide(); bg(s); heading(s, "AI 활용 전략", "AI를 코드 작성자가 아니라 검토 가능한 협업 도구로 사용했습니다.");
  card(s, 0.8, 1.55, 3.75, 2.0, "프롬프트 방식", "목표, 제한조건, 기존 파일, 검증 명령을 함께 제공했습니다.", C.blue);
  card(s, 4.82, 1.55, 3.75, 2.0, "방어적 조건", "기존 기능 제거 금지, 실제 LIVE 기준, Spring Security 미도입 등을 반복 명시했습니다.", C.rose);
  card(s, 8.85, 1.55, 3.75, 2.0, "사람의 판단", "오류 재현, API 응답 확인, 최종 채택 여부는 팀원이 결정했습니다.", C.green);
  bullets(s, ["초기: “기능 만들어줘” 수준", "후기: “현재 구조 + 제약조건 + 검증 명령 + 실패 시 원인 분리” 방식", "결과: AI 출력의 품질보다 검증 가능한 과정이 좋아짐"], 0.9, 4.45, 11, 1.2, 11);
  footer(s, 7);
}

function slide8() {
  const s = pptx.addSlide(); bg(s); heading(s, "코드 검증과 비판적 사고", "AI가 만든 코드를 그대로 믿지 않고 실패 사례를 기록했습니다.");
  const rows = [
    ["관리자 빈 화면", "undefined 필드 map 호출", "방어 코드 + ErrorBoundary"],
    ["Maven wrapper 실패", ".m2 Target[0] 접근 오류", "mvnw.cmd null 방어 후 compile PASS"],
    ["경기센터 필터", "날짜/상태 기준 불일치", "실제 날짜와 LIVE 상태 기준 재정리"],
    ["팀 로고 누락", "화면마다 표시 방식 다름", "TeamLogo 공통 컴포넌트 기준 통일"],
  ];
  rows.forEach((r, i) => {
    const y = 1.55 + i * 1.05;
    slideRow(s, y, r, i);
  });
  footer(s, 8);
}

function slideRow(s, y, r, i) {
  s.addShape(pptx.ShapeType.roundRect, { x: 0.78, y, w: 11.8, h: 0.75, rectRadius: 0.05, fill: { color: i % 2 ? C.panel : C.panel2 }, line: { color: C.line, transparency: 22 } });
  s.addText(r[0], { x: 1.05, y: y + 0.22, w: 2.4, h: 0.2, fontFace: "Malgun Gothic", fontSize: 10.2, bold: true, color: C.text, margin: 0 });
  s.addText(r[1], { x: 3.6, y: y + 0.22, w: 3.7, h: 0.2, fontFace: "Malgun Gothic", fontSize: 9.2, color: C.muted, margin: 0 });
  s.addText(r[2], { x: 7.55, y: y + 0.22, w: 4.0, h: 0.2, fontFace: "Malgun Gothic", fontSize: 9.2, color: C.green, bold: true, margin: 0 });
}

function slide9() {
  const s = pptx.addSlide(); bg(s); heading(s, "최종 검증 결과", "발표 전에 재현 가능한 명령으로 산출물을 확인했습니다.");
  metric(s, 0.95, 1.65, "PASS", "Backend compile", C.green);
  metric(s, 3.45, 1.65, "PASS", "Frontend lint", C.green);
  metric(s, 5.95, 1.65, "PASS", "Frontend build", C.green);
  metric(s, 8.45, 1.65, "14", "발표 슬라이드", C.blue);
  card(s, 0.95, 3.3, 5.5, 1.7, "검증 명령", "npm.cmd run lint\nnpm.cmd run build\n.\\mvnw.cmd -q -DskipTests compile", C.violet);
  card(s, 6.85, 3.3, 5.15, 1.7, "남은 현실적 제한", "외부 API 키, Oracle DB 접속, 발표 환경 포트 충돌은 발표 직전 직접 확인해야 합니다.", C.amber);
  footer(s, 9);
}

function slide10() {
  const s = pptx.addSlide(); bg(s); heading(s, "윤리와 학술적 정직성", "AI 사용 투명성은 평가 항목이자 프로젝트 운영 원칙입니다.");
  bullets(s, [
    "API 키와 개인정보를 AI에게 직접 입력하지 않음",
    "프롬프트 로그는 실제 작업 흐름에 맞춰 기록",
    "AI 분석은 승부 예측이 아니라 경기 이해를 돕는 보조 리포트로 안내",
    "개인 성찰은 AI 작성 금지 항목이므로 각 팀원이 직접 작성",
  ], 0.95, 1.55, 6.2, 3.9, 12);
  card(s, 7.55, 1.65, 4.1, 2.8, "발표에서 강조할 문장", "저희는 AI가 생성한 결과보다, AI 제안을 검증하고 채택·거부한 판단 과정을 평가 증거로 남겼습니다.", C.rose);
  footer(s, 10);
}

function slide11() {
  const s = pptx.addSlide(); bg(s); heading(s, "팀워크와 역할 분담", "종목별 담당을 나누고 공통 기능에서 기준을 합쳤습니다.");
  card(s, 0.8, 1.55, 3.75, 2.45, "축구", "K리그 데이터, 상세 경기, 순위, 축구 분석 문서", C.green);
  card(s, 4.82, 1.55, 3.75, 2.45, "야구", "MLB 일정, 라인스코어, 선수 기록, AI 리포트", C.blue);
  card(s, 8.85, 1.55, 3.75, 2.45, "e스포츠", "LCK 일정, Cito API, 팀/선수 정보, 게임 통계", C.violet);
  bullets(s, ["공통: 인증, 경기센터, 관리자, 즐겨찾기, UI 통일", "보고서 제출 전 실제 학번·기여도·개인 성찰은 팀원이 직접 보완"], 0.95, 4.75, 11, 0.95, 10.5);
  footer(s, 11);
}

function slide12() {
  const s = pptx.addSlide(); bg(s); heading(s, "시연 흐름", "기능을 많이 나열하기보다 데이터 기준이 맞는 흐름을 보여줍니다.");
  arrowFlow(s, ["홈", "경기센터", "상세", "스포츠 허브", "관리자"], 1.6);
  bullets(s, [
    "홈: 실제 LIVE 경기와 3일 내 예정 경기 기준 설명",
    "경기센터: 날짜·종목·상태 필터 작동 확인",
    "상세: MLB 라인스코어, 핵심 타자, 팬 투표, 채팅 확인",
    "스포츠 허브: 축구·야구·e스포츠 전용 화면 확인",
    "관리자: 데이터 동기화와 권한 제한 설명",
  ], 1.0, 3.05, 11, 2.2, 12);
  footer(s, 12);
}

function slide13() {
  const s = pptx.addSlide(); bg(s); heading(s, "예상 질문 대응", "심층 질문에 대한 답변을 미리 준비했습니다.");
  card(s, 0.8, 1.35, 5.8, 1.35, "Q. 왜 AI 코드를 그대로 쓰지 않았나요?", "외부 API 응답, DB 컬럼, 화면 상태는 실제 실행 환경에서만 확인되므로 빌드와 화면 검증을 거쳤습니다.", C.blue);
  card(s, 6.95, 1.35, 5.8, 1.35, "Q. 왜 HttpSession인가요?", "기간과 기존 구조를 고려한 현실적 선택입니다. 모바일/외부 클라이언트 확장은 JWT가 향후 과제입니다.", C.green);
  card(s, 0.8, 3.05, 5.8, 1.35, "Q. AI 분석은 예측인가요?", "아닙니다. 종료 경기의 결과와 흐름을 설명하는 보조 리포트이며 팬 투표와 구분했습니다.", C.rose);
  card(s, 6.95, 3.05, 5.8, 1.35, "Q. 외부 API가 실패하면요?", "화면 단위 오류 상태와 관리자 동기화 확인을 제공하고, 캐시 전략은 향후 개선 과제로 남겼습니다.", C.violet);
  footer(s, 13);
}

function slide14() {
  const s = pptx.addSlide(); bg(s);
  s.addText("마무리", { x: 0.8, y: 1.1, w: 4.5, h: 0.7, fontFace: "Malgun Gothic", fontSize: 38, bold: true, color: C.text, margin: 0 });
  s.addText("Sport Analysis Dashboard는 서로 다른 종목 데이터를 하나의 탐색 흐름으로 통합하고, AI를 검증 가능한 보조 도구로 활용한 프로젝트입니다.", { x: 0.85, y: 2.2, w: 7.4, h: 1.0, fontFace: "Malgun Gothic", fontSize: 18, color: C.muted, fit: "shrink" });
  card(s, 0.9, 4.0, 3.65, 1.2, "핵심 성과", "종목 통합 · 상세 기록 · AI 분석 · 관리자 동기화", C.blue);
  card(s, 4.85, 4.0, 3.65, 1.2, "평가 포인트", "설계 판단 · 프롬프트 성장 · 검증 기록", C.violet);
  card(s, 8.8, 4.0, 3.65, 1.2, "향후 개선", "자동화 테스트 · 배포 · 접근성 · 캐시", C.green);
  s.addText("Q&A", { x: 9.4, y: 1.35, w: 2.5, h: 0.55, fontFace: "Malgun Gothic", fontSize: 32, bold: true, color: C.blue, margin: 0 });
  footer(s, 14);
}

[
  slide1,
  slide2,
  slide3,
  slide4,
  slide5,
  slide6,
  slide7,
  slide8,
  slide9,
  slide10,
  slide11,
  slide12,
  slide13,
  slide14,
].forEach((fn) => fn());

pptx.writeFile({ fileName: outPath }).then(() => console.log(outPath));
