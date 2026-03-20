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
const copyBtn = document.getElementById("copyBtn");
const insertBtn = document.getElementById("insertBtn");
const boldBtn = document.getElementById("boldBtn");
const italicBtn = document.getElementById("italicBtn");
const bulletBtn = document.getElementById("bulletBtn");
const loading = document.getElementById("loading");
const messageBox = document.getElementById("message");

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

function setLoading(isLoading) {
  if (loading) {
    loading.classList.toggle("hidden", !isLoading);
  }

  if (generateBtn) {
    generateBtn.disabled = isLoading;
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

function wrapSelectedText(wrapperStart, wrapperEnd) {
  if (!output) return;

  const start = output.selectionStart;
  const end = output.selectionEnd;
  const text = output.value;
  const selectedText = text.slice(start, end);

  if (!selectedText) {
    showMessage("Select text in the generated post first.");
    return;
  }

  output.value =
    text.slice(0, start) +
    wrapperStart +
    selectedText +
    wrapperEnd +
    text.slice(end);

  output.focus();
}

function applyBulletPoints() {
  if (!output) return;

  const start = output.selectionStart;
  const end = output.selectionEnd;
  const text = output.value;
  const selectedText = text.slice(start, end);

  if (!selectedText) {
    showMessage("Select text first.");
    return;
  }

  const bulleted = selectedText
    .split("\n")
    .map((line) => `• ${line}`)
    .join("\n");

  output.value = text.slice(0, start) + bulleted + text.slice(end);
  output.focus();
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
// Login flow - UI only for now
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

if (boldBtn) {
  boldBtn.addEventListener("click", () => {
    wrapSelectedText("**", "**");
  });
}

if (italicBtn) {
  italicBtn.addEventListener("click", () => {
    wrapSelectedText("*", "*");
  });
}

if (bulletBtn) {
  bulletBtn.addEventListener("click", () => {
    applyBulletPoints();
  });
}