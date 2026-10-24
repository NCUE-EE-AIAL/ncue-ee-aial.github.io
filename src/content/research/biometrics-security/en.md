---
title: "Biometrics and Security"
summary: "Face and voice authentication, automated attendance and exam invigilation."
icon: shield
order: 4
keywords: ["face recognition", "speaker verification", "authentication", "invigilation", "edge AI"]
image: ../../albums/2024-10-iet-iceta/poster-ting-yi-lin.jpg
imageAlt: "Ting-Yi Lin presenting the two-step voice and face authentication poster at the 2024 IET ICETA conference."
---

Identity checks are needed everywhere from building access to examination halls, yet passwords are easily shared and single biometrics can be spoofed. We look for systems that are secure enough to trust and light enough to run on inexpensive hardware.

Our systems combine face recognition and voice verification, and use lightweight networks for edge deployment. In the two-step authentication design, a VGG16 face classifier identifies the user and a ResCNN speaker encoder then verifies the voice; both steps must pass. The invigilation system pairs Swin-Transformer semantic segmentation with ShuffleNet V2 face identification to detect cheating behavior.

Representative projects, all on GitHub, are [Two-Step Multi-Biometric Authentication](https://github.com/NCUE-EE-AIAL/Two-step-Authentication-Multi-biometric-System) (ICETA 2024), the [Face Recognition Attendance Management System](https://github.com/NCUE-EE-AIAL/Attendance-Management-System) and [Invigilation Using Lightweight Semantic Analysis](https://github.com/NCUE-EE-AIAL/Invigilation-Using-Lightweight-Semantic-Analysis). Further papers will be listed on the publications page.
