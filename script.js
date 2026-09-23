/**
 * AcceleratorX - UPSC Landing Page Interactivity
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. 3D TOPPER CAROUSEL AUTO-SWIPE & INTERACTION
  // ==========================================
  const carousel = document.getElementById('topperCarousel');
  const cards = document.querySelectorAll('.topper-card-item');
  const dots = document.querySelectorAll('#carouselDots .c-dot');
  let activeIndex = 1; // Card 1 (Vikramaditya) center by default
  let autoSwipeTimer = null;

  function updateCarousel(newActive) {
    if (!cards || cards.length === 0) return;
    activeIndex = (newActive + cards.length) % cards.length;
    const prevIndex = (activeIndex - 1 + cards.length) % cards.length;
    const nextIndex = (activeIndex + 1) % cards.length;

    cards.forEach((card, i) => {
      card.classList.remove('pos-center', 'pos-left', 'pos-right', 'pos-hidden');
      if (i === activeIndex) {
        card.classList.add('pos-center');
      } else if (i === prevIndex) {
        card.classList.add('pos-left');
      } else if (i === nextIndex) {
        card.classList.add('pos-right');
      } else {
        card.classList.add('pos-hidden');
      }
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === activeIndex);
    });
  }

  function startAutoSwipe() {
    stopAutoSwipe();
    autoSwipeTimer = setInterval(() => {
      updateCarousel(activeIndex + 1);
    }, 2200);
  }

  function stopAutoSwipe() {
    if (autoSwipeTimer) {
      clearInterval(autoSwipeTimer);
      autoSwipeTimer = null;
    }
  }

  // Interactive card clicks
  cards.forEach((card) => {
    card.addEventListener('click', () => {
      const idx = parseInt(card.getAttribute('data-index'), 10);
      if (idx !== activeIndex) {
        updateCarousel(idx);
        startAutoSwipe();
      }
    });
  });

  // Interactive dot clicks
  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.getAttribute('data-index'), 10);
      updateCarousel(idx);
      startAutoSwipe();
    });
  });

  // Pause on hover
  if (carousel) {
    carousel.addEventListener('mouseenter', stopAutoSwipe);
    carousel.addEventListener('mouseleave', startAutoSwipe);

    // Touch swipe support for mobile
    let touchStartX = 0;
    carousel.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      stopAutoSwipe();
    }, { passive: true });

    carousel.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      if (touchStartX - touchEndX > 45) {
        updateCarousel(activeIndex + 1); // Swipe left -> next
      } else if (touchEndX - touchStartX > 45) {
        updateCarousel(activeIndex - 1); // Swipe right -> prev
      }
      startAutoSwipe();
    }, { passive: true });
  }

  // Initial state & start
  updateCarousel(1);
  startAutoSwipe();

  // ==========================================
  // 2. FAQ ACCORDION INTERACTION
  // ==========================================
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach((item) => {
    const questionBtn = item.querySelector('.faq-question');
    questionBtn.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Close all other items
      faqItems.forEach((other) => {
        if (other !== item) other.classList.remove('active');
      });

      // Toggle clicked item
      item.classList.toggle('active', !isActive);
    });
  });

  // Open first FAQ by default
  if (faqItems.length > 0) {
    faqItems[0].classList.add('active');
  }

  // ==========================================
  // 3. CATEGORY SWITCHER TOGGLE
  // ==========================================
  const switcherTabs = document.querySelectorAll('.switcher-tab');
  switcherTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      switcherTabs.forEach((t) => {
        t.classList.remove('active');
        t.classList.add('inactive');
      });
      tab.classList.remove('inactive');
      tab.classList.add('active');
    });
  });

  // ==========================================
  // 4. SMOOTH SCROLL FOR ALL ANCHORS
  // ==========================================
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // ==========================================
  // 5. DYNAMIC AUDIO WAVEFORM RANDOMIZER
  // ==========================================
  const waveBars = document.querySelectorAll('.waveform-bars .bar');
  if (waveBars.length > 0) {
    setInterval(() => {
      waveBars.forEach((bar) => {
        const randomHeight = Math.floor(Math.random() * 26) + 14;
        bar.style.height = `${randomHeight}px`;
      });
    }, 300);
  }

  // ==========================================
  // 6. DAF CARD 3D IMAGES - DYNAMIC BACKGROUND REMOVAL
  // ==========================================
  const dafImages = document.querySelectorAll('.daf-3d-img');
  dafImages.forEach((img) => {
    function removeBg() {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        if (!w || !h) return;

        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);

        const imgData = ctx.getImageData(0, 0, w, h);
        const d = imgData.data;

        // Sample background from the 4 outer corner points
        const corners = [
          [2, 2], [w - 3, 2], [2, h - 3], [w - 3, h - 3],
          [Math.floor(w / 2), 2], [2, Math.floor(h / 2)], [w - 3, Math.floor(h / 2)]
        ];
        let totalR = 0, totalG = 0, totalB = 0, count = 0;
        corners.forEach(([x, y]) => {
          const idx = (y * w + x) * 4;
          totalR += d[idx];
          totalG += d[idx + 1];
          totalB += d[idx + 2];
          count++;
        });
        const bgR = totalR / count;
        const bgG = totalG / count;
        const bgB = totalB / count;

        // BFS flood-fill from border pixels to isolate the outer background
        // and prevent modifying any white/light details inside the 3D subject
        const visited = new Uint8Array(w * h);
        const queue = [];

        function isBg(idx) {
          const r = d[idx];
          const g = d[idx + 1];
          const b = d[idx + 2];
          const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
          const isNearWhite = (r > 230 && g > 230 && b > 230);
          return dist < 42 || isNearWhite;
        }

        for (let x = 0; x < w; x++) {
          queue.push(x, 0);
          visited[x] = 1;
          const btm = (h - 1) * w + x;
          queue.push(x, h - 1);
          visited[btm] = 1;
        }
        for (let y = 0; y < h; y++) {
          const left = y * w;
          if (!visited[left]) {
            queue.push(0, y);
            visited[left] = 1;
          }
          const right = y * w + (w - 1);
          if (!visited[right]) {
            queue.push(w - 1, y);
            visited[right] = 1;
          }
        }

        let head = 0;
        while (head < queue.length) {
          const cx = queue[head++];
          const cy = queue[head++];
          const pIdx = (cy * w + cx) * 4;

          if (isBg(pIdx)) {
            d[pIdx + 3] = 0; // Transparent

            const neighbors = [
              [cx + 1, cy], [cx - 1, cy],
              [cx, cy + 1], [cx, cy - 1]
            ];
            for (let i = 0; i < 4; i++) {
              const nx = neighbors[i][0];
              const ny = neighbors[i][1];
              if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                const nPos = ny * w + nx;
                if (!visited[nPos]) {
                  visited[nPos] = 1;
                  const nIdx = nPos * 4;
                  if (isBg(nIdx)) {
                    queue.push(nx, ny);
                  }
                }
              }
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        img.src = canvas.toDataURL('image/png');
        img.style.mixBlendMode = 'normal';
      } catch (err) {
        // Fallback gracefully to CSS multiply blend
        console.warn('Canvas background removal skipped:', err);
      }
    }

    if (img.complete && img.naturalWidth !== 0) {
      removeBg();
    } else {
      img.addEventListener('load', removeBg, { once: true });
    }
  });

  // ==========================================
  // 7. REMOVE DRAWN BORDER LINE FROM BUILDING WATERMARKS
  // ==========================================
  const watermarks = document.querySelectorAll('.exam-card-watermark');
  watermarks.forEach((wm) => {
    const bgMatch = wm.style.backgroundImage.match(/url\(['"]?(.*?)['"]?\)/);
    if (!bgMatch) return;
    const src = bgMatch[1];
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const w = img.naturalWidth || 1024;
        const h = img.naturalHeight || 1024;
        canvas.width = w;
        canvas.height = h;

        // Crop 72px inset from edges to bypass drawn border lines
        const inset = Math.round(w * 0.075);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(
          img,
          inset, inset, w - inset * 2, h - inset * 2,
          0, 0, w, h
        );

        wm.style.backgroundImage = `url(${canvas.toDataURL('image/jpeg', 0.94)})`;
      } catch (err) {
        console.warn('Canvas watermark line crop fallback:', err);
      }
    };
    img.src = src;
  });
});
