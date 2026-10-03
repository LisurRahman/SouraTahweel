// State Management
const state = {
  originalImage: null,
  processedImage: null,
  originalFile: null,
  originalDimensions: { width: 0, height: 0 },
  currentFormat: "png",
  aspectRatio: 1,
};

// DOM Elements
const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("fileInput");
const previewContainer = document.getElementById("previewContainer");
const convertedPreviewContainer = document.getElementById(
  "convertedPreviewContainer",
);
const fileInfo = document.getElementById("fileInfo");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Controls
const widthSlider = document.getElementById("widthSlider");
const widthInput = document.getElementById("widthInput");
const heightSlider = document.getElementById("heightSlider");
const heightInput = document.getElementById("heightInput");
const lockAspectRatio = document.getElementById("lockAspectRatio");
const qualitySlider = document.getElementById("qualitySlider");
const bgColor = document.getElementById("bgColor");
const brightness = document.getElementById("brightness");
const contrast = document.getElementById("contrast");
const transparentBg = document.getElementById("transparentBg");
const formatGrid = document.getElementById("formatGrid");

// Buttons
const convertBtn = document.getElementById("convertBtn");
const downloadBtn = document.getElementById("downloadBtn");
const copyBtn = document.getElementById("copyBtn");
const resetBtn = document.getElementById("resetBtn");

// Status
const statusMessage = document.getElementById("statusMessage");
const loader = document.getElementById("loader");

// ============ Event Listeners ============

// Upload Area
uploadArea.addEventListener("click", () => fileInput.click());
uploadArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadArea.classList.add("dragover");
});
uploadArea.addEventListener("dragleave", () => {
  uploadArea.classList.remove("dragover");
});
uploadArea.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadArea.classList.remove("dragover");
  handleFileSelect(e.dataTransfer.files[0]);
});

fileInput.addEventListener("change", (e) => {
  handleFileSelect(e.target.files[0]);
});

// Format Selection
document.querySelectorAll(".format-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".format-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    state.currentFormat = btn.dataset.format;

    // Disable transparent option for non-PNG formats
    if (btn.dataset.format !== "png") {
      transparentBg.disabled = true;
      transparentBg.checked = false;
    } else {
      transparentBg.disabled = false;
    }

    updatePreview();
  });
});

// Width/Height Sync
widthSlider.addEventListener("input", (e) => {
  widthInput.value = e.target.value;
  document.getElementById("widthValue").textContent = e.target.value;
  if (lockAspectRatio.checked) {
    const newHeight = Math.max(
      1,
      Math.round(e.target.value / state.aspectRatio),
    );
    heightSlider.value = newHeight;
    heightInput.value = newHeight;
    document.getElementById("heightValue").textContent = newHeight;
  }
  updatePreview();
});

widthInput.addEventListener("input", (e) => {
  const value = Math.min(4000, Math.max(1, parseInt(e.target.value) || 1));
  widthSlider.value = value;
  widthInput.value = value;
  document.getElementById("widthValue").textContent = value;
  if (lockAspectRatio.checked) {
    const newHeight = Math.max(1, Math.round(value / state.aspectRatio));
    heightSlider.value = newHeight;
    heightInput.value = newHeight;
    document.getElementById("heightValue").textContent = newHeight;
  }
  updatePreview();
});

heightSlider.addEventListener("input", (e) => {
  heightInput.value = e.target.value;
  document.getElementById("heightValue").textContent = e.target.value;
  if (lockAspectRatio.checked) {
    const newWidth = Math.max(
      1,
      Math.round(e.target.value * state.aspectRatio),
    );
    widthSlider.value = newWidth;
    widthInput.value = newWidth;
    document.getElementById("widthValue").textContent = newWidth;
  }
  updatePreview();
});

heightInput.addEventListener("input", (e) => {
  const value = Math.min(4000, Math.max(1, parseInt(e.target.value) || 1));
  heightSlider.value = value;
  heightInput.value = value;
  document.getElementById("heightValue").textContent = value;
  if (lockAspectRatio.checked) {
    const newWidth = Math.max(1, Math.round(value * state.aspectRatio));
    widthSlider.value = newWidth;
    widthInput.value = newWidth;
    document.getElementById("widthValue").textContent = newWidth;
  }
  updatePreview();
});

// Quality Slider
qualitySlider.addEventListener("input", (e) => {
  document.getElementById("qualityValue").textContent = e.target.value + "%";
  updatePreview();
});

// Transparency Toggle
transparentBg.addEventListener("change", updatePreview);

// Filters
brightness.addEventListener("input", updatePreview);
contrast.addEventListener("input", updatePreview);
bgColor.addEventListener("input", updatePreview);

// Buttons
convertBtn.addEventListener("click", convertImage);
downloadBtn.addEventListener("click", downloadImage);
copyBtn.addEventListener("click", copyToClipboard);
resetBtn.addEventListener("click", resetAll);

// ============ Functions ============

function handleFileSelect(file) {
  if (!file || !file.type.startsWith("image/")) {
    showStatus("Please select a valid image file", "error");
    return;
  }

  state.originalFile = file;
  const reader = new FileReader();

  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      state.originalImage = img;
      state.originalDimensions = {
        width: img.naturalWidth,
        height: img.naturalHeight,
      };
      state.aspectRatio = img.naturalWidth / img.naturalHeight;

      // Update sliders
      widthSlider.value = img.naturalWidth;
      widthInput.value = img.naturalWidth;
      document.getElementById("widthValue").textContent = img.naturalWidth;

      heightSlider.value = img.naturalHeight;
      heightInput.value = img.naturalHeight;
      document.getElementById("heightValue").textContent = img.naturalHeight;

      // Update file info
      updateFileInfo();

      // Show original preview
      displayOriginalPreview();

      // Enable buttons
      convertBtn.disabled = false;
      showStatus("Image loaded successfully!", "success");
    };
    img.src = e.target.result;
  };

  reader.readAsDataURL(file);
}

function displayOriginalPreview() {
  if (!state.originalImage) return;

  previewContainer.innerHTML = "";
  const img = document.createElement("img");
  img.src = state.originalImage.src;
  img.className = "preview-image";
  previewContainer.appendChild(img);
}

function updateFileInfo() {
  fileInfo.style.display = "block";
  document.getElementById("infoFilename").textContent = state.originalFile.name;
  document.getElementById("infoFileType").textContent =
    state.originalFile.type || "Unknown";
  document.getElementById("infoDimensions").textContent =
    `${state.originalDimensions.width} × ${state.originalDimensions.height} px`;
  document.getElementById("infoOriginalSize").textContent = formatFileSize(
    state.originalFile.size,
  );
}

function updatePreview() {
  if (!state.originalImage) return;

  const width = parseInt(widthInput.value);
  const height = parseInt(heightInput.value);
  const bright = parseInt(brightness.value);
  const cont = parseInt(contrast.value);
  const bg = bgColor.value;
  const transparent = transparentBg.checked && state.currentFormat === "png";

  // Set canvas size
  canvas.width = width;
  canvas.height = height;

  // Apply background (skip for transparent PNG)
  if (!transparent) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
  }

  // Apply filters
  ctx.filter = `brightness(${bright}%) contrast(${cont}%)`;

  // Draw image
  ctx.drawImage(state.originalImage, 0, 0, width, height);

  // Update preview in real-time
  displayConvertedPreview();
}

function displayConvertedPreview() {
  convertedPreviewContainer.innerHTML = "";
  const img = document.createElement("img");
  img.src = canvas.toDataURL();
  img.className = "preview-image";
  convertedPreviewContainer.appendChild(img);
}

function convertImage() {
  if (!state.originalImage) return;

  showLoader(true);
  setTimeout(() => {
    try {
      const width = parseInt(widthInput.value);
      const height = parseInt(heightInput.value);
      const quality = parseInt(qualitySlider.value) / 100;
      const bright = parseInt(brightness.value);
      const cont = parseInt(contrast.value);
      const bg = bgColor.value;
      const format = state.currentFormat;
      const transparent = transparentBg.checked && format === "png";

      // Set canvas size
      canvas.width = width;
      canvas.height = height;

      // Apply background (skip for transparent PNG)
      if (!transparent) {
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, width, height);
      }

      // Apply filters
      ctx.filter = `brightness(${bright}%) contrast(${cont}%)`;

      // Draw image
      ctx.drawImage(state.originalImage, 0, 0, width, height);

      // Show converted preview
      displayConvertedPreview();

      // Convert based on format
      let mimeType = "image/png";
      if (format === "jpg") mimeType = "image/jpeg";
      if (format === "webp") mimeType = "image/webp";
      if (format === "gif") mimeType = "image/gif";
      if (format === "bmp") mimeType = "image/bmp";

      canvas.toBlob(
        (blob) => {
          state.processedImage = blob;
          downloadBtn.disabled = false;
          copyBtn.disabled = false;
          showLoader(false);
          showStatus(
            `Image converted to ${format.toUpperCase()} successfully!`,
            "success",
          );
        },
        mimeType,
        quality,
      );
    } catch (error) {
      showLoader(false);
      showStatus("Error converting image: " + error.message, "error");
    }
  }, 100);
}

function downloadImage() {
  if (!state.processedImage) {
    showStatus("Please convert an image first", "error");
    return;
  }

  const url = URL.createObjectURL(state.processedImage);
  const a = document.createElement("a");
  a.href = url;
  const originalName = state.originalFile.name.split(".")[0];
  a.download = `${originalName}-converted.${state.currentFormat}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showStatus("Image downloaded!", "success");
}

function copyToClipboard() {
  if (!state.processedImage) {
    showStatus("Please convert an image first", "error");
    return;
  }

  navigator.clipboard
    .write([
      new ClipboardItem({ [state.processedImage.type]: state.processedImage }),
    ])
    .then(() => {
      showStatus("Image copied to clipboard!", "success");
    })
    .catch(() => {
      showStatus("Failed to copy to clipboard", "error");
    });
}

function resetAll() {
  state.originalImage = null;
  state.processedImage = null;
  state.originalFile = null;
  fileInput.value = "";
  previewContainer.innerHTML =
    '<div class="no-preview">No image selected</div>';
  convertedPreviewContainer.innerHTML =
    '<div class="no-preview">Converted image will appear here</div>';
  fileInfo.style.display = "none";
  convertBtn.disabled = true;
  downloadBtn.disabled = true;
  copyBtn.disabled = true;
  widthSlider.value = 100;
  heightSlider.value = 100;
  qualitySlider.value = 90;
  brightness.value = 100;
  contrast.value = 100;
  transparentBg.checked = false;
  showStatus("", "");
}

function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  if (message) {
    statusMessage.classList.add("show");
  }
}

function showLoader(show) {
  loader.classList.toggle("active", show);
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
