/**
 * Utility functions for sharing and referral system
 */

export interface ShareData {
  title: string;
  text: string;
  url: string;
}

/**
 * Check if the Web Share API is supported
 */
export const isWebShareSupported = (): boolean => {
  return typeof navigator !== 'undefined' && 'share' in navigator;
};

/**
 * Check if the app is running as a PWA (installed to home screen)
 */
export const isPWA = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true ||
         document.referrer.includes('android-app://');
};

/**
 * Share content using native Web Share API or fallback to clipboard
 */
export const shareContent = async (shareData: ShareData): Promise<{ success: boolean; method: 'native' | 'clipboard'; error?: string }> => {
  // Try native sharing first (PWA/mobile)
  if (isWebShareSupported()) {
    try {
      await navigator.share(shareData);
      return { success: true, method: 'native' };
    } catch (error: any) {
      // User cancelled sharing or error occurred
      if (error.name === 'AbortError') {
        return { success: false, method: 'native', error: 'User cancelled sharing' };
      }
      console.warn('Native sharing failed, falling back to clipboard:', error);
    }
  }

  // Fallback to clipboard API
  try {
    await navigator.clipboard.writeText(shareData.url);
    return { success: true, method: 'clipboard' };
  } catch (error) {
    // Final fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = shareData.url;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return { success: true, method: 'clipboard' };
    } catch (fallbackError) {
      return { success: false, method: 'clipboard', error: 'Could not copy to clipboard' };
    }
  }
};

/**
 * Get referral share data
 */
export const getReferralShareData = (userName?: string): ShareData => {
  const appUrl = 'https://sparkleproapp.com';
  const defaultText = 'Check out SparklePro - the best professional cleaning service in UAE! 🧽✨';
  const personalizedText = userName 
    ? `${userName} invited you to try SparklePro - the best professional cleaning service in UAE! 🧽✨`
    : defaultText;

  return {
    title: 'SparklePro - Professional Cleaning Services',
    text: personalizedText,
    url: appUrl
  };
};

/**
 * Handle referral sharing with appropriate feedback
 */
export const handleReferralShare = async (
  userName?: string,
  onSuccess?: (method: 'native' | 'clipboard') => void,
  onError?: (error: string) => void
): Promise<void> => {
  const shareData = getReferralShareData(userName);
  const result = await shareContent(shareData);
  
  if (result.success) {
    onSuccess?.(result.method);
  } else if (result.error) {
    onError?.(result.error);
  }
};
