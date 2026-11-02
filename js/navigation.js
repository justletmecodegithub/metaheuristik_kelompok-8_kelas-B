/**
 * NAVIGATION, SCROLL-SPY & INTERACTION HANDLERS
 * Mengelola navigasi slide, transisi fade, dan flowchart step inspector.
 */
(function() {
  window.MetaOpt = window.MetaOpt || {};

  function initNavigation() {
    const slides = Array.from(document.querySelectorAll('#presentationDeck .presentation-slide'));
    const progress = document.getElementById('deckProgress');
    const counter = document.getElementById('deckCounter');
    const previousButton = document.getElementById('previousSlide');
    const nextButton = document.getElementById('nextSlide');
    const hashTarget = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
    const linkedIndex = slides.findIndex(slide => slide === hashTarget || slide.contains(hashTarget));
    let activeIndex = linkedIndex >= 0 ? linkedIndex : 0;

    function showSlide(index) {
      if (index < 0 || index >= slides.length || index === activeIndex) return;

      if (slides[activeIndex].contains(document.activeElement)) document.activeElement.blur();
      slides[activeIndex].classList.remove('is-active');
      activeIndex = index;
      slides[activeIndex].scrollTop = 0;
      slides[activeIndex].classList.remove('is-active');
      void slides[activeIndex].offsetWidth;
      slides[activeIndex].classList.add('is-active');
      slides.forEach((slide, slideIndex) => {
        slide.setAttribute('aria-hidden', slideIndex === activeIndex ? 'false' : 'true');
      });

      if (counter) counter.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
      if (progress) progress.style.width = `${((activeIndex + 1) / slides.length) * 100}%`;
      if (previousButton) previousButton.disabled = activeIndex === 0;
      if (nextButton) nextButton.disabled = activeIndex === slides.length - 1;
      history.replaceState(null, '', `#${slides[activeIndex].id}`);
    }

    slides.forEach((slide, index) => {
      slide.classList.toggle('is-active', index === activeIndex);
      slide.setAttribute('aria-hidden', index === activeIndex ? 'false' : 'true');
    });

    if (counter) counter.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    if (progress) progress.style.width = `${(1 / slides.length) * 100}%`;
    if (previousButton) previousButton.disabled = true;
    if (nextButton) nextButton.disabled = slides.length < 2;

    preparePseudocode('ooaPseudocodeBlock');
    preparePseudocode('choaPseudocodeBlock');
    window.selectOoaStep(1);
    window.selectChoaStep(1);
    setupExplanationHighlights();

    if (previousButton) previousButton.addEventListener('click', () => showSlide(activeIndex - 1));
    if (nextButton) nextButton.addEventListener('click', () => showSlide(activeIndex + 1));

    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const target = document.getElementById(link.getAttribute('href').slice(1));
        const targetIndex = slides.indexOf(target?.closest('.presentation-slide'));
        if (targetIndex === -1) return;
        e.preventDefault();
        if (targetIndex === activeIndex) {
          target.scrollIntoView({ block: 'start', behavior: 'smooth' });
        } else {
          showSlide(targetIndex);
          if (target !== slides[targetIndex]) {
            window.setTimeout(() => target.scrollIntoView({ block: 'start', behavior: 'smooth' }), 450);
          }
        }
      });
    });

    document.querySelectorAll('.reference-card').forEach(card => {
      card.addEventListener('click', () => card.classList.add('is-selected'));
    });

    window.addEventListener('keydown', (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const target = e.target;
      if (target instanceof HTMLElement && (target.isContentEditable || /INPUT|SELECT|TEXTAREA/.test(target.tagName))) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        showSlide(activeIndex + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        showSlide(activeIndex - 1);
      }
    });
  }

  function setupExplanationHighlights() {
    document.querySelectorAll('.explanation-card').forEach(card => {
      card.addEventListener('click', () => {
        const selected = card.classList.toggle('is-selected');
        card.setAttribute('aria-pressed', String(selected));
      });

      card.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        card.click();
      });
    });
  }

  function preparePseudocode(blockId) {
    const block = document.getElementById(blockId);
    if (!block || block.dataset.prepared === 'true') return;

    const lines = block.textContent.split('\n');
    block.replaceChildren(...lines.map(line => {
      const lineElement = document.createElement('span');
      const match = line.match(/^\s*(\d+):/);
      lineElement.className = 'pseudocode-line';
      if (match) lineElement.dataset.codeLine = match[1];
      lineElement.textContent = line;
      return lineElement;
    }));
    block.dataset.prepared = 'true';
  }

  function highlightPseudocode(blockId, lineNumbers) {
    const block = document.getElementById(blockId);
    if (!block) return;

    const selectedLines = new Set(lineNumbers.map(String));
    block.querySelectorAll('.pseudocode-line').forEach(line => {
      line.classList.toggle('is-highlighted', selectedLines.has(line.dataset.codeLine));
    });

    const firstLine = block.querySelector('.pseudocode-line.is-highlighted');
    if (firstLine) firstLine.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  // --- Interactive Flowchart Step Inspector untuk OOA ---
  window.selectOoaStep = function(stepNum) {
    const descriptions = {
      1: '<strong>Tahap 1 - Identifikasi Posisi Ikan (Candidate Fish Set):</strong> Setiap osprey mengamati kawanan ikan di bawah permukaan air. Titik ikan dimodelkan oleh posisi osprey lain yang memiliki nilai fungsi objektif lebih baik: $$FP_i = \\{X_k \\mid f(X_k) < f(X_i)\\} \\cup \\{X^*\\}$$. Jika tidak ada agen yang lebih baik, solusi terbaik global $X^*$ secara otomatis dijadikan target referensi.',
      2: '<strong>Tahap 2 - Penyelaman dan Serangan (Diving & Hunting):</strong> Osprey menukik tajam ke arah ikan terpilih ($SF_i$) dengan faktor impuls stokastik $I \\in \\{1, 2\\}$: $$X_{i,j}^{P1} = X_{i,j} + r_1 \\cdot (SF_{i,j} - I \\cdot X_{i,j})$$. Nilai $I=2$ memberikan lompatan eksplorasi agresif untuk melompati cekungan jebakan lokal.',
      3: '<strong>Tahap 3 - Seleksi Elitis Pertama (Greedy Replacement):</strong> Posisi hasil selam $X_i^{P1}$ hanya akan menggantikan koordinat lama $X_i$ jika dan hanya jika menghasilkan biaya fungsi objektif yang lebih rendah: $f(X_i^{P1}) < f(X_i)$.',
      4: '<strong>Tahap 4 - Membawa Mangsa ke Pantai / Sarang (Shore Perch Relocation):</strong> Setelah menangkap ikan, osprey terbang menuju daratan untuk memangsa. Ruang pencarian lokal menyusut secara teredam seiring waktu: $$X_{i,j}^{P2} = X_{i,j} + \\frac{lb_j + r_2 \\cdot (ub_j - lb_j)}{t}$$, memusatkan eksploitasi di sekitar koordinat prima.',
      5: '<strong>Tahap 5 - Seleksi Elitis Kedua & Pembaruan Global:</strong> Posisi sarang diterima jika fitness membaik. Solusi terbaik populasi ($X^*$) diperbarui untuk generasi berikutnya.'
    };

    for (let i = 1; i <= 5; i++) {
      const el = document.getElementById(`ooa-flow-${i}`);
      if (el) {
        if (i === stepNum) {
          el.className = 'cursor-pointer p-space-sm rounded-lg bg-primary-fixed text-on-primary-fixed-variant border-l-4 border-primary transition-all';
        } else {
          el.className = 'cursor-pointer p-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high transition-all';
        }
      }
    }
    const codeLines = {
      1: [5, 6, 7],
      2: [8, 9, 10],
      3: [11],
      4: [13, 14, 15],
      5: [16, 17, 18, 19, 20]
    };
    highlightPseudocode('ooaPseudocodeBlock', codeLines[stepNum] || []);

    const box = document.getElementById('ooaStepDetailBox');
    if (box) {
      box.innerHTML = descriptions[stepNum];
      if (window.renderMathInElement) {
        window.renderMathInElement(box, {
          delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '$', right: '$', display: false}
          ]
        });
      }
    }
  };

  // --- Interactive Flowchart Step Inspector untuk ChOA ---
  window.selectChoaStep = function(stepNum) {
    const descriptions = {
      1: '<strong>Tahap 1 - Inisialisasi & Pembagian Peran Sosial:</strong> Populasi simpanse diurutkan berdasarkan nilai fitness untuk mengidentifikasi 4 pemimpin: $\\alpha$ (Attacker - Terbaik), $\\beta$ (Barrier - Kedua), $\\gamma$ (Chaser - Ketiga), dan $\\delta$ (Driver - Keempat).',
      2: '<strong>Tahap 2 - Perhitungan Vektor Pengurungan (Encirclement):</strong> Masing-masing agen menghitung perpindahan relatif terhadap 4 pemimpin dengan koefisien dinamis: $d_j = |c \\cdot X_j - m \\cdot X_i|$ dan $X_j\' = X_j - a \\cdot d_j$. Parameter $a$ menurun secara adaptif selama proses.',
      3: '<strong>Tahap 3 - Fusi Sentroid Sosial (Centroid Fusion):</strong> Posisi kandidat baru dihitung dari rata-rata kuadran ke-4 pemimpin: $$X_i(t+1) = \\frac{X_1 + X_2 + X_3 + X_4}{4}$$.',
      4: '<strong>Tahap 4 - Modulasi Chaotic Hunting Drive:</strong> Dengan probabilitas $p \\ge 0.5$, simpanse beralih ke peta deterministik chaos untuk menghasilkan perturbasi non-linear yang membebaskan agen dari titik stasioner prematur.',
      5: '<strong>Tahap 5 - Clamping & Pembaruan Hierarki Kasta:</strong> Batas ruang pencarian $[lb, ub]$ ditegakkan, fungsi objektif dievaluasi, dan ranking kasta sosial (Attacker, Barrier, Chaser, Driver) diperbarui.'
    };

    for (let i = 1; i <= 5; i++) {
      const el = document.getElementById(`choa-flow-${i}`);
      if (el) {
        if (i === stepNum) {
          el.className = 'cursor-pointer p-space-sm rounded-lg bg-secondary-container text-on-secondary-container border-l-4 border-secondary transition-all';
        } else {
          el.className = 'cursor-pointer p-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high transition-all';
        }
      }
    }
    const codeLines = {
      1: [1, 2],
      2: [4, 5, 6, 7, 8, 9, 10, 11],
      3: [12],
      4: [13, 14, 15, 16],
      5: [17, 18, 19, 20, 21, 22]
    };
    highlightPseudocode('choaPseudocodeBlock', codeLines[stepNum] || []);

    const box = document.getElementById('choaStepDetailBox');
    if (box) {
      box.innerHTML = descriptions[stepNum];
      if (window.renderMathInElement) {
        window.renderMathInElement(box, {
          delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '$', right: '$', display: false}
          ]
        });
      }
    }
  };

  // --- Salin Pseudocode ke Clipboard ---
  window.copyCodeToClipboard = function(elementId, buttonId) {
    const el = document.getElementById(elementId);
    const btn = document.getElementById(buttonId);
    if (!el || !btn) return;

    const codeText = el.innerText;
    navigator.clipboard.writeText(codeText).then(() => {
      const origContent = btn.innerHTML;
      btn.innerHTML = `<span class="material-symbols-outlined text-[14px]">check</span><span>Tersalin!</span>`;
      btn.classList.add('bg-green-700/30', 'text-green-300');
      setTimeout(() => {
        btn.innerHTML = origContent;
        btn.classList.remove('bg-green-700/30', 'text-green-300');
      }, 2000);
    }).catch(err => {
      console.error('Gagal menyalin:', err);
    });
  };

  document.addEventListener('DOMContentLoaded', initNavigation);
})();
