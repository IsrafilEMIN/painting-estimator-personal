// src/constants/paintTypes.ts
export const paintGroups = [
  {
    subTitle: 'Sherwin Williams',
    fields: [
      { key: 'sherwinWilliamsCaptivate', label: 'Sherwin Williams Captivate' },
      { key: 'sherwinWilliamsCashmere', label: 'Sherwin Williams Cashmere' },
      { key: 'sherwinWilliamsDuration', label: 'Sherwin Williams Duration' },
      { key: 'sherwinWilliamsEmerald', label: 'Sherwin Williams Emerald' },
      { key: 'sherwinWilliamsHarmony', label: 'Sherwin Williams Harmony' },
      { key: 'sherwinWilliamsProMar200', label: 'Sherwin Williams Pro Mar 200' },
      { key: 'sherwinWilliamsProMar400', label: 'Sherwin Williams Pro Mar 400' },
      { key: 'sherwinWilliamsSuperPaint', label: 'Sherwin Williams Super Paint' },
    ],
  },
  {
    subTitle: 'Benjamin Moore',
    fields: [
      { key: 'benjaminMooreAdvance', label: 'Benjamin Moore Advance' },
      { key: 'benjaminMooreAura', label: 'Benjamin Moore Aura' },
      { key: 'benjaminMooreBen', label: 'Benjamin Moore Ben' },
      { key: 'benjaminMooreRegal', label: 'Benjamin Moore Regal' },
      { key: 'benjaminMooreScuffX', label: 'Benjamin Moore Scuff X' },
      { key: 'benjaminMooreUltraSpec', label: 'Benjamin Moore Ultra Spec' },
    ],
  },
  {
    subTitle: 'Behr',
    fields: [
      { key: 'behrDynasty', label: 'Behr Dynasty' },
      { key: 'behrMarquee', label: 'Behr Marquee' },
      { key: 'behrPremiumPlus', label: 'Behr Premium Plus' },
      { key: 'behrUltra', label: 'Behr Ultra' },
    ],
  },
];

export const paintOptions = paintGroups.flatMap(group => group.fields);