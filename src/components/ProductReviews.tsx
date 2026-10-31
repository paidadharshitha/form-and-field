import { useId } from 'react';
import { MessageSquare, Star } from 'lucide-react';
import type { ProductReview } from '../lib/catalogue';

const reviewDate = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

function displayDate(date: string): string {
  const timestamp = Date.parse(date);
  return Number.isFinite(timestamp)
    ? reviewDate.format(timestamp)
    : 'Date unavailable';
}

export function ProductReviews({
  reviews = [],
}: {
  reviews?: readonly ProductReview[];
}) {
  const id = useId();

  return (
    <section className="product-reviews" aria-labelledby={`${id}-title`}>
      <div className="reviews-heading">
        <h3 id={`${id}-title`}>Reviews</h3>
        <span>
          {reviews.length} sample {reviews.length === 1 ? 'review' : 'reviews'}
        </span>
      </div>
      <p className="reviews-context">
        Sample reviews from DummyJSON. The catalogue rating is provided
        separately.
      </p>
      {reviews.length === 0 ? (
        <div className="reviews-empty">
          <MessageSquare size={21} aria-hidden="true" />
          <p>No reviews are included for this product.</p>
        </div>
      ) : (
        <ul className="review-list">
          {reviews.map((review, index) => (
            <li
              className="review-item"
              key={`${review.reviewerName}-${review.date}-${index}`}
            >
              <div className="review-meta">
                <span className="review-author">{review.reviewerName}</span>
                <time dateTime={review.date}>{displayDate(review.date)}</time>
              </div>
              <span
                className="review-stars"
                role="img"
                aria-label={`${review.rating} out of 5 stars`}
              >
                {Array.from({ length: 5 }, (_, star) => (
                  <Star
                    key={star}
                    size={13}
                    fill={star < review.rating ? 'currentColor' : 'none'}
                    aria-hidden="true"
                  />
                ))}
              </span>
              <p className="review-comment">
                {review.comment.trim() || 'No written comment.'}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
