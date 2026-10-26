import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
const script = await readFile(new URL("../public/theme-init.js",import.meta.url),"utf8");
test("tema awal memakai pilihan tersimpan atau sistem; storage ditolak tetap mengikuti sistem", () => {
  for (const [saved, dark, error, expected] of [["gelap",false,false,"gelap"],["terang",true,false,"terang"],[null,true,false,"gelap"],["sistem",false,false,"terang"],["rusak",true,false,"gelap"],[null,true,true,"gelap"]]) {
    const document = { documentElement: { dataset: {} } };
    runInNewContext(script, { document, matchMedia: ()=>({matches:dark}), localStorage:{getItem(key){assert.equal(key,"beanstory:tema:v1");if(error)throw new Error();return saved;}} });
    assert.equal(document.documentElement.dataset.theme,expected);
  }
});
