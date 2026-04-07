function isElementVisible(element) {
  if (!element) return false;

  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();

  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    style.opacity !== "0" &&
    rect.width > 0 &&
    rect.height > 0
  );
}

function buildResult({ success, message, inserted = false, target = null }) {
  return {
    success,
    inserted,
    target,
    message,
  };
}

function getAllSearchRoots(root = document) {
  const roots = [root];
  const elements = root.querySelectorAll ? root.querySelectorAll("*") : [];

  for (const element of elements) {
    if (element.shadowRoot) {
      roots.push(element.shadowRoot);
      roots.push(...getAllSearchRoots(element.shadowRoot));
    }
  }

  return roots;
}

function queryAllAcrossRoots(selectors) {
  const roots = getAllSearchRoots(document);
  const matches = [];

  for (const searchRoot of roots) {
    for (const selector of selectors) {
      if (searchRoot.querySelectorAll) {
        matches.push(...Array.from(searchRoot.querySelectorAll(selector)));
      }
    }
  }

  return matches;
}

function findStartPostButton() {
  const selectors = [
    '[aria-label="Start a post"]',
    '[aria-label*="Start a post"]',
    'button[aria-label="Start a post"]',
    'button[aria-label*="Start a post"]',
    'div[aria-label="Start a post"]',
    'div[aria-label*="Start a post"]',
  ];

  const directMatches = queryAllAcrossRoots(selectors);

  for (const element of directMatches) {
    if (isElementVisible(element)) {
      return element;
    }
  }

  const clickableElements = queryAllAcrossRoots([
    "button",
    'div[role="button"]',
    "div[aria-label]",
    "div",
  ]);

  for (const element of clickableElements) {
    const text = element.innerText?.trim().toLowerCase() || "";
    const ariaLabel = element.getAttribute("aria-label")?.trim().toLowerCase() || "";

    if (
      (text.includes("start a post") || ariaLabel.includes("start a post")) &&
      isElementVisible(element)
    ) {
      return element;
    }
  }

  return null;
}

function findPostComposerEditor() {
  const selectors = [
    '.editor-container .editor-content .ql-editor[contenteditable="true"]',
    '.editor-container .ql-editor[contenteditable="true"]',
    '.editor-content.ql-container .ql-editor[contenteditable="true"]',
    '.ql-editor[contenteditable="true"][data-placeholder="What do you want to talk about?"]',
    '.ql-editor[contenteditable="true"][aria-placeholder="What do you want to talk about?"]',
    '.ql-editor[contenteditable="true"][aria-label="Text editor for creating content"]',
    '.ql-editor[contenteditable="true"][role="textbox"]',
  ];

  const elements = queryAllAcrossRoots(selectors);

  for (const element of elements) {
    if (element.getAttribute("contenteditable") === "true") {
      return element;
    }
  }

  return null;
}

function waitForPostComposerEditorWithObserver(timeoutMs = 30000) {
  return new Promise((resolve) => {
    const existingEditor = findPostComposerEditor();

    if (existingEditor) {
      resolve(existingEditor);
      return;
    }

    const observer = new MutationObserver(() => {
      const editor = findPostComposerEditor();

      if (editor) {
        observer.disconnect();
        resolve(editor);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeoutMs);
  });
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
    return buildResult({
      success: false,
      inserted: false,
      target: null,
      message: "Editor not found.",
    });
  }

  if (!text || !text.trim()) {
    return buildResult({
      success: false,
      inserted: false,
      target: null,
      message: "No content provided for insertion.",
    });
  }

  editor.focus();

  const lines = text.split("\n");

  while (editor.firstChild) {
    editor.removeChild(editor.firstChild);
  }

  lines.forEach((line) => {
    const paragraph = document.createElement("p");

    if (line.trim()) {
      paragraph.textContent = line;
    } else {
      paragraph.innerHTML = "<br>";
    }

    editor.appendChild(paragraph);
  });

  if (!editor.children.length) {
    const paragraph = document.createElement("p");
    paragraph.innerHTML = "<br>";
    editor.appendChild(paragraph);
  }

  editor.classList.remove("ql-blank");
  placeCursorAtEnd(editor);

  editor.dispatchEvent(new InputEvent("input", { bubbles: true }));
  editor.dispatchEvent(new Event("change", { bubbles: true }));
  editor.dispatchEvent(new Event("blur", { bubbles: true }));

  const afterText = editor.innerText.replace(/\u00A0/g, " ").trim();

  if (!afterText) {
    return buildResult({
      success: false,
      inserted: false,
      target: null,
      message: "Failed to insert content into the editor.",
    });
  }

  return buildResult({
    success: true,
    inserted: true,
    target: "main_post_editor",
    message: "Content inserted successfully.",
  });
}

async function ensureEditorAndInsert(text) {
  if (!text || !text.trim()) {
    return buildResult({
      success: false,
      inserted: false,
      target: null,
      message: "No content available to insert.",
    });
  }

  let editor = findPostComposerEditor();

  if (editor) {
    return insertHtmlIntoEditor(editor, text);
  }

  const startPostButton = findStartPostButton();

  if (!startPostButton) {
    return buildResult({
      success: false,
      inserted: false,
      target: null,
      message: "Could not find the post composer trigger.",
    });
  }

  startPostButton.click();

  await new Promise((resolve) => setTimeout(resolve, 2500));

  editor = await waitForPostComposerEditorWithObserver(30000);

  if (!editor) {
    return buildResult({
      success: false,
      inserted: false,
      target: null,
      message: "Post composer editor could not be located.",
    });
  }

  return insertHtmlIntoEditor(editor, text);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "INSERT_POST") {
    ensureEditorAndInsert(message.payload.text)
      .then((result) => sendResponse(result))
      .catch(() => {
        sendResponse({
          success: false,
          message: "An unexpected error occurred while inserting content.",
        });
      });

    return true;
  }
});