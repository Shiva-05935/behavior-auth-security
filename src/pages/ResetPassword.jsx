import { useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import { motion } from "framer-motion";

import {
  Lock,
  Mail,
  ArrowLeft,
  Loader2,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPassword() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  const handleResetPassword = async (e) => {

    e.preventDefault();

    setError("");
    setMessage("");

    if (
      !email ||
      !newPassword ||
      !confirmPassword
    ) {

      setError("Please fill all fields");

      return;
    }

    if (newPassword.length < 6) {

      setError(
        "Password must be at least 6 characters"
      );

      return;
    }

    if (newPassword !== confirmPassword) {

      setError("Passwords do not match");

      return;
    }

    try {

      setLoading(true);

      await new Promise((resolve) =>
       