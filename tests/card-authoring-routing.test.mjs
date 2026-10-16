import test from 'node:test';
import assert from 'node:assert/strict';
import { queryLibrary } from '../skills/consult-tavernweave-library/scripts/query-library.mjs';

for (const [intent, expectedRoutes] of [
  ['先讨论大型世界观的可玩范围', ['tavern-card-builder']],
  ['调整世界书配置，保持原有正文', ['worldbook-design-and-writing']],
  ['设计初始变量并说明知晓程度', ['tavern-card-builder']],
  ['制作纯文字卡的开场白', ['tavern-card-builder']],
  ['规划一张 MVU Zod 卡', ['tavern-card-builder']],
  ['检查 hybrid 角色卡的组件归属', ['tavern-card-builder', 'sillytavern-card-components']],
  ['帮我整理人物创作思路', ['tavern-card-builder']],
  ['写一份玩家资料并明确代演边界', ['tavern-card-builder']],
  ['安排多阶段人设的条件', ['tavern-card-builder']],
  ['根据试演正文做人设诊断', ['tavern-card-builder']],
  ['给人物纠偏，先检查原文', ['tavern-card-builder']],
  ['设计一个轻量NPC', ['tavern-card-builder']],
  ['设计一个人设', ['tavern-card-builder']],
]) {
  test(`card authoring route: ${intent}`, () => {
    const result = queryLibrary({ intent, write: true, catalogLimit: 0 });
    assert.deepEqual(result.routeIds, expectedRoutes);
    assert.deepEqual(result.standing, ['ST-A0']);
    assert.deepEqual(result.candidates, []);
  });
}

test('specific work-source and runtime owners remain available', () => {
  assert.deepEqual(queryLibrary({ intent: '作品资料库里的世界观整理' }).routeIds, ['build-work-library']);
  assert.deepEqual(queryLibrary({ skill: 'sillytavern-runtime-debug', intent: '世界书不更新' }).routeIds, ['sillytavern-runtime-debug']);
  assert.deepEqual(queryLibrary({ intent: '作品资料库中的人设来源核对' }).routeIds, ['build-work-library']);
  assert.deepEqual(queryLibrary({ skill: 'sillytavern-runtime-debug', intent: '阶段人设在真实酒馆报错' }).routeIds, ['sillytavern-runtime-debug']);
});

test('ordinary account information is not routed to player-profile authoring', () => {
  assert.deepEqual(queryLibrary({ intent: '修改系统账户信息', catalogLimit: 0 }).routeIds, []);
  assert.deepEqual(queryLibrary({ intent: '更新个人设置', catalogLimit: 0 }).routeIds, []);
  assert.deepEqual(queryLibrary({ intent: '同步个人设备', catalogLimit: 0 }).routeIds, []);
  assert.deepEqual(queryLibrary({ intent: '检查个人设备', catalogLimit: 0 }).routeIds, []);
  assert.deepEqual(queryLibrary({ intent: '介绍朝代演变', catalogLimit: 0 }).routeIds, []);
  assert.deepEqual(queryLibrary({ intent: '现代演奏形式', catalogLimit: 0 }).routeIds, []);
});

for (const [intent, expectedRoutes] of [
  ['给这张酒馆卡设计一个只在雨夜发热的旧钥匙，其他你决定', ['tavern-card-builder']],
  ['给这张酒馆卡设计一个雨夜事件', ['tavern-card-builder']],
  ['写一份这张卡的文风约定', ['tavern-card-builder']],
  ['整理卡内道具和卡内场景', ['tavern-card-builder']],
  ['查事件监听与事件回调载荷', ['sillytavern-api-reference']],
  ['设计剧情事件，并查对应的 API 事件监听', ['tavern-card-builder', 'sillytavern-api-reference']],
  ['事件监听在真实酒馆报错', ['sillytavern-api-reference', 'sillytavern-runtime-debug']],
  ['作品资料库里的剧情事件整理', ['build-work-library']],
  ['制作消息内容页', ['sillytavern-embedded-ui']],
  ['制作信件页面', ['sillytavern-embedded-ui']],
  ['制作论坛页面', ['sillytavern-embedded-ui']],
  ['制作卡内档案页', ['sillytavern-embedded-ui']],
  ['设计MVU状态栏', ['tavern-card-builder', 'sillytavern-embedded-ui']],
]) {
  test(`scoped creation and frontend route: ${intent}`, () => {
    const result = queryLibrary({ intent, write: true, catalogLimit: 0 });
    assert.deepEqual(result.routeIds, expectedRoutes);
    assert.deepEqual(result.standing, ['ST-A0']);
    assert.deepEqual(result.candidates, []);
  });
}

test('ambiguous everyday events and objects do not become card or API tasks', () => {
  for (const intent of ['事件', '统计设备事件日志', '最近发生什么事件', '整理物品清单', '这篇报道的文风']) {
    assert.deepEqual(queryLibrary({ intent, catalogLimit: 0 }).routeIds, [], intent);
  }
  assert.deepEqual(queryLibrary({ skill: 'sillytavern-api-reference', intent: '剧情事件' }).routeIds,
    ['sillytavern-api-reference']);
  assert.deepEqual(queryLibrary({ skill: 'sillytavern-runtime-debug', intent: '消息内容页白屏' }).routeIds,
    ['sillytavern-runtime-debug']);
  assert.deepEqual(queryLibrary({ intent: '作品资料库中的论坛页面设计' }).routeIds, ['build-work-library']);
});

for (const intent of [
  '只把角色不得替玩家作决定，紧急时通常先提醒写成纯提示词',
  '只写卡内规则正文，保留通常，不擅自添加例外',
  '整理这条卡内创作限制，正文以外不设计其他系统',
  '只修已有角色卡的一条规则，保留原有字段与配置',
]) {
  test(`standalone rolecard rule route: ${intent}`, () => {
    const result = queryLibrary({ intent, write: true, catalogLimit: 0 });
    assert.deepEqual(result.routeIds, ['tavern-card-builder']);
    assert.deepEqual(result.standing, ['ST-A0']);
    assert.deepEqual(result.candidates, []);
  });
}

test('standalone rule routing preserves non-card and explicit specialist boundaries', () => {
  for (const intent of [
    '规则', '限制', '设计独立规则', '解释现实中的交通规则',
    '给这篇一般文章拟定风格要求', '说明公司规则与会议限制',
  ]) {
    assert.deepEqual(queryLibrary({ intent, catalogLimit: 0 }).routeIds, [], intent);
  }
  assert.deepEqual(queryLibrary({ skill: 'sillytavern-api-reference', intent: '核对卡内规则对应的 API' }).routeIds,
    ['sillytavern-api-reference']);
  assert.deepEqual(queryLibrary({ skill: 'sillytavern-runtime-debug', intent: '卡内规则在真实酒馆不生效' }).routeIds,
    ['sillytavern-runtime-debug']);
  assert.deepEqual(queryLibrary({ intent: '查规则对应的 API 事件载荷' }).routeIds,
    ['sillytavern-api-reference']);
});
