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

function buildDebugResult({
  success,
  message,
  inserted = false,
  target = null,
  debug = {},
}) {
  return {
    success,
    inserted,
    target,
    message,
    debug,
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

function collectDomDebugSnapshot() {
  const roots = getAllSearchRoots(document);

  const iframes = Array.from(document.querySelectorAll("iframe")).map((iframe) => ({
    src: iframe.src,
    id: iframe.id,
    className: iframe.className,
  }));

  const contenteditableNodes = [];
  const editorContainers = [];

  for (const root of roots) {
    if (root.querySelectorAll) {
      contenteditableNodes.push(
        ...Array.from(root.querySelectorAll('[contenteditable="true"]')).map((el) => ({
          tagName: el.tagName,
          className: el.className,
          dataPlaceholder: el.getAttribute("data-placeholder"),
          ariaPlaceholder: el.getAttribute("aria-placeholder"),
          ariaLabel: el.getAttribute("aria-label"),
          role: el.getAttribute("role"),
          text: el.innerText?.slice(0, 100) || "",
        }))
      );

      editorContainers.push(
        ...Array.from(
          root.querySelectorAll(".editor-container, .editor-content, .ql-container, .ql-editor")
        ).map((el) => ({
          tagName: el.tagName,
          className: el.className,
          text: el.innerText?.slice(0, 100) || "",
        }))
      );
    }
  }

  return {
    title: document.title,
    url: location.href,
    rootCount: roots.length,
    iframeCount: iframes.length,
    iframes,
    contenteditableCount: contenteditableNodes.length,
    contenteditableNodes,
    editorContainerCount: editorContainers.length,
    editorContainers,
  };
}

function findLinkedInEditor() {
  const selectors = [
    '.editor-content .ql-editor[contenteditable="true"]',
    '.ql-container .ql-editor[contenteditable="true"]',
    '.ql-editor[contenteditable="true"][data-placeholder="What do you want to talk about?"]',
    '.ql-editor[contenteditable="true"][aria-placeholder="What do you want to talk about?"]',
    '.ql-editor[contenteditable="true"][aria-label="Text editor for creating content"]',
    '[data-test-ql-editor-contenteditable="true"]',
  ];

  for (const selector of selectors) {
    const elements = Array.from(document.querySelectorAll(selector));

    for (const element of elements) {
      const style = window.getComputedStyle(element);
      const isUsable =
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        element.getAttribute("contenteditable") === "true";

      if (isUsable) {
        return element;
      }
    }
  }

  return null;
}

function waitForLinkedInEditorAfterComposerOpen(timeoutMs = 20000, intervalMs = 500) {
  return new Promise((resolve) => {
    const start = Date.now();

    const timer = setInterval(() => {
      const editor = findLinkedInEditor();

      if (editor) {
        clearInterval(timer);
        resolve(editor);
        return;
      }

      if (Date.now() - start >= timeoutMs) {
        clearInterval(timer);
        resolve(null);
      }
    }, intervalMs);
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function waitForPostComposerEditorWithObserver(timeoutMs = 20000) {
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

function waitForPostComposerEditor(timeoutMs = 20000, intervalMs = 500) {
  return new Promise((resolve) => {
    const start = Date.now();

    const timer = setInterval(() => {
      const editor = findPostComposerEditor();

      if (editor) {
        clearInterval(timer);
        resolve(editor);
        return;
      }

      if (Date.now() - start >= timeoutMs) {
        clearInterval(timer);
        resolve(null);
      }
    }, intervalMs);
  });
}


function findMainPostDialog() {
  const editor = document.querySelector(
    '.ql-editor[contenteditable="true"][data-placeholder="What do you want to talk about?"], ' +
    '.ql-editor[contenteditable="true"][aria-placeholder="What do you want to talk about?"], ' +
    '[data-test-ql-editor-contenteditable="true"][data-placeholder="What do you want to talk about?"], ' +
    '[contenteditable="true"][role="textbox"][aria-label="Text editor for creating content"]'
  );

  if (!editor || !isElementVisible(editor)) {
    return null;
  }

  return editor.closest(".editor-content, .ql-container, .share-box-feed-entry__closed-share-box, body");
}

function waitForEditor(timeoutMs = 20000, intervalMs = 300) {
  return new Promise((resolve) => {
    const startTime = Date.now();

    const timer = setInterval(() => {
      const editor = findPostComposerEditor();

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
    return buildDebugResult({
      success: false,
      inserted: false,
      target: null,
      message: "DEBUG: editor argument is null.",
    });
  }

  if (!text || !text.trim()) {
    return buildDebugResult({
      success: false,
      inserted: false,
      target: null,
      message: "DEBUG: text is empty before insertion.",
    });
  }

  const beforeHtml = editor.innerHTML;
  const beforeText = editor.innerText;

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

  const afterHtml = editor.innerHTML;
  const afterText = editor.innerText.replace(/\u00A0/g, " ").trim();

  if (!afterText) {
    return buildDebugResult({
      success: false,
      inserted: false,
      target: null,
      message: "DEBUG: editor found, but inserted text is still empty after DOM write.",
      debug: {
        beforeHtml,
        beforeText,
        afterHtml,
        afterText,
        childCount: editor.children.length,
      },
    });
  }

  return buildDebugResult({
    success: true,
    inserted: true,
    target: "main_post_editor",
    message: "DEBUG: insertion succeeded.",
    debug: {
      beforeHtml,
      beforeText,
      afterHtml,
      afterText,
      childCount: editor.children.length,
    },
  });
}

async function ensureEditorAndInsert(text) {
  if (!text || !text.trim()) {
    return buildDebugResult({
      success: false,
      inserted: false,
      target: null,
      message: "DEBUG: no content available to insert.",
    });
  }

  let editor = findPostComposerEditor();

  if (editor) {
    return insertHtmlIntoEditor(editor, text);
  }

  const startPostButton = findStartPostButton();

  if (!startPostButton) {
    return buildDebugResult({
      success: false,
      inserted: false,
      target: null,
      message: "DEBUG: could not find Start a post trigger.",
    });
  }

  startPostButton.click();

  await new Promise((resolve) => setTimeout(resolve, 1500));

  editor = await waitForPostComposerEditorWithObserver(20000);

  if (!editor) {
    return buildDebugResult({
      success: false,
      inserted: false,
      target: null,
      message: "DEBUG: composer opened visually, but script never re-found the editor.",
      debug: collectDomDebugSnapshot(),
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
          message: "An unexpected error occurred while inserting into LinkedIn.",
        });
      });

    return true;
  }
});