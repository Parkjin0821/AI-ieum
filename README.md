# AI-이음

> 요즘 뜨는 주제 × 우리 지역 관광자원을 이어 숏폼 초안을 만들고,
> **지역 담당자가 세 번 확인한 뒤 직접 올리는** 지역 홍보 도구 — 2026 마이AI랩 공모전 (3인 팀)

| 사이트 | 주소 | 하는 일 |
|---|---|---|
| 사용자 | https://ai-ieum.vercel.app | 로그인 → 지역 고르기 → 형식 고르기 → 대화로 주제 정하기 → 1·2·3차 확인 |
| 관리자 | 팀원에게만 따로 공유 (아직 로그인 보호 없음) | 개요(현황판), 지역·담당자·색·슬로건·사진, 템플릿, 콘텐츠·결정 기록, 저장·백업 |

- 대상 지역: **전남광주통합특별시**(2026-07-01 출범, 옛 광주 5개 구 + 옛 전남 22개 시군) · **전북특별자치도** 14개 시군 — 41곳
- 두 사이트는 **서로 다른 주소(도메인)** 에 따로 올라갑니다. 지금은 공용 DB(Supabase)가 연결되지 않아 각 사이트가 그 브라우저에만 저장하는 **시연용** 상태예요.
- 위 배포 주소는 GitHub에 올린다고 바뀌지 않아요. 새 화면을 배포하려면 아래 [배포](#배포)를 실행해야 해요.

---

## 바뀌지 않는 원칙

1. **3번의 확인** — 1차 주제 → 2차 내용·저작권 → 3차 게시. 순서를 건너뛸 수 없음
2. **자동 게시 없음** — 3차 통과 뒤 담당자가 내려받아 직접 올림. 업로드 API 코드 없음
3. **모든 결정 기록** — 통과·반려마다 누가·언제·왜. 반려는 사유 필수, 기록 삭제 없음
4. **2차 점검표 6개 강제** — 사실 · 날짜(추모·기념 기간) · 표현 · 저작권 · 실제 장소 AI 미생성 · 'AI 활용' 표시
5. **실제 장소는 AI로 그리지 않음** — 관광공사 실사 사진 우선, 변경 금지 사진은 원본 비율
6. **Veo · Kling 병행** — 장면마다 두 후보를 나란히 보고 고름, 둘 다 안 되면 그 장면만 재생성

---

## 디자인 — 지자체 누리집 벤치마킹

쓰는 사람이 시·군·구 공무원이라, 매일 보는 **지자체 누리집과 같은 구성**으로 만들었어요. 전남·광주·전북·목포·여수·순천·전주 누리집과 범정부 디자인 시스템(KRDS)을 조사해 공통 요소를 옮겼습니다.

| 누리집 공통 요소 | AI-이음에서 |
|---|---|
| 얇은 안내 띠 + 기관명 헤더 + 가로 메뉴 | 위 안내 띠(담당자·설정·화면 모드) · `AI-이음 \| 사용자` · 가로 메뉴(로그인 뒤에만) |
| 메인 비주얼: 대표 사진 + 슬로건 | 그 지역 관광공사 사진이 4초마다 바뀌고, 큰 글씨는 지자체 **공식 슬로건**(없으면 대표 명소 문구) |
| 자주 찾는 메뉴(원형 아이콘) | 관리자 개요 6칸 · 사용자 메인 비주얼 3칸 |
| 공지 게시판(탭 + 목록 + 날짜) | 관리자 개요 '최근 결정 기록' (전체·확인 요청·통과·반려) |
| 위치 표시(홈 › …) · 제목 아래 선 | 관리자 모든 화면 |
| 흰 바탕 + 상징색은 포인트만 · 진한 회색 푸터 | 지역 색은 메뉴 밑줄·버튼·링크에만, 바탕은 흰색·옅은 회색 |

- **지역 색·슬로건**: 각 누리집의 대표색(공식 CI 색 아님)과 공식 슬로건 33곳 — 출처·신뢰도는 [docs/region-brand.md](docs/region-brand.md). 관리자 '지역 · 담당자'에서 고칠 수 있음
- **관리자 기본색**: KRDS 주조색 `#256EF4`
- **모서리·글자**: KRDS 기준 (버튼·입력 6px, 카드 10~12px, 본문 16px)
- **다크 모드**: 시스템 설정을 따르고, 위 안내 띠의 `◐ 화면`으로 밝게·어둡게 고정

---

## 어디에 무엇이 있나

```
AI-이음/
├─ apps/                     두 사이트 (각각 따로 배포)
│  ├─ user/index.html        사용자 사이트 전체 (로그인·회원가입 + 화면 4개 + 팝업)
│  ├─ admin/index.html       관리자 사이트 전체 (로그인 + 화면 5개 + 팝업)
│  └─ */config.js            공용 DB 주소·키, 두 사이트 주소 (배포 때 자동 생성)
├─ shared/                   두 사이트가 함께 쓰는 코드
│  ├─ ai-ieum.css            디자인 (색 토큰·다크 모드·헤더·메인 비주얼·로그인·결재란·9:16 미리보기)
│  ├─ shared.js              지역 41곳·색·슬로건·사진, 로그인(시연용), 사진 슬라이드, 저장(공용 DB ↔ 브라우저), 후보 만들기
│  ├─ workflow.js            1·2·3차 확인 규칙 (상태 전이 · 점검표 · 반려 사유)
│  ├─ template-rules.js      템플릿 검사 규칙 (4·6·8초 · 15~45초 · 마지막은 정보 장면 …)
│  ├─ templates-data.js      템플릿 사본 (data/templates.json에서 자동 생성 — 직접 고치지 않음)
│  └─ region-photos.js       관광공사 사진 41곳 205장 (npm run photos로 자동 생성 — 직접 고치지 않음)
├─ data/templates.json       숏폼 템플릿 12개 원본 (분야 4 × 연령 3 = 12유형 모두 커버)
├─ docs/
│  ├─ region-brand.md        지역별 슬로건 · 대표색 · 출처 · 신뢰도
│  ├─ references.md          해외 관광청 숏폼 레퍼런스 38건 · 9:16 안전 영역 · 12유형 커버 표
│  ├─ data-model.md          DB 표 구조 · 상태 전이 · 브라우저 저장 키
│  └─ deploy.md              배포 방법 (Vercel 2개 + Supabase 1개)
├─ supabase/schema.sql       공용 DB 표 · 기록 수정/삭제 금지 · 1차 건너뛰기 금지
├─ scripts/
│  ├─ serve.mjs              로컬 미리보기 (사용자 :5178 · 관리자 :5179 · 가짜 DB :5180)
│  ├─ mock-db.mjs            로컬용 가짜 Supabase (메모리 저장)
│  ├─ build.mjs              배포용 dist/user · dist/admin 만들기
│  ├─ deploy-vercel.mjs      빌드 → Vercel 두 사이트 배포 (토큰 파일 자동 삭제)
│  ├─ sync-templates.mjs     data/templates.json → shared/templates-data.js
│  ├─ sync-photos.mjs        관광공사 TourAPI → shared/region-photos.js (공공누리 1유형만)
│  ├─ validate-templates.mjs 템플릿 규칙 검사
│  └─ check-syntax.mjs       페이지 스크립트 문법 검사 (실행 없이 컴파일만)
├─ tests/
│  ├─ workflow.test.cjs      확인 규칙 · 템플릿 규칙 · 업로드 API 없음 확인
│  ├─ mock-db.test.mjs       DB 규칙 (기록 수정 금지 · 1차 건너뛰기 금지)
│  └─ sync-photos.test.mjs   사진 수집 (법정동 이름 맞추기 · 통합특별시 · 1유형 거르기)
└─ package.json              실행 명령 모음
```

### 화면별로 코드 찾기

| 화면 | 파일 | 찾을 함수 |
|---|---|---|
| 로그인 · 회원가입 | `apps/user/index.html` | `viewLogin`, `viewSignup`, `logout` |
| 지역 고르기 (통합특별시는 옛 광주·옛 전남으로 묶음) | `apps/user/index.html` | `viewRegion` |
| 템플릿 고르기 (메인 비주얼 · 분야·연령 필터) | `apps/user/index.html` | `hero`, `viewTemplates`, `openTemplate` |
| 대화로 만들기 (후보 카드) | `apps/user/index.html` | `viewStudio`, `fetchCands`, `sendGate1` |
| 확인함 (결재란 · 2차 장면 비교 · 3차 게시) | `apps/user/index.html` | `viewReview`, `detail`, `bindDetail`, `openReject` |
| 관리자 로그인 | `apps/admin/index.html` | `viewLogin` |
| 관리자 개요 (현황판 · 자주 찾는 메뉴 · 합격선 · 결정 기록 게시판) | `apps/admin/index.html` | `viewHome` |
| 지역·담당자 (색 · 슬로건 · 사진 · 교차 확인) | `apps/admin/index.html` | `viewRegions`, `editPhoto` |
| 템플릿 관리 (편집 · 실시간 검사) | `apps/admin/index.html` | `viewTemplates`, `editTemplate` |
| 콘텐츠·기록 (CSV · JSON 내려받기) | `apps/admin/index.html` | `viewData`, `planDetail` |
| 저장·백업 | `apps/admin/index.html` | `viewStorage` |
| 확인 규칙 자체 | `shared/workflow.js` | `transition`, `gate2Blockers` |
| 지역 · 색 · 슬로건 · 사진 · 로그인 | `shared/shared.js` | `SIDO`, `THEME`, `BRAND`, `regionSettings`, `regionPhotoList`, `slideshow`, `auth` |

---

## 실행하기

Node.js 20 이상이 필요해요. 설치할 패키지는 없습니다.

```bash
npm run dev
```
- 사용자 http://127.0.0.1:5178 · 관리자 http://127.0.0.1:5179 (서로 다른 주소 = 실제 배포와 같은 구조)
- 가짜 공용 DB(:5180)가 함께 떠서 두 사이트가 데이터를 공유해요. 끄면 내용은 사라져요
- `npm run dev:local` 은 DB 없이 (각 사이트에만 저장)

> **테스트 로그인** — 지금은 사용자·관리자 모두 **아무 메일·비밀번호**로 들어갈 수 있어요 (`shared/shared.js`의 `TEST_LOGIN = true`). 사용자 사이트에서 회원가입한 메일이면 그 계정(소속 지역)으로 들어가요. `TEST_LOGIN`을 끄면 관리자는 `admin@ai-ieum.test` / `aiieum-demo`만 통과해요.

검사 (문법 → 템플릿 규칙 → 테스트 23개):
```bash
npm run check
```

템플릿을 고쳤다면 `data/templates.json`을 고친 뒤:
```bash
npm run sync
```

관광공사 사진을 다시 받으려면 프로젝트 폴더 `.env`에 `TOURAPI_KEY=발급키`(공공데이터포털 '한국관광공사_국문 관광정보 서비스_GW')를 넣고:
```bash
npm run photos
```
`.env`는 커밋되지 않아요. 사진은 파일로 저장되므로 배포에는 키가 필요 없어요.

## 배포

```bash
node scripts/deploy-vercel.mjs
```
처음 한 번은 `npx vercel login`을 본인이 직접 해야 해요. 공용 DB 연결 방법은 [docs/deploy.md](docs/deploy.md).

---

## 지금 상태와 남은 일

- [x] 사용자·관리자 사이트 분리, Vercel 배포
- [x] 해외 레퍼런스 기반 템플릿 12개 · 규칙 검사 · 테스트 23개 · 문법 검사
- [x] 지자체 누리집 벤치마킹 리디자인 · 다크 모드 · 전남광주통합특별시 반영
- [x] 지역 슬로건 33곳 · 누리집 대표색 41곳 · 관광공사 사진 41곳 205장
- [x] 로그인 · 회원가입 화면 (시연용 — 계정은 그 브라우저에만, 회원가입은 바로 승인)
- [ ] **Supabase 연결** — 연결 전에는 팀원끼리 데이터가 공유되지 않음
- [ ] 실제 로그인으로 교체 — Supabase Auth + 광역 관리자 승인 + DB 정책을 로그인 기준으로 (지금은 화면만 막고 데이터는 누구나 읽고 씀). 교체 때 `TEST_LOGIN = false`
- [ ] 2차 점검표 · 장면 선택을 서버(Edge Function)에서도 검사
- [ ] 가짜 후보 API를 실제 수집·연결 백엔드로 교체 (`?api=백엔드주소`로 바꿀 수 있게 되어 있음)
- [ ] 지역 고르기 타일 사진도 관광공사 사진으로 (지금은 위키미디어)
- [ ] 슬로건 미확인 8곳 확정 · 무안 새 도시브랜드(2026-10 공모) 반영 — [docs/region-brand.md](docs/region-brand.md)
- [ ] 연령 3구간 경계 팀 확정 (지금은 20대 · 30~40대 · 50대 이상 임시)

## 사진 출처

- **한국관광공사** TourAPI 사진 205장 — 공공누리 **제1유형**(출처표시)만 사용. 화면에 '사진 한국관광공사 · 공공누리 제1유형'으로 표시 (`shared/region-photos.js`)
- **위키미디어 공용** CC·퍼블릭 도메인 사진 41장 — 지역 고르기 타일과 관광공사 사진이 없을 때. 저작자·라이선스는 지역 타일과 '사진 출처'에 표시, 목록은 `shared/shared.js`의 `PHOTOS`
- 해외 레퍼런스는 영상을 내려받지 않고 공개 페이지의 형식 구조만 참고했어요 ([docs/references.md](docs/references.md))
