---
title: "Stereo 3D Vision"
summary: "Dual-camera stereo imaging, image processing and graphics for recovering 3D information, from classical geometry to Transformer models."
icon: camera
order: 5
keywords: ["stereo vision", "depth estimation", "3D imaging", "image processing", "computer graphics", "Transformer"]
---

Cameras see in two dimensions, but robots, inspection systems and interactive devices need to know how far away things are. Recovering depth reliably from ordinary cameras, under changing light and with limited computing power, remains an open engineering problem.

We work with dual-camera stereo setups that capture the same scene from two viewpoints and compute 3D information from the disparity between them. The pipeline covers camera calibration, image rectification, stereo matching and depth estimation, and computer-graphics methods are used to display and check the reconstructed 3D data. Classical image processing and geometry, prototyped in MATLAB, sit alongside deep-learning vision models, including Transformers.

The lab's image-processing work goes back a long way: earlier papers measure wafer probe marks from images and detect wafer microcracks. Depth from this direction also supports [robotic arm](../robotic-arm/) manipulation, and the lab's embedded tradition pushes the models toward small, affordable hardware rather than large servers.
