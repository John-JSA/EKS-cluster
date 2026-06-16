import { useState } from 'react';
import { Star, X } from 'lucide-react';
import api from '../api';

export default function RatingModal({ ride, onClose, onRated }) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  async function submit() {
    if (!selected) { setError('Please select a star rating'); return; }
    setLoading(true);
    try {
      await api.post(`/rides/${ride.id}/rate`, { rating: selected, comment });
      onRated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit rating');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Rate your ride</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <p className="text-gray-500 text-sm mb-6 text-center">
          How was your experience with this driver?
        </p>

        {/* Stars */}
        <div className="flex justify-center gap-2 mb-3">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setSelected(n)}
              className="transition-transform hover:scale-110"
            >
              <Star
                size={40}
                className={`transition-colors ${n <= (hovered || selected) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
              />
            </button>
          ))}
        </div>

        <p className="text-center text-sm font-semibold text-gray-600 h-5 mb-4">
          {labels[hovered || selected]}
        </p>

        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Leave a comment (optional)..."
          rows={3}
          className="input-field resize-none mb-4 text-sm"
        />

        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary py-2.5 text-sm">Skip</button>
          <button onClick={submit} disabled={loading || !selected} className="btn-primary py-2.5 text-sm">
            {loading ? 'Submitting...' : 'Submit Rating'}
          </button>
        </div>
      </div>
    </div>
  );
}
