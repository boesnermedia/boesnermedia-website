// Allgemeine Bedienung: Menü auf dem Handy, Hero-Loop, Showreel
(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Menü
  var menuBtn = document.querySelector(".menu-btn");
  var nav = document.getElementById("hauptnav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      menuBtn.textContent = open ? "Schließen" : "Menü";
    });
  }

  // Hero-Loop: startet nur ohne „Bewegung reduzieren“, immer mit Pause-Knopf
  var loop = document.getElementById("loop");
  var loopBtn = document.querySelector("[data-loop-toggle]");
  function setPaused(p) {
    if (!loop) return;
    if (p) loop.pause(); else loop.play().catch(function () {});
    if (loopBtn) {
      loopBtn.setAttribute("aria-pressed", p ? "true" : "false");
      loopBtn.textContent = p ? "Loop abspielen" : "Loop pausieren";
    }
  }
  if (loop) {
    setPaused(reduce);
    if (loopBtn) loopBtn.addEventListener("click", function () { setPaused(!loop.paused ? true : false); });
  }

  // Showreel-Fenster: startet erst auf Klick, schließt per Knopf oder Esc
  var reel = document.getElementById("reel");
  var opener = null;
  function closeReel() {
    if (!reel) return;
    var v = reel.querySelector("video");
    if (v) v.pause();
    reel.hidden = true;
    document.body.style.overflow = "";
    if (opener) opener.focus();
  }
  document.querySelectorAll("[data-reel-open]").forEach(function (b) {
    b.addEventListener("click", function () {
      if (!reel) return;
      opener = b;
      reel.hidden = false;
      document.body.style.overflow = "hidden";
      reel.querySelector("[data-reel-close]").focus();
    });
  });
  if (reel) {
    reel.querySelector("[data-reel-close]").addEventListener("click", closeReel);
    reel.addEventListener("keydown", function (e) { if (e.key === "Escape") closeReel(); });
    reel.addEventListener("click", function (e) { if (e.target === reel) closeReel(); });
  }

  // Vorschauvideos der Pakete nur bei Zeigen abspielen
  if (!reduce) {
    document.querySelectorAll(".card").forEach(function (card) {
      var v = card.querySelector("video");
      if (!v) return;
      card.addEventListener("mouseenter", function () { v.play().catch(function () {}); });
      card.addEventListener("mouseleave", function () { v.pause(); });
    });
  }
})();
