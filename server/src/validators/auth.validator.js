function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateSignup(data) {
  const errors = {};

  if (!data.full_name || typeof data.full_name !== "string" || !data.full_name.trim()) {
    errors.full_name = "Full name is required";
  } else if (data.full_name.trim().length < 2) {
    errors.full_name = "Full name must be at least 2 characters";
  }

  if (!data.email || typeof data.email !== "string" || !data.email.trim()) {
    errors.email = "Email is required";
  } else if (!isValidEmail(data.email.trim())) {
    errors.email = "Email is invalid";
  }

  if (!data.password || typeof data.password !== "string") {
    errors.password = "Password is required";
  } else if (data.password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

function validateLogin(data) {
  const errors = {};

  if (!data.email || typeof data.email !== "string" || !data.email.trim()) {
    errors.email = "Email is required";
  } else if (!isValidEmail(data.email.trim())) {
    errors.email = "Email is invalid";
  }

  if (!data.password || typeof data.password !== "string") {
    errors.password = "Password is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

function validateVerifyOtp(data) {
  const errors = {};

  if (!data.email || typeof data.email !== "string" || !data.email.trim()) {
    errors.email = "Email is required";
  } else if (!isValidEmail(data.email.trim())) {
    errors.email = "Email is invalid";
  }

  if (!data.otp || typeof data.otp !== "string" || !data.otp.trim()) {
    errors.otp = "OTP is required";
  } else if (!/^\d{6}$/.test(data.otp.trim())) {
    errors.otp = "OTP must be a 6-digit code";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

function validateResendOtp(data) {
  const errors = {};

  if (!data.email || typeof data.email !== "string" || !data.email.trim()) {
    errors.email = "Email is required";
  } else if (!isValidEmail(data.email.trim())) {
    errors.email = "Email is invalid";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

module.exports = {
  validateSignup,
  validateLogin,
  validateVerifyOtp,
  validateResendOtp,
};
