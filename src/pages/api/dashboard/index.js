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
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [
      totalQuotations,
      approvedQuotations,
      pendingPayments,
      totalCustomers,
      completedProjects,
      overdueInvoices,
      monthlyPayments,
      recentQuotations,
      recentPayments,
      allInvoices,
    ] = await Promise.all([
      prisma.quotation.count(),
      prisma.quotation.count({ where: { status: 'APPROVED' } }),
      prisma.invoice.count({ where: { status: { in: ['UNPAID', 'PARTIALLY_PAID'] } } }),
      prisma.customer.count(),
      prisma.project.count({
        where: { steps: { every: { status: 'COMPLETED' } } },
      }),
      prisma.invoice.count({ where: { status: 'OVERDUE' } }),
      prisma.payment.aggregate({
        where: { receivedAt: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
      }),
      prisma.quotation.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { name: true } } },
      }),
      prisma.payment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          invoice: { include: { customer: { select: { name: true } } } },
        },
      }),
      prisma.invoice.aggregate({
        where: { status: { in: ['UNPAID', 'PARTIALLY_PAID'] } },
        _sum: { balanceDue: true },
      }),
    ]);

    // Monthly income for last 6 months
    const monthlyIncome = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const income = await prisma.payment.aggregate({
        where: { receivedAt: { gte: start, lte: end } },
        _sum: { amount: true },
      });
      monthlyIncome.push({
        month: start.toLocaleString('default', { month: 'short', year: 'numeric' }),
        amount: income._sum.amount || 0,
      });
    }

    res.status(200).json({
      stats: {
        totalQuotations,
        approvedQuotations,
        pendingPayments,
        totalCustomers,
        completedProjects,
        overdueInvoices,
        monthlyIncome: monthlyPayments._sum.amount || 0,
        totalBalanceDue: allInvoices._sum.balanceDue || 0,
      },
      monthlyIncome,
      recentQuotations,
      recentPayments,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
