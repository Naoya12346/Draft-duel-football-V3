import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { ClipPath, Defs, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { teamColors } from '../data/playerDB';
import { flagEmoji } from '../utils/gameLogic';
import { F } from '../theme';

const SHIELD = 'M12 1L22 4V14C22 21 17 25 12 27 7 25 2 21 2 14V4Z';

/**
 * National teams render as an emoji flag, clubs as a coloured crest.
 * (Intentionally NOT used inside the draft spin reel.)
 */
export default function TeamBadge({ code, size = 26, style }) {
  if (!code) return null;
  if (code.length <= 2) {
    return (
      <View style={[styles.flagWrap, { width: size, height: size }, style]}>
        <Text style={{ fontSize: size * 0.82 }}>{flagEmoji(code)}</Text>
      </View>
    );
  }
  const [primary, secondary, striped] = teamColors(code);
  const width = size * (24 / 28);
  return (
    <View style={style}>
      <Svg width={width} height={size} viewBox="0 0 24 28">
        <Defs>
          <ClipPath id={`shield-${code}`}>
            <Path d={SHIELD} />
          </ClipPath>
        </Defs>
        <G clipPath={`url(#shield-${code})`}>
          <Rect width="24" height="28" fill={primary} />
          {striped ? (
            [4, 12, 20].map((x) => (
              <Rect key={x} x={x - 2} width="4" height="28" fill={secondary} />
            ))
          ) : (
            <Rect x="12" width="12" height="28" fill={secondary} />
          )}
          <Path d="M0 0H24V9C14 12 8 12 0 9Z" fill="#fff" opacity={0.18} />
        </G>
        <Path d={SHIELD} fill="none" stroke="#f5d06a" strokeWidth="1.6" />
        <SvgText
          x="12"
          y="17.5"
          textAnchor="middle"
          fontFamily={F.extra}
          fontSize="8.5"
          fill="#fff"
          stroke="#000"
          strokeWidth="1.6"
          paintOrder="stroke"
        >
          {code}
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  flagWrap: { alignItems: 'center', justifyContent: 'center' },
});
