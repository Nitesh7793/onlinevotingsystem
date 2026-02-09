const modalRoot = document.getElementById("modal-root");
let faceStream = null;
let isFingerprintDeviceConnected = false;
let otpTimer = null;
let otpCountdown = 30;
let currentDemoOtp = null;
let faceDetectionInterval = null;

function closeModal() {
  if (faceStream) {
    faceStream.getTracks().forEach((track) => track.stop());
    faceStream = null;
  }
  if (otpTimer) {
    clearInterval(otpTimer);
    otpTimer = null;
  }
  if (faceDetectionInterval) {
    clearInterval(faceDetectionInterval);
    faceDetectionInterval = null;
  }
  modalRoot.innerHTML = "";
}

function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

// Ultra-fast face detection that responds immediately to camera changes
function detectFace(video) {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      let nonBlackPixels = 0;
      let totalPixels = data.length / 4;
      let avgBrightness = 0;
      let brightnessVariation = 0;
      let brightnessValues = [];

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r + g + b) / 3;

        if (brightness > 20) {
          nonBlackPixels++;
        }

        avgBrightness += brightness;
        brightnessValues.push(brightness);
      }
      avgBrightness /= totalPixels;

      for (let i = 0; i < brightnessValues.length; i++) {
        brightnessVariation += Math.abs(brightnessValues[i] - avgBrightness);
      }
      brightnessVariation /= totalPixels;

      const nonBlackPercentage = (nonBlackPixels / totalPixels) * 100;

      const hasFace =
        nonBlackPercentage > 10 &&
        brightnessVariation > 15 &&
        avgBrightness < 200;

      resolve(hasFace);
    } catch (error) {
      console.error("Face detection error:", error);
      resolve(false);
    }
  });
}

function generateDemoOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// After successful verification, record the vote and go to results page
function completeVoteAndRedirect() {
  const partyKey = localStorage.getItem("pendingVoteParty");

  if (partyKey && typeof incrementVote === "function") {
    incrementVote(partyKey);
  }

  localStorage.removeItem("pendingVoteParty");

  const url =
    "results.html" +
    (partyKey ? `?party=${encodeURIComponent(partyKey)}` : "");
  window.location.href = url;
}

function showModal(method) {
  let modalHtml = "";
  if (method === "aadhaar") {
    modalHtml = `
    <div class='modal-bg' tabindex="-1">
      <div class='modal' role="dialog" aria-modal="true">
        <button class='modal-close' onclick='closeModal()' aria-label="Close">&times;</button>
        <div class='modal-title'><i class="fa-solid fa-id-card" style="color:#1976d2;"></i> Aadhaar Verification</div>
        <form class='modal-content' id='aadhaar-form' autocomplete="off">
          <input type='text' id='aadhaar-number' placeholder='Enter Aadhaar Number' maxlength="12" pattern="\\d{12}" required />
          <button class='modal-action-btn' id='send-otp-btn' type='button'><i class="fa-solid fa-paper-plane"></i>Send OTP</button>
          <div id='otp-section' style='display:none;'>
            <input type='text' id='aadhaar-otp' placeholder='Enter OTP' maxlength="6" pattern="\\d{6}" required />
            <button class='modal-action-btn' id='verify-otp-btn' type='submit'><i class="fa-solid fa-circle-check"></i>Verify</button>
            <div id='otp-timer' style='margin-top:0.5rem; color:#1976d2;'></div>
            <button class='modal-action-btn' id='resend-otp-btn' type='button' style='margin-top:0.5rem; display:none;'><i class="fa-solid fa-paper-plane"></i>Resend OTP</button>
          </div>
          <div id='otp-message' style='display:none; color:#1976d2; margin-top:0.5rem; text-align:center;'>
            <i class="fa-solid fa-check-circle" style="color:#38b27b;"></i> OTP sent to your registered mobile number.
          </div>
        </form>
        <div id='aadhaar-success' style='display:none;' class='modal-success'><i class="fa-solid fa-circle-check"></i>Verification Successful!</div>
      </div>
    </div>
    `;
  } else if (method === "face") {
    modalHtml = `
    <div class='modal-bg' tabindex="-1">
      <div class='modal' role="dialog" aria-modal="true">
        <button class='modal-close' onclick='closeModal()' aria-label="Close">&times;</button>
        <div class='modal-title'><i class="fa-solid fa-camera" style="color:#1976d2;"></i> Face Recognition</div>
        <div class='modal-content' id='face-content'>
          <div class='modal-live-cam face-not-detected' id='face-cam-area'></div>
          <button class='modal-action-btn' id='start-face-scan'><i class="fa-solid fa-video"></i>Start Camera</button>
          <button class='modal-action-btn' id='scan-face-btn' style='display:none; margin-top:0.7rem;'><i class="fa-solid fa-circle-check"></i>Scan Face</button>
        </div>
        <div id='face-success' style='display:none;' class='modal-success'><i class="fa-solid fa-circle-check"></i>Face Verified!</div>
        <div id='face-error' style='display:none;' class='modal-error'></div>
      </div>
    </div>
    `;
  } else if (method === "fingerprint") {
    modalHtml = `
    <div class='modal-bg' tabindex="-1">
      <div class='modal' role="dialog" aria-modal="true">
        <button class='modal-close' onclick='closeModal()' aria-label="Close">&times;</button>
        <div class='modal-title'><i class="fa-solid fa-fingerprint" style="color:#1976d2;"></i> Fingerprint Scan</div>
        <div class='modal-content' id='finger-content'>
          <div class='modal-sim-fingerprint'><i class="fa-solid fa-fingerprint"></i></div>
          <button class='modal-action-btn' id='scan-fingerprint-btn'><i class="fa-solid fa-circle-check"></i>Scan Fingerprint</button>
        </div>
        <div id='finger-success' style='display:none;' class='modal-success'><i class="fa-solid fa-circle-check"></i>Fingerprint Verified!</div>
        <div id='finger-error' style='display:none;' class='modal-error'></div>
      </div>
    </div>
    `;
  }

  modalRoot.innerHTML = modalHtml;

  // Aadhaar logic
  if (method === "aadhaar") {
    setTimeout(() => {
      const aadhaarForm = document.getElementById("aadhaar-form");
      const sendOtpBtn = document.getElementById("send-otp-btn");
      const otpSection = document.getElementById("otp-section");
      const otpMessage = document.getElementById("otp-message");
      const aadhaarNumberInput = document.getElementById("aadhaar-number");
      const otpTimerDiv = document.getElementById("otp-timer");
      const resendOtpBtn = document.getElementById("resend-otp-btn");

      function startOtpTimer() {
        otpCountdown = 30;
        resendOtpBtn.style.display = "inline-block";
        resendOtpBtn.disabled = true;
        otpTimerDiv.textContent = "Resend OTP in 30s";
        otpTimerDiv.style.display = "block";

        otpTimer = setInterval(() => {
          otpCountdown--;
          otpTimerDiv.textContent = `Resend OTP in ${otpCountdown}s`;
          if (otpCountdown <= 0) {
            clearInterval(otpTimer);
            otpTimer = null;
            otpTimerDiv.textContent = "";
            resendOtpBtn.disabled = false;
            resendOtpBtn.textContent = "Resend OTP";
          }
        }, 1000);
      }

      function handleSendOtp() {
        if (!aadhaarNumberInput.value.match(/^\d{12}$/)) {
          aadhaarNumberInput.focus();
          aadhaarNumberInput.style.border = "1.5px solid #d32f2f";
          return;
        }
        aadhaarNumberInput.style.border = "";
        otpSection.style.display = "block";
        otpMessage.style.display = "block";
        sendOtpBtn.style.display = "none";
        aadhaarNumberInput.disabled = true;
        resendOtpBtn.disabled = true;
        resendOtpBtn.style.display = "inline-block";

        currentDemoOtp = generateDemoOtp();
        alert(`Your OTP is: ${currentDemoOtp}`);
        startOtpTimer();
      }

      sendOtpBtn.onclick = function (e) {
        e.preventDefault();
        handleSendOtp();
      };

      resendOtpBtn.onclick = function (e) {
        e.preventDefault();
        resendOtpBtn.disabled = true;
        otpMessage.style.display = "block";
        currentDemoOtp = generateDemoOtp();
        alert(`Your new OTP is: ${currentDemoOtp}`);
        startOtpTimer();
      };

      aadhaarForm.onsubmit = function (event) {
        event.preventDefault();
        const otpInput = document.getElementById("aadhaar-otp");
        if (!otpInput.value.match(/^\d{6}$/)) {
          otpInput.focus();
          otpInput.style.border = "1.5px solid #d32f2f";
          return;
        }
        if (otpInput.value !== currentDemoOtp) {
          otpInput.focus();
          otpInput.style.border = "1.5px solid #d32f2f";
          alert("Incorrect OTP. Please try again.");
          return;
        }
        otpInput.style.border = "";
        aadhaarForm.style.display = "none";
        document.getElementById("aadhaar-success").style.display = "flex";
        closeModalAfterDelay();
      };
    }, 100);
  }

  // Face scan logic
  if (method === "face") {
    setTimeout(() => {
      const startBtn = document.getElementById("start-face-scan");
      const scanFaceBtn = document.getElementById("scan-face-btn");
      const camArea = document.getElementById("face-cam-area");

      if (startBtn) {
        startBtn.onclick = async function () {
          const errorDiv = document.getElementById("face-error");
          errorDiv.style.display = "none";

          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            errorDiv.textContent = "Camera not supported on this device.";
            errorDiv.style.display = "block";
            return;
          }

          startBtn.disabled = true;
          startBtn.textContent = "Opening Camera...";

          try {
            faceStream = await navigator.mediaDevices.getUserMedia({
              video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: "user",
              },
            });

            camArea.innerHTML = "";
            const video = document.createElement("video");
            video.autoplay = true;
            video.playsInline = true;
            video.srcObject = faceStream;
            video.style.cssText =
              "width: 100%; height: 100%; object-fit: cover; object-position: center; border-radius: 50%; background: #000; display: block; position: absolute; top: 0; left: 0;";
            camArea.appendChild(video);

            startBtn.style.display = "none";
            scanFaceBtn.style.display = "inline-block";
            scanFaceBtn.disabled = true;
            scanFaceBtn.textContent = "No Face Detected";
            camArea.classList.add("face-not-detected");
            camArea.classList.remove("face-detected");

            let faceDetected = false;
            let manualOverride = false;

            faceDetectionInterval = setInterval(async () => {
              if (video.readyState === video.HAVE_ENOUGH_DATA) {
                const hasFace = await detectFace(video);

                if (hasFace && !faceDetected) {
                  camArea.classList.remove("face-not-detected");
                  camArea.classList.add("face-detected");
                  scanFaceBtn.disabled = false;
                  scanFaceBtn.textContent = "Face Detected - Click to Verify";
                  faceDetected = true;
                } else if (!hasFace && faceDetected && !manualOverride) {
                  camArea.classList.remove("face-detected");
                  camArea.classList.add("face-not-detected");
                  scanFaceBtn.disabled = true;
                  scanFaceBtn.textContent = "No Face Detected";
                  faceDetected = false;
                }
              }
            }, 150);

            const manualBtn = document.createElement("button");
            manualBtn.textContent = "Manual Override - I am here";
            manualBtn.style.cssText =
              "margin-top: 1rem; padding: 0.8rem 1.2rem; background: #ff9800; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 1rem; font-weight: bold; width: 100%; box-shadow: 0 2px 4px rgba(0,0,0,0.2);";
            manualBtn.onclick = function () {
              manualOverride = true;
              faceDetected = true;
              camArea.classList.remove("face-not-detected");
              camArea.classList.add("face-detected");
              scanFaceBtn.disabled = false;
              scanFaceBtn.textContent = "Face Detected - Click to Verify";
              manualBtn.style.display = "none";
            };
            camArea.appendChild(manualBtn);

            scanFaceBtn.onclick = function () {
              if (!faceDetected) {
                errorDiv.textContent =
                  "Please ensure your face is clearly visible in the camera.";
                errorDiv.style.display = "block";
                return;
              }

              clearInterval(faceDetectionInterval);
              faceDetectionInterval = null;

              scanFaceBtn.disabled = true;
              scanFaceBtn.textContent = "Verifying Face...";

              setTimeout(() => {
                document.getElementById("face-content").style.display = "none";
                document.getElementById("face-success").style.display = "flex";
                closeModalAfterDelay();
              }, 1500);
            };
          } catch (err) {
            errorDiv.textContent =
              "Unable to access camera. Permission denied or not available.";
            errorDiv.style.display = "block";
            startBtn.disabled = false;
            startBtn.textContent = "Start Camera";
          }
        };
      }
    }, 100);
  }

  // Fingerprint scan logic
  if (method === "fingerprint") {
    setTimeout(() => {
      const scanBtn = document.getElementById("scan-fingerprint-btn");
      const errorDiv = document.getElementById("finger-error");
      if (scanBtn) {
        scanBtn.onclick = async function () {
          errorDiv.style.display = "none";
          if (isMobileDevice() && window.PublicKeyCredential) {
            try {
              const challenge = new Uint8Array(32);
              window.crypto.getRandomValues(challenge);
              await navigator.credentials.get({
                publicKey: {
                  challenge: challenge,
                  timeout: 60000,
                  userVerification: "required",
                  allowCredentials: [],
                },
              });
              document.getElementById("finger-content").style.display = "none";
              document.getElementById("finger-success").style.display = "flex";
              closeModalAfterDelay();
            } catch (err) {
              errorDiv.textContent =
                "Biometric authentication failed or was cancelled.";
              errorDiv.style.display = "block";
            }
            return;
          }
          if (!isFingerprintDeviceConnected) {
            errorDiv.textContent =
              "Please connect a fingerprint scanner device first.";
            errorDiv.style.display = "block";
            return;
          }
          document.getElementById("finger-content").style.display = "none";
          document.getElementById("finger-success").style.display = "flex";
          closeModalAfterDelay();
        };
      }
    }, 100);
  }
}

function closeModalAfterDelay() {
  setTimeout(() => {
    closeModal();
    completeVoteAndRedirect();
  }, 1500);
}

document.querySelectorAll(".verify-card").forEach((card) => {
  card.addEventListener("click", function () {
    showModal(this.getAttribute("data-method"));
  });
  card.addEventListener("keypress", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      showModal(this.getAttribute("data-method"));
    }
  });
});

modalRoot.addEventListener("click", function (e) {
  if (e.target.classList.contains("modal-bg")) closeModal();
});


