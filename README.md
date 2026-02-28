# Cloud Journal（观云记）

一个清新淡雅的移动端优先网页应用：
- 📷 拍摄/上传天空照片
- ☁️ 本地识别云层并给出天气判断与建议
- 📝 记录当下想法（可关联天气）
- 📊 查看近 7 日观测趋势与分布

## 在线预览（GitHub Pages）

> 启用后访问：

**https://acihcs.github.io/Cloud-Journal/**

---

## 功能概览

### 1) 观云识别
- 支持相机拍摄或本地上传
- 基于 Canvas 像素分析（亮度/灰度/蓝色占比）
- 输出天气类型 + 置信度 + 轻建议

### 2) 观测记录
- 保存每次识别结果
- 记录时间、天气类型、置信度
- 本地持久化（localStorage）

### 3) 笔记系统
- 新建/编辑笔记
- 可绑定当次天气标签
- 支持关键词搜索

### 4) 7 日趋势
- 近 7 日总观测次数
- 最常见天气
- 各天气类型占比条
- 每日观测分布条

---

## 技术栈
- HTML5
- CSS3（移动端优先 + 安全区适配）
- Vanilla JavaScript（无框架依赖）

---

## 本地运行

直接双击 `index.html` 即可，或使用任意静态服务器：

```bash
# 方式1：Python
python -m http.server 8080

# 方式2：Node
npx serve .
```

然后访问：
- `http://localhost:8080`

---

## 项目结构

```text
Cloud-Journal/
├─ index.html
├─ style.css
├─ app.js
└─ README.md
```

---

## 路线图（可选）
- [ ] 数据导出（JSON / Markdown）
- [ ] 云层识别规则可视化调参
- [ ] PWA 离线安装
- [ ] 多语言支持（中文 / English）

---

## 许可证

MIT
