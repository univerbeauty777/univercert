// UniverCert · Onboarding wizard pós sign-up · Sprint 13

import OnboardingClient from './OnboardingClient';

export const runtime = 'edge';

export const metadata = {
  title: 'Bem-vindo · Configure sua conta em 5 passos',
};

export default function OnboardingPage() {
  return <OnboardingClient />;
}
