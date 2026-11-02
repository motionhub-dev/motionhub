# motionhub

[English](README.md) | **简体中文**

Motion（风格）是讲解类、叙事类视频可以反复使用的一套外观和动法：片子长什么样、画面怎么动。它写成的样子，让人或 agent 都能用任何引擎照着做出一部新片子。这个仓库是 motion 的开放格式，也是 [motionhub.dev](https://motionhub.dev) 背后的公共目录。

- **[SPEC.md](SPEC.md)**：motion 格式 `motion/0.1`。五个文件：`motion.json`、`MOTION.md`、`tokens.json`（W3C DTCG 格式）、`poster.jpg`、`CREDITS.md`，另外每个需要的工具各有一个自己的目录。
- **[CONTRIBUTING.md](CONTRIBUTING.md)**：怎么用 pull request 投稿一个 motion，接受什么，怎么审核。
- **[HUB.md](HUB.md)**：目录怎么发布、怎么取用（计划中）。

以上文档以英文版为准。

```
motions/<slug>/
  motion.json   MOTION.md   tokens.json   poster.jpg   CREDITS.md
  visotalk/     只有 VisoTalk 读取的文件
```

## 使用 motion

任何 agent 都可以读一个 motion 的 `MOTION.md` 和 `tokens.json`，在自己的引擎里照着做，就像照着一套设计规范做界面一样。如果某个工具在 motion 里有自己的目录，它还能直接拿到现成的组件。

`MOTION.md` 可以用任何语言写；`name` 和 `line` 可以同时提供中文和英文。

## 检查 motion

```sh
node tools/check.mjs motions/<slug>    # 检查一个
node tools/check.mjs                   # 检查全部
```

## 维护

由 [VisoTalk](https://visotalk.dev) 维护，它是第一个使用这个格式的工具，也是参考实现。格式属于每一个使用它的人；想修改格式，请在本仓库提 issue。

本仓库里的工具采用 MIT 许可（[LICENSE](LICENSE)）。每个 motion 在自己的 `motion.json` 里声明各自的许可证。
