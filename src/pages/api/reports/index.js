import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export default async function handler(req, res) {
  const user = authenticateRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();

    let data = {};

    switch (type) {
      case 'sales':
        const payments = await prisma.payment.findMany({
          where: { receivedAt: { gte: start, lte: end } },
          include: { invoice: { include: { customer: true } } },
          orderBy: { receivedAt: 'desc' },
        });
        const totalSales = payments.reduce((sum, p) => sum + p.amount, 0);
        data = { payments, totalSales };
        break;

      case 'pending':
        const pendingInvoices = await prisma.invoice.findMany({
          where: { status: { in: ['UNPAID', 'PARTIALLY_PAID'] } },
          include: { customer: true },
          orderBy: { createdAt: 'desc' },
        });
        const totalPending = pendingInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
        data = { invoices: pendingInvoices, totalPending };
        break;

      case 'completed':
        const completedProjects = await prisma.project.findMany({
          where: {
            steps: { every: { status: 'COMPLETED' } },
            createdAt: { gte: start, lte: end },
          },
          include: {
            customer: true,
            quotation: { select: { total: true, quotationNumber: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
        data = { projects: completedProjects };
        break;

      case 'quotation-conversion':
        const totalQuotes = await prisma.quotation.count({
          where: { createdAt: { gte: start, lte: end } },
        });
        const approvedQuotes = await prisma.quotation.count({
          where: { status: 'APPROVED', createdAt: { gte: start, lte: end } },
        });
        const rejectedQuotes = await prisma.quotation.count({
          where: { status: 'REJECTED', createdAt: { gte: start, lte: end } },
        });
        data = {
          totalQuotes,
          approvedQuotes,
          rejectedQuotes,
          conversionRate: totalQuotes > 0 ? ((approvedQuotes / totalQuotes) * 100).toFixed(1) : 0,
        };
        break;

      case 'customer-history':
        const customers = await prisma.customer.findMany({
          include: {
            quotations: { select: { total: true, status: true } },
            invoices: { select: { total: true, amountPaid: true, status: true } },
            _count: { select: { projects: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
        data = {
          customers: customers.map((c) => ({
            ...c,
            totalQuotationValue: c.quotations.reduce((s, q) => s + q.total, 0),
            totalPaid: c.invoices.reduce((s, i) => s + i.amountPaid, 0),
            totalOutstanding: c.invoices.reduce((s, i) => s + (i.total - i.amountPaid), 0),
          })),
        };
        break;

      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }

    res.status(200).json({ data });
  } catch (error) {
    console.error('Reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
