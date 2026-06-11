/* ============================================================
   Managed Employment Services — interactions
   ============================================================ */
(function () {
  "use strict";

  var doc = document;
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Current year ---------- */
  var yearEl = doc.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Sticky header shadow on scroll ---------- */
  var header = doc.querySelector(".site-header");
  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Mobile nav toggle ---------- */
  var toggle = doc.getElementById("navToggle");
  var nav = doc.getElementById("primary-nav");

  function closeNav() {
    if (!nav || !toggle) return;
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
  }
  function openNav() {
    if (!nav || !toggle) return;
    nav.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      if (nav.classList.contains("is-open")) closeNav();
      else openNav();
    });
    // Close after choosing a link (mobile)
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeNav();
    });
    // Close on Escape
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        closeNav();
        toggle.focus();
      }
    });
    // Reset nav state when resizing up to desktop
    var mq = window.matchMedia("(min-width: 900px)");
    (mq.addEventListener ? mq.addEventListener.bind(mq, "change") : mq.addListener.bind(mq))(closeNav);
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = Array.prototype.slice.call(doc.querySelectorAll(".reveal"));
  if (prefersReduced || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Form validation + submit UX ---------- */
  var form = doc.getElementById("consultForm");
  if (!form) return;

  var statusEl = doc.getElementById("formStatus");
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function fieldError(input, message) {
    var slot = form.querySelector('.field__error[data-for="' + input.id + '"]');
    input.setAttribute("aria-invalid", message ? "true" : "false");
    if (slot) slot.textContent = message || "";
    return !message;
  }

  function validate() {
    var ok = true;
    var name = form.elements["name"];
    var email = form.elements["email"];

    if (!name.value.trim()) ok = fieldError(name, "Please enter your name.") && ok;
    else fieldError(name, "");

    if (!email.value.trim()) ok = fieldError(email, "Please enter your email.") && ok;
    else if (!emailRe.test(email.value.trim())) ok = fieldError(email, "Please enter a valid email.") && ok;
    else fieldError(email, "");

    return ok;
  }

  // Clear an error as the user corrects it
  ["name", "email"].forEach(function (n) {
    var el = form.elements[n];
    if (el) el.addEventListener("input", function () {
      if (el.getAttribute("aria-invalid") === "true") fieldError(el, "");
    });
  });

  function setStatus(msg, kind) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.classList.remove("is-success", "is-error");
    if (kind) statusEl.classList.add("is-" + kind);
  }

  var endpointConfigured = !/your-form-id/.test(form.getAttribute("action") || "");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    setStatus("", null);

    if (!validate()) {
      setStatus("Please fix the highlighted fields.", "error");
      var firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Until a real endpoint is wired up, fall back to a prefilled email.
    if (!endpointConfigured) {
      var fd = new FormData(form);
      var subject = encodeURIComponent("Free Consultation Request — " + (fd.get("name") || ""));
      var bodyLines = [
        "Name: " + (fd.get("name") || ""),
        "Business: " + (fd.get("business") || ""),
        "Email: " + (fd.get("email") || ""),
        "Phone: " + (fd.get("phone") || ""),
        "",
        (fd.get("message") || "")
      ];
      var body = encodeURIComponent(bodyLines.join("\n"));
      setStatus("Opening your email app to send the request…", "success");
      window.location.href =
        "mailto:ManagedEmploymentServices@gmail.com?subject=" + subject + "&body=" + body;
      return;
    }

    var btn = form.querySelector('button[type="submit"]');
    var original = btn ? btn.textContent : "";
    if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }
    setStatus("Sending your request…", null);

    fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" }
    })
      .then(function (res) {
        if (res.ok) {
          form.reset();
          setStatus("Thank you! Your request has been sent — we'll reply within one business day.", "success");
        } else {
          setStatus("Something went wrong. Please call (786) 906-2188 or email us directly.", "error");
        }
      })
      .catch(function () {
        setStatus("Network error. Please call (786) 906-2188 or email us directly.", "error");
      })
      .finally(function () {
        if (btn) { btn.disabled = false; btn.textContent = original; }
      });
  });
})();
