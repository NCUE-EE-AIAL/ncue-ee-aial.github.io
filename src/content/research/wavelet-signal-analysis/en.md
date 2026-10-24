---
title: "Wavelet and Signal Analysis"
summary: "Wavelet transforms and digital signal processing for power, industrial, motion and acoustic signals, often paired with neural networks."
icon: wave
order: 1
keywords: ["wavelet transform", "digital signal processing", "time-frequency analysis", "wavelet neural networks", "power quality", "embedded systems"]
# wavelet-sag-dwt.jpg: a schematic drawn from synthetic data (db4 wavelet, no lab recording), labelled as such in the figure.
# It follows the method of the 2009 power-disturbance paper (DWT, energy per level by Parseval, neural network). 2026-10-24.
showcase:
  - title: "Finding a voltage sag with the wavelet transform"
    image: ./wavelet-sag-dwt.jpg
    alt: "Schematic of wavelet-based disturbance recognition. On the left, a pipeline: measured voltage or current, discrete wavelet transform into details d1 to d5 and approximation a5, energy of each level by Parseval's theorem, a neural network (PNN, RBF, GRNN or LSTM), and the disturbance type. On the right, a sine wave that drops to half amplitude for three cycles; below it the level-1 detail coefficients, flat except for a spike where the sag starts and another where it ends; and a bar chart of the six level energies on a log scale."
    text: "The wavelet transform splits a measured waveform into levels. The finest level stays close to zero until the waveform jumps, so it marks where a sag starts and ends, and the energy of each level gives a neural network six numbers to classify instead of the raw samples. The figure is a schematic drawn from synthetic data."
    href: "https://www.iaeng.org/publication/IMECS2009/IMECS2009_pp1573-1577.pdf"
---

Real measurements rarely stay still. A voltage sag lasts a few cycles, a microcrack shows up as a brief burst in a sensor trace, and a bird call is a short chirp in hours of farm noise. Methods that look at a whole signal at once, such as the ordinary Fourier transform, blur these short events. Wavelet transforms describe a signal in time and frequency together, so a transient can be located and measured where it happens.

This is Prof. Yang's core field. The lab uses the discrete wavelet transform (DWT) and the short-time Fourier transform (STFT) to extract features from measured signals, then classifies or regresses them with neural networks: probabilistic and radial-basis networks, wavelet neural networks, and more recently LSTMs. Because many of these systems run next to the machine they monitor, the processing is designed to fit on embedded hardware, down to a mixed-signal integrated-circuit design for wavelet-based monitoring.

The same tools have been applied to many kinds of signals: voltage sags, flicker and other power disturbances; wafer microcracks, probe marks and wet-etching flow rates in semiconductor manufacturing; textile production lines; human motion patterns; pest-bird sounds on a grape farm; and speech. Two current lines of work carry this forward: wavelet neural networks for the Industrial Internet of Things, which extract features from machine signals to identify a system's response and status, and wavelet neural networks for embedded image recognition, from feature extraction to contour identification and object recognition. <!-- source: Prof. Yang's TEEP 2023 (SDG 7) and IIPP 2024 slides, provided by Brian on 2026-10-24 --> The papers are listed below. The work feeds directly into the lab's [smart grid and energy storage](../smart-grid-energy/) and [biomedical AI](../biomedical-ai/) directions.

**Earlier master's theses.** Students have built these methods into working systems: [voltage-sag analysis with the DWT](https://hdl.handle.net/11296/e5q7q2) and [real-time sag monitoring on an FPGA](https://hdl.handle.net/11296/dtfpsm), an [embedded lifting-wavelet power-quality analyzer](https://hdl.handle.net/11296/wg6k2m), [lifting wavelets for automatic optical inspection](https://hdl.handle.net/11296/gsbyw2), [bearing-vibration analysis on an embedded FPGA](https://hdl.handle.net/11296/a5v245), and wavelet neural networks that recognize [movement patterns](https://hdl.handle.net/11296/9vmw4d) and [infant crying](https://hdl.handle.net/11296/emt2ye) or model [chiller power consumption](https://hdl.handle.net/11296/f2gjdm).
