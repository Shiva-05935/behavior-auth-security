import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

import {
  attackLogs,
} from "./security/attackLogs.js";

// LOAD ENV VARIABLES
dotenv.config();

const app = express();

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// STORE OTPs
const otpStore = {};

// EMAIL CONFIG
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// CHECK EMAIL SERVER
transporter.verify((error, success) => {
  if (error) {
    console.log("Email Error:", error);
  } else {
    console.log("Email server ready");
  }
});

// HOME ROUTE
app.get("/", (req, res) => {
  res.send("Backend server is running");
});

// SEND OTP
app.post("/api/send-otp", async (req, res) => {
  try {

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    otpStore[email] = otp;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
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

// ATTACK LOGS
app.get("/api/attacks", (req, res) => {

  res.json({
    totalAttacks: attackLogs.length,
    blockedAttacks: attackLogs.length,
    logs: attackLogs,
  });

});

// PORT
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});