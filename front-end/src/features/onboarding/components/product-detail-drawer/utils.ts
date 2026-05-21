import { Alert } from 'react-native';

import { getApiUrl } from '@shared/utils/environment';
import type { ProductSpecification, ProductWithSpecs } from '@stores/product.store';

import type { PriceOffer, ProductSpecificationsMap } from './types';

export const getProductImageUri = (image?: string) => {
  if (!image) {
    return undefined;
  }

  return image.startsWith('http') ? image : `${getApiUrl().replace('/api', '')}/static/${image}`;
};

export const getInitialSpecifications = (
  product?: ProductWithSpecs | null
): ProductSpecificationsMap => {
  if (!product?.specifications?.length) {
    return {};
  }

  return product.specifications.reduce<ProductSpecificationsMap>((accumulator, specification) => {
    accumulator[getSpecificationKey(specification)] = '';
    return accumulator;
  }, {});
};

export const getDefaultPriceOffer = (product?: ProductWithSpecs | null): PriceOffer | null => {
  if (!product) {
    return null;
  }

  return {
    min: parseFloat(product.priceRangeMin || '0'),
    max: parseFloat(product.priceRangeMax || '0'),
    currency: 'USD',
  };
};

export const parseQuantityInput = (value: string) => value.replace(/[^0-9.]/g, '');

export const getQuantityValue = (selectedQuantity: number | null, customQuantity: string) =>
  selectedQuantity || parseFloat(customQuantity) || 0;

export const getSpecificationKey = (specification: ProductSpecification) =>
  specification.code || specification.id;

export const normalizeSpecificationValue = (specification: ProductSpecification, value: string) => {
  return specification.dataType === 'NUMBER' ? parseQuantityInput(value) : value;
};

export const validateSpecifications = (
  product: ProductWithSpecs,
  specifications: ProductSpecificationsMap
) => {
  const requiredSpecifications = product.specifications
    .filter((specification) => ['CRITICAL', 'IMPORTANT'].includes(specification.importance))
    .filter((specification) => !specifications[getSpecificationKey(specification)]?.trim());

  if (requiredSpecifications.length > 0) {
    Alert.alert(
      'Missing Information',
      `Please fill in all required specifications: ${requiredSpecifications
        .map((specification) => specification.name || specification.code)
        .join(', ')}`,
      [{ text: 'OK' }]
    );
    return false;
  }

  for (const specification of product.specifications) {
    const specKey = getSpecificationKey(specification);
    const value = specifications[specKey];

    if (!value || specification.dataType !== 'NUMBER') {
      continue;
    }

    const numericValue = parseFloat(value);

    if (Number.isNaN(numericValue)) {
      Alert.alert(
        'Invalid Input',
        `${specification.name || specification.code} must be a valid number`
      );
      return false;
    }

    if (specification.minValue !== undefined && numericValue < specification.minValue) {
      Alert.alert(
        'Invalid Input',
        `${specification.name || specification.code} must be at least ${specification.minValue}`
      );
      return false;
    }

    if (specification.maxValue !== undefined && numericValue > specification.maxValue) {
      Alert.alert(
        'Invalid Input',
        `${specification.name || specification.code} must not exceed ${specification.maxValue}`
      );
      return false;
    }
  }

  return true;
};
