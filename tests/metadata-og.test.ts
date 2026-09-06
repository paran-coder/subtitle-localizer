import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

function jpegDimensions(buffer: Buffer) {
  assert.equal(buffer[0], 0xff);
  assert.equal(buffer[1], 0xd8);
  let offset = 2;
  const sofMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  while (offset + 8 < buffer.length) {
    if (buffer[offset] !== 0xff) { offset += 1; continue; }
    const marker = buffer[offset + 1];
    if (sofMarkers.has(marker)) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    if (marker === 0xd8 || marker === 0xd9) { offset += 2; continue; }
    const length = buffer.readUInt16BE(offset + 2);
    assert.ok(length >= 2, `invalid JPEG segment length at ${offset}`);
    offset += length + 2;
  }
  throw new Error("JPEG dimensions not found");
}

test("공통 metadata는 1200x630 OG와 Twitter large image 태그를 정의한다", () => {
  const layout = read("app/layout.tsx");
  assert.match(layout, /metadataBase: SITE_URL/);
  assert.match(layout, /openGraph:/);
  assert.match(layout, /twitter:/);
  assert.match(layout, /summary_large_image/);
  assert.match(layout, /width: 1200/);
  assert.match(layout, /height: 630/);
  assert.match(layout, /const OG_IMAGE_URL = "\/og\.png"/);
});

test("기존 확정 OG JPEG 데이터는 실제 1200x630 이미지다", () => {
  const parts = Array.from({ length: 6 }, (_, index) => {
    const source = read(`lib/og-image/part-0${index}.ts`);
    const match = source.match(/export default "([\s\S]*)";\s*$/);
    assert.ok(match, `part-0${index}.ts base64 data missing`);
    return match[1];
  });
  const image = Buffer.from(parts.join(""), "base64");
  assert.deepEqual(jpegDimensions(image), { width: 1200, height: 630 });
});

test("구버전 중복 문서와 OG 실험 데이터는 최종 트리에 남지 않는다", () => {
  assert.equal(existsSync(resolve(root, "User%20manual.md")), false);
  for (const prefix of ["compact", "final"]) {
    for (let index = 0; index < 6; index += 1) {
      assert.equal(existsSync(resolve(root, `lib/og-image/${prefix}-0${index}.ts`)), false);
    }
  }
});
