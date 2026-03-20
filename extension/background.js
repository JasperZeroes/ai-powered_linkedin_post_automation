// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.type === "GENERATE_POST") {
//     fetch("http://localhost:5000/api/posts/generate", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify(message.payload)
//     })
//       .then((res) => res.json())
//       .then((data) => sendResponse(data))
//       .catch((error) => {
//         console.error(error);
//         sendResponse({
//           success: false,
//           message: "Failed to generate post"
//         });
//       });

//     return true;
//   }
// });


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "GENERATE_POST") {
    return false;
  }

  fetch("http://localhost:5000/api/posts/generate", {
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
          message: data?.message || "Failed to generate post.",
          errors: data?.errors || null,
        });
        return;
      }

      sendResponse(data);
    })
    .catch((error) => {
      console.error("Background fetch error:", error);

      sendResponse({
        success: false,
        message: "Could not connect to the backend server.",
      });
    });

  return true;
});