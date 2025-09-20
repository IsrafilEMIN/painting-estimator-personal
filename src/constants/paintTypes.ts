// src/constants/paintTypes.ts
export const paintGroups = [
  {
    subTitle: 'Paint Quality',
    fields: [
      { key: 'standard', label: 'Standard' },
      { key: 'better', label: 'Better' },
      { key: 'premium', label: 'Premium' },
    ],
  },
];

export const paintOptions = paintGroups.flatMap(group => group.fields);

// Note: paintStructure is no longer needed for the simplified version, but keeping a minimal version for potential other uses
export const paintStructure = [
  {
    brand: 'Paint Quality',
    lines: [
      {
        name: 'Standard',
        sheens: [{ key: 'standard', label: 'Standard' }],
      },
      {
        name: 'Better',
        sheens: [{ key: 'better', label: 'Better' }],
      },
      {
        name: 'Premium',
        sheens: [{ key: 'premium', label: 'Premium' }],
      },
    ]
  },
];