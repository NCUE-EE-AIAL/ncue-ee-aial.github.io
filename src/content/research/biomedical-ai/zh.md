---
title: "生醫人工智慧"
summary: "以 AI 分析生理訊號與語音：肌肉異常偵測與多模態情緒辨識。"
icon: heart
order: 3
keywords: ["生理訊號", "情緒辨識", "Mamba", "小波轉換", "心電圖"]
---

生理訊號與語音蘊含了人的身體與情緒狀態，但這些資料雜訊多、個體差異大，且常須在小型裝置上分析。我們的目標是建立準確、高效並兼顧隱私的模型。

我們的研究涵蓋由生理訊號與語音進行肌肉異常偵測，以及多模態情緒辨識。在情緒辨識方面，我們比較 Mamba 狀態空間模型與 Transformer 在文字與語音上的表現，並預測聯合的 Valence-Arousal 機率分布，而非單一標籤。較早期的工作則結合小波轉換與類神經網路，在低成本微控制器上分析心電圖心跳訊號。<!-- TODO: confirm with lab: 肌肉異常偵測的細節與資料來源 -->

代表性成果包括 EchoMind Mamba-VA-SER 程式碼釋出（對應預印本 "Emotion as a Distribution"，arXiv:2609.05755），以及嵌入式小波類神經網路心電圖分析專案，皆可於專案頁面查閱：[EchoMind-Mamba-VA-SER](https://github.com/brian10420/EchoMind-Mamba-VA-SER)、[ECG 小波類神經網路](https://github.com/NCUE-EE-AIAL/Embedded-Wavelet-Neural-Network-for-ECG-Analysis)。
