/**
 * Node network background animation (connecting dots).
 * Respects prefers-reduced-motion.
 */
(function () {
  var canvas = document.getElementById('node-canvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var nodes = [];
  var animId = 0;
  var w = 0;
  var h = 0;
  var config = {
    nodeCount: 40,
    maxDistance: 150,
    nodeColor: 'rgba(59, 130, 246, 0.6)',
    lineColor: 'rgba(59, 130, 246, 0.15)',
    speed: 0.3
  };

  function resize() {
    var rect = canvas.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    w = rect.width;
    h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    initNodes();
  }

  function initNodes() {
    nodes = [];
    for (var i = 0; i < config.nodeCount; i++) {
      nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * config.speed,
        vy: (Math.random() - 0.5) * config.speed,
        radius: Math.random() * 2 + 1
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1;

    for (var i = 0; i < nodes.length; i++) {
      for (var j = i + 1; j < nodes.length; j++) {
        var dx = nodes[i].x - nodes[j].x;
        var dy = nodes[i].y - nodes[j].y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < config.maxDistance) {
          var alpha = (1 - dist / config.maxDistance) * 0.15;
          ctx.strokeStyle = 'rgba(59, 130, 246, ' + alpha + ')';
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    ctx.fillStyle = config.nodeColor;
    for (var k = 0; k < nodes.length; k++) {
      var n = nodes[k];
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function step() {
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
      n.x = Math.max(0, Math.min(w, n.x));
      n.y = Math.max(0, Math.min(h, n.y));
    }
  }

  function loop() {
    step();
    draw();
    animId = requestAnimationFrame(loop);
  }

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) {
    config.speed = 0;
  }

  resize();
  if (reducedMotion) {
    draw();
  } else {
    loop();
  }

  window.addEventListener('resize', function () {
    clearTimeout(window._nodeResize);
    window._nodeResize = setTimeout(function () {
      cancelAnimationFrame(animId);
      resize();
      if (!reducedMotion) loop();
      else draw();
    }, 100);
  });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting && !reducedMotion) {
        loop();
      } else {
        cancelAnimationFrame(animId);
      }
    });
  }, { threshold: 0 });
  observer.observe(canvas);
})();
