import { permanentRedirect } from "next/navigation";

export default function LegacyContentRightsPage() {
  permanentRedirect("/zh-CN/content-rights");
}
