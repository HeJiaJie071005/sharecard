/* ================= ShareCard app ================= */
(function () {
  "use strict";

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  var card = $("#card");
  var stage = $("#stage");
  var cardScale = $("#cardScale");
  var inTitle = $("#inTitle");
  var inBody = $("#inBody");
  var inAuthor = $("#inAuthor");
  var inDate = $("#inDate");
  var toastEl = $("#toast");

  var state = {
    template: "minimal",
    accent: null,
    fontSize: 30,
    align: "left",
    pattern: true,
    watermark: true
  };

  var SAMPLES = {
    zh: {
      title: "把日子过成诗",
      body: "生活不是等待风暴过去，\n而是学会在雨中起舞。\n把每一个平凡的日子，\n都过成值得纪念的模样。",
      author: "贺嘉杰"
    },
    en: {
      title: "Make Days Poetic",
      body: "Life is not about waiting\nfor the storm to pass,\nbut learning to dance\nin the rain.",
      author: "He Jiajie"
    }
  };

  var TEMPLATES = ["minimal", "dark", "sunset", "ocean", "forest", "pastel", "neon", "retro", "ink"];

  /* ---------- render ---------- */
  function render() {
    var cls = "card tpl-" + state.template;
    if (state.align !== "left") cls += " align-" + state.align;
    if (!state.pattern) cls += " no-pattern";
    if (!state.watermark) cls += " no-wm";
    card.className = cls;

    card.style.setProperty("--fs-body", state.fontSize + "px");
    card.style.setProperty("--fs-title", Math.round(state.fontSize * 2.1) + "px");
    if (state.accent) card.style.setProperty("--accent", state.accent);
    else card.style.removeProperty("--accent");

    $("#cardTitle").textContent = inTitle.value.trim() || "在这里输入标题";
    $("#cardBody").textContent = inBody.value.trim() || "在这里输入正文，写下你想分享的话……";
    var author = inAuthor.value.trim();
    $("#cardAuthor").textContent = author ? "— " + author : "— 佚名";

    var d = inDate.value ? new Date(inDate.value + "T00:00:00") : new Date();
    var dateText = "";
    if (!isNaN(d.getTime())) {
      var pad = function (n) { return String(n).padStart(2, "0"); };
      dateText = d.getFullYear() + "." + pad(d.getMonth() + 1) + "." + pad(d.getDate());
    }
    $("#cardDate").textContent = dateText;

    $$(".tpl-btn").forEach(function (b) { b.classList.toggle("active", b.dataset.tpl === state.template); });
    $$("#swatches .sw").forEach(function (b) { b.classList.toggle("active", state.accent === b.dataset.color); });
    $$(".seg-btn").forEach(function (b) { b.classList.toggle("active", b.dataset.align === state.align); });
    $("#fontSizeVal").textContent = state.fontSize + "px";
    $("#inFontSize").value = state.fontSize;
  }

  /* ---------- fit preview to container ---------- */
  function fit() {
    if (document.body.classList.contains("shot")) {
      cardScale.style.transform = "scale(1)";
      stage.style.height = "1350px";
      return;
    }
    var w = stage.clientWidth || 800;
    var s = Math.min(1, w / 1080);
    cardScale.style.transform = "scale(" + s + ")";
    stage.style.height = Math.round(1350 * s) + "px";
  }
  window.addEventListener("resize", fit);

  /* ---------- toast ---------- */
  var toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 2600);
  }

  /* ---------- samples ---------- */
  function applySample(key) {
    var s = SAMPLES[key];
    if (!s) return;
    inTitle.value = s.title;
    inBody.value = s.body;
    inAuthor.value = s.author;
    render();
  }

  /* ---------- render card to canvas (full 1080x1350, regardless of preview zoom) ---------- */
  async function renderCardCanvas(scale) {
    // The preview wrapper scales the card down to fit; html2canvas would
    // inherit that scale, so temporarily reset it for a full-res render.
    var prevT = cardScale.style.transform, prevH = stage.style.height;
    cardScale.style.transform = "scale(1)";
    stage.style.height = "1350px";
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      await new Promise(function (r) { requestAnimationFrame(function () { requestAnimationFrame(r); }); });
      return await html2canvas(card, {
        scale: scale,
        backgroundColor: null,
        useCORS: true,
        logging: false
      });
    } finally {
      cardScale.style.transform = prevT;
      stage.style.height = prevH;
    }
  }

  /* ---------- export ---------- */
  function downloadName() {
    var now = new Date();
    var pad = function (n) { return String(n).padStart(2, "0"); };
    return "sharecard-" + now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) +
      "-" + pad(now.getHours()) + pad(now.getMinutes()) + ".png";
  }

  async function exportPNG() {
    var btn = $("#btnExport");
    if (!window.html2canvas) {
      toast("导出库加载失败，请检查网络后重试 / html2canvas failed to load");
      return;
    }
    btn.disabled = true;
    var oldText = btn.textContent;
    btn.textContent = "正在生成… Generating…";
    try {
      var canvas = await renderCardCanvas(2);
      var a = document.createElement("a");
      a.download = downloadName();
      a.href = canvas.toDataURL("image/png");
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast("已导出高清 PNG · Exported 2160×2700 PNG");
    } catch (err) {
      console.error(err);
      toast("导出失败：" + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = oldText;
    }
  }

  /* ---------- events ---------- */
  [inTitle, inBody, inAuthor, inDate].forEach(function (el) {
    el.addEventListener("input", render);
  });

  $$(".tpl-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      state.template = b.dataset.tpl;
      state.accent = null; // reset accent override on template switch
      render();
    });
  });

  $$("#swatches .sw").forEach(function (b) {
    b.addEventListener("click", function () {
      state.accent = (state.accent === b.dataset.color) ? null : b.dataset.color;
      render();
    });
  });

  $("#inFontSize").addEventListener("input", function (e) {
    state.fontSize = parseInt(e.target.value, 10);
    render();
  });

  $$(".seg-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      state.align = b.dataset.align;
      render();
    });
  });

  $("#inPattern").addEventListener("change", function (e) {
    state.pattern = e.target.checked;
    render();
  });
  $("#inWatermark").addEventListener("change", function (e) {
    state.watermark = e.target.checked;
    render();
  });

  $("#btnSampleZh").addEventListener("click", function () { applySample("zh"); toast("已填入中文示例"); });
  $("#btnSampleEn").addEventListener("click", function () { applySample("en"); toast("English sample loaded"); });
  $("#btnExport").addEventListener("click", exportPNG);
  $("#btnShuffle").addEventListener("click", function () {
    var pool = TEMPLATES.filter(function (t) { return t !== state.template; });
    state.template = pool[Math.floor(Math.random() * pool.length)];
    state.accent = null;
    render();
    toast("已切换到「" + state.template + "」模板");
  });

  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      exportPNG();
    }
  });

  /* ---------- URL params: ?template=&sample=&shot=&selftest= ---------- */
  var params = new URLSearchParams(location.search);
  var pTpl = params.get("template");
  if (pTpl && TEMPLATES.indexOf(pTpl) !== -1) state.template = pTpl;
  var pAlign = params.get("align");
  if (pAlign === "center" || pAlign === "right") state.align = pAlign;
  if (params.get("shot")) document.body.classList.add("shot");
  if (params.get("pattern") === "0") { state.pattern = false; $("#inPattern").checked = false; }
  if (params.get("watermark") === "0") { state.watermark = false; $("#inWatermark").checked = false; }

  /* ---------- init ---------- */
  var today = new Date();
  var pad2 = function (n) { return String(n).padStart(2, "0"); };
  inDate.value = today.getFullYear() + "-" + pad2(today.getMonth() + 1) + "-" + pad2(today.getDate());
  applySample(params.get("sample") === "en" ? "en" : "zh");
  render();
  fit();
  // re-fit after fonts settle (layout can shift slightly)
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);

  /* ---------- headless self-test: ?selftest=1 ---------- */
  if (params.get("selftest")) {
    window.addEventListener("load", function () {
      setTimeout(async function () {
        var out = $("#selftest-result");
        try {
          if (!window.html2canvas) throw new Error("html2canvas missing");
          var c = await renderCardCanvas(2);
          document.title = "EXPORT_OK " + c.width + "x" + c.height;
          out.textContent = "EXPORT_OK " + c.width + "x" + c.height;
        } catch (e) {
          document.title = "EXPORT_FAIL " + e.message;
          out.textContent = "EXPORT_FAIL " + e.message;
        }
      }, 1200);
    });
  }
})();
