# 배포 — 사용자·관리자를 서로 다른 주소로

## 지금 배포된 곳 (2026-10-04)

| 사이트 | 주소 | Vercel 프로젝트 |
|---|---|---|
| 사용자 | https://ai-ieum.vercel.app | `ai-ieum` |
| 관리자 | https://ai-ieum-admin.vercel.app | `ai-ieum-admin` |

- Vercel 계정: parkjin8326@gmail.com (팀 `parkjin8326-dots-projects`)
- 공용 DB는 아직 **미연결**입니다. 그래서 두 사이트는 각자 그 브라우저에만 저장합니다.

**다시 올리기**: 아래 명령 한 줄로 빌드 → 연결 → 토큰 파일 삭제 → 두 사이트 배포까지 합니다.
```bash
node scripts/deploy-vercel.mjs
```

> ⚠ `vercel link`를 하면 배포 폴더에 접근 토큰 파일(`.env.local`)이 생깁니다. 스크립트가 이 파일을 지우고, 남아 있으면 배포를 중단합니다. 손으로 올릴 때도 꼭 지우세요.

| 무엇 | 어디에 | 예시 주소 |
|---|---|---|
| 사용자 사이트 (`dist/user`) | Vercel 프로젝트 ① | `https://ai-ieum.vercel.app` |
| 관리자 사이트 (`dist/admin`) | Vercel 프로젝트 ② | `https://ai-ieum-admin.vercel.app` |
| 공용 DB | Supabase 프로젝트 1개 | `https://xxxx.supabase.co` |

두 사이트는 도메인이 달라서 브라우저 저장소를 공유하지 못합니다. **Supabase가 없으면 관리자에서 바꾼 템플릿·지역 색이 사용자 사이트에 반영되지 않습니다.**
Vercel 대신 Netlify 사이트 2개를 써도 됩니다. 둘 다 그냥 정적 파일입니다.

## 1. Supabase (공용 DB) — 한 번만

1. supabase.com에서 새 프로젝트를 만듭니다. 리전은 Seoul(ap-northeast-2)을 권장합니다.
2. SQL Editor → `supabase/schema.sql` 전체를 붙여 넣고 Run합니다.
3. Project Settings → API에서 **Project URL**과 **anon public** 키를 복사합니다.
   - `service_role` 키는 절대 쓰지 않습니다. 페이지에 들어가면 누구나 DB 전체 권한을 갖게 됩니다.

## 2. 빌드

```bash
SUPABASE_URL=https://xxxx.supabase.co SUPABASE_ANON_KEY=eyJ... USER_URL=https://ai-ieum.vercel.app ADMIN_URL=https://ai-ieum-admin.vercel.app node scripts/build.mjs
```

`dist/user`와 `dist/admin`이 생깁니다.
- 각 폴더에는 그 사이트에 필요한 파일만 들어갑니다. 발표 자료 pptx·pdf는 들어가지 않습니다.
- 첫 접속 때 DB가 비어 있으면 시연 데이터가 자동으로 들어갑니다.

## 3. Vercel에 두 프로젝트로

```bash
npx vercel deploy dist/user --prod --name ai-ieum
```
```bash
npx vercel deploy dist/admin --prod --name ai-ieum-admin
```

처음이면 `npx vercel login`이 먼저 필요합니다. 이건 본인 계정으로 직접 하세요.

## 4. 관리자 사이트 보호 — 꼭 확인

- 지금 정책은 **로그인 없는 시연용**입니다. anon 키는 페이지에 그대로 보이니, 주소를 아는 사람은 템플릿·지역 설정도 바꿀 수 있습니다.
- 팀 미리보기 단계: 관리자 주소는 팀원에게만 공유합니다. Vercel Deployment Protection은 요금제에 따라 쓸 수 있습니다.
- 실제 지자체 운영 전: Supabase Auth로 담당자·관리자 로그인을 붙입니다. `schema.sql` 맨 아래 정책을 아래처럼 바꿉니다.
  - 담당자는 자기 지역만 읽고 쓰기
  - `app_config` 쓰기는 관리자만
- DB에서 이미 막혀 있는 것:
  - 결정 기록 수정·삭제
  - 콘텐츠 삭제
  - 1차를 건너뛰는 상태 변경
- 아직 화면에서만 검사하는 것: 2차 점검표 6개·장면 선택 → 운영 전 Supabase Edge Function으로 서버 검사를 추가해야 합니다.

## 로컬에서 미리 확인

```bash
node scripts/serve.mjs
```

사용자는 :5178, 관리자는 :5179에서 서로 다른 주소로 뜹니다. 가짜 공용 DB는 :5180입니다(메모리에만 저장되고, 끄면 사라짐).
`--local`을 붙이면 공용 DB 없이 뜹니다. 두 사이트가 서로의 데이터를 못 보는 상태를 확인할 때 씁니다.
