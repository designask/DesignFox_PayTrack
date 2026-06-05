import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { generateReceiptNumber } from '@/lib/helpers';

export default async function handler(req, res) {
  const user = authenticateRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const { invoiceId, page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = {};
      if (invoiceId) where.invoiceId = invoiceId;

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            invoice: {
              include: { customer: { select: { name: true, companyName: true } } },
            },
            receipt: true,
            recordedBy: { select: { name: true } },
          },
        }),
        prisma.payment.count({ where }),
      ]);

      res.status(200).json({ payments, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (error) {
      console.error('Get payments error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'POST') {
    try {
      const { invoiceId, amount, method, reference, proofUrl, notes } = req.body;

      if (!invoiceId || !amount || !method) {
        return res.status(400).json({ error: 'Invoice ID, amount, and method are required' });
      }

      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { quotation: true },
      });

      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      if (amount > invoice.balanceDue) {
        return res.status(400).json({ error: 'Amount exceeds balance due' });
      }

      // Create payment
      const payment = await prisma.payment.create({
        data: {
          invoiceId,
          amount: parseFloat(amount),
          method,
          reference,
          proofUrl,
          notes,
          recordedById: user.id,
        },
      });

      // Generate receipt
      const receiptNumber = generateReceiptNumber();
      await prisma.receipt.create({
        data: {
          receiptNumber,
          paymentId: payment.id,
          amount: parseFloat(amount),
        },
      });

      // Update invoice
      const newAmountPaid = invoice.amountPaid + parseFloat(amount);
      const newBalance = invoice.total - newAmountPaid;
      const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID';

      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          amountPaid: newAmountPaid,
          balanceDue: newBalance,
          status: newStatus,
        },
      });

      // Update project steps
      if (invoice.quotationId) {
        const project = await prisma.project.findUnique({ where: { quotationId: invoice.quotationId } });
        if (project) {
          if (invoice.type === 'ADVANCE' && newStatus === 'PAID') {
            await prisma.projectStep.updateMany({
              where: { projectId: project.id, stepName: 'Advance Payment Received' },
              data: { status: 'COMPLETED' },
            });
            await prisma.projectStep.updateMany({
              where: { projectId: project.id, stepName: 'Work Started' },
              data: { status: 'IN_PROGRESS' },
            });
          }
          if (invoice.type === 'FINAL' && newStatus === 'PAID') {
            await prisma.projectStep.updateMany({
              where: { projectId: project.id, stepName: 'Balance Payment Received' },
              data: { status: 'COMPLETED' },
            });
            await prisma.projectStep.updateMany({
              where: { projectId: project.id, stepName: 'Final Delivery Completed' },
              data: { status: 'IN_PROGRESS' },
            });
          }
        }
      }

      const fullPayment = await prisma.payment.findUnique({
        where: { id: payment.id },
        include: { receipt: true, invoice: { include: { customer: true } } },
      });

      res.status(201).json({ payment: fullPayment });
    } catch (error) {
      console.error('Create payment error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
