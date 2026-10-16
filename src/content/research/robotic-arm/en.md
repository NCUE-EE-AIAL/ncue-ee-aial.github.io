---
title: "Robotic Arm Control"
summary: "Robotic arm control and vision-guided manipulation."
icon: arm
order: 2
keywords: ["robotic arm", "motion control", "vision-guided manipulation"]
---

Getting a robotic arm to pick up and place objects reliably requires accurate motion control and a good understanding of the scene. Small arms in particular must deal with sensor noise, backlash and limited feedback.

We study robotic arm control together with vision-guided manipulation: cameras locate the target, and the controller plans and executes the arm motion to reach it. <!-- TODO: confirm with lab: arm models, kinematics and control methods, ROS usage, grasping tasks -->

Our embedded control experience carries over from related work. For example, the PatrolBot project uses an IMU with PID control on microcontrollers to keep a vehicle on course, and the same feedback-control ideas apply to arm joints. Depth information from our stereo 3D vision work can supply the target positions. <!-- TODO: confirm with lab: representative projects and publications -->

Projects in this area are still being added to the website, so no dedicated repository is linked yet. See the projects page for updates.
