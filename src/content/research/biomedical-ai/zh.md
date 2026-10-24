---
title: "生醫人工智慧"
summary: "以 AI 分析生理訊號與語音：肌肉異常檢測與多模態情緒辨識。"
icon: heart
order: 3
keywords: ["生理訊號", "情緒辨識", "Mamba", "小波轉換", "心電圖"]
# echomind-overview.jpg：公開 repo EchoMind-Mamba-VA-SER 的 assets/overview.png。semg-fatigue.jpg：以合成資料繪製的示意圖
# （非實驗室量測），圖中已註明。Brian 2026-10-24 要求。
showcase:
  - title: "EchoMind：把情緒看成分布，而不是一個標籤"
    image: ./echomind-overview.jpg
    alt: "EchoMind 架構概覽。語音與文字經過輕量編碼器進入 Mamba 骨幹與交叉注意力融合，輸出四類情緒判斷與 9×9 的 Valence-Arousal 聯合機率矩陣。右側四張熱圖是未參與訓練的說話者在生氣、開心或興奮、難過與中性四類上的平均預測矩陣。"
    text: "文字與語音輸入雙向 Mamba 模型，同時給出四類情緒判斷與 9×9 的 Valence-Arousal 機率分布。圖取自程式碼釋出。"
    href: "https://github.com/brian10420/EchoMind-Mamba-VA-SER"
  - title: "以表面肌電訊號偵測肌肉疲勞"
    image: ./semg-fatigue.jpg
    alt: "肌肉疲勞偵測示意圖。表面肌電電極、20 到 450 Hz 帶通濾波，接著分成兩路：RMS 與中位頻率特徵加傳統機器學習，或直接以深度模型處理原始視窗，最後判斷是否疲勞。右側是 30 秒持續出力的訊號，RMS 包絡逐漸變大，以及開始與結束時的功率頻譜，中位頻率往低頻移動。"
    text: "持續出力時，肌肉疲勞會讓肌電訊號振幅變大、中位頻率下降。我們比較傳統特徵方法與深度學習模型的偵測效果。此圖為示意圖，以合成資料繪製。"
    href: "https://hdl.handle.net/11296/yt5d6s"
---

生理訊號與語音蘊含了人的身體與情緒狀態，但這些資料雜訊多、個體差異大，且常須在小型裝置上分析。我們的目標是建立準確、高效並兼顧隱私的模型。

我們的研究涵蓋以生理訊號進行肌肉異常檢測，以及結合語音與文字的多模態情緒辨識。在情緒辨識方面，我們比較 Mamba 狀態空間模型與 Transformer 在文字與語音上的表現，並預測聯合的 Valence-Arousal 機率分布，而非單一標籤。較早期的工作則結合小波轉換與類神經網路，在低成本微控制器上分析心電圖心跳訊號。<!-- source: Brian 2026-10-17 與 2026-10-19（以肌電訊號進行肌肉異常檢測；碩論 114-yt5d6s） -->

代表性成果包括 EchoMind Mamba-VA-SER 程式碼釋出（對應預印本 "Emotion as a Distribution"，arXiv:2609.05755），以及嵌入式小波類神經網路心電圖分析專案，皆可於專案頁面查閱：[EchoMind-Mamba-VA-SER](https://github.com/brian10420/EchoMind-Mamba-VA-SER)、[ECG 小波類神經網路](https://github.com/NCUE-EE-AIAL/Embedded-Wavelet-Neural-Network-for-ECG-Analysis)。
