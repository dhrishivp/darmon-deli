(function () {
  "use strict";

  var root = document.documentElement;

  /* Mobile drawer ------------------------------------------------------- */

  var drawer = document.getElementById("drawer");
  var scrim = document.querySelector(".drawer-scrim");
  var toggle = document.querySelector(".nav-toggle");
  var desktopQuery = window.matchMedia("(min-width: 901px)");
  var lastFocus = null;
  var scrimTimer = null;

  function isOpen() {
    return drawer.classList.contains("is-open");
  }

  function openDrawer() {
    if (isOpen()) return;
    lastFocus = document.activeElement;
    clearTimeout(scrimTimer);
    scrim.hidden = false;
    // Force a reflow so the scrim fades in instead of popping.
    void scrim.offsetWidth;
    scrim.classList.add("is-visible");
    drawer.inert = false;
    drawer.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    root.classList.add("is-locked");
    var first = drawer.querySelector("a, button");
    if (first) first.focus({ preventScroll: true });
  }

  function closeDrawer(restoreFocus) {
    if (!isOpen()) return;
    drawer.classList.remove("is-open");
    drawer.inert = true;
    scrim.classList.remove("is-visible");
    toggle.setAttribute("aria-expanded", "false");
    root.classList.remove("is-locked");
    scrimTimer = setTimeout(function () {
      scrim.hidden = true;
    }, 300);
    if (restoreFocus !== false && lastFocus) lastFocus.focus({ preventScroll: true });
  }

  if (drawer && scrim && toggle) {
    toggle.addEventListener("click", openDrawer);

    document.querySelectorAll("[data-drawer-close]").forEach(function (el) {
      el.addEventListener("click", function () {
        closeDrawer();
      });
    });

    drawer.querySelectorAll("a[href^='#']").forEach(function (link) {
      link.addEventListener("click", function () {
        // Let the anchor jump happen; don't pull focus back to the toggle.
        closeDrawer(false);
      });
    });

    document.addEventListener("keydown", function (e) {
      if (!isOpen()) return;
      if (e.key === "Escape") {
        closeDrawer();
        return;
      }
      if (e.key === "Tab") {
        var items = drawer.querySelectorAll("a[href], button:not([disabled])");
        if (!items.length) return;
        var first = items[0];
        var last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    // If the viewport grows past the mobile breakpoint, don't leave the
    // page scroll-locked behind a hidden drawer.
    var onBreakpoint = function (e) {
      if (e.matches) closeDrawer(false);
    };
    if (desktopQuery.addEventListener) desktopQuery.addEventListener("change", onBreakpoint);
    else if (desktopQuery.addListener) desktopQuery.addListener(onBreakpoint);
  }

  /* Header shadow on scroll -------------------------------------------- */

  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* Active nav link ---------------------------------------------------- */

  var navLinks = document.querySelectorAll(".nav-desktop a[href^='#']");
  if ("IntersectionObserver" in window && navLinks.length) {
    var byId = {};
    navLinks.forEach(function (a) {
      byId[a.getAttribute("href").slice(1)] = a;
    });
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var link = byId[entry.target.id];
          if (!link) return;
          if (entry.isIntersecting) {
            navLinks.forEach(function (a) {
              a.classList.remove("is-active");
            });
            link.classList.add("is-active");
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    Object.keys(byId).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  }

  /* Menu tabs ---------------------------------------------------------- */

  var menu = document.querySelector(".menu");
  var tablist = menu && menu.querySelector("[role='tablist']");
  if (tablist) {
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll("[role='tab']"));

    var selectTab = function (tab, moveFocus, fromUser) {
      tabs.forEach(function (t) {
        var selected = t === tab;
        t.setAttribute("aria-selected", selected ? "true" : "false");
        t.tabIndex = selected ? 0 : -1;
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !selected;
      });
      if (moveFocus) tab.focus();
      // Keep the chosen tab visible when the row scrolls on small screens.
      if (fromUser && tab.scrollIntoView && tablist.scrollWidth > tablist.clientWidth) {
        tab.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
    };

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () {
        selectTab(tab, false, true);
      });
      tab.addEventListener("keydown", function (e) {
        var next = null;
        if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
        else if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === "Home") next = tabs[0];
        else if (e.key === "End") next = tabs[tabs.length - 1];
        if (next) {
          e.preventDefault();
          selectTab(next, true, true);
        }
      });
    });

    tablist.hidden = false;
    menu.classList.add("has-tabs");
    selectTab(tabs[0], false);
  }

  /* Opening hours ------------------------------------------------------ */

  // Minutes after midnight, UK time. 0 = Sunday.
  var HOURS = {
    0: [[720, 900]],
    1: [],
    2: [],
    3: [],
    4: [[720, 870], [1080, 1320]],
    5: [[720, 870], [1080, 1320]],
    6: [[720, 870], [1080, 1320]]
  };
  var DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var DAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  function ukNow() {
    // Always use UK time, whatever the visitor's own timezone is.
    try {
      var parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/London",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23"
      }).formatToParts(new Date());
      var get = function (type) {
        for (var i = 0; i < parts.length; i++) if (parts[i].type === type) return parts[i].value;
        return "";
      };
      var day = DAY_INDEX[get("weekday")];
      var hour = parseInt(get("hour"), 10) % 24;
      var minute = parseInt(get("minute"), 10);
      if (day === undefined || isNaN(hour) || isNaN(minute)) throw new Error("bad parts");
      return { day: day, minutes: hour * 60 + minute };
    } catch (err) {
      var d = new Date();
      return { day: d.getDay(), minutes: d.getHours() * 60 + d.getMinutes() };
    }
  }

  function formatTime(mins) {
    var h = Math.floor(mins / 60);
    var m = mins % 60;
    var suffix = h >= 12 ? "pm" : "am";
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + (m ? ":" + (m < 10 ? "0" : "") + m : "") + suffix;
  }

  function openStatus(now) {
    var today = HOURS[now.day];
    for (var i = 0; i < today.length; i++) {
      if (now.minutes >= today[i][0] && now.minutes < today[i][1]) {
        return { open: true, text: "Open now · until " + formatTime(today[i][1]) };
      }
    }
    for (var offset = 0; offset < 8; offset++) {
      var day = (now.day + offset) % 7;
      var slots = HOURS[day];
      for (var j = 0; j < slots.length; j++) {
        if (offset === 0 && slots[j][0] <= now.minutes) continue;
        var when;
        if (offset === 0) when = "today";
        else if (offset === 1) when = "tomorrow";
        else when = DAY_NAMES[day];
        return { open: false, text: "Closed · opens " + when + " at " + formatTime(slots[j][0]) };
      }
    }
    return { open: false, text: "Closed" };
  }

  var statusEl = document.querySelector("[data-open-status]");
  function renderStatus() {
    var now = ukNow();

    if (statusEl) {
      var s = openStatus(now);
      statusEl.querySelector(".status-text").textContent = s.text;
      statusEl.classList.toggle("is-open", s.open);
      statusEl.hidden = false;
    }

    document.querySelectorAll(".hours tr[data-day]").forEach(function (row) {
      row.classList.toggle("is-today", Number(row.getAttribute("data-day")) === now.day);
    });
  }
  renderStatus();
  setInterval(renderStatus, 60 * 1000);

  /* Footer year -------------------------------------------------------- */

  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
