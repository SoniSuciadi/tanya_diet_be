export interface Purchase {
  count: number;
  refrence: string;
  id: string;
  type: 'subscription' | 'class';
  title: string;
  instructor?: string;
  price: number;
  purchaseDate: string;
  status: string;
  description: string;
  features?: string[];
  createdAt: string;
  paymentUrl: string;
}
