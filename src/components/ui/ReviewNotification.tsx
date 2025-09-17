import React, { useState } from 'react';
import { XMarkIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/OptimizedAuthContext';
import { CreateReviewData } from '../../types/review';
import Button from './Button';

interface ReviewNotificationProps {
  bookingId: number;
  customerName: string;
  onClose: () => void;
  onSubmitted: () => void;
}

const ReviewNotification: React.FC<ReviewNotificationProps> = ({
  bookingId,
  customerName,
  onClose,
  onSubmitted
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'rating' | 'feedback'>('rating');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const handleStarClick = (starValue: number) => {
    setRating(starValue);
    // Auto-advance to feedback step after selecting rating
    setTimeout(() => {
      setStep('feedback');
    }, 500);
  };

  const handleSubmit = async () => {
    if (rating === 0 || !user) return;

    setIsSubmitting(true);
    try {
      const reviewData = {
        booking_id: bookingId,
        customer_id: user.id,
        rating,
        comment: comment.trim() || null
      };

      const { error } = await supabase
        .from('reviews')
        .insert(reviewData);

      if (error) throw error;

      // Success feedback
      setIsVisible(false);
      setTimeout(() => {
        onSubmitted();
      }, 300);
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Error submitting review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className={`w-full max-w-md max-h-[85vh] bg-white rounded-3xl shadow-2xl transform transition-all duration-300 overflow-hidden ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <div className="p-6 max-h-[85vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {step === 'rating' ? 'How did you like our service?' : 'Tell us more'}
              </h3>
              <p className="text-sm text-gray-600">
                {step === 'rating' 
                  ? `Hi ${customerName}, please rate your cleaning experience`
                  : rating >= 4 
                    ? 'What did we do well? (Optional)'
                    : 'What can we improve?'
                }
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {step === 'rating' && (
            <>
              {/* Star Rating */}
              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleStarClick(star)}
                    className="p-2 transition-transform hover:scale-110"
                  >
                    {star <= rating ? (
                      <StarIconSolid className="w-12 h-12 text-yellow-400" />
                    ) : (
                      <StarIcon className="w-12 h-12 text-gray-300 hover:text-yellow-400" />
                    )}
                  </button>
                ))}
              </div>

              {/* Rating Labels */}
              <div className="text-center">
                <p className="text-lg font-medium text-gray-700">
                  {rating === 0 && 'Tap a star to rate'}
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'}
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Very Good'}
                  {rating === 5 && 'Excellent'}
                </p>
              </div>
            </>
          )}

          {step === 'feedback' && (
            <>
              {/* Selected Rating Display */}
              <div className="flex justify-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIconSolid
                    key={star}
                    className={`w-6 h-6 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
                <span className="ml-2 text-lg font-medium text-gray-700">
                  {rating}/5 stars
                </span>
              </div>

              {/* Feedback Textarea */}
              <div className="mb-6">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    rating >= 4 
                      ? "What did our cleaners do well? Your feedback helps us maintain high quality service."
                      : "Please tell us what we can improve. Your feedback is important to us."
                  }
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none resize-none text-gray-700"
                  rows={4}
                  maxLength={500}
                />
                <div className="text-right text-sm text-gray-400 mt-1">
                  {comment.length}/500 characters
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="nav-back"
                  shape="organic"
                  size="md"
                  onClick={() => setStep('rating')}
                  className="!flex-1"
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  shape="bubble"
                  size="md"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="!flex-1"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </Button>
              </div>

              {/* Skip Option for High Ratings */}
              {rating >= 4 && (
                <div className="text-center mt-3">
                  <button
                    onClick={handleSubmit}
                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                    disabled={isSubmitting}
                  >
                    Skip feedback
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewNotification; 