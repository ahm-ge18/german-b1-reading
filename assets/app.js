(function () {
  "use strict";

  var texts = window.TEXTS || [];
  var content = document.getElementById("content");
  var reader = document.getElementById("reader");
  var list = document.getElementById("text-list");
  var countLabel = document.getElementById("text-count");
  var translationButton = document.getElementById("translations-toggle");
  var translationState = document.getElementById("translations-state");

  function readStorage(key, fallback) {
    try {
      return localStorage.getItem(key) || fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      /* storage can be unavailable in private browsing */
    }
  }

  var state = {
    translations: readStorage("lesesaal.translations", "on") !== "off",
    size: parseInt(readStorage("lesesaal.size", "19"), 10) || 19,
    theme: readStorage("lesesaal.theme", "light")
  };

  if (state.size < 16) state.size = 16;
  if (state.size > 26) state.size = 26;

  var TOKEN = /([^\s{}]+)\{([^{}]*)\}/g;

  function escapeHtml(value) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function plain(value) {
    return value.replace(TOKEN, "$1").replace(/\s+/g, " ").trim();
  }

  function wordCount(text) {
    var total = 0;
    text.paragraphs.forEach(function (paragraph) {
      total += plain(paragraph).split(/\s+/).filter(Boolean).length;
    });
    return total;
  }

  function renderAnnotated(source) {
    var html = "";
    var lastIndex = 0;
    var match;
    TOKEN.lastIndex = 0;

    while ((match = TOKEN.exec(source)) !== null) {
      html += escapeHtml(source.slice(lastIndex, match.index));
      html +=
        '<span class="w" tabindex="0">' +
        '<span class="de" lang="de">' + escapeHtml(match[1]) + "</span>" +
        '<span class="tr" lang="en">&nbsp;(' + escapeHtml(match[2]) + ")</span>" +
        "</span>";
      lastIndex = TOKEN.lastIndex;
    }

    html += escapeHtml(source.slice(lastIndex));
    return html;
  }

  function slugFromHash() {
    return decodeURIComponent(location.hash.replace(/^#\/?/, "").trim());
  }

  function indexForSlug(slug) {
    for (var i = 0; i < texts.length; i += 1) {
      if (texts[i].slug === slug) return i;
    }
    return 0;
  }

  function applySettings() {
    document.documentElement.dataset.theme = state.theme;
    document.documentElement.style.setProperty("--reading-size", state.size + "px");
    document.body.classList.toggle("hide-translations", !state.translations);
    translationState.textContent = state.translations ? "on" : "off";
    translationButton.setAttribute("aria-pressed", String(state.translations));
  }

  function renderList(activeIndex) {
    var fragment = document.createDocumentFragment();

    texts.forEach(function (text, index) {
      var link = document.createElement("a");
      link.className = "side-link" + (index === activeIndex ? " active" : "");
      link.href = "#/" + text.slug;
      link.setAttribute("aria-current", index === activeIndex ? "page" : "false");
      link.innerHTML =
        '<span class="num">' + String(index + 1).padStart(2, "0") + "</span>" +
        '<span class="name">' + escapeHtml(plain(text.title)) + "</span>";
      fragment.appendChild(link);
    });

    list.replaceChildren(fragment);
    countLabel.textContent = texts.length + " texts";
  }

  function footerLink(target, direction) {
    if (!target) {
      return '<span class="empty"></span>';
    }

    var label = direction === "next" ? "Next" : "Previous";
    var arrow = direction === "next" ? "→" : "←";
    return (
      '<a class="' + direction + '" href="#/' + target.slug + '">' +
      '<span class="dir">' + (direction === "next" ? label + " " + arrow : arrow + " " + label) + "</span>" +
      '<span class="title">' + escapeHtml(plain(target.title)) + "</span>" +
      "</a>"
    );
  }

  function render() {
    if (!texts.length) {
      content.innerHTML = "<p>No texts found.</p>";
      return;
    }

    var index = indexForSlug(slugFromHash());
    var text = texts[index];
    var previous = texts[index - 1] || null;
    var next = texts[index + 1] || null;
    var number = String(index + 1).padStart(2, "0");
    var total = String(texts.length).padStart(2, "0");

    content.innerHTML =
      '<div class="text-meta">' +
        "<span>Text " + number + " / " + total + "</span>" +
        '<span class="meta-right">' + wordCount(text) + " words</span>" +
      "</div>" +
      '<h1 class="text-title">' + renderAnnotated(text.title) + "</h1>" +
      '<div class="prose">' +
        text.paragraphs.map(function (paragraph) {
          return "<p>" + renderAnnotated(paragraph) + "</p>";
        }).join("") +
      "</div>" +
      '<footer class="reader-footer">' +
        footerLink(previous, "previous") +
        footerLink(next, "next") +
      "</footer>" +
      '<p class="hint">Tap any word to hold its translation. Use ← and → to move between texts.</p>';

    document.title = plain(text.title) + " — Lesesaal";
    renderList(index);
    reader.scrollTop = 0;
    window.scrollTo(0, 0);
    if (window.innerWidth <= 820) {
      var active = list.querySelector(".active");
      if (active) active.scrollIntoView({ block: "nearest", inline: "center" });
    }
  }

  function step(direction) {
    var index = indexForSlug(slugFromHash());
    var target = texts[index + direction];
    if (target) location.hash = "#/" + target.slug;
  }

  content.addEventListener("click", function (event) {
    var word = event.target.closest(".w");
    if (!word) return;

    var wasActive = word.classList.contains("is-active");
    content.querySelectorAll(".w.is-active").forEach(function (activeWord) {
      activeWord.classList.remove("is-active");
    });
    if (!wasActive) word.classList.add("is-active");
  });

  content.addEventListener("keydown", function (event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    var word = event.target.closest(".w");
    if (!word) return;
    event.preventDefault();
    word.click();
  });

  translationButton.addEventListener("click", function () {
    state.translations = !state.translations;
    writeStorage("lesesaal.translations", state.translations ? "on" : "off");
    applySettings();
  });

  document.getElementById("font-down").addEventListener("click", function () {
    state.size = Math.max(16, state.size - 1);
    writeStorage("lesesaal.size", String(state.size));
    applySettings();
  });

  document.getElementById("font-up").addEventListener("click", function () {
    state.size = Math.min(26, state.size + 1);
    writeStorage("lesesaal.size", String(state.size));
    applySettings();
  });

  document.getElementById("theme-toggle").addEventListener("click", function () {
    state.theme = state.theme === "dark" ? "light" : "dark";
    writeStorage("lesesaal.theme", state.theme);
    applySettings();
  });

  document.addEventListener("keydown", function (event) {
    var tag = event.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || event.metaKey || event.ctrlKey || event.altKey) return;

    if (event.key === "ArrowLeft") {
      step(-1);
    } else if (event.key === "ArrowRight") {
      step(1);
    } else if (event.key.toLowerCase() === "t") {
      translationButton.click();
    } else if (event.key === "+" || event.key === "=") {
      document.getElementById("font-up").click();
    } else if (event.key === "-") {
      document.getElementById("font-down").click();
    }
  });

  window.addEventListener("hashchange", render);

  applySettings();
  render();

  if (!location.hash && texts.length) {
    try {
      history.replaceState(null, "", "#/" + texts[0].slug);
    } catch (error) {
      /* file:// URLs can block history updates */
    }
  }
})();
