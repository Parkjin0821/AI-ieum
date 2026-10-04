# AI-이음 데이터 구조 (안)

지금 프로토타입은 이 브라우저(localStorage)에만 저장합니다. 그래서 팀원끼리, 컴퓨터끼리 데이터가 공유되지 않습니다.
운영할 때는 아래 표를 서버 DB(예: Supabase Postgres)로 옮깁니다.

기획서에 나온 `local_assets / trend_logs / content_plans / review_logs / performance_data` 다섯 개는 이름을 그대로 씁니다.
나머지 넷(`regions`, `users`, `templates`, `chat_threads`)은 이번에 추가했습니다.

| 표 | 내용 | 주요 칸 | 규칙 |
|---|---|---|---|
| `regions` | 시·군·구 계정 | id, sido, name, active, manager, cross_check, color, color2, mood, photo, photo_by, photo_license, photo_page | 관리자만 수정. `cross_check` 기본 false (담당자 한 명이 1·2·3차 확인). 사진은 출처·라이선스 없이는 저장 안 됨 |
| `users` | 담당자·관리자 | id, region_id, name, role (`manager`·`admin`) | 담당자는 자기 지역만 읽고 쓸 수 있음 |
| `local_assets` | 지역 관광자료 (관광공사) | id, region_id, name, categories, photo_license, source_url | 변경 금지 사진은 `photo_license`로 표시 → 원본 비율 유지 |
| `trend_logs` | 트렌드 수집 | id, keyword, category, age, source (데이터랩·유튜브), score, collected_at | 공식 API·공개 지수만 |
| `templates` | 숏폼 형식 | id, name, categories, ages, hook, scenes (json), references, enabled | 저장 전에 `src/template-rules.js`와 같은 규칙으로 검사 |
| `content_plans` | 콘텐츠 (확인 대상) | id, region_id, title, template_id, trend_id, asset_id, status, requested_by, chat_thread_id, parent_id, scenes (json), upload_url | 상태 전이는 서버에서 `src/workflow.js`와 같은 규칙으로만 바꿈 |
| `review_logs` | 결정 기록 | id, plan_id, kind, gate, decision, reviewer, at, reason_category, reason_text, checklist (json), scene_picks (json) | **추가만 가능, 수정·삭제 금지**. 반려는 사유 필수 |
| `chat_threads` | 대화 근거 | id, plan_id, messages (json) | "왜 이 주제였는지" 근거 |
| `performance_data` | 게시 뒤 반응 | id, plan_id, platform, views, likes, measured_at | 담당자가 직접 올린 뒤 측정. 업로드 API는 쓰지 않음 |

## 상태 전이 (서버에서도 똑같이 검사)

```
gate1_wait → 통과 → making → (초안 완료) → gate2_wait → 통과 → gate3_wait → 통과 → published
     └ 반려 → rejected            └ 반려 → rejected        └ 반려 → rejected
rejected → 다시 요청 → 새 id로 gate1_wait (parent_id = 이전 id, 이전 기록은 그대로)
```

2차 통과 조건은 세 가지입니다.
- 점검표 6개를 모두 확인
- 모든 장면에서 Veo·Kling·재생성 중 하나를 선택
- 그 지역의 `cross_check`가 켜져 있으면, 요청자와 확인자가 달라야 함

## 프로토타입 저장 키 (localStorage)

| 키 | 내용 |
|---|---|
| `aiieum-db-v3` | content_plans · review_logs · chat_threads |
| `aiieum-templates-v1` | 관리자가 고친 템플릿 (없으면 `data/templates.json`) |
| `aiieum-template-off-v1` | 사용 중지한 템플릿 id |
| `aiieum-regions-v1` | 지역 설정 (담당자·색·교차 확인·사용 여부) |
| `aiieum-region` | 사용자가 고른 지역 |
