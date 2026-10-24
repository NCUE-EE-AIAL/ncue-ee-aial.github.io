---
title: "生物辨識與資訊安全"
summary: "人臉與語音身分驗證、自動點名與考試監考。"
icon: shield
order: 4
keywords: ["人臉辨識", "語者驗證", "身分驗證", "監考", "邊緣 AI"]
image: ../../albums/2024-10-iet-iceta/poster-ting-yi-lin.jpg
imageAlt: "林庭毅在 2024 IET ICETA 國際研討會介紹語音與人臉雙階段身分驗證海報。"
---

從門禁到考場，各種場合都需要確認身分，但密碼容易外流，單一生物特徵也可能被偽造。我們希望打造足夠安全、可信賴，又輕量到能在低價硬體上執行的系統。

我們的系統結合人臉辨識與語音驗證，並採用輕量網路以便部署於邊緣裝置。在雙階段驗證設計中，先由 VGG16 人臉分類器辨識使用者，再由 ResCNN 語者編碼器驗證聲音，兩個階段都通過才算驗證成功。監考系統則結合 Swin Transformer 語意分割與 ShuffleNet V2 人臉辨識，以偵測作弊行為。

代表性專案皆公開於 GitHub：[雙階段多生物特徵身分驗證](https://github.com/NCUE-EE-AIAL/Two-step-Authentication-Multi-biometric-System)（ICETA 2024）、[人臉辨識點名管理系統](https://github.com/NCUE-EE-AIAL/Attendance-Management-System)，以及[輕量語意分析監考系統](https://github.com/NCUE-EE-AIAL/Invigilation-Using-Lightweight-Semantic-Analysis)。更多論文將陸續列於論文頁面。
