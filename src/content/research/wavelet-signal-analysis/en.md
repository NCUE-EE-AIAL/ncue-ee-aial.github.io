---
title: "Wavelet and Signal Analysis"
summary: "Wavelet transforms and digital signal processing for power, industrial, motion and acoustic signals, often paired with neural networks."
icon: wave
order: 1
keywords: ["wavelet transform", "digital signal processing", "time-frequency analysis", "wavelet neural networks", "power quality", "embedded systems"]
---

Real measurements rarely stay still. A voltage sag lasts a few cycles, a microcrack shows up as a brief burst in a sensor trace, and a bird call is a short chirp in hours of farm noise. Methods that look at a whole signal at once, such as the ordinary Fourier transform, blur these short events. Wavelet transforms describe a signal in time and frequency together, so a transient can be located and measured where it happens.

This is Prof. Yang's core field. The lab uses the discrete wavelet transform (DWT) and the short-time Fourier transform (STFT) to extract features from measured signals, then classifies or regresses them with neural networks: probabilistic and radial-basis networks, wavelet neural networks, and more recently LSTMs. Because many of these systems run next to the machine they monitor, the processing is designed to fit on embedded hardware, down to a mixed-signal integrated-circuit design for wavelet-based monitoring.

The same tools have been applied to many kinds of signals: voltage sags, flicker and other power disturbances; wafer microcracks, probe marks and wet-etching flow rates in semiconductor manufacturing; textile production lines; human motion patterns; pest-bird sounds on a grape farm; and speech. Two current lines of work carry this forward: wavelet neural networks for the Industrial Internet of Things, which extract features from machine signals to identify a system's response and status, and wavelet neural networks for embedded image recognition, from feature extraction to contour identification and object recognition. <!-- source: Prof. Yang's TEEP 2023 (SDG 7) and IIPP 2024 slides, provided by Brian on 2026-10-24 --> The papers are listed below. The work feeds directly into the lab's [smart grid and energy storage](../smart-grid-energy/) and [biomedical AI](../biomedical-ai/) directions.
