import { useCart } from './CartContext';

const categoryGradients = {
  Breakfast: 'from-orange-400 to-amber-300',
  Lunch: 'from-green-400 to-emerald-300',
  Beverages: 'from-blue-400 to-cyan-300',
  Snacks: 'from-yellow-400 to-amber-200',
};

const categoryEmojis = {
  Breakfast: '🥞',
  Lunch: '🍛',
  Beverages: '☕',
  Snacks: '🍟',
};

/**
 * FoodCard — displays a menu item card with image placeholder, info, and add-to-cart.
 */
export default function FoodCard({ item, showAddToCart = true }) {
  const { items, addItem, removeItem } = useCart();

  const cartLine = items.find((i) => i.item_id === item.item_id);
  const quantity = cartLine?.quantity ?? 0;

  const gradient = categoryGradients[item.category] || 'from-gray-400 to-gray-300';
  const emoji = categoryEmojis[item.category] || '🍽️';

  return (
    <div className="group overflow-hidden rounded-xl bg-white shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-100">
      {/* Image placeholder */}
      <div className={`relative h-40 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        <span className="text-5xl opacity-80 group-hover:scale-110 transition-transform duration-200">
          {emoji}
        </span>

        {/* Availability badge */}
        <span
          className={`absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
            item.is_available
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {item.is_available ? 'Available' : 'Unavailable'}
        </span>
        {/* Category tag */}
        <span className="absolute bottom-2 left-2 rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium text-gray-700 backdrop-blur-sm">
          {item.category}
        </span>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="text-base font-semibold text-gray-900">{item.item_name}</h3>
        <p className="mt-1 text-xs text-gray-500 line-clamp-2">{item.description}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-bold text-indigo-600">₹{item.price}</span>
          {showAddToCart && (
            quantity > 0 ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => removeItem(item.item_id)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
                  aria-label={`Decrease ${item.item_name}`}
                >
                  −
                </button>
                <span className="w-8 text-center font-medium" aria-label={`${item.item_name} quantity`}>
                  {quantity}
                </span>
                <button
                  onClick={() => item.is_available && addItem(item)}
                  disabled={!item.is_available}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                    item.is_available
                      ? 'border-gray-300 text-gray-600 hover:bg-gray-100'
                      : 'border-gray-200 text-gray-300 cursor-not-allowed'
                  }`}
                  aria-label={`Increase ${item.item_name}`}
                >
                  +
                </button>
              </div>
            ) : (
              <button
                onClick={() => item.is_available && addItem(item)}
                disabled={!item.is_available}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  item.is_available
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {item.is_available ? '+ Add to Cart' : 'Sold Out'}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}


