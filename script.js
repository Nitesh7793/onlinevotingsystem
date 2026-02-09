 // ====== Slider Functionality ======
 const slider = document.getElementById('slider');
 const slides = slider.querySelectorAll('.slide');
 const slidesWrapper = slider.querySelector('.slides');
 const leftArrow = slider.querySelector('.arrow.left');
 const rightArrow = slider.querySelector('.arrow.right');
 const dotsContainer = slider.querySelector('.dots');
 let current = 0;
 let interval = null;
 const AUTO_DELAY = 4000; // 4 seconds

 // --- Create navigation dots dynamically ---
 slides.forEach((_, idx) => {
   const dot = document.createElement('div');
   dot.classList.add('dot');
   if (idx === 0) dot.classList.add('active');
   dot.addEventListener('click', () => goToSlide(idx));
   dotsContainer.appendChild(dot);
 });
 const dots = dotsContainer.querySelectorAll('.dot');

 // --- Show slide by index ---
 function goToSlide(idx) {
   slides[current].classList.remove('active');
   dots[current].classList.remove('active');
   current = (idx + slides.length) % slides.length;
   slides[current].classList.add('active');
   dots[current].classList.add('active');
   // Animate slides wrapper for a subtle parallax effect
   slidesWrapper.style.transform = `translateX(-${current * 100}%)`;
 }

 // --- Next/Prev Slide ---
 function nextSlide() { goToSlide(current + 1); }
 function prevSlide() { goToSlide(current - 1); }

 // --- Auto-play logic ---
 function startAutoPlay() {
   if (interval) clearInterval(interval);
   interval = setInterval(nextSlide, AUTO_DELAY);
 }
 function stopAutoPlay() {
   if (interval) clearInterval(interval);
 }

 // --- Pause on hover ---
 slider.addEventListener('mouseenter', stopAutoPlay);
 slider.addEventListener('mouseleave', startAutoPlay);

 // --- Arrow navigation ---
 leftArrow.addEventListener('click', prevSlide);
 rightArrow.addEventListener('click', nextSlide);

 // --- Responsive: Reset transform on resize ---
 window.addEventListener('resize', () => {
   slidesWrapper.style.transform = `translateX(-${current * 100}%)`;
 });

 // --- Start auto-play on load ---
 startAutoPlay();

 // --- Accessibility: Keyboard navigation ---
 slider.tabIndex = 0;
 slider.addEventListener('keydown', (e) => {
   if (e.key === 'ArrowLeft') prevSlide();
   if (e.key === 'ArrowRight') nextSlide();
 });


 
  // Show button after scrolling 100px
  window.onscroll = function () {
    const btn = document.getElementById("scrollToTopBtn");
    if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
      btn.style.display = "block";
    } else {
      btn.style.display = "none";
    }
  };

  // Scroll to top on click
  document.getElementById("scrollToTopBtn").onclick = function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  