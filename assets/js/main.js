// Glanzza — landingspagina interactie + high-end perceived speed
(function () {
  "use strict";

  var LEAD_GAS_URL = "https://script.google.com/macros/s/AKfycbzW0bmYcRv0S0QKqAh2YUmC4sZoDw9TRdYZxSqW8Hba-WgyKugyaTr_i95wjZYbsXMenQ/exec";

  // instant hover-prefetch: mousedown/hover = prefetch destination (verbluffend snel)
  (function(){
    var seen=new Set();
    function pf(href){
      try{
        var u=new URL(href, location.href);
        if(u.origin!==location.origin) return;
        var k=u.pathname+u.search;
        if(seen.has(k)) return;
        seen.add(k);
        var l=document.createElement('link');
        l.rel='prefetch';
        l.href=u.pathname+(u.search||'');
        l.as='document';
        document.head.appendChild(l);
      }catch(e){}
    }
    document.addEventListener('mouseover',function(e){
      var a=e.target.closest && e.target.closest('a[href]');
      if(a) pf(a.getAttribute('href'));
    },{passive:true, capture:true});
    document.addEventListener('touchstart',function(e){
      var a=e.target.closest && e.target.closest('a[href]');
      if(a) pf(a.getAttribute('href'));
    },{passive:true, capture:true});
  })();

  document.addEventListener("DOMContentLoaded", function () {
    // 1) Scroll-reveal — IntersectionObserver + stagger polish
    var els = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
      els.forEach(function (el) { io.observe(el); });
    } else {
      els.forEach(function (el) { el.classList.add("in"); });
    }

    // 2) Mobiel menu — focus trap + ESC close
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
      document.addEventListener('keydown', function(e){
        if(e.key==='Escape' && links.classList.contains('open')){
          links.classList.remove('open');
          toggle.setAttribute('aria-expanded','false');
          toggle.focus();
        }
      });
    }

    // 3) Topbar dismiss: persist + respect motion
    (function(){
      var tb=document.getElementById('topbar');
      var cl=document.getElementById('topbar-close');
      if(!tb||!cl) return;
      var k='glanzza_topbar_closed';
      try{ if(localStorage.getItem(k)==='1') tb.style.display='none'; }catch(e){}
      cl.addEventListener('click',function(){
        tb.style.display='none';
        try{ localStorage.setItem(k,'1'); }catch(e){}
      });
    })();

    // 4) Lead-formulier — instant feedback + double-submit guard
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

    // shake animation helper for invalid fields (perceived polish)
    function shake(el){
      if(!el) return;
      el.animate([{transform:'translateX(0)'},{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'translateX(0)'}],{duration:280,easing:'ease'});
    }

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      if (submitBtn.getAttribute("aria-disabled") === "true") return;
      var data = Object.fromEntries(new FormData(form).entries());
      if (data.bedrijf) data.bedrijf = String(data.bedrijf).trim();
      if (data.email) data.email = String(data.email).trim().toLowerCase();
      if (data.bericht) data.bericht = String(data.bericht).trim().slice(0, 500);
      var ok = true;
      setErr("bedrijf"); setErr("email");
      if (!data.bedrijf || data.bedrijf.length < 2) { setErr("bedrijf", data.bedrijf ? "Minimaal 2 tekens." : "Vul je bedrijfsnaam in."); ok = false; shake(form.querySelector('[name=\"bedrijf\"]')); }
      else if (data.bedrijf.length > 80) { setErr("bedrijf", "Max. 80 tekens."); ok = false; shake(form.querySelector('[name=\"bedrijf\"]')); }
      if (!data.email || !validEmail(data.email)) { setErr("email", "Vul een geldig e-mailadres in."); ok = false; shake(form.querySelector('[name=\"email\"]')); }
      if (!ok) { status.textContent = ""; status.removeAttribute("data-state"); return; }

      if (!LEAD_GAS_URL) {
        status.setAttribute("data-state", "err");
        status.textContent = "⚠️ Nog niet gekoppeld: vul LEAD_GAS_URL in (assets/js/main.js).";
        return;
      }

      var orig = submitBtn.textContent;
      submitBtn.setAttribute("aria-disabled", "true");
      status.setAttribute("data-state", "busy");
      status.textContent = "Verzenden…";
      submitBtn.textContent = "Verzenden…";
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
        submitBtn.textContent = "Verzonden ✓";
        setTimeout(function(){ submitBtn.textContent = orig; }, 2600);
      } catch (err) {
        status.setAttribute("data-state", "err");
        status.textContent = "⚠️ Netwerkfout. Probeer het opnieuw of mail naar eliyahimpelmans9@gmail.com";
        submitBtn.textContent = orig;
      } finally {
        submitBtn.removeAttribute("aria-disabled");
        if(status.getAttribute("data-state")!=="ok") submitBtn.textContent = orig;
      }
    });

    // live email hint — premium feel
    var em=document.getElementById('lf-email');
    if(em){
      em.addEventListener('blur', function(){
        var v=em.value.trim();
        if(v && !validEmail(v)) setErr('email','Check je e-mailadres — mist er een @ of punt?');
        else if(v) setErr('email','');
      });
    }
  });
})();
