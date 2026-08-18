---
title: JPEG XL与HDR静图
created: 2026-08-14
updated: 2026-08-15
type: concept
status: active
tags:
  - wiki
  - concept
  - tooling
  - research
sources:
  - https://jpeg.org/jpegxl/
  - https://jpeg.org/jpegxl/documentation.html
  - https://jpeg.org/jpegxl/software.html
  - https://www.iana.org/assignments/media-types/image/jxl
  - https://www.iana.org/assignments/media-types/image/avif
  - https://caniuse.com/jpegxl
  - https://caniuse.com/avif
  - https://developer.chrome.com/release-notes/145
  - https://webkit.org/blog/14445/webkit-features-in-safari-17-0/
  - https://aomediacodec.github.io/av1-avif/
  - https://www.w3.org/TR/png-3/
  - https://www.w3.org/TR/css-images-4/
  - https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types
  - queries/第二批蒸馏目标.md
  - queries/第三批蒸馏目标.md
  - queries/第五批蒸馏目标.md
  - concepts/媒体库路径.md
knowledge_class: factual
---

# JPEG XL与HDR静图

本页不是已采用编码栈，也不是成品图库。检索时间：2026-08-14。蒸馏 [[10-收件箱/写回候选/第五批-B5-JXL]]，补静图编码与浏览器装载。不重抄 WebCodecs、Display P3、`css-color-hdr`。

## 一句话定义

JPEG XL、AVIF、PNG 第三版是三份静图合同：编码与元数据各写各的；浏览器装载看 MIME 与默认解码，不是「下一代图」一词。HDR 静图走码流或 cICP，不是 CSS Display P3。

## 为什么重要

同一句「投一张 HDR 图」会落到三份编码、两套装载选择器，以及「文件能带 HDR ≠ 屏已是 HDR」。Safari 17 已装 JPEG XL，Chrome Stable 默认仍不解 `image/jxl`。把 JXL 当现网首选，或把 AVIF 写成 JXL 的替代品，都会在 Chromium 默认路径裂图。

## 权威入口

检索日 2026-08-14。下表 **12** 条是账本枢纽，兼容摘自各页正文，不是本机实测。ISO 21496-1:2025 增益图本轮未打开付费全文，不升编号。

| # | 入口 | 管什么 |
|---|---|---|
| 1 | [jpeg.org JPEG XL](https://jpeg.org/jpegxl/) | ISO/IEC 18181 枢纽；无损转码既有 JPEG 并可还原同一份 JPEG；写明宽色、HDR、高位深、动画、alpha、无损与渐进 |
| 2 | [JPEG XL 文档](https://jpeg.org/jpegxl/documentation.html) | 白皮书 v2.0（2023）；综述 arXiv:2506.05987；ISO 付费全文不搬 |
| 3 | [IANA `image/jxl`](https://www.iana.org/assignments/media-types/image/jxl) | **2024-03-04 正式登记**；规范 ISO/IEC 18181-2；裸码流魔数 `FF 0A`，盒式 `00 00 00 0C 4A 58 4C 20 0D 0A 87 0A`；扩展名 `.jxl` |
| 4 | [Can I Use JPEG XL](https://caniuse.com/jpegxl) | Safari **17.0–26.5 Partial**；Chrome 91–109 默认关，**110–144 已撤**，145–154 再标 Disabled；Firefox 全程默认关 |
| 5 | [Chrome 145 发行说明](https://developer.chrome.com/release-notes/145) | 稳定日 **2026-02-10**；JXL 在 Origin trials；Blink 用 `jxl-rs`；门是 `enable-jxl-image-format` + `enable_jxl_decoder`；**不是 Stable 默认开** |
| 6 | [WebKit Safari 17.0](https://webkit.org/blog/14445/webkit-features-in-safari-17-0/) | 2023-09：**Safari 17.0 装 JPEG XL**（含 SVC / WKWebView）；示例 `<source type="image/jxl">` 与 `image-set(… type("image/jxl"))` |
| 7 | [AVIF v1.2.0](https://aomediacodec.github.io/av1-avif/) | AOM Final **2025-10-16**；AV1 进 HEIF/ISOBMFF；明文 HDR / WCG / SDR；Baseline `MA1B`、Advanced `MA1A`；HDR 盒 `clli` / `cclv` / `mdcv` |
| 8 | [IANA `image/avif`](https://www.iana.org/assignments/media-types/image/avif) | 2021-01-28；可选 `codecs` / `profile` / `itemtypes` |
| 9 | [Can I Use AVIF](https://caniuse.com/avif) | Chrome 85+、Firefox 93+、Safari **16.4+ 完整**、Edge 121+；四大引擎现网可投 |
| 10 | [PNG 第三版 Rec](https://www.w3.org/TR/png-3/) | W3C Rec **2025-06-24**；允许 HLG / PQ（BT.2100）；`cICP` 用 ITU-T H.273；处理优先级 cICP 先于 iCCP |
| 11 | [CSS Images 4](https://www.w3.org/TR/css-images-4/) | WD **2025-09-30**；`image-set()` 的 `type()` 按 MIME 丢掉 UA 不支持的项 |
| 12 | [JPEG XL 软件](https://jpeg.org/jpegxl/software.html) | Part 3 符合性与参考解码图在 [libjxl/conformance](https://github.com/libjxl/conformance) |

同簇不占名额：B2-Media 的 [MDN 图像类型](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types)（本轮**无 JPEG XL 节**）、`<picture>` / `srcset`；B3-Codec WebCodecs；B3-Hdr Display P3 / `css-color-hdr`。[[concepts/媒体格式与编解码]] 已蒸 B2/B3，本页不重抄。

## 如何运作

### 编码三份，不要并成「下一代图」

**JPEG XL** 是 ISO/IEC 18181。无损转码旧 JPEG、再还原同一份 JPEG 是迁移合同，不是视觉近似。裸码流与盒式两种魔数都在 IANA；只认 `.jxl` 扩展名不够。档次在 18181-1 Annex M，接收端可以解到一半再失败。

**AVIF** 是 AV1 静图进 HEIF。不是「一个 AV1 帧改后缀」：要 `av01` 项、`av1C`、与 MIAF 对齐的品牌。`MA1B` / `MA1A` 是互操作档，不是画质档。单层常见投递仍按 MDN：无渐进、须整文件。分层渐进是规范能力，不是四大引擎都保证的 Web 默认。

**PNG-3** 是已 Rec 的 Web 静图/动图容器。HDR 靠 cICP + HLG/PQ，不是另发明扩展名。它补「旧 PNG 也能带视频码点」，不是 AVIF/JXL 的替代品。

### 装载：`<picture>` 与 `image-set()` 都只问 MIME

HTML：`<picture>` 的 `source type` 选格式（B2 已收）。CSS：`image-set()` + `type()`。两套都是「UA 认不认这个 MIME」，不是 WebCodecs `isConfigSupported()`。`type()` 写错 MIME 只让该项出局；字节仍按 URL 真实格式解。背景图没有 `<picture>`，只能靠 `image-set()`。

`<img src="*.jxl">` 在 Chrome 默认路径会裂；Safari 17+ 可解。投 JXL 必须带 JPEG/AVIF/WebP 回退。AVIF 现网可作首选格式，仍按 MDN 留 JPEG/PNG 回退。不要用 B2 枢纽冒充 JXL 已写入 MDN 总表。

### HDR 静图只记编码面

三份官方说法都谈静图 HDR，层不同：

1. **码流自带**：JXL 与 AVIF 写支持 HDR；AVIF 用 `mdcv` / `clli` / `cclv`。
2. **Web 位图容器**：PNG-3 把 HDR 写成可存 HLG/PQ，用 cICP 点名传递函数。
3. **增益图**：同一文件里一张 SDR 底图 + 一张增益，按屏头房合成。标准号 ISO 21496-1:2025，本轮未打开付费全文，不当入口。

以上都不是 Display P3，也不是「这台显示器已是 HDR」。

## 必须保留的冲突

- **Safari 17 已装 JPEG XL，Chrome Stable 默认无。** WebKit 写 Safari 17.0 已装（含 SVC / WKWebView）。Can I Use 把 Safari 标 Partial 至 26.5。Chrome 110–144 撤掉，145 只开 Origin Trial / 旗标，Stable 默认仍不解 `image/jxl`。Firefox 默认关。一边「Safari 能投 JXL」，一边「Chromium 默认不能」，两边都留。
- **AVIF vs JXL 不是替代关系。** AVIF 是现网能投的静图；JXL 是另一份 ISO 编码（渐进 + 无损还原 JPEG）。Can I Use 两页都写「竞争」，不是「谁取代谁」。
- **AVIF「无渐进」两边留。** MDN 写无渐进、须整文件；AVIF v1.2.0 写可用分层做渐进。Web 常见单层仍按 MDN。
- **文件里能带 HDR ≠ CSS Display P3，≠ 屏已是 HDR。** P3 是 SDR 宽色（B3-Hdr）。
- **`image/jxl` 已是 IANA 正式类型 ≠ 四大引擎默认解码。**
- 本页映射现网投递与卡内配额边界；**不是**「本仓库已采用 JXL」。

## 例子

- 正例：现网首选 AVIF，`<picture>` 回退 JPEG/PNG；JXL 只当 Safari 增强层，且必须回退。
- 正例：背景图用 `image-set(url(a.avif) type("image/avif"), url(a.jpg))`，不假装 CSS 有 `<picture>`。
- 正例：PNG-3 用 cICP 标 HLG/PQ，不当成 `color(display-p3 …)`。
- 反例：给 Chrome Stable 只挂 `<img src="hero.jxl">`，指望默认解码。
- 反例：把 AVIF 写成「JXL 的现网替代」，或把 JXL 写成「已取代 AVIF」。
- 反例：文件带了 HDR 元数据，就宣称「这张图是 HDR 屏」或「这就是 Display P3」。

## 边界与易混概念

- 不包括：WebCodecs / 登记册、Display P3 / `css-color-hdr`、HLS / MSE / PiP、卡内媒体库槽位、盗版图包、破解编码器、解压炸弹步骤。
- JPEG XL ≠ AVIF ≠ PNG-3。三份合同，不是一词。
- IANA `image/jxl` 已正式登记 ≠ 四大引擎默认解码。
- AVIF 规范可分层渐进 ≠ MDN 投递句「无渐进、须整文件」。
- 码流 HDR ≠ 增益图 ≠ CSS 宽色 ≠ 屏已是 HDR。
- 卡内 GIF / data URL 配额仍看 [[concepts/媒体库路径]]，不是本页 MIME。

## 映射到本仓库

映射放最后，不当过滤器。本仓是否接线、真机是否验收，都不在本页宣布。

- **媒体库**：[[concepts/媒体库路径]] 的槽位与 GIF/data URL 上限是产品配额，不是 JXL/AVIF/PNG-3 能力表。
- **投递**：现网按 AVIF + 回退。JXL 只当 Safari 增强层。不要把本页写成「本仓库已采用 JXL」。
- **色**：Display P3 / `css-color-hdr` 见 [[concepts/视觉CSS与设计token]] 与 B3-Hdr 账本，不在本页重抄。
- **帧合同**：WebCodecs 见 [[concepts/媒体格式与编解码]]；本页只谈 `<img>` / `<picture>` / `image-set()`。

蒸馏账本：[[10-收件箱/写回候选/第五批-B5-JXL]]；邻接 [[queries/第二批蒸馏目标]]、[[queries/第三批蒸馏目标]]、[[queries/第五批蒸馏目标]]。

## 来源与证据

- JXL 枢纽与无损转码：jpeg.org JPEG XL；文档页白皮书 v2.0 / 综述。
- IANA 登记与魔数：`image/jxl` 2024-03-04；`image/avif` 2021-01-28。
- Safari 已装：WebKit Safari 17.0 公告（含 SVC / WKWebView）。
- Chrome 默认无：Chrome 145 发行说明（Origin trials / 旗标）；Can I Use 110–144 已撤、145–154 Disabled。
- AVIF 现网与 HDR 盒：Can I Use AVIF；AVIF v1.2.0（`mdcv` / `clli` / `cclv`）。
- PNG-3 HDR：W3C Rec 2025-06-24，cICP 先于 iCCP。
- 装载选择器：CSS Images 4 的 `image-set()` `type()`。
- MDN 图像类型本轮无 JPEG XL 节；B2 枢纽不当成 JXL 已入总表。
- 查询账本：[[queries/第五批蒸馏目标]] B5-JXL；邻接 [[queries/第二批蒸馏目标]] B2-Media、[[queries/第三批蒸馏目标]] B3-Codec / B3-Hdr。
- 增益图 ISO 21496-1:2025：本轮未打开付费全文，不当入口，标未知。

已知冲突见上节，不静默覆盖。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] 冲突没有被静默覆盖
- [x] 一句话定义；三份编码分开写
- [x] 权威入口 12 条；WebCodecs / Display P3 不占编号
- [x] Safari/Chrome JXL 分叉、AVIF≠JXL 替代，两边都留
- [x] `tags` 只使用 SCHEMA 已有词
- [x] 已发布到正式区

## 相关内容

- [[concepts/媒体库路径]]
- [[concepts/视觉CSS与设计token]]
- [[concepts/媒体格式与编解码]]
- [[10-收件箱/写回候选/第五批-B5-JXL]]
- [[queries/第二批蒸馏目标]]
- [[queries/第三批蒸馏目标]]
- [[queries/第五批蒸馏目标]]
