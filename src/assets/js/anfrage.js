// Anfrageformular: Prüfung direkt am Feld, Absenden, Danke-Ansicht mit „Angaben bearbeiten“
(function () {
  var form = document.getElementById("anfrage");
  if (!form) return;
  var danke = document.getElementById("danke");
  var steps = document.querySelectorAll(".progress li");
  var endpoint = form.getAttribute("data-endpoint");
  var start = Date.now();

  function val(name) {
    var el = form.elements[name];
    if (!el) return "";
    if (el.length !== undefined && el.tagName !== "SELECT") {
      for (var i = 0; i < el.length; i++) if (el[i].checked) return el[i].value;
      return "";
    }
    return (el.value || "").trim();
  }
  function setStep(n) {
    steps.forEach(function (li) { li.classList.toggle("done", Number(li.getAttribute("data-step")) <= n); });
    steps.forEach(function (li) { li.removeAttribute("aria-current"); });
    if (steps[n - 1]) steps[n - 1].setAttribute("aria-current", "step");
  }
  function showError(id, inputId, msg) {
    var p = document.getElementById(id);
    if (p) p.textContent = msg || "";
    if (inputId) {
      var inp = document.getElementById(inputId);
      if (inp) inp.setAttribute("aria-invalid", msg ? "true" : "false");
    }
  }

  form.addEventListener("change", function (e) {
    if (e.target.name === "kundentyp") {
      setStep(2);
      var bestand = e.target.value === "Bestandskunde";
      document.getElementById("f-msg").placeholder = bestand ? "Was sollen wir ändern oder ergänzen?" : "Was haben Sie vor? Ziel, Zielgruppe, Ideen.";
    }
    if (e.target.name === "interesse") showError("err-interesse", null, "");
    if (e.target.name === "anliegen") showError("err-anliegen", null, "");
  });

  // Sofortige Rückmeldung, sobald ein Feld verlassen oder korrigiert wird
  var feldRegeln = {
    "f-name": ["err-name", function (v) { return v ? "" : "Bitte geben Sie Ihren Namen ein."; }],
    "f-firma": ["err-firma", function (v) { return v ? "" : "Bitte geben Sie Ihr Unternehmen ein."; }],
    "f-mail": ["err-mail", function (v) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? "" : "Bitte prüfen Sie die E-Mail-Adresse, z. B. name@firma.de."; }],
    "f-msg": ["err-msg", function (v) { return v ? "" : "Ein, zwei Sätze reichen."; }]
  };
  Object.keys(feldRegeln).forEach(function (id) {
    var el = document.getElementById(id);
    var regel = feldRegeln[id];
    el.addEventListener("blur", function () { if (el.value.trim()) showError(regel[0], id, regel[1](el.value.trim())); });
    el.addEventListener("input", function () {
      if (el.getAttribute("aria-invalid") === "true" && !regel[1](el.value.trim())) showError(regel[0], id, "");
    });
  });

  function validate() {
    var typ = val("kundentyp");
    var errors = [];
    var checks = [
      ["err-name", "f-name", val("name") ? "" : "Bitte geben Sie Ihren Namen ein."],
      ["err-firma", "f-firma", val("unternehmen") ? "" : "Bitte geben Sie Ihr Unternehmen ein."],
      ["err-mail", "f-mail", /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val("email")) ? "" : "Bitte prüfen Sie die E-Mail-Adresse, z. B. name@firma.de."],
      ["err-msg", "f-msg", val("nachricht") ? "" : "Ein, zwei Sätze reichen."]
    ];
    if (typ === "Neukunde") checks.unshift(["err-interesse", null, val("interesse") ? "" : "Bitte wählen Sie, wofür Sie sich interessieren."]);
    if (typ === "Bestandskunde") checks.unshift(["err-anliegen", null, val("anliegen") ? "" : "Bitte wählen Sie, worum es geht."]);
    checks.forEach(function (c) { showError(c[0], c[1], c[2]); if (c[2]) errors.push(c); });
    showError("err-senden", null, errors.length
      ? (errors.length === 1 ? "Bitte prüfen Sie das markierte Feld." : "Bitte prüfen Sie die " + errors.length + " markierten Felder.")
      : "");
    if (errors.length) {
      var first = errors[0][1] ? document.getElementById(errors[0][1]) : form.querySelector(typ === "Neukunde" ? 'input[name="interesse"]' : 'input[name="anliegen"]');
      if (first) first.focus();
    }
    return errors.length === 0;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    showError("err-senden", null, "");
    if (!val("kundentyp")) return;
    if (!validate()) return;

    form.elements["t"].value = String(Date.now() - start);
    var daten = new URLSearchParams(new FormData(form));
    var fertig = function () {
      var neu = val("kundentyp") === "Neukunde";
      danke.querySelector('[data-out="vorname"]').textContent = val("name").split(" ")[0];
      danke.querySelector('[data-out="email"]').textContent = val("email");
      danke.querySelector('[data-out="anliegen"]').textContent = neu ? val("interesse") : val("anliegen");
      danke.querySelector('[data-out="danketext"]').textContent = neu
        ? "Ihre Anfrage ist angekommen. Ich melde mich innerhalb von 24 Stunden mit zwei, drei Terminvorschlägen für die kostenlose Potenzial-Analyse. Eine Bestätigung ist schon in Ihrem Postfach."
        : "Ihre Nachricht ist angekommen. Ich melde mich innerhalb von 24 Stunden zu Ihrem Anliegen. Eine Bestätigung ist schon in Ihrem Postfach.";
      form.hidden = true;
      danke.hidden = false;
      setStep(3);
      danke.focus();
    };

    // Solange kein Server angebunden ist, sagt das Formular das ehrlich
    if (!endpoint) {
      showError("err-senden", null, "Das Formular ist noch nicht freigeschaltet. Bitte schreiben Sie an info@boesnermedia.de oder rufen Sie an: +49 173 6094285.");
      return;
    }
    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = "Wird gesendet …";
    fetch(endpoint, { method: "POST", body: daten })
      .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
      .then(function (j) { if (!j || !j.ok) throw new Error(); fertig(); })
      .catch(function () {
        showError("err-senden", null, "Das hat nicht geklappt. Ihre Angaben sind noch da – bitte versuchen Sie es noch einmal oder schreiben Sie an info@boesnermedia.de.");
      })
      .finally(function () { btn.disabled = false; btn.textContent = "Anfrage senden"; });
  });

  danke.querySelector("[data-edit]").addEventListener("click", function () {
    danke.hidden = true;
    form.hidden = false;
    setStep(2);
    document.getElementById("f-name").focus();
  });
  danke.querySelector("[data-reset]").addEventListener("click", function () {
    form.reset();
    danke.hidden = true;
    form.hidden = false;
    setStep(1);
  });
})();
