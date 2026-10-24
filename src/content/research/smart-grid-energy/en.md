---
title: "Smart Grid and Energy Storage"
summary: "AI and signal processing for the campus battery energy storage system, power quality and power electronics."
icon: bolt
order: 2
keywords: ["battery energy storage", "smart grid", "power quality", "edge computing", "SCADA", "wavelet neural networks", "power electronics"]
image: ./rooftop-inverters.jpg
imageAlt: "Solar inverters and a combiner box mounted on a steel frame on the NCUE campus rooftop."
---

The NCUE campus runs a 1-MW battery energy storage system (BESS) alongside solar power; it was the first megawatt-scale BESS operated by a university in Asia. The lab applies AI and edge computing to its operation: edge devices process the measurements with the discrete wavelet transform (DWT), the short-time Fourier transform (STFT) and Huffman coding, and LSTM neural networks approximate and predict how the system behaves. <!-- source: Prof. Yang's TEEP 2023 (SDG 7) and IIPP 2024 slides, provided by Brian on 2026-10-18 -->

The work follows the whole chain: the battery modules (state of charge, balancing, C-rate), the power conversion system (charging and discharging, fault detection, voltage, current, harmonics and power factor), power-system dynamics and frequency, and power quality at the point of common coupling. The aim is a zero-energy campus, in line with UN Sustainable Development Goal 7 (affordable and clean energy), in particular targets 7.A (international cooperation that opens up clean-energy research and technology) and 7.B (expanding and upgrading infrastructure for modern, sustainable energy services). The lab's international internships are one way it contributes to 7.A. The lab also measures and models supercapacitors and batteries. <!-- source: Brian, 2026-10-17 (1-F supercapacitor data) -->

The monitoring system is organized in three layers. At the edge, smart sensors measure the devices and equipment; in the fog layer, an intelligent concentrator gathers their data over wired and wireless links; in the cloud, supervisory control and data acquisition (SCADA) handles demand response, distributed-resource management and operational information. A monitoring, information-exchange and control (MIC) module sits between the battery, the power conversion system and the grid, and runs the edge computing: data processing (DWT, STFT and Huffman coding) and data analysis (LSTM approximation and prediction). <!-- source: Prof. Yang's TEEP 2023 (SDG 7) and IIPP 2024 slides, provided by Brian on 2026-10-24 -->

The direction builds on Prof. Yang's earlier work in power electronics and power quality, listed below: wavelet-based voltage-sag monitoring, flicker measurement, power-disturbance recognition with neural networks, flywheel energy storage, battery charging and resonant converters.
