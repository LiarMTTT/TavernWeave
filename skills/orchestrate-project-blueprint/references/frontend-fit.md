# 前端承载面适配门

先判断任务需要的是信息表达、轻量交互、同层前端、独立前端，还是混合结构。前端形态必须服务核心循环。

输出契约：

```yaml
recommended: text-first | lightweight-display | same-floor | independent-ui | hybrid
fit: suitable | conditional | not-recommended
reason: 为什么适合或不适合
fallback: 更轻、更稳的替代方案
reopenWhen: 哪些条件满足后可以重新评估
driverOverride: false
```

## 建议劝退的信号

- 主要价值是文字、规则或短对话，独立前端没有新的可验证交互价值；
- 同层 DOM/iframe 生命周期、移动端尺寸或宿主权限无法稳定承载；
- 视觉外壳将吃掉首版大部分预算，却不改善核心循环；
- 状态源不明确，界面只能展示伪状态；
- 用户已有更稳定的宿主组件，重写只会增加维护面。

`not-recommended` 时必须明确说“不建议强上”，并给 fallback。若用户仍坚持，记录 `driverOverride: true`，同时强制 `prototypeGateRequired: true` 与 `realHostGateRequired: true`；静态截图不能关闭真实宿主门。
