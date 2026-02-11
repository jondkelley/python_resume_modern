/**
 * Pixel-style rotating globe: land/water, wireframe, orbital rings, satellites, starfield.
 */
(function () {
  var canvas = document.getElementById('pixel-globe');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var width = 0;
  var height = 0;
  var centerX = 0;
  var centerY = 0;
  var radius = 0;
  var rotationY = 0;
  var rotationX = 0.2;
  var isDragging = false;
  var lastX = 0;
  var lastY = 0;
  var time = 0;

  var segmentsLat = 12;
  var segmentsLon = 18;

  // Low-res land mask: 18 cols (lon) x 9 rows (lat), 1 = land. Rough continent blobs.
  var landMask = [
    [0,0,0,1,1,1,0,0,0,0,1,1,0,0,0,0,0,0],
    [0,0,1,1,1,1,1,0,0,1,1,1,1,0,0,1,1,0],
    [0,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,0,0],
    [1,1,1,1,0,0,0,1,1,1,1,0,1,1,1,0,0,0],
    [0,1,1,0,0,0,1,1,1,0,0,0,1,1,0,0,0,0],
    [0,0,0,0,1,1,1,1,0,0,0,1,1,1,0,0,1,0],
    [0,0,1,1,1,1,1,0,0,1,1,1,1,0,0,1,1,0],
    [0,1,1,1,0,0,0,0,1,1,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0]
  ];

  function project(x, y, z) {
    var scale = radius / (radius + z * 0.4);
    return {
      x: centerX + x * scale,
      y: centerY - y * scale,
      z: z
    };
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    centerX = width / 2;
    centerY = height / 2;
    radius = Math.min(width, height) * 0.35;
  }

  function drawStars() {
    var i, x, y, size;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (i = 0; i < 60; i++) {
      x = (Math.sin(i * 1.3) * 0.45 + 0.5) * width;
      y = (Math.cos(i * 0.7) * 0.45 + 0.5) * height;
      size = (i % 3 === 0) ? 1.5 : 1;
      ctx.fillRect(Math.floor(x), Math.floor(y), size, size);
    }
    ctx.fillStyle = 'rgba(59, 130, 246, 0.5)';
    for (i = 0; i < 8; i++) {
      x = (Math.sin(i * 2.1 + 1) * 0.4 + 0.5) * width;
      y = (Math.cos(i * 1.7 + 2) * 0.4 + 0.5) * height;
      ctx.fillRect(Math.floor(x), Math.floor(y), 2, 2);
    }
  }

  function drawGlobeSurface(rotY, rotX) {
    var i, j, lat, lon, x, y, z, cosLat, sinLat, cosLon, sinLon, y2, z2, p, row, col, isLand;
    var oceanBlue = 'rgba(100, 160, 220, 0.85)';
    var landGreen = 'rgba(120, 180, 120, 0.95)';

    for (i = 0; i < segmentsLat; i++) {
      for (j = 0; j < segmentsLon; j++) {
        lat = (Math.PI * (i + 0.5)) / segmentsLat;
        lon = (2 * Math.PI * (j + 0.5)) / segmentsLon + rotY;
        cosLat = Math.cos(lat);
        sinLat = Math.sin(lat);
        cosLon = Math.cos(lon);
        sinLon = Math.sin(lon);
        x = radius * sinLat * cosLon;
        y = radius * cosLat;
        z = radius * sinLat * sinLon;
        y2 = y * Math.cos(rotX) - z * Math.sin(rotX);
        z2 = y * Math.sin(rotX) + z * Math.cos(rotX);
        if (z2 < -radius * 0.2) continue;
        row = Math.floor((1 - (lat + Math.PI / 2) / Math.PI) * (landMask.length - 0.01));
        row = Math.max(0, Math.min(landMask.length - 1, row));
        col = Math.floor(((lon - rotY) / (2 * Math.PI) + 0.5) * landMask[0].length) % landMask[0].length;
        if (col < 0) col += landMask[0].length;
        isLand = landMask[row][col];
        p = project(x, y2, z2);
        ctx.fillStyle = isLand ? landGreen : oceanBlue;
        var cellW = Math.max(4, (width / segmentsLon) * 0.9);
        var cellH = Math.max(3, (height / segmentsLat) * 0.9);
        ctx.fillRect(Math.floor(p.x - cellW / 2), Math.floor(p.y - cellH / 2), Math.ceil(cellW), Math.ceil(cellH));
      }
    }
  }

  function drawWireframe(rotY, rotX) {
    var points = [];
    var i, j, lat, lon, x, y, z, cosLat, sinLat, cosLon, sinLon, y2, z2;
    for (i = 0; i <= segmentsLat; i++) {
      lat = (Math.PI * i) / segmentsLat;
      cosLat = Math.cos(lat);
      sinLat = Math.sin(lat);
      for (j = 0; j <= segmentsLon; j++) {
        lon = (2 * Math.PI * j) / segmentsLon + rotY;
        cosLon = Math.cos(lon);
        sinLon = Math.sin(lon);
        x = radius * sinLat * cosLon;
        y = radius * cosLat;
        z = radius * sinLat * sinLon;
        y2 = y * Math.cos(rotX) - z * Math.sin(rotX);
        z2 = y * Math.sin(rotX) + z * Math.cos(rotX);
        var p = project(x, y2, z2);
        p.z = z2;
        points.push(p);
      }
    }
    var stride = segmentsLon + 1;
    var color = 'rgba(59, 130, 246, 0.5)';
    var frontColor = 'rgba(59, 130, 246, 0.85)';
    var equatorColor = 'rgba(150, 200, 255, 0.6)';
    ctx.lineWidth = 1;

    for (i = 0; i <= segmentsLat; i++) {
      for (j = 0; j < segmentsLon; j++) {
        var a = points[i * stride + j];
        var b = points[i * stride + j + 1];
        if (a.z > -radius * 0.3 || b.z > -radius * 0.3) {
          ctx.strokeStyle = (i === segmentsLat / 2) ? equatorColor : (a.z > 0 || b.z > 0 ? frontColor : color);
          ctx.lineWidth = (i === segmentsLat / 2) ? 1.5 : 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    for (j = 0; j <= segmentsLon; j++) {
      for (i = 0; i < segmentsLat; i++) {
        var a = points[i * stride + j];
        var b = points[(i + 1) * stride + j];
        if (a.z > -radius * 0.3 || b.z > -radius * 0.3) {
          ctx.strokeStyle = (i === segmentsLat / 2 - 1 || i === segmentsLat / 2) ? equatorColor : (a.z > 0 || b.z > 0 ? frontColor : color);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
  }

  function drawOrbitalRings(rotY, rotX) {
    var ringRadius = radius * 1.35;
    var tilt = 0.4;
    var i, t, x, y, z, y2, z2, p, pts;
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.35)';
    ctx.lineWidth = 1.2;
    for (var ring = 0; ring < 2; ring++) {
      var phase = (time * 0.02 + ring * Math.PI) % (2 * Math.PI);
      pts = [];
      for (i = 0; i <= 32; i++) {
        t = (2 * Math.PI * i) / 32 + phase;
        x = ringRadius * Math.cos(t);
        y = ringRadius * Math.sin(t) * (ring === 0 ? Math.cos(tilt) : Math.cos(tilt + 0.5));
        z = ringRadius * Math.sin(t) * (ring === 0 ? Math.sin(tilt) : Math.sin(tilt + 0.5));
        y2 = y * Math.cos(rotX) - z * Math.sin(rotX);
        z2 = y * Math.sin(rotX) + z * Math.cos(rotX);
        p = project(x, y2, z2);
        pts.push(p);
      }
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();
    }
  }

  function drawOrbiters(rotY, rotX) {
    var orbRadius = radius * 1.5;
    var angles = [time * 0.015, time * 0.012 + 2, time * 0.018 + 4];
    var orbits = [
      { angle: angles[0], yOff: 0.3, zOff: 0.2 },
      { angle: angles[1], yOff: -0.25, zOff: 0.15 },
      { angle: angles[2], yOff: 0.1, zOff: -0.3 }
    ];
    var i, o, x, y, z, y2, z2, p;
    for (i = 0; i < orbits.length; i++) {
      o = orbits[i];
      x = orbRadius * Math.cos(o.angle);
      y = orbRadius * Math.sin(o.angle) * 0.6 + radius * o.yOff;
      z = orbRadius * Math.sin(o.angle) * 0.5 + radius * o.zOff;
      y2 = y * Math.cos(rotX) - z * Math.sin(rotX);
      z2 = y * Math.sin(rotX) + z * Math.cos(rotX);
      p = project(x, y2, z2);
      if (z2 < -radius * 0.5) continue;
      if (i === 0) {
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(Math.floor(p.x - 6), Math.floor(p.y - 8), 12, 16);
        ctx.fillStyle = 'rgba(80, 140, 80, 0.9)';
        ctx.fillRect(Math.floor(p.x - 4), Math.floor(p.y - 8), 8, 4);
      } else if (i === 1) {
        ctx.fillStyle = '#808080';
        ctx.fillRect(Math.floor(p.x - 8), Math.floor(p.y - 4), 16, 10);
        ctx.fillStyle = '#c03030';
        ctx.fillRect(Math.floor(p.x - 2), Math.floor(p.y + 2), 4, 3);
      } else {
        ctx.fillStyle = '#404050';
        ctx.fillRect(Math.floor(p.x - 5), Math.floor(p.y - 6), 10, 12);
      }
    }
  }

  function draw() {
    if (width <= 0 || height <= 0) return;
    ctx.clearRect(0, 0, width, height);
    var rotY = rotationY;
    var rotX = rotationX;

    drawStars();
    drawGlobeSurface(rotY, rotX);
    drawWireframe(rotY, rotX);
    drawOrbitalRings(rotY, rotX);
    drawOrbiters(rotY, rotX);
  }

  function animate() {
    if (!isDragging) {
      rotationY += 0.004;
      time++;
    }
    draw();
    requestAnimationFrame(animate);
  }

  function onPointerDown(e) {
    isDragging = true;
    lastX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    lastY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    var x = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : lastX);
    var y = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : lastY);
    rotationY += (x - lastX) * 0.01;
    rotationX = Math.max(-0.5, Math.min(0.5, rotationX + (y - lastY) * 0.005));
    lastX = x;
    lastY = y;
  }

  function onPointerUp() {
    isDragging = false;
  }

  resize();
  canvas.addEventListener('mousedown', onPointerDown);
  canvas.addEventListener('mousemove', onPointerMove);
  canvas.addEventListener('mouseup', onPointerUp);
  canvas.addEventListener('mouseleave', onPointerUp);
  canvas.addEventListener('touchstart', onPointerDown, { passive: true });
  canvas.addEventListener('touchmove', onPointerMove, { passive: true });
  canvas.addEventListener('touchend', onPointerUp);

  window.addEventListener('resize', function () {
    resize();
    draw();
  });

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) {
    draw();
  } else {
    animate();
  }
})();
