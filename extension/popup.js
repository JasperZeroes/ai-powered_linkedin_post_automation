// =========================
// Generator elements
// =========================
const promptInput = document.getElementById("prompt");
const toneSelect = document.getElementById("tone");
const goalSelect = document.getElementById("goal");
const output = document.getElementById("output");
const hashtagsOutput = document.getElementById("hashtagsOutput");
const ctaOutput = document.getElementById("ctaOutput");
const generateBtn = document.getElementById("generateBtn");
const insertBtn = document.getElementById("insertBtn");
const boldBtn = document.getElementById("boldBtn");
const italicBtn = document.getElementById("italicBtn");
const bulletBtn = document.getElementById("bulletBtn");
const listMenuBtn = document.getElementById("listMenuBtn");
const listMenu = document.getElementById("listMenu");
const codeBtn = document.getElementById("codeBtn");
const loading = document.getElementById("loading");
const messageBox = document.getElementById("message");
const saveDraftBtn = document.getElementById("saveDraftBtn");
const copyAllBtn = document.getElementById("copyAllBtn");
const loadingText = document.getElementById("loadingText");

// =========================
// Auth view elements
// =========================
const authChoiceView = document.getElementById("authChoiceView");
const signupView = document.getElementById("signupView");
const loginView = document.getElementById("loginView");
const otpView = document.getElementById("otpView");
const generatorView = document.getElementById("generatorView");

// =========================
// Auth navigation buttons
// =========================
const showSignupBtn = document.getElementById("showSignupBtn");
const showLoginBtn = document.getElementById("showLoginBtn");
const backFromSignup = document.getElementById("backFromSignup");
const backFromLogin = document.getElementById("backFromLogin");
const backFromOtp = document.getElementById("backFromOtp");
const goToLoginFromSignup = document.getElementById("goToLoginFromSignup");
const goToSignupFromLogin = document.getElementById("goToSignupFromLogin");
const goBackToSignupFromOtp = document.getElementById("goBackToSignupFromOtp");

// =========================
// Auth form buttons
// =========================
const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const verifyOtpBtn = document.getElementById("verifyOtpBtn");
const resendOtpBtn = document.getElementById("resendOtpBtn");

// =========================
// Auth form inputs
// =========================
const signupName = document.getElementById("signupName");
const signupEmail = document.getElementById("signupEmail");
const signupPassword = document.getElementById("signupPassword");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const toggleSignupPassword = document.getElementById("toggleSignupPassword");
const toggleLoginPassword = document.getElementById("toggleLoginPassword");
const otpEmailHint = document.getElementById("otpEmailHint");
const otpInputs = Array.from(document.querySelectorAll(".otp-digit"));
const RESEND_COOLDOWN_SECONDS = 30;

function setupPasswordToggle(toggleBtn, inputEl) {
  if (!toggleBtn || !inputEl) return;

  const eye = toggleBtn.querySelector(".icon-eye");
  const eyeOff = toggleBtn.querySelector(".icon-eye-off");
  if (!eye || !eyeOff) return;

  toggleBtn.addEventListener("click", () => {
    const showPlain = inputEl.type === "password";
    inputEl.type = showPlain ? "text" : "password";
    eye.classList.toggle("hidden", showPlain);
    eyeOff.classList.toggle("hidden", !showPlain);
    toggleBtn.setAttribute("aria-label", showPlain ? "Hide password" : "Show password");
    toggleBtn.setAttribute("aria-pressed", showPlain ? "true" : "false");
  });
}

setupPasswordToggle(toggleSignupPassword, signupPassword);
setupPasswordToggle(toggleLoginPassword, loginPassword);

let pendingVerificationEmail = "";
let resendCooldownTimer = null;
let resendCooldownRemaining = 0;
let uiLoading = false;

function updateResendOtpButton() {
  if (!resendOtpBtn) {
    return;
  }

  resendOtpBtn.disabled = uiLoading || resendCooldownRemaining > 0;

  if (resendCooldownRemaining > 0) {
    resendOtpBtn.textContent = `Resend OTP (${resendCooldownRemaining}s)`;
  } else {
    resendOtpBtn.textContent = "Resend OTP";
  }
}

function startResendCooldown(seconds = RESEND_COOLDOWN_SECONDS) {
  resendCooldownRemaining = seconds;
  updateResendOtpButton();

  if (resendCooldownTimer) {
    clearInterval(resendCooldownTimer);
    resendCooldownTimer = null;
  }

  resendCooldownTimer = setInterval(() => {
    resendCooldownRemaining = Math.max(0, resendCooldownRemaining - 1);
    updateResendOtpButton();

    if (resendCooldownRemaining === 0) {
      clearInterval(resendCooldownTimer);
      resendCooldownTimer = null;
    }
  }, 1000);
}

function setPendingVerificationEmail(email) {
  pendingVerificationEmail = email || "";
  if (otpEmailHint) {
    otpEmailHint.textContent = pendingVerificationEmail || "your email";
  }
}

function getOtpCode() {
  return otpInputs.map((input) => input.value).join("");
}

function clearOtpInputs() {
  otpInputs.forEach((input) => {
    input.value = "";
  });

  if (otpInputs[0]) {
    otpInputs[0].focus();
  }
}

function setupOtpInputs() {
  if (!otpInputs.length) {
    return;
  }

  otpInputs.forEach((input, index) => {
    input.addEventListener("input", (event) => {
      const value = event.target.value.replace(/\D/g, "");
      event.target.value = value.slice(-1);

      if (event.target.value && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Backspace" && !input.value && index > 0) {
        otpInputs[index - 1].focus();
      }
    });

    input.addEventListener("paste", (event) => {
      const pasted = (event.clipboardData?.getData("text") || "").replace(/\D/g, "");
      if (!pasted) {
        return;
      }

      event.preventDefault();
      const chars = pasted.slice(0, otpInputs.length).split("");
      chars.forEach((ch, i) => {
        if (otpInputs[i]) {
          otpInputs[i].value = ch;
        }
      });

      const next = Math.min(chars.length, otpInputs.length - 1);
      otpInputs[next]?.focus();
    });
  });
}

setupOtpInputs();
updateResendOtpButton();

let lastFocusedFormatField = output;

[output, hashtagsOutput, ctaOutput].forEach((el) => {
  if (!el) return;
  el.addEventListener("focusin", () => {
    lastFocusedFormatField = el;
  });
});

// =========================
// Helpers
// =========================
function showMessage(message) {
  if (!messageBox) return;
  messageBox.textContent = message;
}

function setLoading(isLoading, text = "Generating post...") {
  uiLoading = isLoading;

  if (loading) {
    loading.classList.toggle("hidden", !isLoading);
  }

  if (loadingText) {
    loadingText.textContent = text;
  }

  if (generateBtn) {
    generateBtn.disabled = isLoading;
  }

  if (saveDraftBtn) {
    saveDraftBtn.disabled = isLoading;
  }

  if (signupBtn) {
    signupBtn.disabled = isLoading;
  }

  if (loginBtn) {
    loginBtn.disabled = isLoading;
  }

  if (verifyOtpBtn) {
    verifyOtpBtn.disabled = isLoading;
  }

  updateResendOtpButton();
}

// =========================
// Save to local Storage
// =========================
function saveToLocal() {
  const backup = {
    post: output?.value || "",
    hashtags: hashtagsOutput?.value || "",
    cta: ctaOutput?.value || "",
    prompt: promptInput?.value || ""
  };
  localStorage.setItem("generatedPost", JSON.stringify(backup));
}

// ===========================
// Load from local
// ===========================

function loadFromLocal() {
  const saved = localStorage.getItem("generatedPost");
  if (!saved) return;

  try {
    const data = JSON.parse(saved);
    if (output) output.value = data.post || "";
    if (hashtagsOutput) hashtagsOutput.value = data.hashtags || "";
    if (ctaOutput) ctaOutput.value = data.cta || "";
    if (promptInput) promptInput.value = data.prompt || "";
  } catch (e) {
    console.error("Failed to parse local storage", e);
  }
}


function hideAllViews() {
  if (authChoiceView) authChoiceView.classList.add("hidden");
  if (signupView) signupView.classList.add("hidden");
  if (loginView) loginView.classList.add("hidden");
  if (otpView) otpView.classList.add("hidden");
  if (generatorView) generatorView.classList.add("hidden");
}

function showView(view) {
  hideAllViews();
  if (view) {
    view.classList.remove("hidden");
  }
  showMessage("");
}

function handleApiError(response, fallbackMessage) {
  if (!response) {
    showMessage(fallbackMessage);
    return true;
  }

  if (!response.success) {
    if (response.errors) {
      const firstError = Object.values(response.errors)[0];
      showMessage(firstError || response.message || fallbackMessage);
      return true;
    }

    showMessage(response.message || fallbackMessage);
    return true;
  }

  return false;
}

function formatDraftAsTxt(payload) {
  const tagsStr = Array.isArray(payload.hashtags)
    ? payload.hashtags.join(" ")
    : payload.hashtags || "";
  return [
    `Title: ${payload.title}`,
    "",
    `Original prompt: ${payload.original_prompt}`,
    `Tone: ${payload.tone}`,
    `Goal: ${payload.goal}`,
    "",
    "--- Post ---",
    payload.draft_content,
    "",
    "--- Hashtags ---",
    tagsStr,
    "",
    "--- CTA ---",
    payload.cta || "",
    "",
  ].join("\n");
}

function downloadDraftTxt(payload) {
  if (!chrome.downloads?.download) return;

  const text = formatDraftAsTxt(payload);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

  chrome.downloads.download(
    {
      url,
      filename: `linkedin-draft-${stamp}.txt`,
      saveAs: false,
    },
    () => {
      URL.revokeObjectURL(url);
      if (chrome.runtime.lastError) {
        console.warn("Draft txt download:", chrome.runtime.lastError.message);
      }
    }
  );
}

// =========================
// Text formatting
// =========================
let activeFormatButton = null;

function setActiveFormatButton(btn) {
  if (!btn) return;

  if (activeFormatButton === btn) {
    btn.classList.remove("active");
    activeFormatButton = null;
    return;
  }

  if (activeFormatButton) {
    activeFormatButton.classList.remove("active");
  }

  btn.classList.add("active");
  activeFormatButton = btn;
}

function activateFormatButton(btn) {
  if (!btn) return;

  if (activeFormatButton && activeFormatButton !== btn) {
    activeFormatButton.classList.remove("active");
  }

  btn.classList.add("active");
  activeFormatButton = btn;
}

function deactivateFormatButton(btn) {
  if (!btn) return;

  btn.classList.remove("active");
  if (activeFormatButton === btn) {
    activeFormatButton = null;
  }
}

function getFormattingTarget() {
  const fields = [output, hashtagsOutput, ctaOutput].filter(Boolean);
  const active = document.activeElement;
  if (fields.includes(active)) {
    return active;
  }
  if (lastFocusedFormatField && fields.includes(lastFocusedFormatField)) {
    return lastFocusedFormatField;
  }
  return output || fields[0];
}

function applyOutputEdit(targetEl, result) {
  if (!targetEl || !result) {
    return false;
  }

  targetEl.value = result.value;
  targetEl.focus();
  targetEl.setSelectionRange(result.selectionStart, result.selectionEnd);
  return true;
}

function applyEmphasis(kind, emptyMessage) {
  const target = getFormattingTarget();
  if (!target) {
    return;
  }

  const fmt = window.LinkedInPostFormatter;
  if (!fmt) {
    return;
  }

  const start = target.selectionStart;
  const end = target.selectionEnd;

  const result =
    kind === "bold"
      ? fmt.applyBold(target.value, start, end)
      : kind === "italic"
        ? fmt.applyItalic(target.value, start, end)
        : fmt.applyCodeFence(target.value, start, end);

  if (!result) {
    showMessage(emptyMessage);
    return;
  }

  applyOutputEdit(target, result);
}

function applyBulletPoints() {
  const target = getFormattingTarget();
  if (!target) {
    return;
  }

  const fmt = window.LinkedInPostFormatter;
  if (!fmt) {
    return;
  }

  const start = target.selectionStart;
  const end = target.selectionEnd;
  const result = fmt.applyList(target.value, start, end, "bullet");

  if (!result) {
    showMessage("Select text first.");
    return;
  }

  applyOutputEdit(target, result);
  return result;
}

function applyCodeFence() {
  applyEmphasis("code", "Select text first.");
}

function applyListFormat(kind) {
  const target = getFormattingTarget();
  if (!target) {
    return;
  }

  const fmt = window.LinkedInPostFormatter;
  if (!fmt) {
    return;
  }

  const start = target.selectionStart;
  const end = target.selectionEnd;
  const result = fmt.applyList(target.value, start, end, kind);

  if (!result) {
    showMessage("Select text first.");
    return;
  }

  applyOutputEdit(target, result);
  return result;
}

// =========================
// Numbered list dropdown
// =========================
function closeListMenu() {
  if (listMenu) {
    listMenu.classList.add("hidden");
  }
  if (listMenuBtn) {
    listMenuBtn.setAttribute("aria-expanded", "false");
  }
}

if (listMenuBtn && listMenu) {
  listMenuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    listMenu.classList.toggle("hidden");
    listMenuBtn.setAttribute(
      "aria-expanded",
      String(!listMenu.classList.contains("hidden"))
    );
  });

  listMenu.querySelectorAll("[data-list-kind]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const kind = btn.getAttribute("data-list-kind");
      if (kind) {
        const result = applyListFormat(kind);
        if (result?.toggledOff) {
          deactivateFormatButton(listMenuBtn);
        } else {
          activateFormatButton(listMenuBtn);
        }
      }
      closeListMenu();
    });
  });

  document.addEventListener("click", () => {
    closeListMenu();
  });
}

// =========================
// Initial screen
// =========================
chrome.runtime.sendMessage({ type: "GET_AUTH_STATE" }, (response) => {
  if (response?.success && response.data?.isAuthenticated) {
    showView(generatorView);
    loadFromLocal();
  } else {
    showView(authChoiceView);
  }
});

// =========================
// Auth navigation
// =========================
if (showSignupBtn) {
  showSignupBtn.addEventListener("click", () => {
    showView(signupView);
  });
}

if (showLoginBtn) {
  showLoginBtn.addEventListener("click", () => {
    showView(loginView);
  });
}

if (backFromSignup) {
  backFromSignup.addEventListener("click", () => {
    showView(authChoiceView);
  });
}

if (backFromLogin) {
  backFromLogin.addEventListener("click", () => {
    showView(authChoiceView);
  });
}

if (backFromOtp) {
  backFromOtp.addEventListener("click", () => {
    showView(loginView);
  });
}

if (goToLoginFromSignup) {
  goToLoginFromSignup.addEventListener("click", () => {
    showView(loginView);
  });
}

if (goToSignupFromLogin) {
  goToSignupFromLogin.addEventListener("click", () => {
    showView(signupView);
  });
}

if (goBackToSignupFromOtp) {
  goBackToSignupFromOtp.addEventListener("click", () => {
    showView(signupView);
  });
}

// =========================
// Signup flow
// After signup, move to OTP view
// =========================
if (signupBtn) {
  signupBtn.addEventListener("click", () => {
    const fullName = signupName?.value.trim();
    const email = signupEmail?.value.trim();
    const password = signupPassword?.value.trim();

    if (!fullName || !email || !password) {
      showMessage("Please fill in all signup fields.");
      return;
    }

    setLoading(true);
    showMessage("");

    chrome.runtime.sendMessage(
      {
        type: "SIGNUP",
        payload: {
          full_name: fullName,
          email,
          password,
        },
      },
      (response) => {
        setLoading(false);

        if (chrome.runtime.lastError) {
          showMessage("Failed to communicate with extension background script.");
          return;
        }

        if (handleApiError(response, "Signup failed.")) {
          const unverifiedExists = String(response?.message || "")
            .toLowerCase()
            .includes("not verified");
          if (unverifiedExists && email) {
            setPendingVerificationEmail(email);
            clearOtpInputs();
            showView(otpView);
          }
          return;
        }

        setPendingVerificationEmail(email);
        clearOtpInputs();
        startResendCooldown();
        showView(otpView);
        showMessage("Account created. Enter the OTP sent to your email.");
      }
    );
  });
}

// =========================
// Login flow
// After login, move to generator
// =========================
if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    const email = loginEmail?.value.trim();
    const password = loginPassword?.value.trim();

    if (!email || !password) {
      showMessage("Please enter your email and password.");
      return;
    }

    setLoading(true);
    showMessage("");

    chrome.runtime.sendMessage(
      {
        type: "LOGIN",
        payload: {
          email,
          password,
        },
      },
      (response) => {
        setLoading(false);

        if (chrome.runtime.lastError) {
          showMessage("Failed to communicate with extension background script.");
          return;
        }

        if (handleApiError(response, "Login failed.")) {
          const notVerified = String(response?.message || "")
            .toLowerCase()
            .includes("not verified");
          if (notVerified && email) {
            setPendingVerificationEmail(email);
            clearOtpInputs();
            showView(otpView);
          }
          return;
        }

        showMessage("Login successful.");
        showView(generatorView);
      }
    );
  });
}

if (verifyOtpBtn) {
  verifyOtpBtn.addEventListener("click", () => {
    const otp = getOtpCode();
    const email = (
      pendingVerificationEmail ||
      signupEmail?.value ||
      loginEmail?.value ||
      ""
    ).trim();

    if (!email) {
      showMessage("Enter your email first by signing up or logging in.");
      showView(loginView);
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      showMessage("Please enter the 6-digit OTP code.");
      return;
    }

    setLoading(true);
    showMessage("");

    chrome.runtime.sendMessage(
      {
        type: "VERIFY_EMAIL_OTP",
        payload: {
          email,
          otp,
        },
      },
      (response) => {
        setLoading(false);

        if (chrome.runtime.lastError) {
          showMessage("Failed to communicate with extension background script.");
          return;
        }

        if (handleApiError(response, "OTP verification failed.")) {
          return;
        }

        showMessage("Email verified. You are now logged in.");
        showView(generatorView);
      }
    );
  });
}

if (resendOtpBtn) {
  resendOtpBtn.addEventListener("click", () => {
    const email = (
      pendingVerificationEmail ||
      signupEmail?.value ||
      loginEmail?.value ||
      ""
    ).trim();

    if (!email) {
      showMessage("Email is required to resend OTP.");
      return;
    }

    setLoading(true);
    showMessage("");

    chrome.runtime.sendMessage(
      {
        type: "RESEND_EMAIL_OTP",
        payload: {
          email,
        },
      },
      (response) => {
        setLoading(false);

        if (chrome.runtime.lastError) {
          showMessage("Failed to communicate with extension background script.");
          return;
        }

        if (handleApiError(response, "Failed to resend OTP.")) {
          return;
        }

        startResendCooldown();
        showMessage("A new OTP has been sent to your email.");
      }
    );
  });
}


// =========================
// Generator actions
// =========================
if (generateBtn) {
  generateBtn.addEventListener("click", async () => {
    const payload = {
      prompt: promptInput?.value.trim(),
      tone: toneSelect?.value,
      goal: goalSelect?.value,
    };

    if (!payload.prompt) {
      showMessage("Please enter a prompt.");
      return;
    }

    if (output) {
      output.value = "";
    }

    if (hashtagsOutput) {
      hashtagsOutput.value = "";
    }

    if (ctaOutput) {
      ctaOutput.value = "";
    }

    setLoading(true);
    showMessage("");

    chrome.runtime.sendMessage(
      {
        type: "GENERATE_POST",
        payload,
      },
      (response) => {
        setLoading(false);

        if (chrome.runtime.lastError) {
          showMessage("Failed to communicate with extension background script.");
          return;
        }

        if (!response) {
          showMessage("No response received from backend.");
          return;
        }

        if (!response.success) {
          if (response.errors) {
            const firstError = Object.values(response.errors)[0];
            showMessage(firstError || response.message || "Failed to generate post.");
            return;
          }

          showMessage(response.message || "Failed to generate post.");
          return;
        }

        if (output) {
          output.value = response.data?.post || ""
        }

        if (hashtagsOutput) {
          const hashtags = Array.isArray(response.data?.hashtags)
            ? response.data.hashtags.join(" ")
            : "";
          hashtagsOutput.value = hashtags;
        }

        if (ctaOutput) {
          ctaOutput.value = response.data?.cta || "";
        }
        saveToLocal(); // I am calling thing for it to run first before the message
        showMessage("Post generated successfully.");
      }
    );
  });
}

if (saveDraftBtn) {
  saveDraftBtn.addEventListener("click", () => {
    const draftContent = output?.value.trim();
    const originalPrompt = promptInput?.value.trim();
    const tone = toneSelect?.value;
    const goal = goalSelect?.value;
    const cta = ctaOutput?.value.trim();

    const hashtags = hashtagsOutput?.value
      ? hashtagsOutput.value
          .split(" ")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [];

    if (!draftContent) {
      showMessage("Generate a post before saving draft.");
      return;
    }

    if (!originalPrompt) {
      showMessage("Original prompt is required.");
      return;
    }

    const title =
      originalPrompt.length > 60
        ? `${originalPrompt.slice(0, 60)}...`
        : originalPrompt;

    const draftPayload = {
      title,
      original_prompt: originalPrompt,
      tone,
      goal,
      draft_content: draftContent,
      hashtags,
      cta,
    };

    setLoading(true, "Saving draft...");
    showMessage("");

    chrome.runtime.sendMessage(
      {
        type: "SAVE_DRAFT",
        payload: draftPayload,
      },
      (response) => {
        setLoading(false, "Generating post...");

        if (chrome.runtime.lastError) {
          showMessage("Failed to communicate with extension background script.");
          return;
        }

        if (handleApiError(response, "Failed to save draft.")) {
          return;
        }

        showMessage("Draft saved.");
        downloadDraftTxt(draftPayload);
      }
    );
  });
}

const COPY_COOLDOWN_MS = 1500;

// copy buttons for each textarea
document.querySelectorAll(".textarea-copy-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    if (btn.disabled) return;

    const id = btn.getAttribute("data-copy-target");
    const ta = id ? document.getElementById(id) : null;
    if (!ta) return;

    try {
      btn.disabled = true;
      btn.classList.add("cooldown");
      setActiveFormatButton(btn);

      const text = (ta.value || "").trim();
      if (!text) {
        showMessage("Nothing to copy yet.");
        return;
      }

      await navigator.clipboard.writeText(text);

      if (id === "output") {
        showMessage("Copied post.");
      } else if (id === "hashtagsOutput") {
        showMessage("Copied hashtags.");
      } else {
        showMessage("Copied CTA.");
      }
    } catch (error) {
      showMessage("Failed to copy.");
    } finally {
      setTimeout(() => {
        btn.classList.remove("cooldown");
        btn.disabled = false;
        if (activeFormatButton === btn) {
          btn.classList.remove("active");
          activeFormatButton = null;
        }
      }, COPY_COOLDOWN_MS);
    }
  });
});

// "Copy All Texts" button
if (copyAllBtn) {
  copyAllBtn.addEventListener("click", async () => {
    if (copyAllBtn.disabled) return;

    try {
      copyAllBtn.disabled = true;
      copyAllBtn.classList.add("cooldown");
      setActiveFormatButton(copyAllBtn);

      // join generated post, hashtags, and CTA sections without stripping formatting
      const postText = (output?.value || "").trimEnd();
      const hashtagsText = (hashtagsOutput?.value || "").trimEnd();
      const ctaText = (ctaOutput?.value || "").trimEnd();
      const combinedText = [postText, ctaText, hashtagsText].filter((s) => s.length > 0).join("\n\n");

      if (!combinedText) {
        showMessage("Nothing to copy yet.");
        return;
      }

      await navigator.clipboard.writeText(combinedText);
      showMessage("Copied post, CTA, and hashtags.");
    } catch (error) {
      showMessage("Failed to copy.");
    } finally {
      setTimeout(() => {
        copyAllBtn.classList.remove("cooldown");
        copyAllBtn.disabled = false;
        if (activeFormatButton === copyAllBtn) {
          copyAllBtn.classList.remove("active");
          activeFormatButton = null;
        }
      }, COPY_COOLDOWN_MS);
    }
  });
}

if (insertBtn) {
  insertBtn.addEventListener("click", async () => {
    const combinedText = [
      output?.value || "",
      "",
      ctaOutput?.value || "",
      "",
      hashtagsOutput?.value || "",
    ].join("\n");

    if (!combinedText.trim()) {
      showMessage("No content available to insert.");
      return;
    }

    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab?.id) {
      showMessage("No active tab found.");
      return;
    }

    const currentUrl = tab.url || "";
    const isLinkedIn = currentUrl.includes("linkedin.com");

    let allowRedirect = false;

    if (!isLinkedIn) {
      const confirmed = window.confirm(
        "You are not currently on LinkedIn. You will be redirected to LinkedIn home feed to insert this post. Continue?"
      );

      if (!confirmed) {
        showMessage("Insert cancelled.");
        return;
      }

      allowRedirect = true;
    }

    chrome.runtime.sendMessage(
      {
        type: "INSERT_POST_SMART",
        payload: {
          text: combinedText,
          allowRedirect,
        },
      },
      (response) => {
        if (chrome.runtime.lastError) {
          showMessage("Could not start LinkedIn insertion flow.");
          return;
        }

        if (!response?.success) {
          showMessage(response?.message || "Failed to insert into LinkedIn editor.");
          console.log("LinkedIn insert debug response:", response);
          return;
        }

        showMessage(response.message || "Insert action completed.");
        console.log("LinkedIn insert success response:", response);
        }
    );
  });
}

// =========================
// Text formatting actions
// =========================
if (boldBtn) {
  boldBtn.addEventListener("click", () => {
    applyEmphasis("bold", "Select text first.");
    setActiveFormatButton(boldBtn);
  });
}

if (italicBtn) {
  italicBtn.addEventListener("click", () => {
    applyEmphasis("italic", "Select text first.");
    setActiveFormatButton(italicBtn);
  });
}

if (bulletBtn) {
  bulletBtn.addEventListener("click", () => {
    const result = applyBulletPoints();
    if (result?.toggledOff) {
      deactivateFormatButton(bulletBtn);
    } else {
      setActiveFormatButton(bulletBtn);
    }
  });
}

if (codeBtn) {
  codeBtn.addEventListener("click", () => {
    applyCodeFence();
    setActiveFormatButton(codeBtn);
  });
}

// Auto-save when user types or edits the generated text
[output, hashtagsOutput, ctaOutput, promptInput].forEach(el => {
  if (el) {
    el.addEventListener("input", saveToLocal);
  }
});
