import React from 'react';
import { Building2 } from 'lucide-react-native';
import { RoleOnboardingShell } from '../../components/RoleOnboardingShell';
import { COLORS } from '@design-system';

const BUYER_ILLUSTRATION = require('../../../../../assets/UserTypes/Buyer.png');

export const BuyerOnboardingFlowScreen: React.FC = () => {
  return (
    <RoleOnboardingShell
      role="buyer"
      aiRole="buyer"
      illustration={BUYER_ILLUSTRATION}
      accentColor={COLORS.info}
      accentBg="rgba(96,165,250,0.10)"
      accentBorder="rgba(96,165,250,0.45)"
      roleLabel="Buyer"
      headline="Tell us about your business"
      subhead="So we can match you with the right sellers and lock orders into escrow."
      companyIcon={Building2}
      companyLabel="Company name"
      companyPlaceholder="Hellenic Grain Co."
    />
  );
};
