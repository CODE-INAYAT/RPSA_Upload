// File handling functions
function handleFileInput(files) {
  if (!files.length) return;

  const file = files[0];
  if (file.type !== "application/pdf") {
    alert("Only PDF files are allowed.");
    document.getElementById("dropzone-file").value = "";
    return;
  }

  const fileContainer = document.getElementById("file-container");
  const fileIconContainer = document.getElementById("file-icon");
  const fileNameDisplay = document.getElementById("file-name-display");

  fileContainer.classList.add("hidden");
  fileIconContainer.classList.remove("hidden", "file-display-enter");
  fileIconContainer.classList.add("file-display-enter");

  applyEllipsis(fileNameDisplay, file.name);

  // Remove animation class after completion
  setTimeout(
    () => fileIconContainer.classList.remove("file-display-enter"),
    500
  );
}

function handleFileDrop(event) {
  const files = event.dataTransfer.files;
  if (files.length) {
    document.getElementById("dropzone-file").files = files;
    handleFileInput(files);
  }
}

// Text ellipsis with binary search optimization
function applyEllipsis(element, fullText) {
  element.setAttribute("data-full-text", fullText);
  element.textContent = fullText;

  const container = document.querySelector(
    '.flex.items-center.justify-center.w-full[style*="max-width: 80%"]'
  );
  const maxWidth = container.offsetWidth - 40;

  if (element.scrollWidth <= maxWidth) return;

  let start = 0,
    end = fullText.length,
    bestFit = "";

  while (start <= end) {
    const mid = Math.floor((start + end) / 2);
    const testText = fullText.substring(0, mid) + "...";
    element.textContent = testText;

    if (element.scrollWidth <= maxWidth) {
      bestFit = testText;
      start = mid + 1;
    } else {
      end = mid - 1;
    }
  }

  element.textContent = bestFit || fullText.substring(0, 3) + "...";
}

// Resize handler for ellipsis recalculation
window.addEventListener("resize", () => {
  const fileNameDisplay = document.getElementById("file-name-display");
  const fullText = fileNameDisplay?.getAttribute("data-full-text");
  if (fullText) applyEllipsis(fileNameDisplay, fullText);
});

// Name input validation with real-time processing
function setupNameInput() {
  const nameInput = document.getElementById("name");
  const forbiddenWords = ["isk", "admin"];
  const forbiddenRegex = new RegExp(forbiddenWords.join("|"), "gi");

  function processName(value) {
    // Filter letters only and remove forbidden words
    let processed = value.replace(/[^a-zA-Z]/g, "").replace(forbiddenRegex, "");

    if (processed.length > 20) {
      alert("Name cannot exceed 20 characters!");
      processed = processed.substring(0, 20);
    }

    // Capitalize first letter
    return processed.length
      ? processed.charAt(0).toUpperCase() + processed.slice(1).toLowerCase()
      : "";
  }

  nameInput.addEventListener("input", (e) => {
    const initial = e.target.value;
    const processed = processName(initial);

    if (initial !== processed) {
      const cursorPos = Math.max(
        0,
        Math.min(
          e.target.selectionStart - (initial.length - processed.length),
          processed.length
        )
      );
      e.target.value = processed;
      e.target.setSelectionRange(cursorPos, cursorPos);
    }
  });

  nameInput.addEventListener("paste", (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData).getData("text");
    nameInput.value = processName(pasted);
  });

  nameInput.addEventListener("keydown", (e) => {
    // Allow control keys
    if (
      [8, 9, 27, 13, 46].includes(e.keyCode) ||
      (e.ctrlKey && [65, 67, 86, 88].includes(e.keyCode))
    )
      return;

    // Block non-letters or if at character limit
    if (!/[a-zA-Z]/.test(e.key) || nameInput.value.length >= 20) {
      e.preventDefault();
    }
  });
}

// Resources input with prefix protection
// Resources input with prefix protection
function setupResourcesInput() {
  const input = document.getElementById("resourcesInput");
  if (!input) return;

  const PREFIX = "Resources_";
  const MAX_LENGTH = 30;
  const ALLOWED_REGEX = /[^a-zA-Z0-9\s\-]/g; // Allow letters, numbers, spaces, and hyphens

  function showInvalidCharacterAlert(invalidChars) {
    const charTypes = [];
    const uniqueInvalidChars = [...new Set(invalidChars)];

    // Filter out allowed characters for the alert
    const actuallyInvalid = uniqueInvalidChars.filter(
      (char) => !/[a-zA-Z0-9\s\-]/.test(char)
    );

    if (actuallyInvalid.length > 0) {
      const message = `Invalid characters detected! Only letters (a-z, A-Z), numbers (0-9), spaces, and hyphens (-) are allowed. Found: ${actuallyInvalid.join(
        ", "
      )}`;
      alert(message);
    }
  }

  function cleanUserInput(userInput, preserveSpaces = false) {
    // Remove invalid characters first
    let cleaned = userInput.replace(ALLOWED_REGEX, "");

    // Only trim if not preserving spaces (for paste/drop operations)
    if (!preserveSpaces) {
      cleaned = cleaned.trim();
    }

    // Replace multiple consecutive spaces with single space
    cleaned = cleaned.replace(/\s+/g, " ");

    return cleaned;
  }

  function validateInput(value, maintainCursor = true, preserveSpaces = false) {
    let cursorPos = maintainCursor ? input.selectionStart : PREFIX.length;

    // Ensure prefix integrity
    if (!value.startsWith(PREFIX)) {
      value =
        PREFIX +
        value.replace(
          new RegExp(`^.*?${PREFIX.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
          ""
        );
      cursorPos = Math.max(PREFIX.length, cursorPos);
    }

    // Check for invalid characters and show alert
    const userInputPart = value.substring(PREFIX.length);
    const invalidChars = userInputPart.match(ALLOWED_REGEX);
    if (invalidChars && invalidChars.length > 0) {
      showInvalidCharacterAlert(invalidChars);
    }

    // Clean user input
    let userInput = cleanUserInput(userInputPart, preserveSpaces);
    if (userInput.length > MAX_LENGTH) {
      userInput = userInput.substring(0, MAX_LENGTH);
    }

    return {
      value: PREFIX + userInput,
      cursorPos: Math.min(cursorPos, PREFIX.length + userInput.length),
    };
  }

  function enforceCursor() {
    const { selectionStart, selectionEnd } = input;
    if (selectionStart < PREFIX.length || selectionEnd < PREFIX.length) {
      input.setSelectionRange(
        PREFIX.length,
        Math.max(PREFIX.length, selectionEnd)
      );
      return true;
    }
    return false;
  }

  // Initialize
  input.value = PREFIX;
  input.setSelectionRange(PREFIX.length, PREFIX.length);

  // Event listeners
  input.addEventListener("input", (e) => {
    const originalValue = e.target.value;
    const originalCursorPos = e.target.selectionStart;

    // Get the user input part before cleaning
    const userInputBefore = originalValue.substring(PREFIX.length);

    // For typing, preserve spaces and only handle consecutive spaces
    const result = validateInput(originalValue, true, true);

    // Calculate cursor adjustment for consecutive spaces removal
    const userInputAfter = result.value.substring(PREFIX.length);
    const lengthDifference = userInputBefore.length - userInputAfter.length;
    let adjustedCursorPos = Math.max(
      PREFIX.length,
      originalCursorPos - lengthDifference
    );

    // Check length after cleaning
    const cleanedLength = cleanUserInput(userInputAfter, false).length;
    if (cleanedLength > MAX_LENGTH) {
      alert(
        `Resources cannot exceed ${MAX_LENGTH} characters (excluding "Resources_")`
      );
    }

    e.target.value = result.value;
    e.target.setSelectionRange(adjustedCursorPos, adjustedCursorPos);
  });

  // Add blur event to trim spaces when user finishes editing
  input.addEventListener("blur", (e) => {
    const result = validateInput(e.target.value, false, false); // Trim on blur
    e.target.value = result.value;
  });

  input.addEventListener("keydown", (e) => {
    const { selectionStart, selectionEnd } = e.target;
    const hasSelection = selectionStart !== selectionEnd;
    const blockedKeys = [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "PageUp",
      "PageDown",
    ];

    // Block navigation in prefix area
    if (
      blockedKeys.includes(e.key) &&
      (selectionStart < PREFIX.length ||
        (hasSelection && selectionStart < PREFIX.length))
    ) {
      e.preventDefault();
      e.target.setSelectionRange(PREFIX.length, PREFIX.length);
      return;
    }

    // Handle special cases
    if (
      e.key === "Backspace" &&
      selectionStart === PREFIX.length &&
      !hasSelection
    ) {
      e.preventDefault();
      return;
    }

    // Control key combinations
    if (e.ctrlKey || e.metaKey) {
      if (e.key.toLowerCase() === "a") {
        e.preventDefault();
        e.target.setSelectionRange(PREFIX.length, e.target.value.length);
        return;
      }
      if (
        ["z", "y"].includes(e.key.toLowerCase()) ||
        (["x", "c"].includes(e.key.toLowerCase()) &&
          selectionStart < PREFIX.length)
      ) {
        e.preventDefault();
        return;
      }
    }

    // Character input validation - allow all valid characters including spaces
    if (e.key.length === 1 && selectionStart >= PREFIX.length) {
      if (!/[a-zA-Z0-9\s\-]/.test(e.key)) {
        e.preventDefault();
        showInvalidCharacterAlert([e.key]);
        return;
      }
    }

    // Character input in prefix area
    if (e.key.length === 1 && selectionStart < PREFIX.length) {
      e.preventDefault();
      if (/[a-zA-Z0-9\s\-]/.test(e.key)) {
        const newValue =
          e.target.value.substring(0, PREFIX.length) +
          e.key +
          e.target.value.substring(PREFIX.length);
        const result = validateInput(newValue, false, true);
        e.target.value = result.value;
        e.target.setSelectionRange(PREFIX.length + 1, PREFIX.length + 1);
      } else {
        showInvalidCharacterAlert([e.key]);
      }
    }
  });

  input.addEventListener("paste", (e) => {
    e.preventDefault();
    const pastedText = (e.clipboardData || window.clipboardData).getData(
      "text"
    );

    // Check for invalid characters in pasted content
    const invalidChars = pastedText.match(ALLOWED_REGEX);
    if (invalidChars && invalidChars.length > 0) {
      showInvalidCharacterAlert(invalidChars);
    }

    const paste = cleanUserInput(pastedText, false); // Trim pasted content
    const cursorPos = Math.max(e.target.selectionStart, PREFIX.length);
    const selectionEnd = Math.max(e.target.selectionEnd, PREFIX.length);

    const currentInput = input.value.substring(PREFIX.length);
    const beforeCursor = currentInput.substring(0, cursorPos - PREFIX.length);
    const afterCursor = currentInput.substring(selectionEnd - PREFIX.length);

    let newInput = beforeCursor + paste + afterCursor;
    newInput = cleanUserInput(newInput, false); // Clean and trim the combined input

    if (newInput.length > MAX_LENGTH) {
      alert(
        `Resources cannot exceed ${MAX_LENGTH} characters (excluding "Resources_")`
      );
      newInput = newInput.substring(0, MAX_LENGTH);
    }

    input.value = PREFIX + newInput;
    const newCursorPos = Math.min(cursorPos + paste.length, input.value.length);
    input.setSelectionRange(newCursorPos, newCursorPos);
  });

  // Mouse and focus events
  ["mousedown", "click", "focus", "select"].forEach((event) => {
    input.addEventListener(event, () => setTimeout(() => enforceCursor(), 0));
  });

  // Periodic validation fallback
  let lastValue = input.value;
  setInterval(() => {
    if (input.value !== lastValue) {
      const result = validateInput(input.value, true, true); // Preserve spaces during periodic check
      if (input.value !== result.value) {
        input.value = result.value;
        enforceCursor();
      }
      lastValue = input.value;
    }
    if (document.activeElement === input) enforceCursor();
  }, 100);

  // Drag and drop
  input.addEventListener("dragover", (e) => e.preventDefault());
  input.addEventListener("drop", (e) => {
    e.preventDefault();
    const droppedText = e.dataTransfer.getData("text");

    // Check for invalid characters in dropped content
    const invalidChars = droppedText.match(ALLOWED_REGEX);
    if (invalidChars && invalidChars.length > 0) {
      showInvalidCharacterAlert(invalidChars);
    }

    const cleanedText = cleanUserInput(droppedText, false); // Trim dropped content
    let newInput = input.value.substring(PREFIX.length) + cleanedText;
    newInput = cleanUserInput(newInput, false); // Clean and trim the combined input

    if (newInput.length > MAX_LENGTH) {
      alert(
        `Resources cannot exceed ${MAX_LENGTH} characters (excluding "Resources_")`
      );
      newInput = newInput.substring(0, MAX_LENGTH);
    }

    input.value = PREFIX + newInput;
    input.setSelectionRange(input.value.length, input.value.length);
  });

  input.addEventListener("contextmenu", (e) => {
    if (input.selectionStart < PREFIX.length) e.preventDefault();
  });
}

//Subject Input Validation
function setupSubjectInput() {
  const input = document.getElementById("subjectInput");
  if (!input) return;

  const MAX_LENGTH = 30;
  const ALLOWED_REGEX = /[^a-zA-Z0-9\s\-]/g; // Allow letters, numbers, spaces, and hyphens

  function showInvalidCharacterAlert(invalidChars) {
    const charTypes = [];
    const uniqueInvalidChars = [...new Set(invalidChars)];

    // Filter out allowed characters for the alert
    const actuallyInvalid = uniqueInvalidChars.filter(
      (char) => !/[a-zA-Z0-9\s\-]/.test(char)
    );

    if (actuallyInvalid.length > 0) {
      const message = `Invalid characters detected! Only letters (a-z, A-Z), numbers (0-9), spaces, and hyphens (-) are allowed. Found: ${actuallyInvalid.join(
        ", "
      )}`;
      alert(message);
    }
  }

  function cleanUserInput(userInput, preserveSpaces = false) {
    // Remove invalid characters first
    let cleaned = userInput.replace(ALLOWED_REGEX, "");

    // Only trim if not preserving spaces (for paste/drop operations)
    if (!preserveSpaces) {
      cleaned = cleaned.trim();
    }

    // Replace multiple consecutive spaces with single space
    cleaned = cleaned.replace(/\s+/g, " ");

    return cleaned;
  }

  function validateInput(value, preserveSpaces = false) {
    // Check for invalid characters and show alert
    const invalidChars = value.match(ALLOWED_REGEX);
    if (invalidChars && invalidChars.length > 0) {
      showInvalidCharacterAlert(invalidChars);
    }

    // Clean user input
    let userInput = cleanUserInput(value, preserveSpaces);
    if (userInput.length > MAX_LENGTH) {
      userInput = userInput.substring(0, MAX_LENGTH);
    }

    return userInput;
  }

  // Initialize
  input.value = "";

  // Event listeners
  input.addEventListener("input", (e) => {
    const originalValue = e.target.value;
    const originalCursorPos = e.target.selectionStart;

    // Get the user input part before cleaning
    const userInputBefore = originalValue;

    // For typing, preserve spaces and only handle consecutive spaces
    const result = validateInput(originalValue, true);

    // Calculate cursor adjustment for consecutive spaces removal
    const userInputAfter = result;
    const lengthDifference = userInputBefore.length - userInputAfter.length;
    let adjustedCursorPos = Math.max(0, originalCursorPos - lengthDifference);

    // Check length after cleaning
    const cleanedLength = cleanUserInput(userInputAfter, false).length;
    if (cleanedLength > MAX_LENGTH) {
      alert(`Subject cannot exceed ${MAX_LENGTH} characters`);
    }

    e.target.value = result;
    e.target.setSelectionRange(adjustedCursorPos, adjustedCursorPos);
  });

  // Add blur event to trim spaces when user finishes editing
  input.addEventListener("blur", (e) => {
    const result = validateInput(e.target.value, false); // Trim on blur
    e.target.value = result;
  });

  input.addEventListener("keydown", (e) => {
    // Control key combinations
    if (e.ctrlKey || e.metaKey) {
      // Allow common shortcuts like Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z, Ctrl+Y
      const allowedKeys = ["a", "c", "v", "x", "z", "y"];
      if (allowedKeys.includes(e.key.toLowerCase())) {
        return; // Allow these shortcuts
      }
    }

    // Allow navigation and editing keys
    const allowedKeys = [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
      "PageUp",
      "PageDown",
      "Tab",
      "Enter",
      "Escape",
    ];

    if (allowedKeys.includes(e.key)) {
      return; // Allow these keys
    }

    // Character input validation - allow all valid characters including spaces
    if (e.key.length === 1) {
      if (!/[a-zA-Z0-9\s\-]/.test(e.key)) {
        e.preventDefault();
        showInvalidCharacterAlert([e.key]);
        return;
      }
    }
  });

  input.addEventListener("paste", (e) => {
    e.preventDefault();
    const pastedText = (e.clipboardData || window.clipboardData).getData(
      "text"
    );

    // Check for invalid characters in pasted content
    const invalidChars = pastedText.match(ALLOWED_REGEX);
    if (invalidChars && invalidChars.length > 0) {
      showInvalidCharacterAlert(invalidChars);
    }

    const paste = cleanUserInput(pastedText, false); // Trim pasted content
    const cursorPos = e.target.selectionStart;
    const selectionEnd = e.target.selectionEnd;

    const currentInput = input.value;
    const beforeCursor = currentInput.substring(0, cursorPos);
    const afterCursor = currentInput.substring(selectionEnd);

    let newInput = beforeCursor + paste + afterCursor;
    newInput = cleanUserInput(newInput, false); // Clean and trim the combined input

    if (newInput.length > MAX_LENGTH) {
      alert(`Subject cannot exceed ${MAX_LENGTH} characters`);
      newInput = newInput.substring(0, MAX_LENGTH);
    }

    input.value = newInput;
    const newCursorPos = Math.min(cursorPos + paste.length, input.value.length);
    input.setSelectionRange(newCursorPos, newCursorPos);
  });

  // Drag and drop
  input.addEventListener("dragover", (e) => e.preventDefault());
  input.addEventListener("drop", (e) => {
    e.preventDefault();
    const droppedText = e.dataTransfer.getData("text");

    // Check for invalid characters in dropped content
    const invalidChars = droppedText.match(ALLOWED_REGEX);
    if (invalidChars && invalidChars.length > 0) {
      showInvalidCharacterAlert(invalidChars);
    }

    const cleanedText = cleanUserInput(droppedText, false); // Trim dropped content
    let newInput = input.value + cleanedText;
    newInput = cleanUserInput(newInput, false); // Clean and trim the combined input

    if (newInput.length > MAX_LENGTH) {
      alert(`Subject cannot exceed ${MAX_LENGTH} characters`);
      newInput = newInput.substring(0, MAX_LENGTH);
    }

    input.value = newInput;
    input.setSelectionRange(input.value.length, input.value.length);
  });

  // Periodic validation fallback
  let lastValue = input.value;
  setInterval(() => {
    if (input.value !== lastValue) {
      const result = validateInput(input.value, true); // Preserve spaces during periodic check
      if (input.value !== result) {
        input.value = result;
      }
      lastValue = input.value;
    }
  }, 100);
}

// Main application logic
document.addEventListener("DOMContentLoaded", () => {
  setupNameInput();
  setupResourcesInput();
  setupSubjectInput();

  // DOM elements
  const elements = {
    step1: document.getElementById("step1"),
    step2: document.getElementById("step2"),
    step3: document.getElementById("step3"),
    uploadScreen: document.getElementById("upload-progress-screen"),
    forms: {
      step1: document.getElementById("step1Form"),
      name: document.getElementById("name"),
      branch: document.getElementById("branch"),
      year: document.getElementById("year"),
      sem: document.getElementById("SEM"),
      subject: document.getElementById("subject"),
      resources: document.getElementById("resources"),
      subjectInput: document.getElementById("subjectInput"),
      resourcesInput: document.getElementById("resourcesInput"),
    },
    buttons: {
      step1Submit: document.getElementById("step1Submit"),
      step2Submit: document.getElementById("step2Submit"),
      finalSubmit: document.getElementById("finalSubmit"),
      step1Locked: document.getElementById("Step1lockedButton"),
      step2Locked: document.getElementById("Step2lockedButton"),
    },
    sections: {
      subjectDetail: document.getElementById("subjectDetail"),
      resourcesDetail: document.getElementById("resourcesDetail"),
    },
    upload: {
      fileInput: document.getElementById("dropzone-file"),
      dropzone: document.getElementById("dropzone"),
      fileContainer: document.getElementById("file-container"),
      fileIcon: document.getElementById("file-icon"),
      fileName: document.getElementById("file-name-display"),
      statusMessage: document.getElementById("upload-status-message"),
      nextMessage: document.getElementById("next-file-message"),
      progressValue: document.querySelector(".progress-value"),
      progressCircle: document.querySelector(".progress-ring__circle"),
    },
  };

  // Application state
  const state = {
    userDetails: {},
    filesToUpload: [],
    currentFileIndex: 0,
    progressInterval: null,
    successModal: null,
    appsScriptUrl:
      "https://script.google.com/macros/s/AKfycbwj1MBkerRANi1ZynlhPi0VoYpGWOYQulfRgvKH47LcusrFS3EztQI9SYPvZoo7OBA4/exec",
  };

  // Utility functions
  /*Locked Input styles*/
  function lockFormInputs(formElement) {
    // Style the main inputs (text) and selects (dropdowns)
    formElement.querySelectorAll('input[type="text"], select').forEach((el) => {
      el.disabled = true;
      el.classList.remove(
        "bg-gray-50",
        "text-gray-700",
        "dark:bg-gray-700",
        "dark:text-white"
      );
      el.classList.add(
        "bg-gray-200",
        "text-gray-500",
        "cursor-not-allowed",
        "dark:bg-gray-800",
        "dark:text-gray-400"
      );
      const label = formElement.querySelector(`label[for="${el.id}"]`);
      if (label) {
        label.classList.add("text-gray-400", "dark:text-gray-500");
      }
    });

    // Style the checkboxes and their labels
    formElement.querySelectorAll('input[type="checkbox"]').forEach((el) => {
      el.disabled = true;
      el.classList.add("cursor-not-allowed");

      // Remove its original active/accent color
      el.classList.remove("text-blue-600");
      // Add a gray accent color to make the checkmark gray
      el.classList.add("text-gray-400");

      // Style the label next to the checkbox
      const label = el.nextElementSibling;
      if (label && label.tagName === "LABEL") {
        label.classList.remove("text-gray-700", "dark:text-gray-300");
        label.classList.add(
          "text-gray-400",
          "dark:text-gray-500",
          "cursor-not-allowed"
        );
      }
    });

    // Style the checkbox container list
    const checkboxList = formElement.querySelector("ul.sm\\:flex");
    if (checkboxList) {
      checkboxList.classList.remove("bg-white", "dark:bg-gray-700");
      checkboxList.classList.add("bg-gray-100", "dark:bg-gray-800");
    }
  }

  /*Reset input styles to default*/
  function unlockFormInputs(formElement) {
    // Restore the main inputs (text) and selects (dropdowns)
    formElement.querySelectorAll('input[type="text"], select').forEach((el) => {
      el.disabled = false;
      el.classList.remove(
        "bg-gray-200",
        "text-gray-500",
        "cursor-not-allowed",
        "dark:bg-gray-800",
        "dark:text-gray-400"
      );
      el.classList.add(
        "bg-gray-50",
        "text-gray-700",
        "dark:bg-gray-700",
        "dark:text-white"
      );
      const label = formElement.querySelector(`label[for="${el.id}"]`);
      if (label) {
        label.classList.remove("text-gray-400", "dark:text-gray-500");
      }
    });

    // Restore the checkboxes and their labels
    formElement.querySelectorAll('input[type="checkbox"]').forEach((el) => {
      el.disabled = false;
      el.classList.remove("cursor-not-allowed");

      // Remove the gray accent color
      el.classList.remove("text-gray-400");
      // Restore the original blue accent color
      el.classList.add("text-blue-600");

      // Restore the label next to the checkbox
      const label = el.nextElementSibling;
      if (label && label.tagName === "LABEL") {
        label.classList.remove(
          "text-gray-400",
          "dark:text-gray-500",
          "cursor-not-allowed"
        );
        label.classList.add("text-gray-700", "dark:text-gray-300");
      }
    });

    // Restore the checkbox container list
    const checkboxList = formElement.querySelector("ul.sm\\:flex");
    if (checkboxList) {
      checkboxList.classList.remove("bg-gray-100", "dark:bg-gray-800");
      checkboxList.classList.add("bg-white", "dark:bg-gray-700");
    }
  }

  function scrollToElement(element) {
    element.scrollIntoView({ behavior: "smooth" });
  }

  function getFriendlyName(fileType, includeDetails = true) {
    const names = {
      subject: includeDetails
        ? `Subject (${state.userDetails.subjectName})`
        : state.userDetails.subjectName,
      resources: includeDetails
        ? `Resources (${state.userDetails.resourcesName})`
        : state.userDetails.resourcesName,
      ISE1: "ISE 1",
      ISE2: "ISE 2",
      ESE: "ESE",
      COMBINED: "COMBINED",
    };
    return names[fileType] || fileType;
  }

  function createSuccessModal(message) {
    if (state.successModal) state.successModal.remove();

    state.successModal = document.createElement("div");
    state.successModal.innerHTML = `
      <div id="success" style="display: flex; font-family: 'Plus Jakarta Sans', sans-serif;"
          class="fixed z-10 inset-0 overflow-y-auto flex items-center justify-center p-4" aria-labelledby="modal-title"
          role="dialog" aria-modal="true">
          <div class="w-full max-w-sm sm:max-w-md mx-2 sm:mx-0">
              <div style="background: rgba(0, 0, 0, 0.441); backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);" class="fixed inset-0 transition-opacity" aria-hidden="true"></div>
              <div style="border-radius: 35px;"
                  class="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all w-full">
                  <div class="flex items-center justify-between p-1 md:p-5 border-b rounded-t">
                      <h3 class="text-xl font-semibold text-gray-900 w-full text-center">
                          <div class="dotlottie-container">
                              <dotlottie-player
                                  src="https://lottie.host/b262bbf7-05a6-4a30-b6e3-648b52389ffe/o5joDCtkZz.json"
                                  background="transparent" speed="1" style="width: 80px; height: 80px;" loop
                                  autoplay></dotlottie-player>
                              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                  d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          </div>File Uploaded Successfully!
                      </h3>
                  </div>
                  <div class="p-3 md:p-5 space-y-4 text-center">
                      <p id="modalMessage" class="text-base leading-relaxed">${message}</p>
                      <div
                          class="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4">
                          <button id="okbtn"
                              class="text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full text-sm px-5 py-2.5 text-center mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800 inline-flex items-center">
                              <span class="plus-jakarta-sans">Got it</span>
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    `;

    document.body.appendChild(state.successModal);

    // Load Lottie player if needed
    if (!document.querySelector('script[src*="lottie-player"]')) {
      const script = document.createElement("script");
      script.src =
        "https://unpkg.com/@dotlottie/player-component@latest/dist/dotlottie-player.js";
      document.head.appendChild(script);
    }

    // Handle modal close
    state.successModal.querySelector("#okbtn").addEventListener("click", () => {
      state.successModal.remove();
      state.successModal = null;
      if (state.currentFileIndex < state.filesToUpload.length) {
        promptForNextFile();
      } else {
        resetFormAndData();
      }
    });
  }

  function updateProgressBar(value) {
    elements.upload.progressValue.textContent = `${Math.round(value)}%`;
    const circumference = 408.407; // 2 * π * 65
    const offset = circumference - (value / 100) * circumference;
    elements.upload.progressCircle.style.strokeDashoffset = offset;
  }

  function getProgressParams(fileSizeMB) {
    if (fileSizeMB < 1)
      return {
        delay: 150,
        fast: () => Math.random() * 0.5 + 0.1,
        slow: () => Math.random() * 0.5 + 0.1,
      };
    if (fileSizeMB < 20)
      return {
        delay: 250,
        fast: () => Math.random() * 0.1 + 0.2,
        slow: () => Math.random() * 0.1 + 0.1,
      };
    return {
      delay: 450,
      fast: () => Math.random() * 0.1 + 0.2,
      slow: () => Math.random() * 0.1 + 0.1,
    };
  }

  function simulateProgress(file, onComplete) {
    let progress = 0;
    let isUploadComplete = false;
    const params = getProgressParams(file.size / (1024 * 1024));

    state.progressInterval = setInterval(() => {
      if (isUploadComplete) {
        progress = 100;
        updateProgressBar(progress);
        clearInterval(state.progressInterval);
        onComplete();
      } else if (progress < 90) {
        progress += params.fast();
        if (progress > 90) progress = 90;
        updateProgressBar(progress);
      } else if (progress < 98) {
        progress += params.slow();
        if (progress > 98) progress = 98;
        updateProgressBar(progress);
      }
    }, params.delay);

    return () => {
      isUploadComplete = true;
    };
  }

  function resetForNextUpload() {
    updateProgressBar(0);
    elements.buttons.finalSubmit.disabled = false;
    elements.buttons.finalSubmit.textContent = "Upload";
    elements.upload.fileInput.value = "";
    elements.upload.fileContainer.classList.remove("hidden");
    elements.upload.fileIcon.classList.add("hidden");
    elements.upload.fileName.textContent = "";
  }

  function promptForNextFile() {
    const fileType = getFriendlyName(
      state.filesToUpload[state.currentFileIndex]
    );
    elements.upload.dropzone.querySelector(
      ".font-semibold"
    ).textContent = `Upload ${fileType}`;
    resetForNextUpload();
  }

  function prepareUploadScreen() {
    const currentFile = getFriendlyName(
      state.filesToUpload[state.currentFileIndex]
    );
    elements.upload.statusMessage.textContent = `Uploading your ${currentFile} file. Please wait...`;

    const nextIndex = state.currentFileIndex + 1;
    if (nextIndex < state.filesToUpload.length) {
      const nextFile = getFriendlyName(state.filesToUpload[nextIndex]);
      elements.upload.nextMessage.textContent = `Next up: ${nextFile}`;
    } else {
      elements.upload.nextMessage.textContent = "This is the last file.";
    }
  }

  // Event handlers
  elements.buttons.step1Submit.addEventListener("click", () => {
    const { name, branch, year } = elements.forms;
    const nameValue = name.value.trim();
    const branchValue = branch.value;

    if (!nameValue || branchValue === "Select PYQs/Resources Branch") {
      alert("Please fill in your name and select a branch.");
      return;
    }

    state.userDetails = {
      name: nameValue,
      branch: branchValue,
      year: year.value,
    };
    lockFormInputs(elements.forms.step1);
    elements.step2.classList.remove("hidden");
    scrollToElement(elements.step2);
    elements.buttons.step1Submit.classList.add("hidden");
    elements.buttons.step1Locked.classList.remove("hidden");
  });

  // Toggle detail sections
  elements.forms.subject.addEventListener("change", () => {
    elements.sections.subjectDetail.classList.toggle(
      "hidden",
      !elements.forms.subject.checked
    );
  });

  elements.forms.resources.addEventListener("change", () => {
    elements.sections.resourcesDetail.classList.toggle(
      "hidden",
      !elements.forms.resources.checked
    );
  });

  elements.buttons.step2Submit.addEventListener("click", () => {
    const selectedSem = elements.forms.sem.value;
    const fileTypeCheckboxes = document.querySelectorAll(
      'input[type="checkbox"]'
    );
    const selectedFiles = Array.from(fileTypeCheckboxes).filter(
      (cb) => cb.checked && !["subject", "resources"].includes(cb.id)
    );
    const subjectName = elements.forms.subjectInput.value.trim();
    const resourcesName = elements.forms.resourcesInput.value
      .trim()
      .replace("Resources_", "");

    // Validation
    if (selectedSem === "Select SEM") {
      alert("Please select a SEM.");
      return;
    }
    if (elements.forms.resources.checked && !resourcesName) {
      alert("Please enter the resources name.");
      return;
    }
    if (elements.forms.subject.checked && !subjectName) {
      alert("Please enter the subject name.");
      return;
    }

    const totalSelections =
      selectedFiles.length +
      (elements.forms.subject.checked ? 1 : 0) +
      (elements.forms.resources.checked ? 1 : 0);

    if (totalSelections === 0) {
      alert("Please select at least one file type to upload.");
      return;
    }
    if (totalSelections > 3) {
      alert(
        "You can select a maximum of 3 file types (including Subject and Resources)."
      );
      return;
    }

    // Update state
    state.userDetails.sem = selectedSem;
    if (elements.forms.subject.checked)
      state.userDetails.subjectName = subjectName;
    if (elements.forms.resources.checked)
      state.userDetails.resourcesName = resourcesName;

    // Determine upload order
    const order = ["resources", "subject", "ESE", "ISE1", "ISE2", "COMBINED"];
    state.filesToUpload = order.filter(
      (id) => document.getElementById(id)?.checked
    );

    lockFormInputs(elements.step2);
    elements.step3.classList.remove("hidden");
    scrollToElement(elements.step3);

    const firstFileType = getFriendlyName(state.filesToUpload[0]);
    alert(`Proceed To Upload PDF for: ${firstFileType}`);
    elements.upload.dropzone.querySelector(
      ".font-semibold"
    ).textContent = `Upload ${firstFileType}`;
    resetForNextUpload();

    elements.buttons.step2Submit.classList.add("hidden");
    elements.buttons.step2Locked.classList.remove("hidden");
  });

  // File input handler
  elements.upload.fileInput.addEventListener("change", function () {
    handleFileInput(this.files);
  });

  // Final submit handler
  elements.buttons.finalSubmit.addEventListener("click", (e) => {
    e.preventDefault();

    if (!elements.upload.fileInput.files.length) {
      alert("Please select a file to upload.");
      return;
    }

    const file = elements.upload.fileInput.files[0];

    // Show upload screen
    prepareUploadScreen();
    elements.uploadScreen.classList.remove("hidden");

    // Start progress simulation
    const markComplete = simulateProgress(file, () => {
      setTimeout(() => {
        elements.uploadScreen.classList.add("hidden");
        state.currentFileIndex++;

        const currentFileFriendlyName = getFriendlyName(
          state.filesToUpload[state.currentFileIndex - 1]
        );
        let message = `Your <span class="bg-blue-100 text-blue-800 font-medium me-2 px-1.5 py-0.5 rounded">${currentFileFriendlyName}</span>file has been uploaded successfully!`;

        if (state.currentFileIndex < state.filesToUpload.length) {
          const nextFileFriendlyName = getFriendlyName(
            state.filesToUpload[state.currentFileIndex]
          );
          message += `<br>Next, proceed to upload the PDF for: <span class="bg-blue-100 text-blue-800 font-medium me-2 px-1.5 py-0.5 rounded">${nextFileFriendlyName}</span>`;
        } else {
          message += `<br><span class="bg-green-100 text-green-800 font-medium me-2 px-1.5 py-0.5 rounded">All files uploaded successfully!</span>`;
        }

        createSuccessModal(message);
      }, 1200);
    });

    // File upload logic
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = () => {
      const base64File = reader.result.split(",")[1];
      const fileType = getFriendlyName(
        state.filesToUpload[state.currentFileIndex],
        false
      );

      let newFileName;
      if (state.filesToUpload[state.currentFileIndex] === "resources") {
        newFileName = `${state.userDetails.branch}_Resources_${state.userDetails.resourcesName}_${state.userDetails.sem}(${state.userDetails.name})<${state.userDetails.year}>.pdf`;
      } else {
        newFileName = `${state.userDetails.branch}_${fileType.replace(
          / /g,
          ""
        )}_${state.userDetails.sem}(${state.userDetails.name})<${
          state.userDetails.year
        }>.pdf`;
      }

      const payload = {
        fileName: newFileName,
        mimeType: file.type,
        base64File: base64File,
        branch: state.userDetails.branch,
        sem: state.userDetails.sem,
      };

      fetch(state.appsScriptUrl, {
        method: "POST",
        body: JSON.stringify(payload),
      })
        .then((res) => res.json())
        .then((data) => {
          markComplete();
          if (data.status !== "success") {
            throw new Error(data.message || "Upload failed");
          }
        })
        .catch((error) => {
          clearInterval(state.progressInterval);
          console.error("Upload Error:", error);
          alert(`Upload error: ${error.message}`);
          elements.uploadScreen.classList.add("hidden");
          resetForNextUpload();
        });
    };

    reader.onerror = () => {
      clearInterval(state.progressInterval);
      alert("Error reading the file.");
      elements.uploadScreen.classList.add("hidden");
      resetForNextUpload();
    };
  });

  function resetFormAndData() {
    // Reset application state
    state.userDetails = {};
    state.filesToUpload = [];
    state.currentFileIndex = 0;

    // Clear progress interval if running
    if (state.progressInterval) {
      clearInterval(state.progressInterval);
      state.progressInterval = null;
    }

    // Remove success modal if exists
    if (state.successModal) {
      state.successModal.remove();
      state.successModal = null;
    }

    // Reset Step 1
    elements.forms.step1.reset();
    unlockFormInputs(elements.forms.step1); // Unlock inputs and remove gray styles
    elements.buttons.step1Submit.classList.remove("hidden");
    elements.buttons.step1Locked.classList.add("hidden");

    // Reset Step 2
    elements.step2.classList.add("hidden");
    elements.forms.sem.value = "Select SEM";

    // Reset checkboxes
    document
      .querySelectorAll('input[type="checkbox"]')
      .forEach((cb) => (cb.checked = false));

    // Reset and hide detail sections
    elements.sections.subjectDetail.classList.add("hidden");
    elements.sections.resourcesDetail.classList.add("hidden");

    // Reset input fields with their validation
    elements.forms.subjectInput.value = "";
    elements.forms.resourcesInput.value = "Resources_";
    elements.forms.resourcesInput.setSelectionRange(10, 10); // Position cursor after prefix

    // Unlock Step 2 form elements and remove gray styles
    unlockFormInputs(elements.step2);
    elements.buttons.step2Submit.classList.remove("hidden");
    elements.buttons.step2Locked.classList.add("hidden");

    // Reset Step 3
    elements.step3.classList.add("hidden");

    // Reset file upload elements
    elements.upload.fileInput.value = "";
    elements.upload.fileContainer.classList.remove("hidden");
    elements.upload.fileIcon.classList.add("hidden");
    elements.upload.fileName.textContent = "";
    elements.upload.fileName.removeAttribute("data-full-text");

    // Reset upload screen
    elements.uploadScreen.classList.add("hidden");
    updateProgressBar(0);

    // Reset final submit button
    elements.buttons.finalSubmit.disabled = false;
    elements.buttons.finalSubmit.textContent = "Upload";

    // Reset dropzone text
    const dropzoneTitle =
      elements.upload.dropzone.querySelector(".font-semibold");
    if (dropzoneTitle) {
      dropzoneTitle.textContent = "Click to upload or drag and drop";
    }

    // Scroll back to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

document.addEventListener("DOMContentLoaded", function () {
  // Get references to elements
  const firstYear = document.getElementById("firstYear");
  const secondYear = document.getElementById("secondYear");
  const firstYearUpload = document.getElementById("firstYearUpload");
  const secondYearUpload = document.getElementById("secondYearUpload");
  const switchButtonContainer = document.getElementById(
    "switchButtonContainer"
  );
  const switchButton = document.getElementById("switchButton");
  const closeSwitchModal = document.getElementById("closeSwitchModal");
  const switchModal = document.getElementById("switchModal");

  // Get references to switch trigger elements
  const switchSpan = document.getElementById("switch");
  const switchSvg = switchSpan ? switchSpan.querySelector("svg") : null;

  // URL mappings for each radio button
  const urlMappings = {
    firstYear: "https://pyqs-isk.pages.dev",
    secondYear: "https://cups-user.vercel.app",
    firstYearUpload: "https://1yr-pyqsupload-isk.pages.dev",
    secondYearUpload: "https://cups-admin.vercel.app",
  };

  // Function to show the modal with stack-out animation and dramatic overlay effect
  function showModal() {
    // First, show the modal without overlay
    switchModal.classList.remove("hidden");
    switchModal.style.display = "flex";

    // Get the modal content element
    const modalContent = switchModal.querySelector(".bg-gray-800");
    const modalOverlay = switchModal.querySelector(".fixed.inset-0");

    // Initially hide overlay with dramatic starting state
    if (modalOverlay) {
      modalOverlay.style.opacity = "0";
      modalOverlay.style.transform = "scale(1.1)";
      modalOverlay.style.filter = "blur(8px)";
    }

    // Initial state for modal content (stack-out animation)
    if (modalContent) {
      modalContent.style.opacity = "0";
      modalContent.style.transform = "scale(0.8) translateY(20px)";
      modalContent.style.transition =
        "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
    }

    // First animate the modal content
    setTimeout(() => {
      if (modalContent) {
        modalContent.style.opacity = "1";
        modalContent.style.transform = "scale(1) translateY(0px)";
      }

      // Then apply dramatic overlay effect after a short delay
      setTimeout(() => {
        if (modalOverlay) {
          modalOverlay.style.transition =
            "all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
          modalOverlay.style.opacity = "1";
          modalOverlay.style.transform = "scale(1)";
          modalOverlay.style.filter = "blur(0px)";
        }
      }, 150);
    }, 10);

    // Enhanced auto-scroll to center modal perfectly
    setTimeout(() => {
      centerModalOnScreen();
    }, 50);
  }

  // Enhanced function to center modal perfectly on screen
  function centerModalOnScreen() {
    const modalContent = switchModal.querySelector(".bg-gray-800");
    if (modalContent) {
      const rect = modalContent.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const modalHeight = rect.height;

      // Calculate the exact center position
      const currentModalCenter = rect.top + modalHeight / 2;
      const desiredModalCenter = viewportHeight / 2;
      const scrollAdjustment = currentModalCenter - desiredModalCenter;

      // Only scroll if the modal isn't already perfectly centered (with 50px tolerance)
      if (Math.abs(scrollAdjustment) > 50) {
        const targetScrollY = window.pageYOffset + scrollAdjustment;

        // Enhanced smooth scroll with custom easing
        const startScrollY = window.pageYOffset;
        const distance = targetScrollY - startScrollY;
        const duration = 800; // Longer, more elegant scroll
        let startTime = null;

        function animateScroll(currentTime) {
          if (startTime === null) startTime = currentTime;
          const timeElapsed = currentTime - startTime;
          const progress = Math.min(timeElapsed / duration, 1);

          // Custom easing function (ease-out-cubic)
          const easeOutCubic = 1 - Math.pow(1 - progress, 3);

          const currentScrollY = startScrollY + distance * easeOutCubic;
          window.scrollTo(0, currentScrollY);

          if (progress < 1) {
            requestAnimationFrame(animateScroll);
          }
        }

        requestAnimationFrame(animateScroll);
      }
    }
  }

  // Function to show switch button with enhanced animation
  function showSwitchButton(url) {
    switchButton.href = url;

    // If button is already visible, show selection change animation
    if (!switchButtonContainer.classList.contains("hidden")) {
      // Quick pulse and color change animation for selection change
      switchButton.style.transition = "all 0.2s ease-in-out";
      switchButton.style.transform = "scale(0.95)";
      switchButton.style.backgroundColor = "#059669"; // darker green

      setTimeout(() => {
        switchButton.style.transform = "scale(1.05)";
        switchButton.style.backgroundColor = "#10b981"; // brighter green
      }, 100);

      setTimeout(() => {
        switchButton.style.transform = "scale(1)";
        switchButton.style.backgroundColor = ""; // reset to default
        switchButton.style.transition = "";
      }, 300);
    } else {
      // Initial show animation
      switchButtonContainer.classList.remove("hidden");

      // Enhanced entrance animation with multiple effects
      switchButton.style.transform = "scale(0.8) rotateX(90deg)";
      switchButton.style.opacity = "0";
      switchButton.style.transition =
        "all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)";

      // Trigger animation after a small delay to ensure the element is rendered
      setTimeout(() => {
        switchButtonContainer.classList.remove("opacity-0", "translate-y-4");
        switchButtonContainer.classList.add("opacity-100", "translate-y-0");

        switchButton.style.transform = "scale(1) rotateX(0deg)";
        switchButton.style.opacity = "1";

        // Add a subtle glow effect
        setTimeout(() => {
          switchButton.style.boxShadow = "0 0 20px rgba(16, 185, 129, 0.4)";
          setTimeout(() => {
            switchButton.style.boxShadow = "";
            switchButton.style.transition = "";
          }, 800);
        }, 200);
      }, 10);
    }
  }

  // Function to hide switch button with enhanced animation
  function hideSwitchButton() {
    // Enhanced exit animation
    switchButton.style.transition =
      "all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)";
    switchButton.style.transform = "scale(0.7) rotateX(-90deg)";
    switchButton.style.opacity = "0";

    switchButtonContainer.classList.remove("opacity-100", "translate-y-0");
    switchButtonContainer.classList.add("opacity-0", "translate-y-4");

    // Hide the element after animation completes
    setTimeout(() => {
      switchButtonContainer.classList.add("hidden");

      // Reset button state
      switchButton.style.transform = "scale(1) rotateX(0deg)";
      switchButton.style.opacity = "1";
      switchButton.style.transition = "";
    }, 400);
  }

  // Add event listeners to switch trigger elements
  if (switchSpan) {
    switchSpan.addEventListener("click", function (e) {
      e.preventDefault();
      showModal();
    });
  }

  if (switchSvg) {
    switchSvg.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation(); // Prevent event bubbling
      showModal();
    });
  }

  // Add event listeners to radio buttons
  if (firstYear) {
    firstYear.addEventListener("change", function () {
      if (this.checked) {
        showSwitchButton(urlMappings.firstYear);
      }
    });
  }

  if (secondYear) {
    secondYear.addEventListener("change", function () {
      if (this.checked) {
        showSwitchButton(urlMappings.secondYear);
      }
    });
  }

  if (firstYearUpload) {
    firstYearUpload.addEventListener("change", function () {
      if (this.checked) {
        showSwitchButton(urlMappings.firstYearUpload);
      }
    });
  }

  if (secondYearUpload) {
    secondYearUpload.addEventListener("change", function () {
      if (this.checked) {
        showSwitchButton(urlMappings.secondYearUpload);
      }
    });
  }

  // Close modal functionality with enhanced stack-in animation and dramatic overlay removal
  if (closeSwitchModal) {
    closeSwitchModal.addEventListener("click", function () {
      const modalContent = switchModal.querySelector(".bg-gray-800");
      const modalOverlay = switchModal.querySelector(".fixed.inset-0");

      // First create dramatic overlay fade-out with reverse effects
      if (modalOverlay) {
        modalOverlay.style.transition =
          "all 0.4s cubic-bezier(0.55, 0.085, 0.68, 0.53)";
        modalOverlay.style.opacity = "0";
        modalOverlay.style.transform = "scale(1.05)";
        modalOverlay.style.filter = "blur(4px)";
      }

      // Then animate modal content with enhanced stack-in effect
      setTimeout(() => {
        if (modalContent) {
          modalContent.style.transition =
            "all 0.35s cubic-bezier(0.68, -0.55, 0.265, 1.55)";
          modalContent.style.opacity = "0";
          modalContent.style.transform =
            "scale(0.65) translateY(-40px) rotateX(10deg)";
        }
      }, 100);

      // Hide modal after all animations complete
      setTimeout(() => {
        switchModal.classList.add("hidden");
        switchModal.style.display = "none";

        // Reset modal state for next opening
        if (modalContent) {
          modalContent.style.opacity = "1";
          modalContent.style.transform =
            "scale(1) translateY(0px) rotateX(0deg)";
          modalContent.style.transition = "";
        }

        if (modalOverlay) {
          modalOverlay.style.opacity = "1";
          modalOverlay.style.transform = "scale(1)";
          modalOverlay.style.filter = "blur(0px)";
          modalOverlay.style.transition = "";
        }

        // Reset radio buttons and hide switch button
        const radioButtons = document.querySelectorAll(
          'input[name="default-radio"]'
        );
        radioButtons.forEach((radio) => (radio.checked = false));
        hideSwitchButton();
      }, 450);
    });
  }

  // Close modal when clicking outside of it
  if (switchModal) {
    switchModal.addEventListener("click", function (e) {
      if (e.target === switchModal || e.target.classList.contains("fixed")) {
        if (closeSwitchModal) {
          closeSwitchModal.click();
        }
      }
    });
  }

  // Alternative: Add event listener to any element with class 'switch-trigger'
  // This provides flexibility for multiple switch elements
  const switchTriggers = document.querySelectorAll(".switch-trigger");
  switchTriggers.forEach((trigger) => {
    trigger.addEventListener("click", function (e) {
      e.preventDefault();
      showModal();
    });
  });
});
