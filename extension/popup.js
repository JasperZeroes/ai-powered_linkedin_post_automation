// =========================
// Generator elements
// =========================
const promptInput = document.getElementById("prompt");
const toneSelect = document.getElementById("tone");
const goalSelect = document.getElementById("goal");
const output = document.getElementById("output");
const copyOutputBtn = document.getElementById("copyOutputBtn");
const hashtagsOutput = document.getElementById("hashtagsOutput");
const ctaOutput = document.getElementById("ctaOutput");
const generateBtn = document.getElementById("generateBtn");
const copyBtn = document.getElementById("copyBtn");
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
const loadingText = document.getElementById("loadingText");

// =========================
// Auth view elements
// =========================
const authChoiceView = document.getElementById("authChoiceView");
const signupView = document.getElementById("signupView");
const loginView = document.getElementById("loginView");
const generatorView = document.getElementById("generatorView");

// =========================
// Auth navigation buttons
// =========================
const showSignupBtn = document.getElementById("showSignupBtn");
const showLoginBtn = document.getElementById("showLoginBtn");
const backFromSignup = document.getElementById("backFromSignup");
const backFromLogin = document.getElementById("backFromLogin");
const goToLoginFromSignup = document.getElementById("goToLoginFromSignup");
const goToSignupFromLogin = document.getElementById("goToSignupFromLogin");

// =========================
// Auth form buttons
// =========================
const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");

// =========================
// Auth form inputs
// =========================
const signupName = document.getElementById("signupName");
const signupEmail = document.getElementById("signupEmail");
const signupPassword = document.getElementById("signupPassword");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");

// =========================
// Helpers
// =========================
function showMessage(message) {
  if (!messageBox) return;
  messageBox.textContent = message;
}

function setLoading(isLoading, text = "Generating post...") {
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
}

function hideAllViews() {
  if (authChoiceView) authChoiceView.classList.add("hidden");
  if (signupView) signupView.classList.add("hidden");
  if (loginView) loginView.classList.add("hidden");
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

function applyOutputEdit(result) {
  if (!output || !result) {
    return false;
  }

  output.value = result.value;
  output.focus();
  output.setSelectionRange(result.selectionStart, result.selectionEnd);
  return true;
}

function applyEmphasis(kind, emptyMessage) {
  if (!output) {
    return;
  }

  const fmt = window.LinkedInPostFormatter;
  if (!fmt) {
    return;
  }

  const start = output.selectionStart;
  const end = output.selectionEnd;

  const result =
    kind === "bold"
      ? fmt.applyBold(output.value, start, end)
      : kind === "italic"
        ? fmt.applyItalic(output.value, start, end)
        : fmt.applyCodeFence(output.value, start, end);

  if (!result) {
    showMessage(emptyMessage);
    return;
  }

  applyOutputEdit(result);
}

function applyBulletPoints() {
  if (!output) {
    return;
  }

  const fmt = window.LinkedInPostFormatter;
  if (!fmt) {
    return;
  }

  const start = output.selectionStart;
  const end = output.selectionEnd;
  const result = fmt.applyList(output.value, start, end, "bullet");

  if (!result) {
    showMessage("Select text first.");
    return;
  }

  applyOutputEdit(result);
  return result;
}

function applyCodeFence() {
  applyEmphasis("code", "Select text first.");
}

function applyListFormat(kind) {
  if (!output) {
    return;
  }

  const fmt = window.LinkedInPostFormatter;
  if (!fmt) {
    return;
  }

  const start = output.selectionStart;
  const end = output.selectionEnd;
  const result = fmt.applyList(output.value, start, end, kind);

  if (!result) {
    showMessage("Select text first.");
    return;
  }

  applyOutputEdit(result);
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

// =========================
// Signup flow
// After signup, move to login
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
          return;
        }

        showMessage("Signup successful. Please login.");
        showView(loginView);

        if (loginEmail) {
          loginEmail.value = email;
        }

        if (loginPassword) {
          loginPassword.value = "";
        }
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
          return;
        }

        showMessage("Login successful.");
        showView(generatorView);
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
          output.value = response.data?.post || "";
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

    setLoading(true, "Saving draft...");
    showMessage("");

    chrome.runtime.sendMessage(
      {
        type: "SAVE_DRAFT",
        payload: {
          title,
          original_prompt: originalPrompt,
          tone,
          goal,
          draft_content: draftContent,
          hashtags,
          cta,
        },
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
      }
    );
  });
}

if (copyBtn) {
  copyBtn.addEventListener("click", async () => {
    try {
      const postText = output?.value || "";
      const ctaText = ctaOutput?.value || "";
      const hashtagsText = hashtagsOutput?.value || "";

      const combinedText = [
        postText,
        "", // spacing
        ctaText,
        "", // spacing
        hashtagsText,
      ].join("\n");

      await navigator.clipboard.writeText(combinedText);

      showMessage("Copied post, CTA, and hashtags.");
    } catch (error) {
      showMessage("Failed to copy.");
    }
  });
}

if (insertBtn) {
  insertBtn.addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab?.id) {
      showMessage("No active tab found.");
      return;
    }

    chrome.tabs.sendMessage(
      tab.id,
      {
        type: "INSERT_POST",
        payload: {
          text: output?.value || "",
        },
      },
      (response) => {
        if (chrome.runtime.lastError) {
          showMessage("Could not connect to LinkedIn page.");
          return;
        }

        showMessage(response?.message || "Insert action completed.");
      }
    );
  });
}

// =========================
// Text formatting actions
// =========================
if (boldBtn) {
  boldBtn.addEventListener("click", () => {
    applyEmphasis("bold", "Select text in the generated post first.");
    setActiveFormatButton(boldBtn);
  });
}

if (italicBtn) {
  italicBtn.addEventListener("click", () => {
    applyEmphasis("italic", "Select text in the generated post first.");
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

if (copyOutputBtn) {
  copyOutputBtn.addEventListener("click", async () => {
    if (copyOutputBtn.disabled) return;

    try {
      copyOutputBtn.disabled = true;
      copyOutputBtn.classList.add("cooldown");
      setActiveFormatButton(copyOutputBtn);

      const postText = output?.value || "";
      await navigator.clipboard.writeText(postText);
      showMessage("Copied generated post text.");
    } catch (error) {
      showMessage("Failed to copy.");
    } finally {
      const COPY_COOLDOWN_MS = 1500;
      setTimeout(() => {
        copyOutputBtn.classList.remove("cooldown");
        copyOutputBtn.disabled = false;
        if (activeFormatButton === copyOutputBtn) {
          copyOutputBtn.classList.remove("active");
          activeFormatButton = null;
        }
      }, COPY_COOLDOWN_MS);
    }
  });
}