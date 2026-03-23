function isElementVisible(element) {
  if (!element) return false;

  const style = window.getComputedStyle(element);
  return (
    element.offsetParent !== null &&
    style.display !== "none" &&
    style.visibility !== "hidden"
  );
}

function findLinkedInEditor() {
  const dialog = findMainPostDialog();

  if (!dialog) {
    return null;
  }

  const selectors = [
    '.ql-editor[contenteditable="true"][data-placeholder="What do you want to talk about?"]',
    '.ql-editor[contenteditable="true"][aria-placeholder="What do you want to talk about?"]',
    '[data-test-ql-editor-contenteditable="true"][data-placeholder="What do you want to talk about?"]',
    '[contenteditable="true"][role="textbox"][aria-label="Text editor for creating content"]',
  ];

  for (const selector of selectors) {
    const element = dialog.querySelector(selector);

    if (element && isElementVisible(element)) {
      return element;
    }
  }

  return null;
}

function findStartPostButton() {
  const buttons = Array.from(document.querySelectorAll("button"));

  for (const button of buttons) {
    const text = button.innerText?.trim().toLowerCase() || "";

    if (text.includes("start a post") && isElementVisible(button)) {
      return button;
    }
  }

  return null;
}

function findMainPostDialog() {
  const dialogs = Array.from(document.querySelectorAll('[role="dialog"]'));

  for (const dialog of dialogs) {
    if (!isElementVisible(dialog)) {
      continue;
    }

    const text = dialog.innerText?.toLowerCase() || "";

    const looksLikePostComposer =
      text.includes("create a post") ||
      text.includes("what do you want to talk about?");

    if (looksLikePostComposer) {
      return dialog;
    }
  }

  return null;
}

function isMainPostComposerOpen() {
  return !!findLinkedInEditor();
}

function waitForEditor(timeoutMs = 12000, intervalMs = 300) {
  return new Promise((resolve) => {
    const startTime = Date.now();

    const timer = setInterval(() => {
      const editor = findLinkedInEditor();

      if (editor) {
        clearInterval(timer);
        resolve(editor);
        return;
      }

      if (Date.now() - startTime >= timeoutMs) {
        clearInterval(timer);
        resolve(null);
      }
    }, intervalMs);
  });
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
      const safeLine = escapeHtml(line);

      if (!safeLine.trim()) {
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

function insertHtmlIntoEditor(editor, text) {
  if (!editor) {
    return {
      success: false,
      inserted: false,
      target: null,
      message: "LinkedIn editor not found.",
    };
  }

  if (!text || !text.trim()) {
    return {
      success: false,
      inserted: false,
      target: null,
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
      inserted: false,
      target: null,
      message: "Failed to insert content into LinkedIn editor.",
    };
  }

  return {
    success: true,
    inserted: true,
    target: "main_post_editor",
    message: "Post inserted into LinkedIn editor.",
  };
}

async function ensureEditorAndInsert(text) {
  if (!text || !text.trim()) {
    return {
      success: false,
      inserted: false,
      target: null,
      message: "No content available to insert.",
    };
  }

  // First, check if the MAIN post composer is already open
  const existingMainEditor = findLinkedInEditor();

  if (existingMainEditor) {
    return insertHtmlIntoEditor(existingMainEditor, text);
  }

  // Otherwise, always go through Start a post
  const startPostButton = findStartPostButton();

  if (!startPostButton) {
    return {
      success: false,
      inserted: false,
      target: null,
      message: "Could not find 'Start a post'. Open LinkedIn home and try again.",
    };
  }

  startPostButton.click();

  // small delay so LinkedIn can begin rendering the post modal
  await new Promise((resolve) => setTimeout(resolve, 500));

  const editorAfterClick = await waitForEditor(12000, 300);

  if (!editorAfterClick) {
    return {
      success: false,
      inserted: false,
      target: null,
      message: "LinkedIn composer did not open in time.",
    };
  }

  return insertHtmlIntoEditor(editorAfterClick, text);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "INSERT_POST") {
    ensureEditorAndInsert(message.payload.text)
      .then((result) => sendResponse(result))
      .catch(() => {
        sendResponse({
          success: false,
          message: "An unexpected error occurred while inserting into LinkedIn.",
        });
      });

    return true;
  }
});