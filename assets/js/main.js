// Glanzza — landingspagina interactie
(function () {
  "use strict";

  // === VUL IN: jouw Google Apps Script web-app URL (voor het lead-formulier) ===
  var LEAD_GAS_URL = "https://script.google.com/macros/s/AKfycbzW0bmYcRv0S0QKqAh2YUmC4sZoDw9TRdYZxSqW8Hba-WgyKugyaTr_i95wjZYbsXMenQ/exec";
  // =========================================================================

  document.addEventListener("DOMContentLoaded", function () {
    // 1) Scroll-reveal
    var els = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
        });
      }, { threshold: 0.12 });
      els.forEach(function (el) { io.observe(el); });
    } else {
      els.forEach(function (el) { el.classList.add("in"); });
    }

    // 2) Mobiel menu
    var toggle = document.getElementById("nav-toggle");
    var links = document.getElementById("nav-links");
    if (toggle && links) {
      toggle.addEventListener("click", function () {
        var open = links.classList.toggle("open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        toggle.setAttribute("aria-label", open ? "Menu sluiten" : "Menu openen");
      });
      links.addEventListener("click", function (e) {
        if (e.target.tagName === "A" && links.classList.contains("open")) {
          links.classList.remove("open");
          toggle.setAttribute("aria-expanded", "false");
        }
      });
    }

    // 3) Lead-formulier
    var form = document.getElementById("lead-form");
    var status = document.getElementById("lead-status");
    var submitBtn = document.getElementById("lead-submit");
    if (!form) return;

    function setErr(name, msg) {
      var el = form.querySelector('.field__err[data-for="' + name + '"]');
      var input = form.querySelector('[name="' + name + '"]');
      if (el) el.textContent = msg || "";
      if (input) input.setAttribute("aria-invalid", msg ? "true" : "false");
    }
    function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      if (submitBtn.getAttribute("aria-disabled") === "true") return;
      var data = Object.fromEntries(new FormData(form).entries());
      // trim
      if (data.bedrijf) data.bedrijf = String(data.bedrijf).trim();
      if (data.email) data.email = String(data.email).trim().toLowerCase();
      if (data.bericht) data.bericht = String(data.bericht).trim().slice(0, 500);
      var ok = true;
      setErr("bedrijf"); setErr("email");
      if (!data.bedrijf || data.bedrijf.length < 2) { setErr("bedrijf", data.bedrijf ? "Minimaal 2 tekens." : "Vul je bedrijfsnaam in."); ok = false; }
      else if (data.bedrijf.length > 80) { setErr("bedrijf", "Max. 80 tekens."); ok = false; }
      if (!data.email || !validEmail(data.email)) { setErr("email", "Vul een geldig e-mailadres in."); ok = false; }
      if (!ok) { status.textContent = ""; status.removeAttribute("data-state"); return; }

      if (!LEAD_GAS_URL) {
        status.setAttribute("data-state", "err");
        status.textContent = "⚠️ Nog niet gekoppeld: vul LEAD_GAS_URL in (assets/js/main.js).";
        return;
      }

      submitBtn.setAttribute("aria-disabled", "true");
      status.setAttribute("data-state", "busy");
      status.textContent = "Verzenden…";
      data.type = "lead";
      try {
        await fetch(LEAD_GAS_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(data),
        });
        status.setAttribute("data-state", "ok");
        status.textContent = "✅ Bedankt! We nemen binnen 2 werkdagen contact op.";
        form.reset();
      } catch (err) {
        status.setAttribute("data-state", "err");
        status.textContent = "⚠️ Netwerkfout. Probeer het opnieuw of mail naar eliyahimpelmans9@gmail.com";
      } finally {
        submitBtn.removeAttribute("aria-disabled");
      }
    });
  });
})();
