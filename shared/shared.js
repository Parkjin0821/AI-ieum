/* AI-이음 — 사용자·관리자 페이지 공용: 지역·색, 시연 데이터, 저장소, 후보 만들기, 9:16 미리보기
 * 저장은 시연용으로 이 브라우저(localStorage)에만 한다. 실제 운영은 서버 DB (docs/data-model.md).
 */
(function (root) {
  "use strict";
  const W = root.Workflow, R = root.TemplateRules;

  /* ---------- 지역 ---------- */
  /* 2026-07-01 광주광역시 + 전라남도 → 전남광주통합특별시 (시·군·구 이름은 그대로, 광역 이름만 바뀜).
     지역 id("광주 북구", "전남 목포시")는 저장된 콘텐츠·사진·색·슬로건의 열쇠라 옛 광역 약칭을 그대로 쓴다.
     area: 통합특별시 안에서 찾기 쉽게 옛 광역으로 묶은 것 */
  const SIDO = [
    { id: "jg", name: "전남광주통합특별시", short: "전남광주", areas: [
      { id: "gj", name: "옛 광주광역시", short: "광주", list: ["동구", "서구", "남구", "북구", "광산구"] },
      { id: "jn", name: "옛 전라남도", short: "전남", list: ["목포시", "여수시", "순천시", "나주시", "광양시", "담양군", "곡성군", "구례군", "고흥군", "보성군", "화순군", "장흥군", "강진군", "해남군", "영암군", "무안군", "함평군", "영광군", "장성군", "완도군", "진도군", "신안군"] }] },
    { id: "jb", name: "전북특별자치도", short: "전북", areas: [
      { id: "jb", name: "", short: "전북", list: ["전주시", "군산시", "익산시", "정읍시", "남원시", "김제시", "완주군", "진안군", "무주군", "장수군", "임실군", "순창군", "고창군", "부안군"] }] }
  ];
  const REGIONS = SIDO.flatMap(s => s.areas.flatMap(a => a.list.map(n => ({ id: `${a.short} ${n}`, sido: s.id, sidoName: s.name, area: a.id, areaName: a.name, short: a.short, name: n }))));
  SIDO.forEach(s => { s.list = REGIONS.filter(r => r.sido === s.id); }); // 광역별 지역 수 표시용
  const SIDO_LABEL = "전남광주·전북";
  const regionOf = id => REGIONS.find(r => r.id === id);

  /* 지역 기본 색 — 각 지자체 누리집의 대표색(공식 CI 색 아님, 출처 docs/region-brand.md, 관리자 페이지에서 바꿀 수 있음)
     c: 버튼·강조(흰 글자 대비 4.5:1 이상으로 보정), c2: 밝은 색. mood: 지역 대표 명소·풍경 (공식 슬로건 아님) */
  const THEME = {
    "광주 동구": { c: "#0066B3", c2: "#9EC5E2", mood: "무등산 증심사" },
    "광주 남구": { c: "#0079B8", c2: "#9ECEE7", mood: "향교와 옛 골목" },
    "광주 북구": { c: "#00873C", c2: "#9ED8B8", mood: "무등산 능선" },
    "광주 광산구": { c: "#2F51B2", c2: "#B0BDE2", mood: "황룡강 물길" },
    "전남 목포시": { c: "#1A4AB9", c2: "#A8BAE4", mood: "근대 항구" },
    "전남 여수시": { c: "#046FD9", c2: "#A0C8F1", mood: "여수 밤바다" },
    "전남 순천시": { c: "#5670C5", c2: "#C0CBEC", mood: "갈대 물결" },
    "전남 나주시": { c: "#027BC2", c2: "#9FCDE8", mood: "영산강 물길" },
    "전남 광양시": { c: "#363C5A", c2: "#B3B5C0", mood: "이순신대교 바다" },
    "전남 담양군": { c: "#1A826C", c2: "#AADBD0", mood: "대숲 바람" },
    "전남 곡성군": { c: "#1774D1", c2: "#A8CEF4", mood: "기차마을 장미" },
    "전남 구례군": { c: "#06599E", c2: "#A0C0DA", mood: "산수유 노랑" },
    "전남 고흥군": { c: "#203D89", c2: "#AAB5D2", mood: "우주로 가는 바다" },
    "전남 보성군": { c: "#5258A4", c2: "#BDC0DC", mood: "초록 차밭" },
    "전남 화순군": { c: "#071943", c2: "#A1A8B8", mood: "고인돌 돌빛" },
    "전남 장흥군": { c: "#094FA3", c2: "#A2BCDC", mood: "편백 숲" },
    "전남 강진군": { c: "#416EDB", c2: "#BACDFC", mood: "청자 빛깔" },
    "전남 해남군": { c: "#004EA2", c2: "#9EBCDC", mood: "땅끝 황토" },
    "전남 영암군": { c: "#007CC2", c2: "#9ECDE8", mood: "월출산 바위" },
    "전남 무안군": { c: "#4264A3", c2: "#B7C4DC", mood: "갯벌 해변" },
    "전남 함평군": { c: "#034EA2", c2: "#9FBCDC", mood: "나비 날개" },
    "전남 영광군": { c: "#4C78B2", c2: "#C0D4EE", mood: "굴비 황금빛" },
    "전남 장성군": { c: "#3C5A9A", c2: "#B5C0D9", mood: "황룡강 노란 꽃" },
    "전남 완도군": { c: "#225E95", c2: "#ABC2D7", mood: "청정 바다" },
    "전남 진도군": { c: "#2E499F", c2: "#B0BADB", mood: "신비의 바닷길" },
    "전남 신안군": { c: "#1D56BC", c2: "#A9BFE6", mood: "퍼플섬" },
    "전북 전주시": { c: "#005BAC", c2: "#9EC1DF", mood: "한옥 기와" },
    "전북 김제시": { c: "#0074A9", c2: "#9ECADE", mood: "지평선 황금 들녘" },
    "전북 익산시": { c: "#005BAC", c2: "#9EC1DF", mood: "미륵사지 석탑" },
    "전북 순창군": { c: "#0E7CA1", c2: "#A3CDDB", mood: "고추장 익는 마을" },
    "전북 남원시": { c: "#2277C6", c2: "#ACCFF0", mood: "광한루 달빛" },
    "전북 고창군": { c: "#0071B9", c2: "#9EC9E4", mood: "선운사 꽃무릇" },
    "전북 진안군": { c: "#3357AC", c2: "#B1BFDF", mood: "마이산 돌탑" },
    "전북 정읍시": { c: "#0044A2", c2: "#9EB8DC", mood: "내장산 단풍" },
    "전북 장수군": { c: "#4979AA", c2: "#BDD2E7", mood: "장안산 억새" },
    "전북 임실군": { c: "#382D70", c2: "#B3AFC9", mood: "임실 치즈마을" },
    "전북 완주군": { c: "#0F1477", c2: "#A4A6CB", mood: "대둔산 구름다리" },
    "전북 부안군": { c: "#3D48A1", c2: "#B5B9DB", mood: "변산 채석강" },
    "전북 무주군": { c: "#0D8845", c2: "#A4D9BC", mood: "덕유산 설경" },
    "전북 군산시": { c: "#1A6CBF", c2: "#A8C7E7", mood: "근대 골목" },
    "광주 서구": { c: "#02346B", c2: "#9FB2C7", mood: "풍암호수 산책" }
  };
  /* 지역 대표 사진 — 위키미디어 공용의 CC·퍼블릭 도메인 사진 (2026-10-04 확인, 저작자·라이선스 표시 필수)
     운영 때는 관광공사 사진(TourAPI)으로 바꾸고, 관리자 페이지에서 지역별로 바꿀 수 있다.
     src의 {w}는 사진 폭(330 또는 960). 41개 지역 모두 있음 — 사진을 못 불러오면 색 타일로 바뀐다. */
  const THUMB = "https://thumb.wikimedia.org/wikipedia/commons/thumb/", FILEPAGE = "https://commons.wikimedia.org/wiki/File:";
  const PHOTOS = Object.fromEntries([
    ["광주 동구", "7/7e/증심사_대웅전.JPG", "Dalgial", "CC BY-SA 3.0"],
    ["광주 서구", "6/66/광주월드컵경기장_E석.jpg", "이강철", "CC BY-SA 4.0"],
    ["광주 남구", "4/46/Gwangju_Hyanggyo_4.JPG", "Leedkmn", "CC BY-SA 3.0"],
    ["광주 북구", "9/97/Gwangju_Mudeungsan.jpg", "Kgw1226", "CC BY-SA 4.0"],
    ["광주 광산구", "a/ac/Hwangnyong_river_and_SRT_20190522_134644.jpg", "LERK", "CC BY-SA 4.0"],
    ["전남 광양시", "d/dc/Yi_Sun-sin_Bridge_18-04177.jpg", "Steve46814", "Public domain"],
    ["전남 무안군", "e/e1/A_seaside_resort_in_Muan,_Jeollanam-do,_South_Korea(1).jpg", "Mar del Este", "CC BY-SA 4.0"],
    ["전남 영광군", "9/90/Gyema_Fishing_Port_APR2021.jpg", "Gupdaal", "CC BY 4.0"],
    ["전북 장수군", "5/5b/장안산.jpg", "Seong Ilhan", "CC BY-SA 4.0"],
    ["전남 목포시", "2/24/Korea-Mokpo_Gatbawi_11-01724.JPG", "Steve46814", "CC BY-SA 3.0"],
    ["전남 여수시", "7/7e/Yeosu_by_night_3.jpg", "thomas park", "CC BY 2.0"],
    ["전남 순천시", "6/68/Panorama_of_Reed_fields_in_Suncheon_bay.jpg", "Bandoche", "Public domain"],
    ["전남 나주시", "1/13/Naju_castle_west_gate02.jpg", "Mar del Este", "CC BY-SA 4.0"],
    ["전남 담양군", "3/30/Bamboo_forest_in_Damyang_South_Korea_2015-05-06(6).jpg", "Mar del Este", "CC BY-SA 4.0"],
    ["전남 곡성군", "9/93/Gokseong_trail_village.jpg", "노갑균", "CC BY-SA 4.0"],
    ["전남 구례군", "d/d5/Korea-Mountain-Jirisan-Hwaeomsa-01.jpg", "eimoberg", "CC BY 2.0"],
    ["전남 고흥군", "9/99/Korea-Goheung-Rice_fields_in_rural_Goheung.JPG", "Steve46814", "CC BY-SA 3.0"],
    ["전남 보성군", "b/b3/Boseong_Green_Tea_Field.jpg", "Jakob Reichmann", "CC BY-SA 3.0"],
    ["전남 화순군", "c/c7/Korea-Hwasun_Dolmen_sites01.jpg", "Mar del Este", "CC BY-SA 4.0"],
    ["전남 장흥군", "5/51/Korea-Jangheung-Jeungsanji-01.jpg", "pcamp", "CC BY 2.0"],
    ["전남 강진군", "4/4e/KORAIL_Gangjin_Gun_32_(17096056830).jpg", "Republic of Korea", "CC BY-SA 2.0"],
    ["전남 해남군", "d/d8/Daeheungsa_11-03878.JPG", "Steve46814", "CC BY-SA 3.0"],
    ["전남 영암군", "2/27/Wolchulsan_mountain_peak.jpg", "Fbjon", "CC BY-SA 3.0"],
    ["전남 함평군", "6/62/Hampyeong_butterfly_festival_banner.JPG", "Piotrus", "CC BY-SA 3.0"],
    ["전남 장성군", "c/cb/Baekyangsa.JPG", "Dalgial", "CC BY-SA 3.0"],
    ["전남 완도군", "0/0b/범바위05.jpg", "정동완", "CC BY-SA 4.0"],
    ["전남 진도군", "c/c5/Jindo_Bridge_(16043482437).jpg", "old ccc", "Public domain"],
    ["전남 신안군", "1/1e/Taepyeong_Salt_Field_-_3_in_2011.jpg", "Government of the Republic of Korea", "CC BY-SA 2.0"],
    ["전북 전주시", "2/22/Jeonju_Hanok_Maeul_02.jpg", "Bernard Gagnon", "CC0"],
    ["전북 군산시", "6/6a/Entrance_of_Gunsan_Modern_History_Museum.jpg", "Dquai", "CC BY-SA 4.0"],
    ["전북 익산시", "9/9d/Mireuksaji_Stone_Pagoda_20190505.png", "Jjw", "CC BY-SA 4.0"],
    ["전북 정읍시", "3/3b/Panorama_of_Naejangsan,_South_Korea_(3).jpg", "Lance Vanlewen", "CC BY-SA 4.0"],
    ["전북 남원시", "f/f2/Korea-Nawon-Kwanghanlu2.jpg", "Asfreeas", "CC BY-SA 3.0"],
    ["전북 김제시", "8/83/Korea-Gimje-Country_scene-01.jpg", "Neil Landreville", "CC BY 2.0"],
    ["전북 완주군", "a/a8/Chilseongbong_at_Daedunsan.jpg", "Yoo Chung", "CC BY-SA 3.0"],
    ["전북 진안군", "c/ca/Maisan.jpg", "Joachim Dirauf", "CC BY 3.0"],
    ["전북 무주군", "a/a1/Deogyusan_from_Hyangjeok_Peak.jpg", "Yoo Chung", "CC BY-SA 2.5"],
    ["전북 임실군", "c/cb/Imsilgun_County_12_(16577832127).jpg", "Republic of Korea", "CC BY-SA 2.0"],
    ["전북 순창군", "3/32/Sunchang-eup_from_Mt._Daedong_-_00_(20130820).jpg", "Leedkmn", "CC BY-SA 3.0"],
    ["전북 고창군", "d/d2/Korea-Gwangju-Gochang_Dolmens_5350-06.JPG", "Steve46814", "CC BY-SA 3.0"],
    ["전북 부안군", "f/fa/Korea-Buan_County-Chaeseokgang-01.jpg", "Byungjoon Kim", "CC BY 2.0"]
  ].map(([id, p, by, lic]) => {
    const file = p.split("/")[2], enc = encodeURIComponent(file).replace(/\(/g, "%28").replace(/\)/g, "%29");
    return [id, { src: `${THUMB}${p.split("/").slice(0, 2).join("/")}/${enc}/{w}px-${enc}`, page: FILEPAGE + enc, by, lic }];
  }));
  const hash = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9973, 7);
  function hslHex(h, s, l) {
    s /= 100; l /= 100;
    const f = n => { const k = (n + h / 30) % 12, a = s * Math.min(l, 1 - l); const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); return Math.round(c * 255).toString(16).padStart(2, "0"); };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  /* ---------- 시연용 지역 관광자료 · 트렌드 (실제 데이터 아님) ---------- */
  const ASSETS = [
    ["a01", "전북 김제시", "김제지평선축제", ["축제"]], ["a02", "전북 김제시", "벽골제", ["문화", "관광지"]],
    ["a03", "광주 남구", "양림동 역사문화마을", ["관광지", "문화"]], ["a04", "광주 광산구", "1913송정역시장", ["음식"]],
    ["a05", "광주 광산구", "송정 떡갈비 거리", ["음식"]], ["a06", "광주 동구", "국립아시아문화전당", ["문화"]],
    ["a07", "전남 고흥군", "고흥 우주발사전망대", ["관광지"]], ["a08", "전남 고흥군", "나로우주센터 우주과학관", ["문화", "관광지"]],
    ["a09", "전남 나주시", "나주곰탕 거리", ["음식"]], ["a10", "전남 나주시", "나주읍성", ["문화"]],
    ["a11", "전남 목포시", "목포 근대역사관", ["문화"]], ["a12", "전남 목포시", "목포 해상케이블카", ["관광지"]],
    ["a13", "전남 보성군", "보성 녹차밭", ["관광지"], "변경 금지 사진 — 원본 비율 유지"], ["a14", "전남 보성군", "보성다향대축제", ["축제"]],
    ["a31", "전남 보성군", "벌교 꼬막 거리", ["음식"]],
    ["a15", "전남 강진군", "강진청자축제", ["축제"]], ["a16", "전남 강진군", "고려청자박물관", ["문화"]],
    ["a17", "전남 담양군", "죽녹원", ["관광지"]], ["a18", "전남 담양군", "담양 떡갈비", ["음식"]], ["a19", "전남 담양군", "메타세쿼이아길", ["관광지"]],
    ["a20", "전남 순천시", "순천만습지", ["관광지"]], ["a21", "전남 순천시", "순천만국가정원", ["관광지"]],
    ["a22", "전남 영광군", "법성포 굴비거리", ["음식"]], ["a23", "전남 여수시", "이순신광장 낭만포차", ["음식"]],
    ["a24", "전남 여수시", "여수 해상케이블카", ["관광지"]], ["a25", "전남 신안군", "퍼플섬", ["관광지"]],
    ["a26", "전남 함평군", "함평나비대축제", ["축제"]], ["a27", "전남 진도군", "진도 신비의 바닷길", ["축제", "관광지"]],
    ["a28", "전북 전주시", "전주한옥마을", ["관광지", "문화"]], ["a29", "전남 곡성군", "섬진강기차마을", ["관광지"]],
    ["a30", "전남 구례군", "구례산수유꽃축제", ["축제"]]
  ].map(([id, region, name, cats, warn]) => ({ id, region, name, cats, warn }));
  const TRENDS = [
    ["t01", "가을 축제 브이로그", "축제", "20대", [["네이버 데이터랩", "'가을 축제' 20대 검색 지수 상승"], ["유튜브", "여행 검색 상위에 축제 브이로그"]]],
    ["t02", "가족 체험 축제", "축제", "30~40대", [["유튜브", "'아이랑 가볼 만한 곳' 검색 증가"]]],
    ["t03", "옛 추억 축제 나들이", "축제", "50대 이상", [["네이버 데이터랩", "50대 이상 '축제 일정' 검색 상승"]]],
    ["t04", "인생샷 성지", "관광지", "20대", [["유튜브", "'인생샷' 여행 쇼츠 증가"]]],
    ["t05", "혼자 여행 루틴", "관광지", "20대", [["유튜브", "'혼자 여행' 영상 증가"]]],
    ["t06", "가을 산책·전망", "관광지", "30~40대", [["네이버 데이터랩", "30~40대 '가을 나들이' 지수 상승"]]],
    ["t07", "정원·차밭 힐링", "관광지", "50대 이상", [["네이버 데이터랩", "50대 이상 '힐링 여행' 지수 상승"]]],
    ["t08", "시장 먹방", "음식", "20대", [["유튜브", "시장 먹거리 쇼츠 검색 증가"]]],
    ["t09", "노포 이야기", "음식", "30~40대", [["네이버 데이터랩", "'노포' 검색 꾸준"]]],
    ["t10", "제철 보양식", "음식", "50대 이상", [["네이버 데이터랩", "50대 이상 '보양식' 검색 상승"]]],
    ["t11", "전시 데이트", "문화", "20대", [["유튜브", "'전시 데이트' 쇼츠 증가"]]],
    ["t12", "전통 공예 배우기", "문화", "30~40대", [["네이버 데이터랩", "'공예 체험' 검색 꾸준"]]],
    ["t13", "근대 골목 산책", "문화", "50대 이상", [["네이버 데이터랩", "'근대 건축' 검색 꾸준"]]]
  ].map(([id, name, cat, age, ev]) => ({ id, name, cat, age, ev }));
  const assetsIn = region => ASSETS.filter(a => a.region === region);

  function candOf(id) {
    const [tid, aid] = String(id || "").split("~");
    const t = TRENDS.find(x => x.id === tid), a = ASSETS.find(x => x.id === aid);
    if (!t || !a) return null;
    return { id, trend: t.name, asset: a.name, region: a.region, cat: t.cat, age: t.age,
      fit: 0.55 + (hash(tid + aid) % 41) / 100,
      ev: t.ev.concat([["관광공사", a.warn || "장소·운영시간·사진 자료 있음"]]) };
  }
  /** 지역 관광자료 × 트렌드로 후보를 만든다. 조건에 맞는 게 없으면 연령 → 분야 순으로 조건을 풀어 relaxed에 적는다 */
  function candidates(region, cond) {
    const pairs = [];
    for (const a of assetsIn(region)) for (const t of TRENDS) if (a.cats.includes(t.cat)) pairs.push(candOf(`${t.id}~${a.id}`));
    const by = (c, useAge, useCat) => (!useCat || !cond.cat || c.cat === cond.cat) && (!useAge || !cond.age || c.age === cond.age);
    let list = pairs.filter(c => by(c, true, true)), relaxed = [];
    if (!list.length && cond.age) { list = pairs.filter(c => by(c, false, true)); relaxed.push("연령"); }
    if (!list.length && cond.cat) { list = pairs.slice(); relaxed.push("분야"); }
    return { list: list.sort((x, y) => y.fit - x.fit).slice(0, 3), relaxed, total: pairs.length };
  }

  /* ---------- 저장소 ----------
     사용자·관리자 페이지는 서로 다른 도메인에 올라가므로 브라우저 저장소를 공유하지 못한다.
     config.js에 Supabase 주소·키가 있으면 공용 DB(remote), 없으면 이 도메인의 localStorage(local).
     페이지 코드는 read/write만 쓰고, remote일 때는 시작할 때 전부 읽어 둔 캐시에서 읽고 쓰기는 DB로 보낸다. */
  const KEY = { db: "aiieum-db-v3", tpl: "aiieum-templates-v1", off: "aiieum-template-off-v1", regions: "aiieum-regions-v1", region: "aiieum-region" };
  const CFG = root.AIIEUM_CONFIG || {};
  const REMOTE = !!(CFG.supabaseUrl && CFG.supabaseAnonKey);
  const CONFIG_ROW = { [KEY.tpl]: "templates", [KEY.off]: "templates_off", [KEY.regions]: "regions" }; // app_config 표의 key
  const clone = v => v == null ? v : JSON.parse(JSON.stringify(v));
  const cache = {};
  const lsRead = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } };
  const lsWrite = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };
  const lsRemove = k => { try { localStorage.removeItem(k); } catch {} };
  const isShared = k => REMOTE && k !== KEY.region; // 고른 지역은 보는 사람마다 따로라 항상 이 브라우저에

  /* Supabase REST (PostgREST) — 라이브러리 없이 fetch로 */
  const base = REMOTE ? CFG.supabaseUrl.replace(/\/+$/, "") + "/rest/v1/" : "";
  async function rest(method, path, body, prefer) {
    const h = { apikey: CFG.supabaseAnonKey, Authorization: `Bearer ${CFG.supabaseAnonKey}`, "Content-Type": "application/json" };
    if (prefer) h.Prefer = prefer;
    const r = await fetch(base + path, { method, headers: h, body: body == null ? undefined : JSON.stringify(body) });
    if (!r.ok) { let m = ""; try { m = (await r.json()).message || ""; } catch {} throw new Error(`공용 DB ${method} ${path.split("?")[0]} 실패 (${r.status}) ${m}`); }
    return r.status === 204 ? null : r.json().catch(() => null);
  }
  const syncError = e => { console.error(e); root.dispatchEvent(new CustomEvent("aiieum:sync-error", { detail: e.message })); };
  let queue = Promise.resolve();
  const enqueue = fn => (queue = queue.then(fn).catch(syncError));

  function pushDB(prev, next) {
    prev = prev || { plans: [], logs: [], threads: {} };
    const was = new Map(prev.plans.map(p => [p.id, JSON.stringify(p)]));
    const plans = next.plans.filter(p => was.get(p.id) !== JSON.stringify(p))
      .map(p => ({ id: p.id, region: p.region, status: p.status, data: p, created_at: p.createdAt }));
    const known = new Set(prev.logs.map(l => l.id));
    const logs = next.logs.filter(l => !known.has(l.id)).map(l => ({ id: l.id, plan_id: l.planId, at: l.at, data: l })); // 기록은 추가만
    const threads = Object.entries(next.threads).filter(([k, v]) => JSON.stringify(prev.threads[k]) !== JSON.stringify(v)).map(([id, data]) => ({ id, data }));
    enqueue(async () => {
      if (plans.length) await rest("POST", "content_plans", plans, "resolution=merge-duplicates,return=minimal");
      if (logs.length) await rest("POST", "review_logs", logs, "return=minimal");
      if (threads.length) await rest("POST", "chat_threads", threads, "resolution=merge-duplicates,return=minimal");
    });
  }
  function read(k, d) { return isShared(k) ? (k in cache ? clone(cache[k]) : d) : lsRead(k, d); }
  function write(k, v) {
    if (!isShared(k)) return lsWrite(k, v);
    const prev = cache[k]; cache[k] = clone(v);
    if (k === KEY.db) pushDB(prev, v);
    else enqueue(() => rest("POST", "app_config", [{ key: CONFIG_ROW[k], value: v, updated_at: new Date().toISOString() }], "resolution=merge-duplicates,return=minimal"));
    return true;
  }
  function remove(k) {
    if (!isShared(k)) return lsRemove(k);
    if (k === KEY.db) { syncError(new Error("공용 DB의 콘텐츠·결정 기록은 지울 수 없어요")); return; }
    delete cache[k];
    enqueue(() => rest("DELETE", `app_config?key=eq.${CONFIG_ROW[k]}`));
  }
  /** 공용 DB에서 전부 읽어 캐시를 채운다. 바뀐 게 있으면 true */
  async function pull() {
    const [plans, logs, threads, conf] = await Promise.all(["content_plans", "review_logs", "chat_threads", "app_config"].map(t => rest("GET", `${t}?select=*`)));
    const before = JSON.stringify([cache[KEY.db], cache[KEY.tpl], cache[KEY.off], cache[KEY.regions]]);
    cache[KEY.db] = {
      plans: plans.map(r => r.data).sort((a, b) => a.createdAt < b.createdAt ? 1 : -1),
      logs: logs.map(r => r.data).sort((a, b) => a.at < b.at ? -1 : 1),
      threads: Object.fromEntries(threads.map(r => [r.id, r.data])), seq: 0, version: 3 };
    for (const [k, name] of Object.entries(CONFIG_ROW)) { const row = conf.find(c => c.key === name); if (row) cache[k] = row.value; else delete cache[k]; }
    return before !== JSON.stringify([cache[KEY.db], cache[KEY.tpl], cache[KEY.off], cache[KEY.regions]]);
  }
  /** 페이지 시작 전에 한 번. 공용 DB가 비어 있으면 시연 데이터를 넣는다 */
  async function init() {
    if (!REMOTE) return { mode: "local" };
    await pull();
    if (!cache[KEY.db].plans.length) { const s = seed(); write(KEY.db, s); await queue; }
    return { mode: "remote" };
  }
  async function refresh() { if (!REMOTE) return false; await queue; return pull(); }
  const nextPlanId = db => REMOTE ? "P-" + Date.now().toString(36).toUpperCase().slice(-5) : "P-" + (db.seq++);

  /* 지역 설정 (관리자 페이지에서 바꿈) */
  /* 지자체 공식 브랜드 슬로건 — 출처를 확인한 것만. 없으면 빈 칸(화면은 분위기 문구로 대신) */
  /* 2026-10 조사(2차 보완 포함): 각 누리집·상징 페이지·언론 (출처 전체는 docs/region-brand.md). 미확인·신뢰도 낮음은 비워 둠 */
  const BRAND = {
    "광주 광산구": { slogan: "지속가능 광산", src: "https://www.gwangsan.go.kr/contentsView.do?pageId=www487" },
    "광주 동구": { slogan: "인문도시 광주 동구", src: "https://donggu.kr/board.es?act=view&bid=0249&list_no=7698&mid=a50103000000" },
    "광주 북구": { slogan: "You Are Bukgu", src: "https://bukgu.gwangju.kr/brand/" },
    "광주 서구": { slogan: "#착한도시 서구", src: "https://www.seogu.gwangju.kr/menu.es?mid=a10101020100" },
    "전남 강진군": { slogan: "A로의 초대, Again 남도답사 1번지 강진", src: "https://v.daum.net/v/20221006114653770?f=p" },
    "전남 고흥군": { slogan: "우주항공 중심도시 고흥", src: "https://www.goheung.go.kr/contentsView.do?pageId=www159" },
    "전남 곡성군": { slogan: "자연속의 가족마을 곡성", src: "https://www.gokseong.go.kr/kr/subPage.do?menuNo=101002006000" },
    "전남 광양시": { slogan: "Sunshine Gwangyang", src: "https://gwangyang.go.kr/menu.es?mid=a11303010000" },
    "전남 구례군": { slogan: "자연으로 가는 길 구례", src: "https://www.gurye.go.kr/kr/subPage.do?menuNo=116007001002" },
    "전남 나주시": { slogan: "살기좋은 행복나주 앞서가는 으뜸나주", src: "https://www.naju.go.kr/www/introduction/symbol" },
    "전남 담양군": { slogan: "대숲맑은 생태도시 담양", src: "http://www.newsdy.co.kr/news/articleView.html?idxno=410456" },
    "전남 목포시": { slogan: "낭만항구 목포", src: "https://www.mokpo.go.kr/www/introduce/mokpo_symbol/brand" },
    "전남 무안군": { slogan: "전남의 수도, 플랫폼 무안", src: "https://www.muan.go.kr/www/abountmuan/symbol/brand/city" },
    "전남 보성군": { slogan: "녹차수도 보성", src: "https://www.boseong.go.kr/www/introduce/intro/represent/brand_slogan" },
    "전남 순천시": { slogan: "人(in) Suncheon", src: "https://www.aitimes.com/news/articleView.html?idxno=127206" },
    "전남 신안군": { slogan: "천사섬 신안", src: "https://www.shinan.go.kr/home/www/about/typifier/typifier_02/page.wscms" },
    "전남 여수시": { slogan: "섬섬여수", src: "https://www.yeosu.go.kr/www/yeosu/symbol/slogan" },
    "전남 영광군": { slogan: "천년의 빛 영광", src: "https://www.yeonggwang.go.kr/subpage/?site=headquarter_new&mn=9480" },
    "전남 영암군": { slogan: "기(氣)의 고장 영암", src: "https://www.yeongam.go.kr/home/www/new_plus/introduce/introduce_11/introduce_11_02/yeongam.go" },
    "전남 완도군": { slogan: "해양치유 완도", src: "https://go.seoul.co.kr/news/newsView.php?id=20241014500043" },
    "전남 장성군": { slogan: "성장장성", src: "https://www.jangseong.go.kr/home/www/healing/healing_08" },
    "전남 장흥군": { slogan: "정남진 장흥", src: "https://www.jangheung.go.kr/www/jeongnamjin/jangheung_intro/symbol" },
    "전남 진도군": { slogan: "보배섬 진도", src: "https://www.jindo.go.kr/home/sub.cs?m=174" },
    "전남 해남군": { slogan: "땅끝해남, 한반도의 시작", src: "https://www.haenam.go.kr/index.9is?contentUid=18e3368f5d745106015e557d4034348b" },
    "전남 화순군": { slogan: "Therapy 화순", src: "https://www.hwasun.go.kr/contents.do?S=S01&M=070402020000" },
    "전북 군산시": { slogan: "물빛희망", src: "https://www.gunsan.go.kr/main/m1429" },
    "전북 김제시": { slogan: "지평선 생명도시 김제", src: "https://www.gimje.go.kr/index.gimje?menuCd=DOM_000000101004002007" },
    "전북 남원시": { slogan: "피어나다 남원", src: "https://www.namwon.go.kr/index.do?menuUid=ff8080818e3beff0018e40e6223502b6" },
    "전북 무주군": { slogan: "자연특별시 무주", src: "https://www.muju.go.kr/index.9is?contentUid=ff8080816c5f9d47016cbd6357b90179" },
    "전북 익산시": { slogan: "위대한 도시, 그레이트 익산", src: "https://www.newsis.com/view/NISX20241007_0002910939" },
    "전북 장수군": { slogan: "장수만세", src: "https://www.jangsu.go.kr/index.jangsu?menuCd=DOM_000000103002006008" },
    "전북 전주시": { slogan: "한바탕 전주 세계를 비빈다", src: "https://www.jjan.kr/news/articleView.html?idxno=317370" },
    "전북 진안군": { slogan: "진안고원", src: "https://www.jinan.go.kr/index.jinan?menuCd=DOM_000000104002002003" }
  };
  function regionSettings(id) {
    const r = regionOf(id) || { name: id };
    const saved = (read(KEY.regions, {}) || {})[id] || {};
    const th = THEME[id];
    const h = hash(id) % 360;
    const ph = PHOTOS[id] || {}, br = BRAND[id] || {};
    return Object.assign({ active: true, manager: `${r.name} 담당자`, crossCheck: false,
      color: th ? th.c : hslHex(h, 46, 34), color2: th ? th.c2 : hslHex(h, 58, 78), mood: th ? th.mood : "",
      slogan: br.slogan || "", sloganSrc: br.src || "",
      photo: ph.src || "", photoBy: ph.by || "", photoLic: ph.lic || "", photoPage: ph.page || "" }, saved);
  }
  /** 사진 주소 — 기본 사진은 폭을 골라 쓰고, 관리자가 넣은 주소는 그대로 */
  const photoUrl = (s, w) => s.photo ? s.photo.replace("{w}", w || 330) : "";
  const photoCredit = s => s.photo ? `${s.photoBy || "저작자 미상"} · ${s.photoLic || "라이선스 확인 필요"}` : "";
  function resetRegionPhoto(id) {
    const all = read(KEY.regions, {}) || {};
    if (all[id]) { ["photo", "photoBy", "photoLic", "photoPage"].forEach(k => delete all[id][k]); write(KEY.regions, all); }
  }
  function saveRegionSettings(id, patch) {
    const all = read(KEY.regions, {}) || {};
    all[id] = Object.assign({}, all[id], patch);
    write(KEY.regions, all);
  }
  function resetRegionColor(id) {
    const all = read(KEY.regions, {}) || {};
    if (all[id]) { delete all[id].color; delete all[id].color2; delete all[id].mood; write(KEY.regions, all); }
  }

  /* 템플릿 (관리자가 고친 것이 있으면 그것, 없으면 기본 data/templates.json) */
  const defaultTemplates = () => JSON.parse(JSON.stringify(root.AIIEUM_TEMPLATES || []));
  const templates = () => read(KEY.tpl, null) || defaultTemplates();
  const disabledIds = () => read(KEY.off, []) || [];
  const enabledTemplates = () => { const off = disabledIds(); return templates().filter(t => !off.includes(t.id)); };

  /* ---------- 시연 데이터 ---------- */
  const iso = s => new Date(s).toISOString();
  function scenesOf(tplId) {
    const t = templates().find(x => x.id === tplId);
    return t ? t.scenes.map((s, i) => ({ idx: i + 1, label: s.text || s.role, seconds: s.seconds, source: s.source, role: s.role })) : [];
  }
  function seed() {
    const M = id => regionSettings(id).manager;
    const P = (id, cand, tpl, status, at, extra) => {
      const c = candOf(cand);
      return Object.assign({ id, title: `${c.trend} × ${c.asset}`, region: c.region, templateId: tpl, cand, requestedBy: M(c.region), status, createdAt: iso(at) }, extra);
    };
    const plans = [
      P("P-107", "t04~a13", "dream-reveal", "gate2_wait", "2026-10-02T09:40:00+09:00", { scenes: scenesOf("dream-reveal") }),
      P("P-105", "t03~a14", "then-now", "gate1_wait", "2026-10-03T10:12:00+09:00", { chatThreadId: "T-105" }),
      P("P-101", "t07~a13", "four-seasons", "gate3_wait", "2026-09-29T10:00:00+09:00", { scenes: scenesOf("four-seasons").map((s, i) => Object.assign(s, { picked: i % 3 === 1 ? "kling" : "veo" })) }),
      P("P-104", "t01~a01", "festival-countdown", "gate1_wait", "2026-10-03T11:00:00+09:00"),
      P("P-102", "t05~a03", "dream-reveal", "gate2_wait", "2026-10-01T09:40:00+09:00", { scenes: scenesOf("dream-reveal") }),
      P("P-103", "t08~a04", "sensory-bite", "making", "2026-10-02T14:00:00+09:00"),
      P("P-099", "t13~a11", "then-now", "published", "2026-09-24T10:00:00+09:00"),
      P("P-100", "t02~a15", "festival-countdown", "rejected", "2026-09-27T11:00:00+09:00")
    ];
    const allC = Object.fromEntries(W.CHECKS2.map(c => [c.key, true]));
    let n = 0;
    const L = (planId, at, o) => { const p = plans.find(x => x.id === planId); return Object.assign({ id: "L" + (++n), planId, at: iso(at), reviewer: o.sys ? "시스템" : p.requestedBy }, o); };
    const REQ = { kind: "request", gate: 1, note: "대화로 주제 후보 선택, 1차 확인 요청" }, SYS = { kind: "system", sys: true, note: "초안 생성 완료 (장면별 Veo·Kling 후보)" };
    const logs = [
      L("P-099", "2026-09-24T10:00:00+09:00", REQ), L("P-099", "2026-09-24T13:20:00+09:00", { kind: "decision", gate: 1, decision: "pass" }),
      L("P-099", "2026-09-25T16:30:00+09:00", SYS),
      L("P-099", "2026-09-26T15:05:00+09:00", { kind: "decision", gate: 2, decision: "pass", checklist: allC, scenePicks: { 1: "veo", 2: "veo", 3: "kling", 4: "veo", 5: "veo" } }),
      L("P-099", "2026-09-27T09:30:00+09:00", { kind: "decision", gate: 3, decision: "pass", checklist: { final: true, caption: true } }),
      L("P-100", "2026-09-27T11:00:00+09:00", REQ),
      L("P-100", "2026-09-27T15:40:00+09:00", { kind: "decision", gate: 1, decision: "reject", reasonCategory: "사실 오류", reasonText: "올해 축제 일정이 관광공사 자료와 달라요. 군청 공지로 일정을 확인한 뒤 다시 요청해 주세요." }),
      L("P-101", "2026-09-29T10:00:00+09:00", REQ), L("P-101", "2026-09-29T13:20:00+09:00", { kind: "decision", gate: 1, decision: "pass" }),
      L("P-101", "2026-09-30T16:30:00+09:00", SYS),
      L("P-101", "2026-10-01T15:05:00+09:00", { kind: "decision", gate: 2, decision: "pass", checklist: allC, scenePicks: { 1: "veo", 2: "kling", 3: "veo", 4: "veo", 5: "kling" } }),
      L("P-102", "2026-10-01T09:40:00+09:00", REQ), L("P-102", "2026-10-01T11:02:00+09:00", { kind: "decision", gate: 1, decision: "pass" }),
      L("P-102", "2026-10-02T16:30:00+09:00", SYS),
      L("P-107", "2026-10-02T09:40:00+09:00", REQ), L("P-107", "2026-10-02T10:30:00+09:00", { kind: "decision", gate: 1, decision: "pass" }),
      L("P-107", "2026-10-03T08:10:00+09:00", SYS),
      L("P-103", "2026-10-02T14:00:00+09:00", REQ), L("P-103", "2026-10-02T17:10:00+09:00", { kind: "decision", gate: 1, decision: "pass" }),
      L("P-104", "2026-10-03T11:00:00+09:00", REQ),
      L("P-105", "2026-10-03T10:12:00+09:00", REQ)
    ];
    logs.forEach(l => delete l.sys);
    const threads = { "T-105": [
      { who: "me", text: "50대 이상 · 축제 · 이번 달" },
      { who: "ai", text: "보성군 관광자료에서 찾은 후보 3개를 드렸어요." },
      { who: "me", text: "'옛 추억 축제 나들이 × 보성다향대축제'로 할게요" }
    ] };
    return { plans, logs, threads, seq: 108, version: 3 };
  }
  const loadDB = () => { const d = read(KEY.db, null); return d && d.plans ? d : seed(); };
  const saveDB = db => write(KEY.db, db);
  /** 백업 불러오기: 없는 기록만 더한다 (있는 기록은 지우거나 덮지 않음) */
  function mergeDB(db, inc) {
    const add = { plans: 0, logs: 0, threads: 0 };
    for (const p of inc.plans || []) if (!db.plans.some(x => x.id === p.id)) { db.plans.push(p); add.plans++; }
    for (const l of inc.logs || []) if (!db.logs.some(x => x.id === l.id)) { db.logs.push(l); add.logs++; }
    for (const [k, v] of Object.entries(inc.threads || {})) if (!db.threads[k]) { db.threads[k] = v; add.threads++; }
    db.seq = Math.max(db.seq || 0, inc.seq || 0);
    return add;
  }

  /* ---------- 표시용 ---------- */
  const ROLE = { hook: "훅", highlight: "볼거리", entrance: "입장", food: "음식", stage: "공연", peak: "하이라이트", reveal: "실제 공개", detail: "디테일", step: "단계", recap: "정리", season: "계절", place: "장소", tip: "꿀팁", now: "지금", then: "그때", fact: "사실", engage: "댓글 유도", quote: "한마디", info: "정보" };
  const SRC = { photo: "실사 사진", ai: "AI 분위기", archive: "기록 사진", text: "글자 화면" };
  const HOOK = { question: "질문형", countdown: "카운트다운", pov: "1인칭 POV", reveal: "꿈→실제 공개", list: "번호 목록", seasonal: "계절 엽서", sensory: "감각 클로즈업", story: "유래 이야기", quiz: "퀴즈", howto: "따라 하기", nostalgia: "회상", quote: "주민 한마디" };
  const STATUS = { gate1_wait: "1차 대기", making: "초안 만드는 중", gate2_wait: "2차 대기", gate3_wait: "3차 대기", published: "게시 완료", rejected: "반려" };
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = s => { const d = new Date(s), z = n => String(n).padStart(2, "0"); return `${d.getMonth() + 1}.${d.getDate()} ${z(d.getHours())}:${z(d.getMinutes())}`; };
  const day = s => { const d = new Date(s); return `${d.getMonth() + 1}.${d.getDate()}`; };

  /** 9:16 한 장면 미리보기 */
  function screen(t, i, o) {
    o = o || {};
    if (!t || !t.scenes || !t.scenes.length) return `<div class="screen src-text"><div class="bg"></div></div>`;
    i = Math.min(i, t.scenes.length - 1);
    const s = t.scenes[i], last = i === t.scenes.length - 1;
    const bars = t.scenes.map((x, k) => `<i style="flex:${x.seconds};--d:${x.seconds / (o.speed || 1)}s" class="${k < i ? "done" : k === i ? "on" + (o.still ? " still" : "") : ""}"></i>`).join("");
    let body;
    if (i === 0 || s.role === "hook") body = `<div class="sc-hook"><span>${esc(s.text || (t.hook && t.hook.example) || "")}</span></div>`;
    else if (s.role === "info" || last) body = `<div class="sc-info">${esc(s.text || "위치 · 기간 · 운영시간")}<small>사진: 한국관광공사 · AI 활용</small></div>`;
    else body = s.text ? `<div class="sc-cap"><span>${esc(s.text)}</span></div>` : "";
    const note = s.source === "ai" ? `<div class="sc-note">실제 장소·인물 아님</div>` : "";
    return `<div class="screen src-${esc(s.source)}${o.cls ? " " + o.cls : ""}${o.safe ? " show-safe" : ""}" style="--h:${(hash(t.id) + i * 37) % 180 - 40}deg">
      <div class="bg"></div>${note}<div class="sc-bars" aria-hidden="true">${bars}</div>
      <span class="sc-ai">AI 활용</span><span class="sc-src">${SRC[s.source] || esc(s.source)}</span>${body}
      <i class="sz t"></i><i class="sz b"></i><i class="sz r"></i><i class="sz l"></i></div>`;
  }

  /* 화면 모드 — 브라우저마다 따로 저장 (공용 DB에 올리지 않음). 누를 때마다 시스템 → 밝게 → 어둡게.
     첫 화면 깜빡임을 막으려고 <head>에서도 같은 키를 먼저 읽어 data-theme을 붙인다. */
  const THEME_KEY = "aiieum-theme", THEME_ORDER = ["", "light", "dark"], THEME_LABEL = { "": "시스템", light: "밝게", dark: "어둡게" };
  function themeMode() { try { return localStorage.getItem(THEME_KEY) || ""; } catch (e) { return ""; } }
  const themeText = () => `◐ 화면 · ${THEME_LABEL[themeMode()] || "시스템"}`;
  const themeBtn = cls => `<button type="button" class="${cls || "btn ghost sm"}" data-theme-toggle aria-label="화면 모드 바꾸기">${themeText()}</button>`;
  function setThemeMode(m) {
    try { m ? localStorage.setItem(THEME_KEY, m) : localStorage.removeItem(THEME_KEY); } catch (e) { /* 저장 못 해도 지금 화면엔 적용 */ }
    if (m) document.documentElement.dataset.theme = m; else delete document.documentElement.dataset.theme;
    paintThemeButtons();
  }
  // 아이콘만 있는 버튼(data-theme-toggle="icon")은 글자를 바꾸지 않음
  function paintThemeButtons() { document.querySelectorAll("[data-theme-toggle]:not([data-theme-toggle=icon])").forEach(b => { b.textContent = themeText(); }); }
  paintThemeButtons();
  document.addEventListener("click", e => {
    if (!e.target.closest("[data-theme-toggle]")) return;
    setThemeMode(THEME_ORDER[(THEME_ORDER.indexOf(themeMode()) + 1) % THEME_ORDER.length]);
  });

  /** 지역 사진 묶음 [{src, caption}] — 관리자가 넣은 사진 → 관광공사(TourAPI, shared/region-photos.js) → 기본 사진 순 */
  function regionPhotoList(id) {
    const r = regionOf(id), s = regionSettings(id), name = r ? `${r.sidoName} ${r.name}` : id;
    const custom = ((read(KEY.regions, {}) || {})[id] || {}).photo;
    const tour = (((root.AIIEUM_PHOTOS || {}).regions || {})[id] || [])
      .map(p => ({ src: p.src, caption: `${name}${p.title ? " " + p.title : ""} · 사진 한국관광공사 · 공공누리 제1유형` }));
    const own = s.photo ? [{ src: photoUrl(s, 960), caption: `${name} · 사진 ${photoCredit(s)}` }] : [];
    return custom ? own.concat(tour) : tour.length ? tour : own;
  }

  /* 사진 슬라이드 — items를 ms마다 서서히 바꿈 (items가 없으면 지역마다 대표 사진 1장씩, 순서는 매번 섞음).
     사진 두 장을 번갈아 쓰며 다음 사진이 다 받아진 뒤에 바꾸고, 출처(저작자 표시)도 같이 바꾼다.
     '동작 줄이기' 설정이면 첫 장만. host가 화면에서 빠지면 스스로 멈춘다. */
  function slideshow(host, cap, ms, items) {
    let list = items;
    if (!list) {
      list = REGIONS.map(r => regionPhotoList(r.id)[0]).filter(Boolean);
      for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
    }
    if (!host || !list.length) return;
    host.innerHTML = `<img alt="" referrerpolicy="no-referrer"><img alt="" referrerpolicy="no-referrer">`;
    const imgs = host.querySelectorAll("img");
    let i = 0, front = imgs[0];
    const caption = k => { if (cap) cap.textContent = list[k % list.length].caption; };
    front.src = list[0].src; front.classList.add("on"); caption(0);
    if (list.length < 2 || root.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      if (!host.isConnected) return clearInterval(t);
      const back = front === imgs[0] ? imgs[1] : imgs[0], k = ++i;
      back.onload = () => { back.classList.add("on"); front.classList.remove("on"); front = back; caption(k); };
      back.src = list[k % list.length].src; // 못 받으면 onload가 없으니 지금 사진 그대로
    }, ms || 4000);
  }

  /* ---------- 로그인 · 가입 신청 (시연용) ----------
     계정은 이 브라우저(localStorage)에만 두고 공용 DB로 보내지 않는다. 비밀번호는 SHA-256 해시만 저장.
     운영 전환 때 이 묶음을 Supabase Auth(signUp · signInWithPassword · signOut)로 바꾸고 schema.sql 정책을 로그인 기준으로 바꾼다. */
  const AUTH = { accounts: "aiieum-accounts-v1", session: "aiieum-session" };
  const TEST_LOGIN = true; // 테스트판: 아무 메일·비밀번호로 로그인. 운영 전환 때 false로
  const DEMO_ADMIN = { email: "admin@ai-ieum.test", pw: "aiieum-demo", name: "광역 관리자" }; // README '시연 계정'과 같게
  async function pwHash(email, pw) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`aiieum:${email.toLowerCase()}:${pw}`));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
  }
  const publicAcct = a => { const { pw, ...rest } = a; return rest; };
  const auth = {
    TEST_LOGIN,
    session: () => lsRead(AUTH.session, null),
    accounts: () => (lsRead(AUTH.accounts, []) || []).map(publicAcct),
    /** 비밀번호 규칙: 8자 이상, 영문·숫자 모두 */
    pwProblem: pw => pw.length < 8 ? "비밀번호는 8자 이상이어야 해요" : !(/[A-Za-z]/.test(pw) && /\d/.test(pw)) ? "영문과 숫자를 함께 써주세요" : "",
    async signUp(f) {
      const email = f.email.trim().toLowerCase(), list = lsRead(AUTH.accounts, []) || [];
      if (list.some(a => a.email === email)) throw new Error("이미 가입 신청한 메일이에요");
      // 운영: status "pending" → 광역 관리자 승인. 시연판은 바로 승인
      const acct = { email, name: f.name.trim(), region: f.region, dept: f.dept.trim(), title: (f.title || "").trim(), phone: (f.phone || "").trim(),
        role: "manager", status: "approved", createdAt: new Date().toISOString(), pw: await pwHash(email, f.pw) };
      list.push(acct); lsWrite(AUTH.accounts, list);
      return publicAcct(acct);
    },
    async signIn(email, pw, role) {
      email = email.trim().toLowerCase();
      if (role === "admin") {
        if (!TEST_LOGIN && (email !== DEMO_ADMIN.email || pw !== DEMO_ADMIN.pw)) throw new Error("메일 또는 비밀번호가 맞지 않아요");
        const s = { email, name: DEMO_ADMIN.name, role: "admin", test: TEST_LOGIN || undefined, at: new Date().toISOString() };
        lsWrite(AUTH.session, s); return s;
      }
      const a = (lsRead(AUTH.accounts, []) || []).find(x => x.email === email);
      if (TEST_LOGIN && !a) { // 가입하지 않은 메일 → 테스트 계정 (지역은 직접 고름)
        const s = { email, name: email.split("@")[0] || "테스트", role: "manager", test: true, at: new Date().toISOString() };
        lsWrite(AUTH.session, s); return s;
      }
      if (!a || a.pw !== await pwHash(email, pw)) throw new Error("메일 또는 비밀번호가 맞지 않아요");
      if (a.status !== "approved") throw new Error("광역 관리자 승인을 기다리고 있어요");
      const s = { email, name: a.name, region: a.region, dept: a.dept, role: a.role, at: new Date().toISOString() };
      lsWrite(AUTH.session, s); return s;
    },
    /** 계정 없이 둘러보기 (시연) */
    demo(role) { const s = { demo: true, role: role || "manager", name: role === "admin" ? DEMO_ADMIN.name : "시연 계정", at: new Date().toISOString() }; lsWrite(AUTH.session, s); return s; },
    signOut() { lsRemove(AUTH.session); }
  };

  root.Shared = { SIDO, SIDO_LABEL, REGIONS, themeBtn, auth, slideshow, regionPhotoList, regionOf, THEME, ASSETS, TRENDS, assetsIn, candOf, candidates,
    KEY, read, write, remove, REMOTE, CFG, init, refresh, nextPlanId, PHOTOS, photoUrl, photoCredit, resetRegionPhoto, regionSettings, saveRegionSettings, resetRegionColor,
    defaultTemplates, templates, disabledIds, enabledTemplates, scenesOf, seed, loadDB, saveDB, mergeDB,
    ROLE, SRC, HOOK, STATUS, esc, fmt, day, hash, screen, R };
})(window);
