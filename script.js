document.addEventListener('DOMContentLoaded', () => {
  // Select all progress bars, including variants
  const bars = document.querySelectorAll('.progress-bar, .progress-bar-men, .progress-bar-women');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const bar = entry.target;
      // Primary selector: any element with class starting with 'progress-fill'
      let fill = bar.querySelector('[class^="progress-fill"]');
      
      // Fallback selector if primary fails: any div with 'progress-fill' in class (broader match)
      if (!fill) {
        fill = bar.querySelector('div[class*="progress-fill"]');
      }
      
      const rightLabel = bar.querySelector('.progress-label');
      const progress = parseInt(bar.dataset.progress, 10);

      // Debugging logs – check these in the browser console!
      console.log('Bar class:', bar.className);
      console.log('Detected fill:', fill);  // Should be the <div> element; if null, that's the issue
      console.log('Progress value:', progress);

      if (!isNaN(progress)) {
        // Animate the bar fill
        if (fill) {
          fill.style.width = `${progress}%`;
        } else {
          console.warn('Fill not found for this bar!');  // This will log if selector fails
        }

        // Update the right label span
        if (rightLabel) {
          rightLabel.textContent = `${progress}${getOrdinalSuffix(progress)}`;
        }
      }

      // Stop observing this bar once it has animated
      observer.unobserve(bar);
    });
  }, { threshold: 0.1 });

  // Observe each bar
  bars.forEach(bar => observer.observe(bar));

  // --- Zoom detection block (unchanged) ---
  (function () {
    const scroller =
      document.querySelector('.snap-wrap') ||
      document.querySelector('.scroll-sections') ||
      document.scrollingElement ||
      document.documentElement;

    const EPS = 0.01;

    function isZoomed() {
      return window.visualViewport
        ? Math.abs(window.visualViewport.scale - 1) > EPS
        : false;
    }

    function syncZoomState() {
      scroller.classList.toggle('zoomed', isZoomed());
    }

    syncZoomState();

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', syncZoomState);
      window.visualViewport.addEventListener('scroll', syncZoomState);
    }

    window.addEventListener('resize', syncZoomState);
  })();
});

// Helper function for correct ordinal suffixes (e.g., 52nd, 1st, 3rd, 89th)
function getOrdinalSuffix(n) {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}