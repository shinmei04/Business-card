(() => {
  const stage = document.querySelector('[data-profile-video]');
  if (!stage) return;
  const video = stage.querySelector('video');
  const canvas = stage.querySelector('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return;

  // Keep processing small enough for mobile playback.
  const height = 450;
  let width = 0;
  let visited;
  let queue;
  let previousTime = -1;
  let failed = false;
  // The generated clip changes from black to white during its opening frames.
  const loopStart = 1.2;
  const blendDuration = 0.35;
  let loopFrame = null;
  let blendStart = null;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function render() {
    if (!video.videoWidth || video.readyState < 2 || failed) return;
    try {
      const loopEnd = video.duration - 0.12;
      if (Number.isFinite(loopEnd) && loopEnd > loopStart + blendDuration &&
          (video.currentTime < loopStart || video.currentTime >= loopEnd)) {
        if (!video.seeking) {
          // Hold the visible, already matted frame throughout decoder seeking.
          loopFrame = width && stage.classList.contains('is-ready')
            ? context.getImageData(0, 0, width, height) : null;
          blendStart = null;
          video.currentTime = loopStart;
        }
        return;
      }
      if (video.seeking) return;
      if (!width) {
        width = Math.round(height * video.videoWidth / video.videoHeight);
        canvas.width = width;
        canvas.height = height;
        visited = new Uint8Array(width * height);
        queue = new Int32Array(width * height);
      }
      context.drawImage(video, 0, 0, width, height);
      const frame = context.getImageData(0, 0, width, height);
      const pixels = frame.data;
      const darkBackground = pixels[0] + pixels[1] + pixels[2] < 300;
      visited.fill(0);
      let head = 0;
      let tail = 0;
      function visit(index) {
        if (visited[index]) return;
        visited[index] = 1;
        const p = index * 4;
        const low = Math.min(pixels[p], pixels[p + 1], pixels[p + 2]);
        const high = Math.max(pixels[p], pixels[p + 1], pixels[p + 2]);
        if (darkBackground
          ? high < 40 && high - low < 25
          : low > 180 && high - low < 45) queue[tail++] = index;
      }
      // Only remove light pixels connected to the frame boundary, preserving
      // isolated highlights such as teeth, eyes and glasses inside the portrait.
      for (let x = 0; x < width; x++) {
        visit(x);
        visit((height - 1) * width + x);
      }
      for (let y = 0; y < height; y++) {
        visit(y * width);
        visit(y * width + width - 1);
      }
      while (head < tail) {
        const index = queue[head++];
        const x = index % width;
        if (x > 0) visit(index - 1);
        if (x < width - 1) visit(index + 1);
        if (index >= width) visit(index - width);
        if (index < width * (height - 1)) visit(index + width);
      }
      for (let i = 0; i < tail; i++) {
        const p = queue[i] * 4;
        const low = Math.min(pixels[p], pixels[p + 1], pixels[p + 2]);
        const high = Math.max(pixels[p], pixels[p + 1], pixels[p + 2]);
        const alpha = Math.max(0, Math.min(1,
          darkBackground ? (high - 4) / 36 : (245 - low) / 65));
        pixels[p + 3] = Math.round(alpha * 255);
        if (alpha > 0) {
          for (let channel = 0; channel < 3; channel++) {
            pixels[p + channel] = Math.max(0,
              (pixels[p + channel] - (darkBackground ? 0 : 255) * (1 - alpha)) / alpha);
          }
        }
      }
      if (loopFrame) {
        if (blendStart === null) blendStart = video.currentTime;
        const progress = Math.min(1, Math.max(0,
          (video.currentTime - blendStart) / blendDuration));
        const weight = progress * progress * (3 - 2 * progress);
        const old = loopFrame.data;
        // Blend after background removal, using premultiplied alpha so hair
        // edges do not briefly turn dark or reveal an opaque rectangle.
        for (let p = 0; p < pixels.length; p += 4) {
          const a = old[p + 3] / 255 * (1 - weight);
          const b = pixels[p + 3] / 255 * weight;
          const alpha = a + b;
          for (let channel = 0; channel < 3; channel++) {
            pixels[p + channel] = alpha > 0
              ? (old[p + channel] * a + pixels[p + channel] * b) / alpha : 0;
          }
          pixels[p + 3] = alpha * 255;
        }
        if (progress === 1) loopFrame = null;
      }
      context.putImageData(frame, 0, 0);
      stage.classList.add('is-ready');
      if (reducedMotion.matches) video.pause();
    } catch {
      // Keep the transparent still image if decoding or canvas processing fails.
      failed = true;
      video.pause();
      stage.classList.remove('is-ready');
    }
  }

  let scheduled = false;
  function schedule() {
    if (scheduled || video.paused || failed) return;
    scheduled = true;
    if ('requestVideoFrameCallback' in video) video.requestVideoFrameCallback(tick);
    else requestAnimationFrame(tick);
  }
  function tick() {
    scheduled = false;
    if (!document.hidden && video.currentTime !== previousTime) {
      previousTime = video.currentTime;
      render();
    }
    schedule();
  }
  video.addEventListener('play', schedule);
  video.addEventListener('loadeddata', render);
  video.addEventListener('seeked', () => {
    render();
    schedule();
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) video.pause();
    else video.play().catch(() => {});
  });
  render();
  schedule();
})();
