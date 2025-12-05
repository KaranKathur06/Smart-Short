import { redirect } from 'next/navigation';

export default function AnalyticsLinkPage({ params }: { params: { linkId: string } }) {
  redirect(`/analytics?linkId=${params.linkId}`);
}
