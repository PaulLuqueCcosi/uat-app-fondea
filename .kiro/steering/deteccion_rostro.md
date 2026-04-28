---
inclusion: always
---

toma como ejemplo esto proeycto para poder agreagr esto en la toma de foto de una rostro

# index.html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Formulario con Validación de Rostro</title>
  <link rel="stylesheet" href="stylesheet.css" />
</head>
<body>

  <!-- PASO 1: Cámara y captura -->
  <div id="cameraSection" class="card">
    <h1>Verificación de Identidad</h1>
    <p class="subtitle">Primero necesitamos verificar tu identidad mediante reconocimiento facial.</p>

    <div id="cameraContainer" class="camera-container">
      <video id="webcam" autoplay playsinline></video>
      <canvas id="overlay" class="overlay"></canvas>
      <div id="faceGuide" class="face-guide"></div>
      <div id="statusBadge" class="status-badge">Cámara inactiva</div>
    </div>

    <div class="camera-actions">
      <button id="startCameraBtn" class="btn btn-primary">📷 Activar Cámara</button>
      <button id="captureBtn" class="btn btn-success" disabled>📸 Capturar Foto</button>
    </div>

    <div id="capturePreview" class="capture-preview" style="display:none;">
      <img id="previewImg" alt="Foto capturada" />
      <div id="validationResult" class="validation-result"></div>
      <div class="preview-actions">
        <button id="retakeBtn" class="btn btn-secondary">🔄 Repetir</button>
        <button id="continueBtn" class="btn btn-success" disabled>✅ Continuar al Formulario</button>
      </div>
    </div>
  </div>

  <!-- PASO 2: Formulario (oculto hasta validar) -->
  <div id="formSection" class="card" style="display:none;">
    <div class="verified-banner">
      <span>✅ Identidad verificada</span>
      <img id="thumbPhoto" alt="Foto verificada" />
    </div>

    <h2>Completa el Formulario</h2>
    <form id="mainForm">
      <div class="form-group">
        <label for="nombre">Nombre completo</label>
        <input type="text" id="nombre" name="nombre" placeholder="Tu nombre" required />
      </div>
      <div class="form-group">
        <label for="email">Correo electrónico</label>
        <input type="email" id="email" name="email" placeholder="correo@ejemplo.com" required />
      </div>
      <div class="form-group">
        <label for="telefono">Teléfono</label>
        <input type="tel" id="telefono" name="telefono" placeholder="+1 234 567 8900" />
      </div>
      <div class="form-group">
        <label for="mensaje">Mensaje</label>
        <textarea id="mensaje" name="mensaje" rows="4" placeholder="Escribe tu mensaje..."></textarea>
      </div>
      <button type="submit" class="btn btn-primary btn-full">Enviar Formulario</button>
    </form>
  </div>

  <!-- PASO 3: Confirmación -->
  <div id="successSection" class="card" style="display:none;">
    <div class="success-icon">🎉</div>
    <h2>¡Formulario enviado!</h2>
    <p>Tu información fue enviada correctamente con verificación facial.</p>
    <button id="resetBtn" class="btn btn-secondary">Volver al inicio</button>
  </div>

  <script src="index.js" type="module"></script>
</body>
</html>


# stylesheet.css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Segoe UI', Arial, sans-serif;
  background: #0f0f0f;
  color: #e0e0e0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.card {
  background: #1e1e1e;
  border-radius: 16px;
  padding: 32px;
  width: 100%;
  max-width: 560px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
}

h1 { font-size: 1.6rem; color: #00bcd4; margin-bottom: 8px; text-align: center; }
h2 { font-size: 1.3rem; color: #00bcd4; margin-bottom: 20px; }
.subtitle { color: #aaa; text-align: center; margin-bottom: 24px; font-size: 0.9rem; }

.camera-container {
  position: relative;
  width: 100%;
  aspect-ratio: 4/3;
  background: #111;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
}

#webcam {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
  display: block;
}

.overlay {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none;
}

.face-guide {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 55%;
  aspect-ratio: 3/4;
  border: 2px dashed rgba(255,255,255,0.3);
  border-radius: 50%;
  pointer-events: none;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.face-guide.valid {
  border-color: #28a745;
  box-shadow: 0 0 24px rgba(40,167,69,0.5);
}

.face-guide.invalid { border-color: #dc3545; }

.status-badge {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.75);
  color: #fff;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.8rem;
  white-space: nowrap;
  transition: background 0.3s;
}

.status-badge.valid   { background: rgba(40,167,69,0.85); }
.status-badge.invalid { background: rgba(220,53,69,0.85); }
.status-badge.waiting { background: rgba(255,193,7,0.85); color: #000; }

.camera-actions { display: flex; gap: 12px; margin-bottom: 16px; }

.btn {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
}

.btn:disabled { opacity: 0.4; cursor: not-allowed; }
.btn:not(:disabled):hover { opacity: 0.88; }
.btn:not(:disabled):active { transform: scale(0.97); }

.btn-primary   { background: #007f8b; color: #fff; }
.btn-success   { background: #28a745; color: #fff; }
.btn-secondary { background: #444; color: #fff; }
.btn-full      { width: 100%; margin-top: 8px; }

.capture-preview { margin-top: 16px; text-align: center; }

.capture-preview img {
  width: 100%;
  max-height: 280px;
  object-fit: cover;
  border-radius: 10px;
  transform: scaleX(-1);
  margin-bottom: 12px;
}

.validation-result {
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 600;
  margin-bottom: 12px;
  font-size: 0.9rem;
}

.validation-result.valid   { background: rgba(40,167,69,0.2); color: #28a745; border: 1px solid #28a745; }
.validation-result.invalid { background: rgba(220,53,69,0.2); color: #dc3545; border: 1px solid #dc3545; }

.preview-actions { display: flex; gap: 12px; }

.verified-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(40,167,69,0.15);
  border: 1px solid #28a745;
  border-radius: 10px;
  padding: 10px 16px;
  margin-bottom: 24px;
  font-weight: 600;
  color: #28a745;
}

.verified-banner img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  transform: scaleX(-1);
  border: 2px solid #28a745;
}

.form-group { margin-bottom: 18px; }

.form-group label {
  display: block;
  font-size: 0.85rem;
  color: #aaa;
  margin-bottom: 6px;
}

.form-group input,
.form-group textarea {
  width: 100%;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 10px 14px;
  color: #e0e0e0;
  font-size: 0.95rem;
  transition: border-color 0.2s;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #00bcd4;
}

.success-icon { font-size: 4rem; text-align: center; margin-bottom: 16px; }
#successSection h2, #successSection p { text-align: center; }
#successSection p { color: #aaa; margin: 8px 0 24px; }
#resetBtn { display: block; margin: 0 auto; }

# index.js
import { FaceDetector, FilesetResolver } from
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

// ── DOM refs ──────────────────────────────────────────────────────────────────
const video          = document.getElementById("webcam");
const faceGuide      = document.getElementById("faceGuide");
const statusBadge    = document.getElementById("statusBadge");
const startCameraBtn = document.getElementById("startCameraBtn");
const captureBtn     = document.getElementById("captureBtn");
const capturePreview = document.getElementById("capturePreview");
const previewImg     = document.getElementById("previewImg");
const validationResult = document.getElementById("validationResult");
const retakeBtn      = document.getElementById("retakeBtn");
const continueBtn    = document.getElementById("continueBtn");
const cameraSection  = document.getElementById("cameraSection");
const formSection    = document.getElementById("formSection");
const successSection = document.getElementById("successSection");
const thumbPhoto     = document.getElementById("thumbPhoto");
const mainForm       = document.getElementById("mainForm");
const resetBtn       = document.getElementById("resetBtn");

// ── State ─────────────────────────────────────────────────────────────────────
let faceDetector = null;
let runningMode  = "IMAGE";
let faceValid    = false;
let animFrameId  = null;
let lastVideoTime = -1;
const MIN_CONFIDENCE = 0.70;

// ── Init MediaPipe ────────────────────────────────────────────────────────────
async function initDetector() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );
  faceDetector = await FaceDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
      delegate: "GPU"
    },
    runningMode: "IMAGE"
  });
}

initDetector().catch(console.error);

// ── Activar cámara ────────────────────────────────────────────────────────────
startCameraBtn.addEventListener("click", async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    alert("Tu navegador no soporta acceso a la cámara.");
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }
    });
    video.srcObject = stream;
    video.addEventListener("loadeddata", startDetectionLoop, { once: true });
    startCameraBtn.disabled = true;
    startCameraBtn.textContent = "📷 Cámara activa";
    setStatus("waiting", "Buscando rostro...");
  } catch (err) {
    alert("No se pudo acceder a la cámara. Verifica los permisos.");
    console.error(err);
  }
});

// ── Loop de detección en tiempo real ─────────────────────────────────────────
async function startDetectionLoop() {
  if (!faceDetector) {
    animFrameId = requestAnimationFrame(startDetectionLoop);
    return;
  }

  if (runningMode !== "VIDEO") {
    runningMode = "VIDEO";
    await faceDetector.setOptions({ runningMode: "VIDEO" });
  }

  if (video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    const results = faceDetector.detectForVideo(video, performance.now());
    processDetections(results.detections);
  }

  animFrameId = requestAnimationFrame(startDetectionLoop);
}

function processDetections(detections) {
  if (!detections || detections.length === 0) {
    faceValid = false;
    captureBtn.disabled = true;
    faceGuide.className = "face-guide";
    setStatus("waiting", "Buscando rostro...");
    return;
  }

  const best = detections.reduce((a, b) =>
    b.categories[0].score > a.categories[0].score ? b : a
  );
  const confidence = best.categories[0].score;
  faceValid = confidence >= MIN_CONFIDENCE;

  if (faceValid) {
    captureBtn.disabled = false;
    faceGuide.className = "face-guide valid";
    setStatus("valid", `✓ Rostro detectado — ${pct(confidence)}% confianza`);
  } else {
    captureBtn.disabled = true;
    faceGuide.className = "face-guide invalid";
    setStatus("invalid", `Confianza baja: ${pct(confidence)}% (mín. 70%)`);
  }
}

// ── Capturar foto ─────────────────────────────────────────────────────────────
captureBtn.addEventListener("click", async () => {
  if (!faceValid) return;

  // Pausar loop
  cancelAnimationFrame(animFrameId);

  // Dibujar frame en canvas
  const canvas = document.createElement("canvas");
  canvas.width  = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d").drawImage(video, 0, 0);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

  previewImg.src = dataUrl;
  capturePreview.style.display = "block";
  captureBtn.disabled = true;

  // Validar la foto capturada con el modelo en modo IMAGE
  await validateCapturedPhoto(canvas);
});

async function validateCapturedPhoto(canvas) {
  validationResult.textContent = "Validando rostro...";
  validationResult.className = "validation-result";

  try {
    if (runningMode !== "IMAGE") {
      runningMode = "IMAGE";
      await faceDetector.setOptions({ runningMode: "IMAGE" });
    }

    const results = faceDetector.detect(canvas);
    const detections = results.detections;

    if (!detections || detections.length === 0) {
      showValidation(false, "No se detectó ningún rostro en la foto.");
      return;
    }

    const best = detections.reduce((a, b) =>
      b.categories[0].score > a.categories[0].score ? b : a
    );
    const confidence = best.categories[0].score;

    if (confidence >= MIN_CONFIDENCE) {
      showValidation(true, `✓ Rostro válido — ${pct(confidence)}% de confianza`);
    } else {
      showValidation(false, `✗ Confianza insuficiente: ${pct(confidence)}% (mín. 70%)`);
    }
  } catch (err) {
    console.error(err);
    showValidation(false, "Error al validar la imagen.");
  }
}

function showValidation(valid, message) {
  validationResult.textContent = message;
  validationResult.className = "validation-result " + (valid ? "valid" : "invalid");
  continueBtn.disabled = !valid;
}

// ── Repetir foto ──────────────────────────────────────────────────────────────
retakeBtn.addEventListener("click", () => {
  capturePreview.style.display = "none";
  previewImg.src = "";
  continueBtn.disabled = true;
  captureBtn.disabled = false;
  // Reanudar loop
  runningMode = "IMAGE"; // forzar reset en próximo frame
  startDetectionLoop();
});

// ── Continuar al formulario ───────────────────────────────────────────────────
continueBtn.addEventListener("click", () => {
  thumbPhoto.src = previewImg.src;

  // Detener cámara
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(t => t.stop());
  }

  cameraSection.style.display = "none";
  formSection.style.display   = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// ── Enviar formulario ─────────────────────────────────────────────────────────
mainForm.addEventListener("submit", (e) => {
  e.preventDefault();
  formSection.style.display   = "none";
  successSection.style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// ── Reset ─────────────────────────────────────────────────────────────────────
resetBtn.addEventListener("click", () => {
  mainForm.reset();
  previewImg.src = "";
  capturePreview.style.display = "none";
  continueBtn.disabled = true;
  startCameraBtn.disabled = false;
  startCameraBtn.textContent = "📷 Activar Cámara";
  captureBtn.disabled = true;
  faceGuide.className = "face-guide";
  setStatus("", "Cámara inactiva");
  successSection.style.display = "none";
  cameraSection.style.display  = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function setStatus(type, text) {
  statusBadge.textContent = text;
  statusBadge.className = "status-badge" + (type ? " " + type : "");
}

function pct(score) {
  return Math.round(score * 100);
}
