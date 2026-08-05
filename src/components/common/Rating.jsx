import { useState } from 'react';

export default function Rating({ value = 0, onChange, readonly = false, size = 'md' }) {
  const [hover, setHover] = useState(0);
  const sz = size === 'lg' ? 'text-2xl' : 'text-lg';

  return (
    <div className={`flex gap-0.5 ${sz}`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hover || value);
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            className={`${filled ? 'text-status-pending' : 'text-text-secondary'} ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110 transition-transform'}`}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(0)}
            onClick={() => !readonly && onChange?.(star)}
            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
          >
            <i className={`${filled ? 'fas' : 'far'} fa-star`} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
