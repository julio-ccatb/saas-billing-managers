import { OnboardingWizard } from "~/features/clients/components/OnboardingWizard";

export const metadata = {
  title: "Onboard Client | CSOC Operations",
  description: "Unified client onboarding wizard for software contracts, runtime licenses, and billing",
};

export default function NewClientOnboardingPage() {
  return <OnboardingWizard />;
}
