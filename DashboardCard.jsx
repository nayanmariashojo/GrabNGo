/**
 * DashboardCard — statistics card for dashboard overview.
 * @param {string} title — stat label
 * @param {string|number} value — stat value
 * @param {string} icon — emoji icon
 * @param {string} color — tailwind color scheme key
 * @param {string} subtitle — optional sub-text
 * @param {function} onClick — optional click handler (makes card selectable)
 * @param {boolean} active — optional active state styling when selectable
 */
export default function DashboardCard({
  title,
  value,
  icon = '📊',
  color = 'indigo',
  subtitle,
  onClick,
  active = false,
}) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
  };

  const iconBgColors = {
    indigo: 'bg-indigo-100',
    green: 'bg-green-100',
    blue: 'bg-blue-100',
    yellow: 'bg-yellow-100',
    red: 'bg-red-100',
    purple: 'bg-purple-100',
    orange: 'bg-orange-100',
  };

  const clickable = typeof onClick === 'function';
  const baseClass = `rounded-xl border p-5 ${colors[color] || colors.indigo} transition-shadow`;
  const interactiveClass = clickable
    ? `hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
        active ? 'ring-2 ring-indigo-500 shadow-md' : ''
      }`
    : 'hover:shadow-md';

  const content = (
    <>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
          {subtitle && <p className="mt-1 text-xs opacity-60">{subtitle}</p>}
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-lg text-2xl ${
            iconBgColors[color] || iconBgColors.indigo
          }`}
        >
          {icon}
        </div>
      </div>
    </>
  );

  if (clickable) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={`${baseClass} ${interactiveClass} text-left w-full`}
      >
        {content}
      </button>
    );
  }

  return <div className={`${baseClass} ${interactiveClass}`}>{content}</div>;
}


