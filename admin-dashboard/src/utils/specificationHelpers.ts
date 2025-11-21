interface Specification {
  id: string;
  valueNumber?: number | null;
  valueText?: string | null;
  valueBool?: boolean | null;
  specificationType: {
    id: string;
    code: string;
    name: string;
    unit?: string;
    dataType: 'NUMBER' | 'TEXT' | 'BOOLEAN' | 'ENUM';
  };
}

export const formatSpecValue = (spec: Specification): string => {
  const type = spec.specificationType;

  if (spec.valueNumber !== null && spec.valueNumber !== undefined) {
    return `${spec.valueNumber}${type.unit || ''}`;
  }
  if (spec.valueText) {
    return spec.valueText;
  }
  if (spec.valueBool !== null && spec.valueBool !== undefined) {
    return spec.valueBool ? 'Yes' : 'No';
  }
  return 'N/A';
};

export const getSpecDisplayName = (spec: Specification): string => {
  return spec.specificationType.name;
};

export const getSpecCode = (spec: Specification): string => {
  return spec.specificationType.code;
};

// Tooltip descriptions for each specification type
export const getSpecTooltip = (code: string, value: string): { title: string; description: string; ranges?: string[] } => {
  const tooltips: Record<string, { title: string; description: string; ranges?: string[] }> = {
    PROTEIN_CONTENT: {
      title: 'Protein Content',
      description: 'Determines the wheat\'s suitability for different uses. Higher protein content indicates better baking quality.',
      ranges: [
        '11-12%: Feed wheat (animal feed)',
        '12-14%: Bread wheat (standard baking)',
        '14%+: Premium bread wheat (high-quality baking)',
      ],
    },
    MOISTURE_CONTENT: {
      title: 'Moisture Content',
      description: 'Indicates water content in the grain. Lower moisture ensures better storage and reduces risk of spoilage.',
      ranges: [
        '≤14%: Optimal for storage',
        '14-16%: Acceptable, monitor storage',
        '>16%: Risk of spoilage, requires drying',
      ],
    },
    IMPURITIES: {
      title: 'Impurities',
      description: 'Percentage of foreign material (dirt, other seeds, damaged kernels). Lower is better for quality and processing.',
      ranges: [
        '≤2%: Premium quality',
        '2-5%: Standard quality',
        '>5%: Lower grade, may require cleaning',
      ],
    },
    TEST_WEIGHT: {
      title: 'Test Weight',
      description: 'Weight per unit volume, indicating kernel density and quality. Higher test weight means better quality grain.',
      ranges: [
        '≥80 kg/hl: Excellent',
        '76-80 kg/hl: Good',
        '<76 kg/hl: Below standard',
      ],
    },
    FALLING_NUMBER: {
      title: 'Falling Number',
      description: 'Measures enzyme activity. Indicates sprouting damage and affects baking quality.',
      ranges: [
        '≥300s: Excellent baking quality',
        '250-300s: Good quality',
        '<250s: Compromised quality',
      ],
    },
    GLUTEN_CONTENT: {
      title: 'Gluten Content',
      description: 'Protein that gives dough elasticity. Critical for bread-making quality.',
      ranges: [
        '≥28%: Strong gluten, excellent for bread',
        '23-28%: Medium gluten, good quality',
        '<23%: Weak gluten, limited uses',
      ],
    },
    HECTOLITER_WEIGHT: {
      title: 'Hectoliter Weight',
      description: 'Weight of 100 liters of grain. Similar to test weight, indicates grain density and quality.',
      ranges: [
        '≥78 kg/hl: Premium',
        '75-78 kg/hl: Standard',
        '<75 kg/hl: Lower grade',
      ],
    },
    ORGANIC_CERTIFIED: {
      title: 'Organic Certification',
      description: 'Indicates if the product is certified organic, grown without synthetic pesticides or fertilizers.',
    },
    NON_GMO: {
      title: 'Non-GMO',
      description: 'Confirms the product is free from genetically modified organisms.',
    },
  };

  const tooltip = tooltips[code] || {
    title: code.replace(/_/g, ' '),
    description: 'Product specification requirement.',
  };

  return {
    ...tooltip,
    title: `${tooltip.title}: ${value}`,
  };
};

export type { Specification };
