import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { F, M3 } from '../theme';

/** Local vector flag/crest marks — no network requests at runtime. */
const NAMES = {
  germany: 'DE', deutschland: 'DE', france: 'FR', italy: 'IT', italia: 'IT',
  spain: 'ES', espana: 'ES', england: 'ENG', scotland: 'SCO', wales: 'WAL',
  netherlands: 'NL', holland: 'NL', belgium: 'BE', portugal: 'PT', brazil: 'BR',
  argentina: 'AR', uruguay: 'UY', colombia: 'CO', chile: 'CL', mexico: 'MX',
  usa: 'US', 'united states': 'US', canada: 'CA', japan: 'JP', 'south korea': 'KR',
  korea: 'KR', china: 'CN', india: 'IN', australia: 'AU', switzerland: 'CH',
  austria: 'AT', denmark: 'DK', sweden: 'SE', norway: 'NO', finland: 'FI',
  poland: 'PL', croatia: 'HR', serbia: 'RS', greece: 'GR', turkey: 'TR',
  russia: 'RU', ukraine: 'UA', nigeria: 'NG', ghana: 'GH', egypt: 'EG',
  morocco: 'MA', 'south africa': 'ZA', iran: 'IR', jamaica: 'JM',
};

const CLUBS = {
  BAY: ['#dc052d', 'FCB'], MUN: ['#dc052d', 'MU'], LIV: ['#c8102e', 'LIV'],
  ARS: ['#ef0107', 'ARS'], CHE: ['#034694', 'CHE'], CIT: ['#6cabdd', 'MCI'],
  TOT: ['#1890ff', 'TH'], BAR: ['#a50044', 'FCB'], RMA: ['#febe10', 'RMA'],
  ATM: ['#cb3524', 'ATM', '#ffffff'], PSG: ['#004170', 'PSG'],
  JUV: ['#000000', 'JUV', '#ffffff'], MIL: ['#fb090b', 'MIL'],
  INT: ['#0068a8', 'INT'], DOR: ['#fde100', 'BVB', '#000000'],
};

export function countryCode(teamName, code) {
  if (code && code.length === 2) return code.toUpperCase();
  if (code && ['ENG', 'SCO', 'WAL'].includes(String(code).toUpperCase())) return code.toUpperCase();
  const key = String(teamName || '').trim().toLowerCase();
  return NAMES[key] || 'XX';
}

export function isClubCode(code) {
  return !!code && String(code).length === 3 && !['ENG', 'SCO', 'WAL'].includes(String(code).toUpperCase());
}

export function FlagMark({ code, teamName, width = 26 }) {
  const iso = countryCode(teamName, code);
  const h = width * 0.68;
  const r = width * 0.12;
  const stripes = {
    DE: ['#000000', '#dd0000', '#ffce00'], FR: ['#002395', '#ffffff', '#ed2939'],
    IT: ['#009246', '#ffffff', '#ce2b37'], ES: ['#aa151b', '#f1bf00', '#aa151b'],
    BR: ['#009c3b', '#ffdf00', '#002776'], AR: ['#75aadb', '#ffffff', '#75aadb'],
    PT: ['#006600', '#ff0000'], NL: ['#ae1c28', '#ffffff', '#21468b'],
    BE: ['#000000', '#ffff00', '#ef4135'], CH: ['#da291c', '#ffffff', '#da291c'],
    AT: ['#ed2939', '#ffffff', '#ed2939'], MX: ['#006847', '#ffffff', '#ce1126'],
    US: ['#b31942', '#ffffff', '#0a3161'], CA: ['#ff0000', '#ffffff', '#ff0000'],
    JP: ['#ffffff', '#bc002d'], KR: ['#ffffff', '#cd2e3a'], CN: ['#de2910', '#ffde00'],
    NG: ['#008753', '#ffffff', '#008753'], GH: ['#ce1126', '#fcd116', '#006b3f'],
    RU: ['#ffffff', '#0039a6', '#d52b1e'], UA: ['#0057b7', '#ffd700'],
  };

  let content = (
    <Rect x={0} y={0} width={width} height={h} rx={r} fill={M3.color.surfaceContainerHighest} />
  );
  if (stripes[iso]) {
    const n = stripes[iso].length;
    content = (
      <>
        {stripes[iso].map((color, i) => (
          <Rect key={i} x={(width / n) * i} y={0} width={width / n + 0.5} height={h} fill={color} />
        ))}
        <Rect x={0} y={0} width={width} height={h} rx={r} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
      </>
    );
  } else if (iso === 'ENG') {
    content = (
      <>
        <Rect width={width} height={h} rx={r} fill="#ffffff" />
        <Path d={`M ${width / 2} 0 V ${h} M 0 ${h / 2} H ${width}`} stroke="#ce1124" strokeWidth={h * 0.2} />
      </>
    );
  } else if (iso === 'SCO') {
    content = (
      <>
        <Rect width={width} height={h} rx={r} fill="#0065bf" />
        <Path d={`M 0 ${h} L ${width} 0 M ${width} ${h} L 0 0`} stroke="#ffffff" strokeWidth={h * 0.18} />
      </>
    );
  } else if (iso === 'WAL') {
    content = (
      <>
        <Rect width={width} height={h} rx={r} fill="#ffffff" />
        <Path d={`M 0 ${h * 0.5} H ${width} M ${width * 0.3} ${h * 0.1} V ${h * 0.9} M ${width * 0.7} ${h * 0.1} V ${h * 0.9}`} stroke="#c8102e" strokeWidth={h * 0.12} />
      </>
    );
  }
  return (
    <Svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} accessible accessibilityLabel={`${iso} flag`}>
      {content}
    </Svg>
  );
}

export function CrestMark({ code, teamName, width = 22 }) {
  const raw = String(code || '').toUpperCase();
  const club = CLUBS[raw] || [M3.color.secondary, raw.slice(0, 3) || String(teamName || '?').slice(0, 2).toUpperCase(), '#ffffff'];
  const [bg, label, fg = '#ffffff'] = club;
  const h = width * 1.12;
  return (
    <View style={{ width, height: h }} accessible accessibilityLabel={`${raw} crest`}>
      <Svg width={width} height={h} viewBox="0 0 40 46" style={StyleSheet.absoluteFill}>
        <Path d="M3 3 L37 3 L37 31 L20 44 L3 31 Z" fill={bg} stroke={fg} strokeWidth="2" />
        <Rect x={7} y={10} width={26} height={16} rx={2} fill="rgba(0,0,0,0.18)" />
      </Svg>
      <View style={styles.crestLabel}>
        <Text style={[styles.crestText, { color: fg, fontSize: width * 0.34 }]}>{String(label).slice(0, 3)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  crestLabel: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', paddingTop: 1 },
  crestText: { fontFamily: F.extra, letterSpacing: -0.5 },
});
