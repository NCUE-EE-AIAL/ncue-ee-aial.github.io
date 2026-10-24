---
title: "Robotic Arm Control"
summary: "Robotic arm control and vision-guided manipulation, developed and tested in simulation before running on hardware."
icon: arm
order: 6
keywords: ["robotic arm", "motion control", "simulation", "vision-guided manipulation"]
---

Getting a robotic arm to pick up and place objects reliably requires accurate motion control and a good understanding of the scene. Small arms in particular must deal with sensor noise, backlash and limited feedback, and every failed trial on real hardware costs time and risks damage.

We therefore develop arm control in simulation first. A model of the arm and its workspace lets us work out the kinematics, plan trajectories and tune controllers safely, and only then move the result to the physical arm and compare the two. Cameras locate the target, and the controller plans and executes the motion to reach it.

The work connects to other lab directions. Depth from our [stereo 3D vision](../stereo-3d-vision/) work can supply target positions, and the feedback-control experience from embedded projects such as PatrolBot, which keeps a vehicle on course with an IMU and PID control, carries over to arm joints. Photos and videos of the lab's arms will be added here.
