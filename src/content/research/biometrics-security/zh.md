---
title: "生物辨識與資訊安全"
summary: "人臉與語音身分驗證、自動點名與考試監考。"
icon: shield
order: 4
keywords: ["人臉辨識", "語者驗證", "身分驗證", "監考", "邊緣 AI"]
image: ../../albums/2024-10-iet-iceta/poster-ting-yi-lin.jpg
imageAlt: "林庭毅在 2024 IET ICETA 國際研討會介紹語音與人臉雙階段身分驗證海報。"
# two-step-workflow.jpg：公開 repo Two-step-Authentication-Multi-biometric-System 的 doc/workflow.svg，轉成 JPEG。
# invigilation-flow.jpg：依 Invigilation-Using-Lightweight-Semantic-Analysis README 的流程圖與數據重繪。2026-10-24。
showcase:
  - title: "雙階段驗證：先認臉，再認聲音"
    image: ./two-step-workflow.jpg
    alt: "兩列流程圖。人臉辨識：登入、擷取影像、以 MTCNN 與 VGG16 辨識出候選身分，再檢查機率是否大於 0.75，否則拒絕。通過後選出該使用者已註冊的聲音參考。語者驗證：錄音與參考聲音經 ResCNN 轉為嵌入向量並計算餘弦相似度，超過門檻才通過，否則拒絕。圖下註明兩道關卡都要通過，公開程式碼則分開評估兩個分支。"
    text: "人臉比對通過後，系統選出該使用者已註冊的聲音參考，語者驗證也必須通過；任一關未過就拒絕進入。程式碼釋出中，人臉辨識在五位註冊學生上的準確率約 95%，語者驗證在 LibriSpeech 上約 99%，兩者分別測試。圖取自程式碼釋出。"
    href: "https://github.com/NCUE-EE-AIAL/Two-step-Authentication-Multi-biometric-System"
  - title: "在輕量硬體上監考"
    image: ./invigilation-flow.jpg
    alt: "流程圖。即時攝影畫面同時送進三個模型：ShuffleNet V2 人臉辨識、違禁物品偵測與 Swin-T 人體語意分割。接著依序做四項檢查：學號與人臉不符、畫面中有違禁物品、人物標籤碰到邊界、眼睛從區域 2 移到區域 1。任一項為是就發出警告，四項皆否則通過並繼續檢查。右側列出語意分割準確率 92.74%、人臉辨識準確率 98.58%、人臉模型 36.87 MB，以及電腦考試與紙筆考試的攝影機配置。"
    text: "三個模型同時分析每一張攝影畫面：考生是誰、畫面中有沒有手機或耳機，以及每個人的身體位置。接著由四項檢查決定是否提醒監考人員。模型小到能在邊緣裝置上執行。依 repo 中的流程圖重繪。"
    href: "https://github.com/NCUE-EE-AIAL/Invigilation-Using-Lightweight-Semantic-Analysis"
---

從門禁到考場，各種場合都需要確認身分，但密碼容易外流，單一生物特徵也可能被偽造。我們希望打造足夠安全、可信賴，又輕量到能在低價硬體上執行的系統。

我們的系統結合人臉辨識與語音驗證，並採用輕量網路以便部署於邊緣裝置。在雙階段驗證設計中，先由 VGG16 人臉分類器辨識使用者，再由 ResCNN 語者編碼器驗證聲音，兩個階段都通過才算驗證成功。監考系統則結合 Swin Transformer 語意分割與 ShuffleNet V2 人臉辨識，以偵測作弊行為。

代表性專案皆公開於 GitHub：[雙階段多生物特徵身分驗證](https://github.com/NCUE-EE-AIAL/Two-step-Authentication-Multi-biometric-System)（ICETA 2024）、[人臉辨識點名管理系統](https://github.com/NCUE-EE-AIAL/Attendance-Management-System)，以及[輕量語意分析監考系統](https://github.com/NCUE-EE-AIAL/Invigilation-Using-Lightweight-Semantic-Analysis)。
