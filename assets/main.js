/* McCall Listing Studio: interactions */
(function () {
  var root = document.documentElement;
  root.classList.remove('no-js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  requestAnimationFrame(function () { setTimeout(function () { root.classList.add('loaded'); }, 80); });

  // reveal on scroll
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el, i) {
      var sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.transitionDelay = Math.min(sib, 5) * 70 + 'ms';
      io.observe(el);
    });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  // header state + process line progress
  var header = document.querySelector('.site-header');
  var flow = document.querySelector('.flow');
  var lastY = window.scrollY, ticking = false;
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle('scrolled', y > 40);
    header.classList.toggle('hide', y > lastY && y > window.innerHeight * 0.9);
    lastY = y;
    if (flow) {
      var r = flow.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.min(1, Math.max(0, (vh * 0.8 - r.top) / (r.height + vh * 0.3)));
      flow.style.setProperty('--p', p.toFixed(3));
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  if (reduce || !fine) return;

  // magnetic buttons
  document.querySelectorAll('.magnetic').forEach(function (el) {
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      var x = (e.clientX - r.left - r.width / 2) * 0.22;
      var y = (e.clientY - r.top - r.height / 2) * 0.3;
      el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    });
    el.addEventListener('pointerleave', function () { el.style.transform = ''; });
  });

  // 3D tilt cards
  document.querySelectorAll('.tilt').forEach(function (el) {
    var raf = 0;
    el.addEventListener('pointermove', function (e) {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transition = 'transform .15s ease-out, box-shadow .5s';
        el.style.transform = 'perspective(1100px) rotateX(' + (-py * 5) + 'deg) rotateY(' + (px * 6) + 'deg)';
      });
    });
    el.addEventListener('pointerleave', function () {
      cancelAnimationFrame(raf);
      el.style.transition = 'transform .9s cubic-bezier(.22,1,.36,1), box-shadow .5s';
      el.style.transform = '';
    });
  });
})();
