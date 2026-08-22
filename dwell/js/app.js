(function () {
  "use strict";

  var cfg = window.DWELL || {};
  var root = String(cfg.url || "").replace(/\/$/, "");
  var key = cfg.key || "";
  var headers = {
    apikey: key,
    Authorization: "Bearer " + key,
    "Content-Type": "application/json"
  };

  var form = document.getElementById("list-form");
  var urlEl = document.getElementById("url");
  var lineEl = document.getElementById("line");
  var noteEl = document.getElementById("form-note");
  var rowsEl = document.getElementById("rows");
  var emptyEl = document.getElementById("empty");
  var hintEl = document.getElementById("hint");
  var pulseEl = document.getElementById("pulse");
  var goBtn = form.querySelector("button");

  var CACHE = "dwell.board.v1";
  var FOCUS = "dwell.focus.v1";
  var focusId = null;
  var lastAct = Date.now();
  var items = [];
  var ticking = false;

  function headersPlus(extra) {
    var h = {};
    var k;
    for (k in headers) h[k] = headers[k];
    if (extra) for (k in extra) h[k] = extra[k];
    return h;
  }

  function showNote(text, bad) {
    if (!text) {
      noteEl.hidden = true;
      noteEl.textContent = "";
      noteEl.classList.remove("bad");
      return;
    }
    noteEl.hidden = false;
    noteEl.textContent = text;
    noteEl.classList.toggle("bad", !!bad);
  }

  function hostOf(href) {
    try {
      return new URL(href).host.replace(/^www\./, "");
    } catch (e) {
      return href;
    }
  }

  function formatDwell(ms) {
    var s = Math.floor(Math.max(0, Number(ms) || 0) / 1000);
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var sec = s % 60;
    if (h > 0) return h + "h " + String(m).padStart(2, "0") + "m";
    if (m > 0) return m + "m " + String(sec).padStart(2, "0") + "s";
    return sec + "s";
  }

  function normalizeUrl(raw) {
    var trimmed = String(raw || "").trim();
    var u;
    try {
      u = new URL(trimmed);
    } catch (e) {
      throw new Error("Need a full HTTPS URL.");
    }
    if (u.protocol !== "https:") throw new Error("Only HTTPS URLs.");
    var path = u.pathname.replace(/\/+$/, "");
    return u.origin + path + u.search + u.hash;
  }

  function markActive() {
    lastAct = Date.now();
  }

  function saveCache() {
    try { localStorage.setItem(CACHE, JSON.stringify(items)); } catch (e) {}
    try {
      if (focusId) sessionStorage.setItem(FOCUS, focusId);
      else sessionStorage.removeItem(FOCUS);
    } catch (e) {}
  }

  function readCache() {
    try {
      var raw = localStorage.getItem(CACHE);
      var data = raw ? JSON.parse(raw) : [];
      if (Array.isArray(data) && data.length) items = data;
    } catch (e) {}
    try {
      var f = sessionStorage.getItem(FOCUS);
      if (f) focusId = f;
    } catch (e) {}
  }

  function sortItems() {
    items.sort(function (a, b) {
      return (Number(b.dwell_ms) || 0) - (Number(a.dwell_ms) || 0);
    });
  }

  ["pointerdown", "pointermove", "keydown", "touchstart", "wheel"].forEach(function (ev) {
    document.addEventListener(ev, markActive, { passive: true });
  });

  function canTick() {
    return (
      !!focusId &&
      document.visibilityState === "visible" &&
      Date.now() - lastAct < 20000
    );
  }

  function setPulse() {
    if (canTick()) {
      pulseEl.textContent = "present";
      pulseEl.classList.add("live");
    } else if (focusId && document.visibilityState !== "visible") {
      pulseEl.textContent = "hidden";
      pulseEl.classList.remove("live");
    } else {
      pulseEl.textContent = "idle";
      pulseEl.classList.remove("live");
    }
    if (hintEl) hintEl.hidden = !!focusId;
  }

  function render() {
    rowsEl.innerHTML = "";
    emptyEl.hidden = items.length > 0;
    if (!items.length) {
      emptyEl.textContent = "Nothing listed yet. Drop a URL above.";
      return;
    }

    items.forEach(function (row, i) {
      var li = document.createElement("li");
      li.className = "row" + (row.id === focusId ? " on" : "");
      li.dataset.id = row.id;
      li.tabIndex = 0;
      li.setAttribute("role", "button");

      var rank = document.createElement("span");
      rank.className = "rank";
      rank.textContent = String(i + 1).padStart(2, "0");

      var mid = document.createElement("div");
      var host = document.createElement("div");
      host.className = "host";
      host.textContent = hostOf(row.url);
      var what = document.createElement("div");
      what.className = "what";
      what.textContent = row.line || "";
      mid.appendChild(host);
      mid.appendChild(what);

      var meta = document.createElement("div");
      meta.className = "meta";
      var time = document.createElement("span");
      time.className = "time";
      time.textContent = formatDwell(row.dwell_ms);
      meta.appendChild(time);
      if (i === 0) {
        var held = document.createElement("span");
        held.className = "held";
        held.textContent = "staying";
        meta.appendChild(held);
      }
      var open = document.createElement("a");
      open.className = "out";
      open.href = row.url;
      open.target = "_blank";
      open.rel = "noopener noreferrer";
      open.textContent = "open";
      open.addEventListener("click", function (e) {
        e.stopPropagation();
      });
      meta.appendChild(open);

      li.appendChild(rank);
      li.appendChild(mid);
      li.appendChild(meta);
      li.addEventListener("click", function () {
        focusId = row.id;
        markActive();
        saveCache();
        render();
        setPulse();
        tick();
      });
      li.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          li.click();
        }
      });
      rowsEl.appendChild(li);
    });
  }

  function showBoard(data) {
    items = Array.isArray(data) ? data : [];
    sortItems();
    if (focusId && !items.some(function (r) { return r.id === focusId; })) {
      focusId = null;
    }
    saveCache();
    render();
    setPulse();
  }

  function load() {
    if (!root || !key) {
      if (!items.length) {
        emptyEl.hidden = false;
        emptyEl.textContent = "The board is unreachable. You can still try the form above.";
      }
      return Promise.resolve();
    }
    return fetch(
      root + "/rest/v1/dwell_listings?select=id,url,line,dwell_ms&order=dwell_ms.desc",
      { headers: headers }
    )
      .then(function (res) {
        if (!res.ok) throw new Error("board");
        return res.json();
      })
      .then(function (data) {
        showBoard(data);
      })
      .catch(function () {
        if (items.length) {
          render();
          return;
        }
        emptyEl.hidden = false;
        emptyEl.textContent = "The board is unreachable. You can still try the form above.";
      });
  }

  function applyTick(ms) {
    var i;
    var add = Number(ms);
    if (!(add > 0)) add = 4000;
    for (i = 0; i < items.length; i++) {
      if (items[i].id === focusId) {
        items[i].dwell_ms = (Number(items[i].dwell_ms) || 0) + add;
        break;
      }
    }
    sortItems();
    saveCache();
    render();
  }

  function tick() {
    if (!canTick() || ticking) {
      setPulse();
      return;
    }
    ticking = true;
    fetch(root + "/rest/v1/rpc/dwell_tick", {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ p_id: focusId })
    })
      .then(function (res) {
        if (!res.ok) throw new Error("tick");
        return res.json();
      })
      .then(function (n) {
        applyTick(n);
      })
      .catch(function () {})
      .then(function () {
        ticking = false;
        setPulse();
      });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var href;
    var line = String(lineEl.value || "").trim();
    showNote("");
    if (!line) {
      showNote("Say what it does, in one line.", true);
      return;
    }
    if (line.length > 120) {
      showNote("Keep the line to 120 characters.", true);
      return;
    }
    try {
      href = normalizeUrl(urlEl.value);
    } catch (err) {
      showNote(err.message, true);
      return;
    }
    goBtn.disabled = true;
    fetch(root + "/rest/v1/dwell_listings", {
      method: "POST",
      headers: headersPlus({ Prefer: "return=representation" }),
      body: JSON.stringify({ url: href, line: line })
    })
      .then(function (res) {
        return res.text().then(function (text) {
          var body = null;
          try { body = text ? JSON.parse(text) : null; } catch (err) { body = text; }
          return { res: res, body: body };
        });
      })
      .then(function (pack) {
        if (pack.res.ok) {
          urlEl.value = "";
          lineEl.value = "";
          showNote("Listed.");
          if (Array.isArray(pack.body) && pack.body[0] && pack.body[0].id) {
            focusId = pack.body[0].id;
            markActive();
            if (!items.some(function (r) { return r.id === focusId; })) {
              items.push(pack.body[0]);
            }
            sortItems();
            saveCache();
            render();
            setPulse();
            tick();
          }
          return load();
        }
        var msg = "";
        if (pack.body && typeof pack.body === "object") {
          msg = pack.body.message || pack.body.details || pack.body.hint || "";
        }
        var low = String(msg).toLowerCase();
        if (
          pack.res.status === 409 ||
          low.indexOf("duplicate") !== -1 ||
          low.indexOf("unique") !== -1
        ) {
          showNote("already listed", true);
        } else {
          showNote("Could not list that URL.", true);
        }
      })
      .catch(function () {
        showNote("Could not list that URL.", true);
      })
      .then(function () {
        goBtn.disabled = false;
      });
  });

  document.addEventListener("visibilitychange", setPulse);
  readCache();
  if (items.length) render();
  setInterval(setPulse, 1000);
  setInterval(tick, 4000);
  setInterval(load, 8000);
  load();
  setPulse();
})();
