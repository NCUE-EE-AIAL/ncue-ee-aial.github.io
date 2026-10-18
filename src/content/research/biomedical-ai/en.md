---
title: "Biomedical AI"
summary: "AI for biosignals and speech: muscle-abnormality detection and multimodal emotion recognition."
icon: heart
order: 3
keywords: ["biosignals", "emotion recognition", "Mamba", "wavelet", "ECG"]
---

Biosignals and speech carry information about a person's physical and emotional state, but they are noisy, vary between individuals and must often be analyzed on small devices. The goal is models that are accurate, efficient and respect privacy.

Our work covers muscle-abnormality detection from biosignals, and multimodal emotion recognition from speech and text. For emotion recognition we compare Mamba state-space models with Transformers on text and audio, and predict a joint valence-arousal probability distribution rather than a single label. Earlier work uses wavelet transforms with neural networks to analyze ECG heartbeat signals on low-cost microcontrollers. <!-- source: Brian 2026-10-17 and 2026-10-19 (muscle-abnormality detection from EMG; thesis 114-yt5d6s) -->

Representative work includes the EchoMind Mamba-VA-SER code release, which accompanies the preprint "Emotion as a Distribution" (arXiv:2609.05755), and the Embedded Wavelet Neural Network for ECG Analysis repository. Both are linked from the projects page: [EchoMind-Mamba-VA-SER](https://github.com/brian10420/EchoMind-Mamba-VA-SER) and [ECG wavelet neural network](https://github.com/NCUE-EE-AIAL/Embedded-Wavelet-Neural-Network-for-ECG-Analysis).
