import test from 'node:test';
import assert from 'node:assert/strict';
import {queryLibrary} from '../skills/consult-tavernweave-library/scripts/query-library.mjs';

for (const intent of ['前端沙盒','联合模拟多个前端','状态对照','滑条调试','封装前打磨，变量注入先确认']) {
  test(`sandbox route: ${intent}`,()=>{
    const result=queryLibrary({intent,write:true,catalogLimit:0});
    assert.deepEqual(result.routeIds,['sillytavern-embedded-ui']);
    assert.deepEqual(result.standing,['ST-A0']);
  });
}
test('real-host failure still includes runtime-debug; explicit owner remains authoritative',()=>{
  assert.ok(queryLibrary({intent:'前端沙盒正常，但真实酒馆不更新'}).routeIds.includes('sillytavern-runtime-debug'));
  assert.deepEqual(queryLibrary({skill:'sillytavern-runtime-debug',intent:'前端沙盒正常'}).routeIds,['sillytavern-runtime-debug']);
});
test('work-source research routing remains independent of sandbox wording',()=>{
  assert.deepEqual(queryLibrary({intent:'作品资料库中记录前端沙盒方案'}).routeIds,['build-work-library']);
});
