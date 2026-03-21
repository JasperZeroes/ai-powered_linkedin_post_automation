chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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

  return false;
});