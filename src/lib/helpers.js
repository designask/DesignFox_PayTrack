export function generateQuotationNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `QT-${year}${month}-${random}`;
}

export function generateInvoiceNumber(type) {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 9000) + 1000;
  const prefix = type === 'ADVANCE' ? 'INV-ADV' : 'INV-FIN';
  return `${prefix}-${year}${month}-${random}`;
}

export function generateReceiptNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `RCT-${year}${month}-${random}`;
}

export const PROJECT_STEPS = [
  'Quotation Approved',
  'Advance Invoice Sent',
  'Advance Payment Received',
  'Work Started',
  'Project Completed',
  'Final Invoice Sent',
  'Balance Payment Received',
  'Final Delivery Completed',
];

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
