import { CATEGORY_ICONS } from "../constants/categories";

interface SpiderGraphProps {
  categoryScores: Record<string, number>;
  completedCategories: string[];
}

export function SpiderGraph({ categoryScores, completedCategories }: SpiderGraphProps) {
  // Only show completed categories
  const completedScores = Object.entries(categoryScores).filter(([category]) => 
    completedCategories.includes(category)
  );

  if (completedScores.length === 0) {
    return null;
  }

  const numCategories = completedScores.length;
  const centerX = 250;
  const centerY = 250;
  const maxRadius = 150;
  const levels = 5; // Number of concentric circles (representing scores 2, 4, 6, 8, 10)

  // Calculate points for the spider web
  const getPoint = (angle: number, radius: number) => {
    const radian = (angle - 90) * (Math.PI / 180);
    return {
      x: centerX + radius * Math.cos(radian),
      y: centerY + radius * Math.sin(radian),
    };
  };

  // Create the polygon path for the data
  const createDataPath = () => {
    return completedScores
      .map(([category, score], index) => {
        const angle = (360 / numCategories) * index;
        const radius = (score / 10) * maxRadius;
        const point = getPoint(angle, radius);
        return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
      })
      .join(' ') + ' Z';
  };

  return (
    <div style={{ 
      background: 'rgba(255,255,255,0.9)',
      borderRadius: 24,
      padding: '32px 24px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      marginBottom: 24,
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#6A3ABF' }}>
          Life Areas Overview
        </h3>
        <p style={{ margin: '8px 0 0', fontSize: 14, color: '#6b7280' }}>
          Your current satisfaction across {completedScores.length} life areas
        </p>
      </div>

      {/* SVG Spider Graph */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <svg width="500" height="500" viewBox="0 0 500 500" style={{ maxWidth: '100%', height: 'auto' }}>
          {/* Draw concentric circles (web levels) */}
          {Array.from({ length: levels }).map((_, i) => {
            const radius = ((i + 1) / levels) * maxRadius;
            return (
              <circle
                key={`level-${i}`}
                cx={centerX}
                cy={centerY}
                r={radius}
                fill="none"
                stroke="rgba(106, 58, 191, 0.1)"
                strokeWidth="1"
              />
            );
          })}

          {/* Draw axis lines from center to each category */}
          {completedScores.map(([category], index) => {
            const angle = (360 / numCategories) * index;
            const point = getPoint(angle, maxRadius);
            return (
              <line
                key={`axis-${category}`}
                x1={centerX}
                y1={centerY}
                x2={point.x}
                y2={point.y}
                stroke="rgba(106, 58, 191, 0.15)"
                strokeWidth="1"
              />
            );
          })}

          {/* Draw the data polygon */}
          <path
            d={createDataPath()}
            fill="rgba(106, 58, 191, 0.2)"
            stroke="#6A3ABF"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Draw data points */}
          {completedScores.map(([category, score], index) => {
            const angle = (360 / numCategories) * index;
            const radius = (score / 10) * maxRadius;
            const point = getPoint(angle, radius);
            return (
              <circle
                key={`point-${category}`}
                cx={point.x}
                cy={point.y}
                r="6"
                fill="#6A3ABF"
                stroke="white"
                strokeWidth="2"
              />
            );
          })}

          {/* Draw category labels */}
          {completedScores.map(([category, score], index) => {
            const angle = (360 / numCategories) * index;
            const labelRadius = maxRadius + 60;
            const point = getPoint(angle, labelRadius);
            const icon = CATEGORY_ICONS[category] || '📊';
            
            return (
              <g key={`label-${category}`}>
                {/* Icon */}
                <text
                  x={point.x}
                  y={point.y - 10}
                  textAnchor="middle"
                  fontSize="20"
                >
                  {icon}
                </text>
                {/* Category name */}
                <text
                  x={point.x}
                  y={point.y + 10}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="600"
                  fill="#6A3ABF"
                >
                  {category}
                </text>
                {/* Score */}
                <text
                  x={point.x}
                  y={point.y + 24}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#8A4EF0"
                  fontWeight="500"
                >
                  {score.toFixed(1)}/10
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: 24,
        fontSize: 12,
        color: '#6b7280',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
          <span>0-3: Needs Attention</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }} />
          <span>4-6: Room to Grow</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }} />
          <span>7-10: Thriving</span>
        </div>
      </div>
    </div>
  );
}





