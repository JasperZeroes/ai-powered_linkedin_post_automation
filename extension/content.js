function findLinkedInEditor() {
  const selectors = [
    '[contenteditable="true"][role="textbox"]',
    '.ql-editor[contenteditable="true"]',
    'div[contenteditable="true"]'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) return element;
  }

  return null;
}

function insertTextIntoEditor(text) {
  const editor = findLinkedInEditor();

  if (!editor) {
    return {
      success: false,
      message: "LinkedIn editor not found. Open the post composer first."
    };
  }

  editor.focus();

  editor.innerHTML = "";
  const lines = text.split("\n");

  lines.forEach((line, index) => {
    const div = document.createElement("div");
    div.textContent = line || "\u00A0";
    editor.appendChild(div);

    if (index < lines.length - 1) {
      const br = document.createElement("br");
      editor.appendChild(br);
    }
  });

  editor.dispatchEvent(new Event("input", { bubbles: true }));

  return {
    success: true,
    message: "Post inserted into LinkedIn editor."
  };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "INSERT_POST") {
    const result = insertTextIntoEditor(message.payload.text);
    sendResponse(result);
  }
});