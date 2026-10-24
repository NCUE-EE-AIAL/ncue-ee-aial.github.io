---
title: "預印本：把情緒當成一個分布"
date: 2026-09-04
summary: "多模態情緒辨識的 Valence-Arousal 聯合機率學習預印本已上線 arXiv，並公開程式碼。"
---

林庭毅、楊文然老師與 Kuanwei Chen 的論文〈Emotion as a Distribution: Joint Valence-Arousal Probability Learning for Speaker-Independent Multimodal Emotion Recognition〉已上傳 arXiv（[arXiv:2609.05755](https://arxiv.org/abs/2609.05755)），並投稿至 *Speech Communication* 期刊。

這篇論文不替每段語句只標一個情緒類別，而是由文字與語音預測 Valence 與 Arousal 的聯合機率分布，並在 IEMOCAP 資料集上比較雙向 Mamba 狀態空間模型與 Transformer 骨幹。程式碼公開於 [EchoMind-Mamba-VA-SER](https://github.com/brian10420/EchoMind-Mamba-VA-SER)。
