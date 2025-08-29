export interface MidtransWebhookPayload {
  transaction_type: string;
  transaction_time: string;
  transaction_status: string;
  transaction_id: string;
  status_message: string;
  status_code: string;
  signature_key: string;
  settlement_time: string;
  payment_type: string;
  order_id: string;
  merchant_id: string;
  merchant_cross_reference_id: string;
  issuer: string;
  gross_amount: string; // Keep as string for consistency as it appears to be a string in the payload
  fraud_status: string;
  expiry_time: string;
  currency: string;
  acquirer: string;
}

export interface PaymentStatusResponse {
  message: string;
}
