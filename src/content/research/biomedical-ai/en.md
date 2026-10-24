---
title: "Biomedical AI"
summary: "AI for biosignals and speech: muscle-abnormality detection and multimodal emotion recognition."
icon: heart
order: 3
keywords: ["biosignals", "emotion recognition", "Mamba", "wavelet", "ECG"]
# echomind-overview.jpg: assets/overview.png from the public EchoMind-Mamba-VA-SER repo. semg-fatigue.jpg: a schematic drawn
# from synthetic data (no lab recording), labelled as such in the figure. Brian asked for both, 2026-10-24.
showcase:
  - title: "EchoMind: emotion as a distribution, not a label"
    image: ./echomind-overview.jpg
    alt: "EchoMind overview. Speech and text go through light encoders into a Mamba backbone with cross-attention fusion, which gives a four-class decision and a 9×9 joint valence-arousal probability matrix. Four heat maps show the predicted mean matrix for angry, happy or excited, sad and neutral speech from held-out speakers."
    text: "Text and speech go into a bidirectional Mamba model, which answers with one of four emotions and a 9×9 valence-arousal probability map. Figure from the code release."
    href: "https://github.com/brian10420/EchoMind-Mamba-VA-SER"
  - title: "Muscle fatigue from surface EMG"
    image: ./semg-fatigue.jpg
    alt: "Schematic of muscle-fatigue detection. Surface EMG electrodes, a 20 to 450 Hz band-pass filter, then either RMS and median-frequency features with classical machine learning or a deep model on the raw windows, ending in fresh or fatigued. Beside it, a 30-second contraction whose RMS envelope slowly grows, and two power spectra whose median frequency moves lower from start to end."
    text: "As a muscle tires during a sustained contraction, its EMG grows larger and its median frequency falls. We compare classical features with deep models for detecting fatigue. The figure is a schematic drawn from synthetic data."
    href: "https://hdl.handle.net/11296/yt5d6s"
---

Biosignals and speech carry information about a person's physical and emotional state, but they are noisy, vary between individuals and must often be analyzed on small devices. The goal is models that are accurate, efficient and respect privacy.

Our work covers muscle-abnormality detection from biosignals, and multimodal emotion recognition from speech and text. For emotion recognition we compare Mamba state-space models with Transformers on text and audio, and predict a joint valence-arousal probability distribution rather than a single label. Earlier work uses wavelet transforms with neural networks to analyze ECG heartbeat signals on low-cost microcontrollers. <!-- source: Brian 2026-10-17 and 2026-10-19 (muscle-abnormality detection from EMG; thesis 114-yt5d6s) -->

Representative work includes the EchoMind Mamba-VA-SER code release, which accompanies the preprint "Emotion as a Distribution" (arXiv:2609.05755), and the Embedded Wavelet Neural Network for ECG Analysis repository. Both are linked from the projects page: [EchoMind-Mamba-VA-SER](https://github.com/brian10420/EchoMind-Mamba-VA-SER) and [ECG wavelet neural network](https://github.com/NCUE-EE-AIAL/Embedded-Wavelet-Neural-Network-for-ECG-Analysis).
