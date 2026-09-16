import { redirect } from "next/navigation";
import { AppRoutes } from "~/config/routes";

export default function PortalLoginPage() {
  redirect(`${AppRoutes.SIGN_IN}?tab=portal`);
}
