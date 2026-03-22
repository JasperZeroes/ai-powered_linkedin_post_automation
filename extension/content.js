function findLinkedInEditor() {
  const selectors = [
    '.ql-editor[contenteditable="true"]',
    '[data-test-ql-editor-contenteditable="true"]',
    '[contenteditable="true"][role="textbox"]',
  ];

  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);

    for (const element of elements) {
      const isVisible =
        element.offsetParent !== null ||
        window.getComputedStyle(element).display !== "none";

      if (isVisible) {
        return element;
      }
    }
  }

  return null;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildLinkedInEditorHtml(text) {
  const lines = text.split("\n");

  return lines
    .map((line) => {
      const safeLine = escapeHtml(line.trim());

      if (!safeLine) {
        return "<p><br></p>";
      }

      return `<p>${safeLine}</p>`;
    })
    .join("");
}

function placeCursorAtEnd(element) {
  const selection = window.getSelection();
  const range = document.createRange();

  range.selectNodeContents(element);
  range.collapse(false);

  selection.removeAllRanges();
  selection.addRange(range);
}

function insertTextIntoEditor(text) {
  const editor = findLinkedInEditor();

  if (!editor) {
    return {
      success: false,
      message: "LinkedIn editor not found. Open the post composer first.",
    };
  }

  if (!text || !text.trim()) {
    return {
      success: false,
      message: "No content available to insert.",
    };
  }

  editor.focus();

  const html = buildLinkedInEditorHtml(text);
  editor.innerHTML = html;

  editor.classList.remove("ql-blank");

  placeCursorAtEnd(editor);

  editor.dispatchEvent(new InputEvent("input", { bubbles: true }));
  editor.dispatchEvent(new Event("change", { bubbles: true }));
  editor.dispatchEvent(new Event("blur", { bubbles: true }));

  const insertedText = editor.innerText.replace(/\u00A0/g, " ").trim();

  if (!insertedText) {
    return {
      success: false,
      message: "Failed to insert content into LinkedIn editor.",
    };
  }

  return {
    success: true,
    message: "Post inserted into LinkedIn editor.",
  };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "INSERT_POST") {
    const result = insertTextIntoEditor(message.payload.text);
    sendResponse(result);
  }
});