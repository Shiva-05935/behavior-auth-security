import express from "express";
import cors from "cors";
import {
  attackLogs,
} from "./security/attackLogs.js";
import nodemailer from "nodemailer";
import cors from "cors";


app.use(ddosProtection);
app.use(cors());
app.use(express.json());

const otpStore = {};

// EMAIL CONFIG
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "shivajagtap67@gmail.com",
    pass: "shiva@123",
  },
});

// CHECK EMAIL SERVER
transporter.verify((error, success) => {
  if (error) {
    console.log(error);
  } else {
    console.log("Email server ready");
  }
});

// SEND OTP
app.post("/api/send-otp", async (req, res) => {
  try {

    const { email } = req.body;

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    otpStore[email] = otp;

    await transporter.sendMail({
      from: "shivajagtap67@gmail.com",
      to: email,
      subject: "OTP Verification",
      text: `Your OTP is ${otp}`,
    });

    res.json({
      success: true,
      message: "OTP sent successfully",
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
    });
  }
});

// VERIFY OTP
app.post("/api/verify-otp", (req, res) => {

  const { email, otp } = req.body;

  if (otpStore[email] === otp) {

    delete otpStore[email];

    return res.json({
      success: true,
      message: "OTP verified successfully",
    });
  }

  res.status(400).json({
    success: false,
    message: "Invalid OTP",
  });
});
app.get(
  "/api/attacks",
  (req, res) => {

    res.json({
      totalAttacks: attackLogs.length,
      blockedAttacks: attackLogs.length,
      logs: attackLogs,
    });

  }
);
app.listen(5000, () => {
  console.log("Server running on port 5000");
});