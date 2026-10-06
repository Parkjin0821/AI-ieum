// 관광공사 사진 수집 — 키 없이 확인할 수 있는 부분 (법정동 이름 맞추기 · 1유형 거르기)
import test from "node:test";
import assert from "node:assert/strict";
import { loadRegions, matchRegions, pickPhotos } from "../scripts/sync-photos.mjs";

const regions = loadRegions();
const ids = regions.map(r => r.id);

test("앱 지역 41곳을 shared.js에서 그대로 읽는다", () => {
  assert.equal(regions.length, 41);
  assert.ok(ids.includes("광주 북구") && ids.includes("전남 목포시") && ids.includes("전북 전주시"));
});

const signguOf = short => regions.filter(r => r.short === short).map((r, i) => ({ code: `${short}${i}`, name: r.name }));

test("통합 전 이름(광주광역시·전라남도·전북특별자치도)으로 41곳 모두 맞춘다", () => {
  const regns = [{ code: "29", name: "광주광역시" }, { code: "46", name: "전라남도" }, { code: "52", name: "전북특별자치도" }, { code: "27", name: "대구광역시" }];
  const { codes, missing } = matchRegions(regions, regns, { 29: signguOf("광주"), 46: signguOf("전남"), 52: signguOf("전북"), 27: [{ code: "x", name: "북구" }] });
  assert.deepEqual(missing, []);
  assert.equal(codes["광주 북구"].regn, "29"); // 대구 북구와 섞이지 않음
});

test("통합특별시 하나에 광주 구와 전남 시군이 함께 있어도 맞춘다", () => {
  const regns = [{ code: "99", name: "전남광주통합특별시" }, { code: "52", name: "전북특별자치도" }];
  const { codes, missing } = matchRegions(regions, regns, { 99: signguOf("광주").concat(signguOf("전남")), 52: signguOf("전북") });
  assert.deepEqual(missing, []);
  assert.equal(codes["광주 동구"].regn, "99");
  assert.equal(codes["전남 여수시"].regn, "99");
});

test("시 아래 구가 따로 있으면(전주시 완산구·덕진구) 구 코드도 함께 찾는다", () => {
  const jb = signguOf("전북").concat([{ code: "111", name: "전주시 완산구" }, { code: "113", name: "전주시 덕진구" }]);
  const { codes } = matchRegions(regions, [{ code: "52", name: "전북특별자치도" }], { 52: jb });
  assert.deepEqual([...codes["전북 전주시"].subs], ["111", "113"]); // vm에서 온 배열이라 값만 비교
  assert.equal(codes["전북 군산시"].subs.length, 0);
});

test("못 맞춘 지역은 빠진 목록으로 알려준다", () => {
  const { missing } = matchRegions(regions, [{ code: "52", name: "전북특별자치도" }], { 52: signguOf("전북") });
  assert.equal(missing.length, 27);
});

test("사진은 공공누리 1유형만, 같은 사진은 한 번, https로, 최대 n장", () => {
  const items = [
    { title: "A", firstimage: "http://tong.visitkorea.or.kr/a.jpg", cpyrhtDivCd: "Type1" },
    { title: "B", firstimage: "http://tong.visitkorea.or.kr/b.jpg", cpyrhtDivCd: "Type3" },
    { title: "A2", firstimage: "http://tong.visitkorea.or.kr/a.jpg", cpyrhtDivCd: "Type1" },
    { title: "C", firstimage: "", cpyrhtDivCd: "Type1" },
    { title: "D", firstimage: "https://tong.visitkorea.or.kr/d.jpg", cpyrhtDivCd: "Type1" },
    { title: "E", firstimage: "https://tong.visitkorea.or.kr/e.jpg", cpyrhtDivCd: "Type1" }
  ];
  assert.deepEqual(pickPhotos(items, 2), [{ src: "https://tong.visitkorea.or.kr/a.jpg", title: "A" }, { src: "https://tong.visitkorea.or.kr/d.jpg", title: "D" }]);
});
