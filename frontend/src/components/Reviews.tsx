import React, { useState } from 'react';
import { Star, Send } from 'lucide-react';
import { REVIEWS } from '../data/mock';

interface ReviewsProps {
  targetId: string;
  targetType: 'item' | 'seller';
}

export default function Reviews({ targetId, targetType }: ReviewsProps) {
  const [reviews, setReviews] = useState(REVIEWS.filter(r => r.targetId === targetId && r.targetType === targetType));
  const [newReview, setNewReview] = useState('');
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.trim()) return;

    const review = {
      id: Math.random().toString(36).substring(7),
      targetId,
      targetType,
      author: 'You',
      authorId: 'user_current',
      rating,
      comment: newReview,
      date: new Date().toISOString(),
    };

    setReviews([review, ...reviews]);
    setNewReview('');
    setRating(5);
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="space-y-8">
      {/* Review Summary */}
      <div className="flex items-center gap-4">
        <div className="text-4xl font-semibold text-gray-900">{averageRating.toFixed(1)}</div>
        <div>
          <div className="flex items-center gap-1 mb-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.round(averageRating)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-gray-200 fill-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-500">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</p>
        </div>
      </div>

      {/* Add Review Form */}
      <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Write a Review</h3>
        
        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="focus:outline-none"
            >
              <Star
                className={`w-6 h-6 transition-colors ${
                  star <= (hoveredRating || rating)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-gray-300 fill-gray-300'
                }`}
              />
            </button>
          ))}
        </div>

        <div className="relative">
          <textarea
            value={newReview}
            onChange={(e) => setNewReview(e.target.value)}
            placeholder="Share your experience..."
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none min-h-[100px]"
          />
          <button
            type="submit"
            disabled={!newReview.trim()}
            className="absolute bottom-3 right-3 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-gray-500 text-sm py-4 text-center">No reviews yet. Be the first to review!</div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-medium text-sm">
                    {review.author.charAt(0)}
                  </div>
                  <span className="font-medium text-gray-900 text-sm">{review.author}</span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(review.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3 h-3 ${
                      star <= review.rating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-200 fill-gray-200'
                    }`}
                  />
                ))}
              </div>
              <p className="text-gray-600 text-sm">{review.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
