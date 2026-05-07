const STORAGE_KEY = "happy-box-capsules";
const API_BASE = window.location.protocol === "file:" ? null : window.location.origin;
const COLORS = ["pink", "blue", "yellow", "green", "purple"];

const seedStories = [
  "Hôm nay mình đi bộ dưới trời mưa nhỏ. Một cô bán hoa thấy mình không có ô nên dúi cho mình một chiếc túi nilon để che điện thoại. Việc nhỏ thôi, nhưng mình thấy cả ngày dịu lại.",
  "Có lần mình nấu ăn bị cháy một chút. Bạn cùng phòng không chê, chỉ cười rồi bảo: mùi này giống bếp nhà hồi nhỏ. Tối đó tụi mình ăn hết sạch.",
  "Sáng nay bé mèo nhà hàng xóm chạy theo mình đến tận cổng. Nó ngồi đó nhìn như tiễn đi làm. Mình đã cười suốt quãng đường.",
  "Mình nhận được tin nhắn từ một người bạn cũ: 'Tớ vừa nghe bài này và nhớ đến cậu'. Chỉ một dòng thôi mà làm mình thấy mình vẫn được nhớ.",
  "Hôm qua mình tự mua cho mình một cái bánh nhỏ, cắm một cây nến, và chúc mừng vì đã vượt qua một tuần khó. Không cần dịp lớn mới được vui.",
  "Một em bé trong thang máy nhìn sticker trên laptop của mình rồi nói 'đẹp quá'. Mình thấy phiên bản trẻ con trong mình cũng được khen theo.",
  "Mẹ gọi hỏi mình ăn cơm chưa. Lần này mình không vội cúp máy, hai mẹ con kể chuyện linh tinh gần nửa tiếng. Tắt máy xong thấy lòng ấm hẳn.",
  "Mình nhặt được một tờ giấy note ai đó dán trong thư viện: 'Bạn đang làm tốt hơn bạn nghĩ'. Mình để nó trong ví đến giờ."
];

const elements = {
  pit: document.querySelector("#capsulePit"),
  catchBtn: document.querySelector("#catchBtn"),
  clawRig: document.querySelector("#clawRig"),
  grabbedCapsule: document.querySelector("#grabbedCapsule"),
  storyModal: document.querySelector("#storyModal"),
  submitModal: document.querySelector("#submitModal"),
  storyContent: document.querySelector("#storyContent"),
  reactionText: document.querySelector("#reactionText"),
  modalCapsule: document.querySelector("#modalCapsule"),
  timeCount: document.querySelector("#timeCount"),
  statsText: document.querySelector("#statsText"),
  form: document.querySelector("#storyForm"),
  storyInput: document.querySelector("#storyInput"),
  charCount: document.querySelector("#charCount"),
  toast: document.querySelector("#toast"),
  soundToggle: document.querySelector("#soundToggle"),
  backgroundMusic: document.querySelector("#backgroundMusic")
};

let activeCapsule = null;

function getCapsules() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) return JSON.parse(raw);

  const capsules = seedStories.map((content, index) => ({
    id: createId(),
    content,
    color: COLORS[index % COLORS.length],
    createdAt: new Date(Date.now() - index * 86400000).toISOString(),
    hearts: Math.floor(Math.random() * 12),
    thanks: Math.floor(Math.random() * 7)
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(capsules));
  return capsules;
}

async function apiRequest(path, options = {}) {
  if (API_BASE === null) return null;

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: {
        "content-type": "application/json",
        ...(options.headers || {})
      },
      ...options
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function saveCapsules(capsules) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(capsules));
  updateStats();
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `capsule-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function updateStats() {
  const remoteStats = await apiRequest("/api/stats");
  if (remoteStats) {
    elements.statsText.textContent = `Đang có ${remoteStats.count} mẩu chuyện trong hộp. Tất cả đều ẩn danh.`;
    return;
  }

  const count = getCapsules().length;
  elements.statsText.textContent = `Đang có ${count} mẩu chuyện trong hộp. Tất cả đều ẩn danh.`;
}

function capsuleMarkup(color) {
  const capsule = document.createElement("div");
  capsule.className = `capsule ${color}`;
  return capsule;
}

function replaceChildrenSafe(parent, child) {
  parent.textContent = "";
  parent.appendChild(child);
}

function renderPit() {
  elements.pit.innerHTML = "";
  const pitWidth = Math.max(elements.pit.clientWidth || 640, 320);
  const pitHeight = Math.max(elements.pit.clientHeight || 250, 200);
  const capsuleWidth = pitWidth < 430 ? 66 : pitWidth < 560 ? 78 : 92;
  const gap = capsuleWidth * 0.9;
  const baseY = Math.max(24, pitHeight - capsuleWidth * 0.92);
  const rows = [
    { y: baseY, count: Math.ceil(pitWidth / gap) + 1 },
    { y: baseY - capsuleWidth * 0.55, count: Math.ceil(pitWidth / gap) },
    { y: baseY - capsuleWidth * 1.1, count: Math.ceil(pitWidth / gap) - 1 },
    { y: baseY - capsuleWidth * 1.65, count: Math.max(4, Math.ceil(pitWidth / gap) - 3) }
  ];

  rows.forEach((row, rowIndex) => {
    for (let i = 0; i < row.count; i += 1) {
      const capsule = capsuleMarkup(COLORS[(i + rowIndex) % COLORS.length]);
      capsule.style.width = `${capsuleWidth}px`;
      capsule.style.height = `${Math.round(capsuleWidth * 0.48)}px`;
      const x = 10 + i * (gap - rowIndex * 3) + (rowIndex % 2 ? gap * 0.36 : 0);
      const y = row.y + ((i % 2) * 13);
      const rotation = [-28, 14, -9, 24, -18, 7][(i + rowIndex) % 6];
      capsule.style.setProperty("--x", `${x}px`);
      capsule.style.setProperty("--y", `${y}px`);
      capsule.style.setProperty("--r", `${rotation}deg`);
      elements.pit.appendChild(capsule);
    }
  });
}

function pickRandomCapsule() {
  const capsules = getCapsules();
  return capsules[Math.floor(Math.random() * capsules.length)];
}

async function pickRandomCapsuleAsync() {
  const remoteCapsule = await apiRequest("/api/capsules/random");
  return remoteCapsule || pickRandomCapsule();
}

function showStory(capsule) {
  activeCapsule = capsule;
  elements.storyContent.textContent = capsule.content;
  elements.reactionText.textContent = `${capsule.hearts || 0} tim • ${capsule.thanks || 0} lời cảm ơn đã được gửi cho câu chuyện này.`;
  const color = getComputedStyle(document.documentElement).getPropertyValue(colorToVar(capsule.color));
  elements.modalCapsule.style.setProperty("--modal-color", color.trim());
  openDialog(elements.storyModal);
}

function colorToVar(color) {
  const map = {
    pink: "--pink",
    blue: "--sky",
    yellow: "--cream",
    green: "--mint",
    purple: "--lavender"
  };
  return map[color] || "--pink";
}

async function animateCatch() {
  if (elements.catchBtn.disabled) return;

  const capsule = await pickRandomCapsuleAsync();
  const visual = capsuleMarkup(capsule.color);
  replaceChildrenSafe(elements.grabbedCapsule, visual);

  elements.timeCount.textContent = "30";
  elements.catchBtn.disabled = true;
  elements.clawRig.classList.remove("is-catching");
  void elements.clawRig.offsetWidth;
  elements.clawRig.classList.add("is-catching");

  const countdown = setInterval(() => {
    const next = Math.max(0, Number(elements.timeCount.textContent) - 3);
    elements.timeCount.textContent = String(next).padStart(2, "0");
  }, 330);

  setTimeout(() => {
    clearInterval(countdown);
    elements.timeCount.textContent = "30";
    elements.catchBtn.disabled = false;
    elements.clawRig.classList.remove("is-catching");
    showStory(capsule);
  }, 4250);
}

async function addReaction(type) {
  if (!activeCapsule) return;

  const remoteCapsule = await apiRequest(`/api/capsules/${activeCapsule.id}/reactions`, {
    method: "POST",
    body: JSON.stringify({ type })
  });
  if (remoteCapsule) {
    activeCapsule = remoteCapsule;
    elements.reactionText.textContent = `${remoteCapsule.hearts || 0} tim • ${remoteCapsule.thanks || 0} lời cảm ơn đã được gửi cho câu chuyện này.`;
    return;
  }

  const capsules = getCapsules();
  const capsule = capsules.find((item) => item.id === activeCapsule.id);
  if (!capsule) return;

  capsule[type] = (capsule[type] || 0) + 1;
  activeCapsule = capsule;
  saveCapsules(capsules);
  elements.reactionText.textContent = `${capsule.hearts || 0} tim • ${capsule.thanks || 0} lời cảm ơn đã được gửi cho câu chuyện này.`;
}

async function submitStory(event) {
  event.preventDefault();
  const content = elements.storyInput.value.trim();
  if (content.length < 12) {
    showToast("Hãy gửi một mẩu chuyện dài hơn một chút nhé.");
    return;
  }

  const remoteCapsule = await apiRequest("/api/capsules", {
    method: "POST",
    body: JSON.stringify({ content })
  });
  if (remoteCapsule) {
    elements.form.reset();
    elements.charCount.textContent = "0/420";
    elements.submitModal.close();
    showToast("Câu chuyện đã được gửi vào Happy Box.");
    renderPit();
    updateStats();
    return;
  }

  const capsules = getCapsules();
  capsules.unshift({
    id: createId(),
    content,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    createdAt: new Date().toISOString(),
    hearts: 0,
    thanks: 0
  });
  saveCapsules(capsules);
  elements.form.reset();
  elements.charCount.textContent = "0/420";
  elements.submitModal.close();
  showToast("Câu chuyện đã được bỏ vào Happy Box.");
  renderPit();
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    elements.toast.classList.remove("show");
  }, 2300);
}

function toggleMusic() {
  const backgroundMusic = elements.backgroundMusic;
  if (!backgroundMusic) {
    showToast("Không tìm thấy file nhạc nền.");
    return;
  }

  if (!backgroundMusic.paused) {
    backgroundMusic.pause();
    elements.soundToggle.classList.remove("active");
    showToast("Đã tắt nhạc nền.");
    return;
  }

  backgroundMusic.volume = 0.45;
  backgroundMusic.play()
    .then(() => {
      elements.soundToggle.classList.add("active");
      showToast("Đã bật nhạc nền.");
    })
    .catch(() => {
      showToast("Trình duyệt chưa cho phép phát nhạc. Hãy bấm lại nút nhạc.");
    });
}

function openDialog(dialog) {
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
  }
}

document.querySelector("#openSubmit").addEventListener("click", () => openDialog(elements.submitModal));
document.querySelector("#openSubmitSide").addEventListener("click", () => openDialog(elements.submitModal));
document.querySelector("#closeSubmit").addEventListener("click", () => elements.submitModal.close());
document.querySelector("#closeStory").addEventListener("click", () => elements.storyModal.close());
document.querySelector("#heartBtn").addEventListener("click", () => addReaction("hearts"));
document.querySelector("#thanksBtn").addEventListener("click", () => addReaction("thanks"));
elements.catchBtn.addEventListener("click", animateCatch);
elements.form.addEventListener("submit", submitStory);
elements.soundToggle.addEventListener("click", toggleMusic);
elements.backgroundMusic?.addEventListener("error", () => {
  elements.soundToggle.classList.remove("active");
  showToast("Không tải được file nhạc. Hãy kiểm tra assets/happy-box-bgm.mp3 trên GitHub.");
});
elements.storyInput.addEventListener("input", () => {
  elements.charCount.textContent = `${elements.storyInput.value.length}/420`;
});

renderPit();
updateStats();
window.addEventListener("resize", () => {
  window.clearTimeout(renderPit.resizeTimer);
  renderPit.resizeTimer = window.setTimeout(renderPit, 120);
});
