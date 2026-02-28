import { InvoiceDetailClient } from "@/components/invoices/InvoiceDetailClient";

type Props = {
  params: Promise<{ invoiceId: string }>;
};

export default async function InvoiceDetailPage({ params }: Props) {
  const { invoiceId } = await params;

  return <InvoiceDetailClient invoiceId={invoiceId} />;
}
