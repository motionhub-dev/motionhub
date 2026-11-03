# motionhub

[English](README.md) | **简体中文**

Motion（风格）是讲解类、叙事类视频可以反复使用的一套外观和动法：片子长什么样、画面怎么动。它写成的样子，让人或 agent 都能用任何引擎照着做出一部新片子。这个仓库是 motion 的开放格式，也是 [motionhub.dev](https://motionhub.dev) 背后的公共目录。

- **[SPEC.md](SPEC.md)**：motion 格式 `motion/0.3`。五个文件：`motion.json`、`MOTION.md`、`tokens.json`（W3C DTCG 格式）、`poster.jpg`、`CREDITS.md`，另外每个需要的工具各有一个自己的目录。
- **[CONTRIBUTING.md](CONTRIBUTING.md)**：怎么用 pull request 投稿一个 motion，接受什么，怎么审核。
- **[HUB.md](HUB.md)**：目录怎么发布、怎么取用（计划中）。

以上文档以英文版为准。

```
motions/<slug>/            官方 motion，id 为 <slug>
motions/@<scope>/<slug>/   创作者的 motion，id 为 @<scope>/<slug>
  motion.json   MOTION.md   tokens.json   poster.jpg   CREDITS.md
  react/        任何 React 引擎都能绘制的组件（@motionhub/runtime）
```

## 使用 motion

```sh
npx @motionhub/cli search hand-drawn    # 搜索含有所有关键词的 motion
npx @motionhub/cli get @iamsuosi/red-pencil   # 下载到 ./motion，并核对 SHA-256
```

任何 agent 都可以读一个 motion 的 `MOTION.md` 和 `tokens.json`，在自己的引擎里照着做，就像照着一套设计规范做界面一样。带 `react/` 的 motion 还附带组件，通过 [`@motionhub/runtime`](packages/runtime/README.md) 可以原样用在 Remotion（[`@motionhub/remotion`](packages/remotion/README.md)）和 HyperFrames（[`@motionhub/hyperframes`](packages/hyperframes/README.md)）里。

[`skills/motionhub/SKILL.md`](skills/motionhub/SKILL.md) 是给任何 agent 用的 skill：怎么挑一个 motion、怎么取到它、怎么照着它做片。按你的 agent 安装 skill 的方式装上即可。

`MOTION.md` 可以用任何语言写；`name` 和 `line` 可以同时提供中文和英文。

## 检查 motion

```sh
npx @motionhub/cli check path/to/<slug>   # 用发布到 npm 的检查器，检查任意位置的一个 motion
node tools/check.mjs motions/<slug>       # 在本仓库里检查一个
node tools/check.mjs                      # 检查全部
node tools/build.mjs                   # 生成 motionhub.dev 要发布的文件，放在 dist/
```

## 维护

由 [SuoSi](https://github.com/iamsuosi) 维护。格式属于每一个使用它的人；想修改格式，请在本仓库提 issue。

本仓库里的工具采用 MIT 许可（[LICENSE](LICENSE)）。每个 motion 在自己的 `motion.json` 里声明各自的许可证。
