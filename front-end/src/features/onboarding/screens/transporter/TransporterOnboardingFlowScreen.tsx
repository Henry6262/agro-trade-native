import React from 'react';
import { Truck } from 'lucide-react-native';
import { RoleOnboardingShell } from '../../components/RoleOnboardingShell';

const TRANSPORTER_ILLUSTRATION = require('../../../../../assets/UserTypes/transporter.png');

export const TransporterOnboardingFlowScreen: React.FC = () => {
  return (
    <RoleOnboardingShell
      role="transport"
      aiRole="transporter"
      illustration={TRANSPORTER_ILLUSTRATION}
      accentColor="#A78BFA"
      accentBg="rgba(167,139,250,0.10)"
      accentBorder="rgba(167,139,250,0.45)"
      roleLabel="Transporter"
      headline="Register your fleet"
      subhead="Match incoming routes to your trucks. Payouts release to your wallet on delivery confirmation."
      companyIcon={Truck}
      companyLabel="Company name"
      companyPlaceholder="Swift Transport LLC"
    />
  );
};
