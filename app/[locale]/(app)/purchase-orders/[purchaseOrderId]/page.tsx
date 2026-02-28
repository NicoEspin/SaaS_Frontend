import { PurchaseOrderDetailClient } from "@/components/purchase-orders/PurchaseOrderDetailClient";

type Props = {
  params: Promise<{ purchaseOrderId: string }>;
};

export default async function PurchaseOrderDetailPage({ params }: Props) {
  const { purchaseOrderId } = await params;
  return <PurchaseOrderDetailClient purchaseOrderId={purchaseOrderId} />;
}
