chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GENERATE_POST") {
    fetch("http://localhost:5000/api/posts/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(message.payload)
    })
      .then((res) => res.json())
      .then((data) => sendResponse(data))
      .catch((error) => {
        console.error(error);
        sendResponse({
          success: false,
          message: "Failed to generate post"
        });
      });

    return true;
  }
});