---
title: "Biometrics and Security"
summary: "Face and voice authentication, automated attendance and exam invigilation."
icon: shield
order: 4
keywords: ["face recognition", "speaker verification", "authentication", "invigilation", "edge AI"]
image: ../../albums/2024-10-iet-iceta/poster-ting-yi-lin.jpg
imageAlt: "Ting-Yi Lin presenting the two-step voice and face authentication poster at the 2024 IET ICETA conference."
# two-step-workflow.jpg: doc/workflow.svg from the public Two-step-Authentication-Multi-biometric-System repo, rendered to JPEG.
# invigilation-flow.jpg: redrawn from the flow diagram and figures in the Invigilation-Using-Lightweight-Semantic-Analysis README. 2026-10-24.
showcase:
  - title: "Two-step authentication: face first, then voice"
    image: ./two-step-workflow.jpg
    alt: "Flow chart in two rows. Face identification: login, image capture, MTCNN and VGG16 face identification giving a candidate identity, and a face-match check with probability above 0.75; no leads to denied. Yes selects that user's enrolled voice reference. Speaker verification: an audio recording and the reference go into ResCNN embeddings compared by cosine similarity; a voice-match check above a threshold leads to pass, otherwise denied. A note says both gates must pass and the released code evaluates the two branches separately."
    text: "A face match picks the user's enrolled voice reference, and speaker verification must then pass as well; either failed check denies access. In the code release, face identification reaches about 95% accuracy on five enrolled students and speaker verification about 99% on LibriSpeech, each tested on its own. Figure from the code release."
    href: "https://github.com/NCUE-EE-AIAL/Two-step-Authentication-Multi-biometric-System"
  - title: "Exam invigilation on light hardware"
    image: ./invigilation-flow.jpg
    alt: "Flow chart. A real-time camera frame goes to three models in parallel: ShuffleNet V2 face identification, contraband object detection and Swin-T body segmentation. Four checks follow in turn: student ID differs from the face, contraband in view, a person label touches the boundary, eyes cross from zone 2 to zone 1. Any yes leads to a warning; four noes lead to pass and check again. A side panel lists 92.74% segmentation accuracy, 98.58% face identification accuracy, 36.87 MB for the face model, and the camera set-ups for computer-based and paper exams."
    text: "Three models look at each camera frame: who the student is, whether a phone or earphones are in view, and where each body is. Four checks then decide whether to warn the invigilator. The models are small enough for edge devices. Redrawn from the flow diagram in the repository."
    href: "https://github.com/NCUE-EE-AIAL/Invigilation-Using-Lightweight-Semantic-Analysis"
---

Identity checks are needed everywhere from building access to examination halls, yet passwords are easily shared and single biometrics can be spoofed. We look for systems that are secure enough to trust and light enough to run on inexpensive hardware.

Our systems combine face recognition and voice verification, and use lightweight networks for edge deployment. In the two-step authentication design, a VGG16 face classifier identifies the user and a ResCNN speaker encoder then verifies the voice; both steps must pass. The invigilation system pairs Swin-Transformer semantic segmentation with ShuffleNet V2 face identification to detect cheating behavior.

Representative projects, all on GitHub, are [Two-Step Multi-Biometric Authentication](https://github.com/NCUE-EE-AIAL/Two-step-Authentication-Multi-biometric-System) (ICETA 2024), the [Face Recognition Attendance Management System](https://github.com/NCUE-EE-AIAL/Attendance-Management-System) and [Invigilation Using Lightweight Semantic Analysis](https://github.com/NCUE-EE-AIAL/Invigilation-Using-Lightweight-Semantic-Analysis).
