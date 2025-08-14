/**
 * Utility function to scroll to top of the page
 * Uses multiple methods for better browser compatibility
 */
export const scrollToTop = () => {
  // Method 1: window.scrollTo
  window.scrollTo(0, 0);
  
  // Method 2: document.documentElement.scrollTop
  if (document.documentElement) {
    document.documentElement.scrollTop = 0;
  }
  
  // Method 3: document.body.scrollTop
  if (document.body) {
    document.body.scrollTop = 0;
  }
  
  // Method 4: Use requestAnimationFrame for better timing
  requestAnimationFrame(() => {
    window.scrollTo(0, 0);
  });
};

/**
 * Scroll to top with smooth behavior
 */
export const scrollToTopSmooth = () => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: 'smooth'
  });
}; 