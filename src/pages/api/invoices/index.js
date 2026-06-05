import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { generateInvoiceNumber } from '@/lib/helpers';

export default async function handler(req, res) {
  const user = authenticateRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const { status, type, customerId, page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = {};
      if (status) where.status = status;
      if (type) where.type = type;
      if (customerId) where.customerId = customerId;

      const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            customer: { select: { name: true, companyName: true } },
            quotation: { select: { quotationNumber: true } },
            payments: true,
          },
        }),
        prisma.invoice.count({ where }),
      ]);

      res.status(200).json({ invoices, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (error) {
      console.error('Get invoices error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'POST') {
    try {
      const {
        quotationId,
        customerId,
        type,
        percentage = 50,
        dueDate,
        notes,
        bankName,
        accountName,
        accountNumber,
        branch,
        paymentRef,
      } = req.body;

      if (!customerId || !type) {
        return res.status(400).json({ error: 'Customer and invoice type are required' });
      }

      const invoiceNumber = generateInvoiceNumber(type);

      let total = 0;
      if (quotationId) {
        const quotation = await prisma.quotation.findUnique({ where: { id: quotationId } });
        if (!quotation) {
          return res.status(404).json({ error: 'Quotation not found' });
        }
        total = (quotation.total * percentage) / 100;
      } else {
        total = req.body.total || 0;
      }

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          quotationId,
          customerId,
          type,
          total,
          subtotal: total,
          balanceDue: total,
          dueDate: dueDate ? new Date(dueDate) : null,
          notes,
          bankName,
          accountName,
          accountNumber,
          branch,
          paymentRef,
          createdById: user.id,
        },
        include: { customer: true, quotation: true },
      });

      // Update project step if advance invoice
      if (quotationId && type === 'ADVANCE') {
        const project = await prisma.project.findUnique({ where: { quotationId } });
        if (project) {
          await prisma.projectStep.updateMany({
            where: { projectId: project.id, stepName: 'Advance Invoice Sent' },
            data: { status: 'COMPLETED' },
          });
        }
      }

      // Update project step if final invoice
      if (quotationId && type === 'FINAL') {
        const project = await prisma.project.findUnique({ where: { quotationId } });
        if (project) {
          await prisma.projectStep.updateMany({
            where: { projectId: project.id, stepName: 'Final Invoice Sent' },
            data: { status: 'COMPLETED' },
          });
        }
      }

      res.status(201).json({ invoice });
    } catch (error) {
      console.error('Create invoice error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
