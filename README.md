# AI-이음

> 요즘 뜨는 주제 × 우리 지역 관광자원을 이어 숏폼 초안을 만들고,
> **지역 담당자가 세 번 확인한 뒤 직접 올리는** 지역 홍보 도구 — 2026 마이AI랩 공모전 (3인 팀)

| 사이트 | 주소 | 하는 일 |
|---|---|---|
| 사용자 | https://ai-ieum.vercel.app | 지역 고르기 → 형식 고르기 → 대화로 주제 정하기 → 1·2·3차 확인 |
| 관리자 | https://ai-ieum-admin.vercel.app | 템플릿 관리, 지역·담당자·색·사진, 콘텐츠·결정 기록, 저장·백업 |

두 사이트는 **서로 다른 주소(도메인)** 에 따로 올라갑니다. 지금은 공용 DB(Supabase)가 연결되지 않아 각 사이트가 그 브라우저에만 저장하는 **시연용** 상태예요.

---

## 바뀌지 않는 원칙

1. **3번의 확인** — 1차 주제 → 2차 내용·저작권 → 3차 게시. 순서를 건너뛸 수 없음
2. **자동 게시 없음** — 3차 통과 뒤 담당자가 내려받아 직접 올림. 업로드 API 코드 없음
3. **모든 결정 기록** — 통과·반려마다 누가·언제·왜. 반려는 사유 필수, 기록 삭제 없음
4. **2차 점검표 6개 강제** — 사실 · 날짜(추모·기념 기간) · 표현 · 저작권 · 실제 장소 AI 미생성 · 'AI 활용' 표시
5. **실제 장소는 AI로 그리지 않음** — 관광공사 실사 사진 우선, 변경 금지 사진은 원본 비율
6. **Veo · Kling 병행** — 장면마다 두 후보를 나란히 보고 고름, 둘 다 안 되면 그 장면만 재생성

---

## 어디에 무엇이 있나

```
AI-이음/
├─ apps/                     두 사이트 (각각 따로 배포)
│  ├─ user/
│  │  ├─ index.html          사용자 사이트 전체 (화면 4개 + 팝업)
│  │  └─ config.js           공용 DB 주소·키, 두 사이트 주소 (배포 때 자동 생성)
│  └─ admin/
│     ├─ index.html          관리자 사이트 전체 (화면 5개 + 팝업)
│     └─ config.js           〃
├─ shared/                   두 사이트가 함께 쓰는 코드
│  ├─ ai-ieum.css            디자인 (색·버튼·탭·필터·결재란·9:16 미리보기)
│  ├─ shared.js              지역 41곳·지역 색·사진, 시연 데이터, 저장(공용 DB ↔ 브라우저), 후보 만들기
│  ├─ workflow.js            1·2·3차 확인 규칙 (상태 전이 · 점검표 · 반려 사유)
│  ├─ template-rules.js      템플릿 검사 규칙 (4·6·8초 · 15~45초 · 마지막은 정보 장면 …)
│  └─ templates-data.js      템플릿 사본 (data/templates.json에서 자동 생성 — 직접 고치지 않음)
├─ data/
│  └─ templates.json         숏폼 템플릿 12개 원본 (분야 4 × 연령 3 = 12유형 모두 커버)
├─ docs/
│  ├─ references.md          해외 관광청 숏폼 레퍼런스 38건 · 9:16 안전 영역 · 12유형 커버 표
│  ├─ data-model.md          DB 표 구조 · 상태 전이 · 브라우저 저장 키
│  └─ deploy.md              배포 방법 (Vercel 2개 + Supabase 1개)
├─ supabase/
│  └─ schema.sql             공용 DB 표 · 기록 수정/삭제 금지 · 1차 건너뛰기 금지 (Supabase SQL Editor에서 실행)
├─ scripts/
│  ├─ serve.mjs              로컬 미리보기 (사용자 :5178 · 관리자 :5179 · 가짜 DB :5180)
│  ├─ mock-db.mjs            로컬용 가짜 Supabase (메모리 저장)
│  ├─ build.mjs              배포용 dist/user · dist/admin 만들기
│  ├─ deploy-vercel.mjs      빌드 → Vercel 두 사이트 배포 (토큰 파일 자동 삭제)
│  ├─ sync-templates.mjs     data/templates.json → shared/templates-data.js
│  └─ validate-templates.mjs 템플릿 규칙 검사 (CI용)
├─ tests/
│  ├─ workflow.test.cjs      확인 규칙 · 템플릿 규칙 · 업로드 API 없음 확인
│  └─ mock-db.test.mjs       DB 규칙 (기록 수정 금지 · 1차 건너뛰기 금지)
└─ package.json              실행 명령 모음
```

### 화면별로 코드 찾기

| 화면 | 파일 | 찾을 함수 |
|---|---|---|
| 지역 고르기 | `apps/user/index.html` | `viewRegion` |
| 템플릿 고르기 (분야·연령 필터) | `apps/user/index.html` | `viewTemplates`, `openTemplate` |
| 대화로 만들기 (후보 카드) | `apps/user/index.html` | `viewStudio`, `fetchCands`, `sendGate1` |
| 확인함 (결재란 · 2차 장면 비교 · 3차 게시) | `apps/user/index.html` | `viewReview`, `detail`, `bindDetail`, `openReject` |
| 관리자 개요 (합격선 · 최근 기록) | `apps/admin/index.html` | `viewHome` |
| 지역·담당자 (색 · 사진 · 교차 확인) | `apps/admin/index.html` | `viewRegions`, `editPhoto` |
| 템플릿 관리 (편집 · 실시간 검사) | `apps/admin/index.html` | `viewTemplates`, `editTemplate` |
| 콘텐츠·기록 (CSV · JSON 내려받기) | `apps/admin/index.html` | `viewData`, `planDetail` |
| 저장·백업 | `apps/admin/index.html` | `viewStorage` |
| 확인 규칙 자체 | `shared/workflow.js` | `transition`, `gate2Blockers` |
| 지역 목록 · 색 · 사진 | `shared/shared.js` | `SIDO`, `THEME`, `PHOTOS`, `regionSettings` |

---

## 실행하기

Node.js 20 이상이 필요해요. 설치할 패키지는 없습니다.

```bash
node scripts/serve.mjs
```
- 사용자 http://127.0.0.1:5178 · 관리자 http://127.0.0.1:5179 (서로 다른 주소 = 실제 배포와 같은 구조)
- 가짜 공용 DB(:5180)가 함께 떠서 두 사이트가 데이터를 공유해요. 끄면 내용은 사라져요
- `node scripts/serve.mjs --local` 은 DB 없이 (각 사이트에만 저장)

검사:
```bash
node scripts/validate-templates.mjs
```
```bash
node --test tests/workflow.test.cjs tests/mock-db.test.mjs
```

템플릿을 고쳤다면 `data/templates.json`을 고친 뒤:
```bash
node scripts/sync-templates.mjs
```

## 배포

```bash
node scripts/deploy-vercel.mjs
```
처음 한 번은 `npx vercel login`을 본인이 직접 해야 해요. 공용 DB 연결 방법은 [docs/deploy.md](docs/deploy.md).

---

## 지금 상태와 남은 일

- [x] 사용자·관리자 사이트 분리, Vercel 배포
- [x] 지역 먼저 고르기 · 지역별 색과 사진 · 담당자 1인 승인
- [x] 해외 레퍼런스 기반 템플릿 12개 · 규칙 검사 · 테스트 17개
- [ ] **Supabase 연결** — 연결 전에는 팀원끼리 데이터가 공유되지 않음
- [x] 로그인 · 가입 신청 화면 (시연용 — 계정은 그 브라우저에만, 가입 신청은 바로 승인)
- [ ] 실제 로그인으로 교체 — Supabase Auth + 광역 관리자 승인 + DB 정책을 로그인 기준으로 (지금은 화면만 막고 데이터는 누구나 읽고 씀)

> **시연 계정** — 관리자: `admin@ai-ieum.test` / `aiieum-demo` (또는 '시연 관리자로 들어가기'). 사용자 사이트는 가입 신청으로 직접 만들거나 '계정 없이 시연으로 둘러보기'.
- [ ] 2차 점검표 · 장면 선택을 서버(Edge Function)에서도 검사
- [ ] 가짜 후보 API를 실제 수집·연결 백엔드로 교체 (`?api=백엔드주소`로 바꿀 수 있게 되어 있음)
- [ ] 지역 사진을 관광공사 사진(TourAPI)으로 교체
- [ ] 연령 3구간 경계 팀 확정 (지금은 20대 · 30~40대 · 50대 이상 임시)

## 사진 출처

지역 사진 41장은 위키미디어 공용의 CC·퍼블릭 도메인 사진이에요. 저작자·라이선스는 사이트 안 지역 타일과 "사진 출처"에 표시돼 있고, 목록은 `shared/shared.js`의 `PHOTOS`에 있어요. 해외 레퍼런스는 영상을 내려받지 않고 공개 페이지의 형식 구조만 참고했어요 ([docs/references.md](docs/references.md)).
