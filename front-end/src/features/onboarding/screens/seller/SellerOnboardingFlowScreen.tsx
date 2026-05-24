import React from 'react';
import { Wheat } from 'lucide-react-native';
import { RoleOnboardingShell } from '../../components/RoleOnboardingShell';
import { COLORS } from '@design-system';

const SELLER_ILLUSTRATION = require('../../../../../assets/UserTypes/Seller.png');

export const SellerOnboardingFlowScreen: React.FC = () => {
  return (
    <RoleOnboardingShell
      role="seller"
      aiRole="seller"
      illustration={SELLER_ILLUSTRATION}
      accentColor={COLORS.accentGreen}
      accentBg="rgba(74,222,128,0.10)"
      accentBorder="rgba(74,222,128,0.45)"
      roleLabel="Seller"
      headline="Set up your farm profile"
      subhead="Buyers will see your listings, and payments lock into escrow until delivery is confirmed."
      companyIcon={Wheat}
      companyLabel="Farm or cooperative name"
      companyPlaceholder="Green Valley Farms"
    />
  );
};
