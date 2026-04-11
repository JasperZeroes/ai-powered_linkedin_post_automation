// ----------------------
// Authentication helpers
// ----------------------
function sendAuthenticatedRequest({ url, method = "GET", token, body = null, sendResponse, fallbackMessage }) {
  fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : null,
  })
    .then(async (res) => {
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        sendResponse({
          success: false,
          message: data?.message || fallbackMessage,
          errors: data?.errors || null,
        });
        return;
      }

      sendResponse(data);
    })
    .catch((error) => {
      console.error(`${method} ${url} error:`, error);

      sendResponse({
        success: false,
        message: "Could not connect to the backend server.",
      });
    });
}

// ---------------------
// Linkedin post helpers
// ---------------------
function isLinkedInUrl(url) {
  return typeof url === "string" && url.includes("linkedin.com");
}

function isLinkedInFeedUrl(url) {
  return typeof url === "string" && /^https:\/\/www\.linkedin\.com\/feed\/?/i.test(url);
}

function waitForTabComplete(tabId, timeoutMs = 45000) {
  return new Promise((resolve, reject) => {
    let timeoutId = null;

    function cleanup() {
      chrome.tabs.onUpdated.removeListener(handleUpdated);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }

    function handleUpdated(updatedTabId, changeInfo) {
      if (updatedTabId === tabId && changeInfo.status === "complete") {
        cleanup();
        resolve();
      }
    }

    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError) {
        reject(new Error("Could not access tab."));
        return;
      }

      if (tab.status === "complete") {
        resolve();
        return;
      }

      chrome.tabs.onUpdated.addListener(handleUpdated);

      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error("Timed out waiting for LinkedIn to load."));
      }, timeoutMs);
    });
  });
}

function sendInsertMessageToTab(tabId, text, sendResponse) {
  setTimeout(() => {
    chrome.tabs.sendMessage(
      tabId,
      {
        type: "INSERT_POST",
        payload: { text },
      },
      (response) => {
        if (chrome.runtime.lastError) {
          sendResponse({
            success: false,
            message: "Could not connect to LinkedIn page after navigation. Refresh LinkedIn and try again.",
          });
          return;
        }

        sendResponse(
          response || {
            success: false,
            message: "No response from LinkedIn page.",
          }
        );
      }
    );
  }, 1000);
}

// -----------------------------
// Google OAuth PKCE helpers 
// -----------------------------
// convert byte array to base64 url encoded string
function base64UrlEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// generate a random verifier bytes for PKCE code verifier and OAuth state
function randomVerifierBytes(length) {
  const buf = new Uint8Array(length);
  crypto.getRandomValues(buf);
  return base64UrlEncode(buf);
}

// generate a SHA-256 hash of the code verifier and return it as a base64 url encoded string
async function sha256Base64Url(asciiString) {
  const data = new TextEncoder().encode(asciiString);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(hash);
}

// build the Google PKCE auth URL
async function buildGooglePkceAuthUrl() {
  const manifest = chrome.runtime.getManifest();
  const clientId = manifest.oauth2.client_id;
  const redirectUri = chrome.identity.getRedirectURL();
  const codeVerifier = randomVerifierBytes(32);
  const codeChallenge = await sha256Base64Url(codeVerifier);
  const state = randomVerifierBytes(16);
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: "openid email profile",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
  });
  return {
    authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    codeVerifier,
    state,
    redirectUri,
  };
}

// -----------------
// Background script
// -----------------
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  
  // signup with email and password
  if (message.type === "SIGNUP") {
    fetch("http://localhost:5000/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message.payload),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          sendResponse({
            success: false,
            message: data?.message || "Signup failed.",
            errors: data?.errors || null,
          });
          return;
        }

        const token = data?.data?.token || data?.token || null;

        if (!token) {
          sendResponse({
            success: false,
            message: "Signup succeeded but no token was returned.",
          });
          return;
        }

        sendResponse(data);
      })
      .catch((error) => {
        console.error("Signup error:", error);

        sendResponse({
          success: false,
          message: "Could not connect to the backend server.",
        });
      });

    return true;
  }

  // login with email and password
  if (message.type === "LOGIN") {
    fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message.payload),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          sendResponse({
            success: false,
            message: data?.message || "Login failed.",
            errors: data?.errors || null,
          });
          return;
        }

        const token = data?.data?.token || data?.token || null;
        const user = data?.data?.user || data?.user || null;

        if (!token) {
          sendResponse({
            success: false,
            message: "Login succeeded but no token was returned.",
          });
          return;
        }

        chrome.storage.local.set({ authToken: token, currentUser: user }, () => {
          sendResponse({
            success: true,
            message: "Login successful.",
            data,
          });
        });
      })
      .catch((error) => {
        console.error("Login error:", error);

        sendResponse({
          success: false,
          message: "Could not connect to the backend server.",
        });
      });

    return true;
  }

  // signup/login with Google
  if (message.type === "GOOGLE_AUTH") {
    (async () => {
      let pkce;
      try {
        pkce = await buildGooglePkceAuthUrl();
      } catch (e) {
        console.error("Google PKCE setup error:", e);
        sendResponse({
          success: false,
          message: "Could not start Google sign-in.",
        });
        return;
      }

      chrome.identity.launchWebAuthFlow(
        { url: pkce.authUrl, interactive: true },
        (redirectedTo) => {
          if (chrome.runtime.lastError || !redirectedTo) {
            sendResponse({
              success: false,
              message: chrome.runtime.lastError?.message || "Google sign-in was cancelled.",
            });
            return;
          }

          let url;
          try {
            url = new URL(redirectedTo);
          } catch {
            sendResponse({
              success: false,
              message: "Invalid redirect from Google.",
            });
            return;
          }

          const oauthError = url.searchParams.get("error");
          if (oauthError) {
            sendResponse({
              success: false,
              message:
                url.searchParams.get("error_description") || `Google error: ${oauthError}`,
            });
            return;
          }

          if (url.searchParams.get("state") !== pkce.state) {
            sendResponse({
              success: false,
              message: "Google sign-in state mismatch.",
            });
            return;
          }

          const code = url.searchParams.get("code");
          if (!code) {
            sendResponse({
              success: false,
              message: "No authorization code from Google.",
            });
            return;
          }

          fetch("http://localhost:5000/api/auth/google", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code,
              code_verifier: pkce.codeVerifier,
              redirect_uri: pkce.redirectUri,
            }),
          })
            .then(async (res) => {
              const data = await res.json().catch(() => null);

              if (!res.ok) {
                sendResponse({
                  success: false,
                  message: data?.message || "Google sign-in failed.",
                  errors: data?.errors || null,
                });
                return;
              }

              const token = data?.data?.token || data?.token || null;
              const user = data?.data?.user || data?.user || null;

              if (!token) {
                sendResponse({
                  success: false,
                  message: "Google sign-in succeeded but no token was returned.",
                });
                return;
              }

              chrome.storage.local.set({ authToken: token, currentUser: user }, () => {
                sendResponse({
                  success: true,
                  message: "Signed in with Google.",
                  data,
                });
              });
            })
            .catch((error) => {
              console.error("Google auth error:", error);
              sendResponse({
                success: false,
                message: "Could not connect to the backend server.",
              });
            });
        }
      );
    })();

    return true;
  }

  if (message.type === "GENERATE_POST") {
    chrome.storage.local.get(["authToken"], (result) => {
      const token = result.authToken;

      if (!token) {
        sendResponse({
          success: false,
          message: "Unauthorized. Please login first.",
        });
        return;
      }

      fetch("http://localhost:5000/api/posts/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(message.payload),
      })
        .then(async (res) => {
          const data = await res.json().catch(() => null);

          if (!res.ok) {
            sendResponse({
              success: false,
              message: data?.message || "Failed to generate post.",
              errors: data?.errors || null,
            });
            return;
          }

          sendResponse(data);
        })
        .catch((error) => {
          console.error("Generate post error:", error);

          sendResponse({
            success: false,
            message: "Could not connect to the backend server.",
          });
        });
    });

    return true;
  }

  if (message.type === "SAVE_DRAFT") {
    chrome.storage.local.get(["authToken"], (result) => {
      const token = result.authToken;

      if (!token) {
        sendResponse({
          success: false,
          message: "Unauthorized. Please login first.",
        });
        return;
      }

      fetch("http://localhost:5000/api/drafts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(message.payload),
      })
        .then(async (res) => {
          const data = await res.json().catch(() => null);

          if (!res.ok) {
            sendResponse({
              success: false,
              message: data?.message || "Failed to save draft.",
              errors: data?.errors || null,
            });
            return;
          }

          sendResponse(data);
        })
        .catch((error) => {
          console.error("Save draft error:", error);

          sendResponse({
            success: false,
            message: "Could not connect to the backend server.",
          });
        });
    });

    return true;
  }

  if (message.type === "LOGOUT") {
    chrome.storage.local.remove(["authToken", "currentUser"], () => {
      sendResponse({
        success: true,
        message: "Logged out successfully.",
      });
    });

    return true;
  }

  if (message.type === "GET_AUTH_STATE") {
    chrome.storage.local.get(["authToken", "currentUser"], (result) => {
      sendResponse({
        success: true,
        data: {
          token: result.authToken || null,
          user: result.currentUser || null,
          isAuthenticated: !!result.authToken,
        },
      });
    });

    return true;
  }

  if (message.type === "LOG_USAGE_EVENT") {
    chrome.storage.local.get(["authToken"], (result) => {
      const token = result.authToken;

      if (!token) {
        sendResponse({
          success: false,
          message: "Unauthorized. Please login first.",
        });
        return;
      }

      sendAuthenticatedRequest({
        url: "http://localhost:5000/api/events",
        method: "POST",
        token,
        body: message.payload,
        sendResponse,
        fallbackMessage: "Failed to log usage event.",
      });
    });

    return true;
  }

  if (message.type === "INSERT_POST_SMART") {
    const text = message.payload?.text || "";
    const allowRedirect = !!message.payload?.allowRedirect;
    const linkedInFeedUrl = "https://www.linkedin.com/feed/";

    if (!text.trim()) {
      sendResponse({
        success: false,
        message: "No content available to insert.",
      });
      return true;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const activeTab = tabs?.[0];

      if (!activeTab?.id) {
        sendResponse({
          success: false,
          message: "No active tab found.",
        });
        return;
      }

      try {
        if (isLinkedInFeedUrl(activeTab.url)) {
          sendInsertMessageToTab(activeTab.id, text, sendResponse);
          return;
        }

        if (isLinkedInUrl(activeTab.url)) {
          chrome.tabs.update(activeTab.id, { url: linkedInFeedUrl }, async (updatedTab) => {
            try {
              await waitForTabComplete(updatedTab.id);
              sendInsertMessageToTab(updatedTab.id, text, sendResponse);
            } catch (error) {
              sendResponse({
                success: false,
                message: error.message || "Failed to load LinkedIn feed.",
              });
            }
          });

          return;
        }

        if (!allowRedirect) {
          sendResponse({
            success: false,
            message: "Insert cancelled.",
          });
          return;
        }

        chrome.tabs.create({ url: linkedInFeedUrl, active: true }, async (newTab) => {
          try {
            await waitForTabComplete(newTab.id);
            sendInsertMessageToTab(newTab.id, text, sendResponse);
          } catch (error) {
            sendResponse({
              success: false,
              message: error.message || "Failed to open LinkedIn feed.",
            });
          }
        });
      } catch (error) {
        sendResponse({
          success: false,
          message: "Failed to start LinkedIn insertion flow.",
        });
      }
    });

    return true;
  }

  return false;
});