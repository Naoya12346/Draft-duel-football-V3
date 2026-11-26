import React from 'react';
import Svg, { Circle, Line, Path, Polyline } from 'react-native-svg';

/**
 * Minimal stroke icon set (Lucide-style paths) used across the UI.
 */
export default function Icon({ name, size = 22, color = '#fff', strokeWidth = 2, fill = 'none' }) {
  const common = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    fill: 'none',
  };
  const body = () => {
    switch (name) {
      case 'close':
        return <Path d="M6 6l12 12M18 6L6 18" {...common} />;
      case 'check':
        return <Path d="M5 12.5l4.5 4.5L19 7.5" {...common} />;
      case 'chevronDown':
        return <Path d="M6 9l6 6 6-6" {...common} />;
      case 'chevronUp':
        return <Path d="M6 15l6-6 6 6" {...common} />;
      case 'settings':
        return (
          <>
            <Circle cx="12" cy="12" r="3" {...common} />
            <Path
              d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2 2 2 0 1 1-4 0 1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 4.6 15a2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 11 4.6a2 2 0 1 1 4 0 1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 19.4 11a2 2 0 1 1 0 4z"
              {...common}
            />
          </>
        );
      case 'teams':
        return (
          <>
            <Path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" {...common} />
            <Path d="M9 11h6M9 14h6" {...common} />
          </>
        );
      case 'modes':
        return (
          <>
            <Path d="M4 7h10M18 7h2M4 17h2M10 17h10" {...common} />
            <Circle cx="16" cy="7" r="2" {...common} />
            <Circle cx="8" cy="17" r="2" {...common} />
          </>
        );
      case 'whistle':
        return (
          <>
            <Path d="M8 4h8v5a4 4 0 0 1-8 0z" {...common} />
            <Path d="M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 13v4M8 21h8M9 17h6" {...common} />
          </>
        );
      case 'trophy':
        return (
          <>
            <Path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" {...common} />
            <Path d="M9 11h6M9 14h6" {...common} />
          </>
        );
      case 'play':
        return <Path d="M8 5l11 7-11 7z" fill={color} stroke="none" />;
      case 'refresh':
        return <Path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" {...common} />;
      case 'search':
        return (
          <>
            <Circle cx="11" cy="11" r="7" {...common} />
            <Line x1="16.5" y1="16.5" x2="21" y2="21" {...common} />
          </>
        );
      case 'trash':
        return (
          <>
            <Polyline points="3 6 5 6 21 6" {...common} />
            <Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" {...common} />
          </>
        );
      case 'edit':
        return (
          <>
            <Path d="M12 20h9" {...common} />
            <Path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" {...common} />
          </>
        );
      case 'upload':
        return (
          <>
            <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" {...common} />
            <Polyline points="17 8 12 3 7 8" {...common} />
            <Line x1="12" y1="3" x2="12" y2="15" {...common} />
          </>
        );
      case 'coin':
        return (
          <>
            <Circle cx="12" cy="12" r="9" {...common} />
            <Path d="M14.8 9.2c-.6-.8-1.6-1.2-2.8-1.2-1.6 0-2.8.8-2.8 2s1.2 1.7 2.8 2 2.8.8 2.8 2-1.2 2-2.8 2c-1.2 0-2.2-.4-2.8-1.2M12 6v2M12 16v2" {...common} />
          </>
        );
      case 'user':
        return (
          <>
            <Circle cx="9" cy="8" r="3.5" {...common} />
            <Path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.4c2 .7 3.5 2.6 3.5 5.6" {...common} />
          </>
        );
      case 'plus':
        return <Path d="M12 5v14M5 12h14" {...common} />;
      case 'minus':
        return <Path d="M5 12h14" {...common} />;
      case 'arrowLeft':
        return <Path d="M19 12H5M12 19l-7-7 7-7" {...common} />;
      case 'flag':
        return (
          <>
            <Path d="M4 21V4M4 4h11l-2 4 2 4H4" {...common} />
          </>
        );
      default:
        return <Circle cx="12" cy="12" r="9" {...common} />;
    }
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill}>
      {body()}
    </Svg>
  );
}
