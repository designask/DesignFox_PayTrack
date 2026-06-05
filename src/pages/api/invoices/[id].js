import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export default async function handler(req, res) {
  const user = authenticateRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          customer: true,
          quotation: { include: { items: true } },
          payments: { include: { receipt: true } },
          createdBy: { select: { name: true } },
        },
      });

      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      res.status(200).json({ invoice });
    } catch (error) {
      console.error('Get invoice error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { status, dueDate, notes, bankName, accountName, accountNumber, branch, paymentRef } = req.body;

      const updateData = {};
      if (status) updateData.status = status;
      if (dueDate) updateData.dueDate = new Date(dueDate);
      if (notes !== undefined) updateData.notes = notes;
      if (bankName !== undefined) updateData.bankName = bankName;
      if (accountName !== undefined) updateData.accountName = accountName;
      if (accountNumber !== undefined) updateData.accountNumber = accountNumber;
      if (branch !== undefined) updateData.branch = branch;
      if (paymentRef !== undefined) updateData.paymentRef = paymentRef;

      const invoice = await prisma.invoice.update({
        where: { id },
        data: updateData,
        include: { customer: true, payments: true },
      });

      res.status(200).json({ invoice });
    } catch (error) {
      console.error('Update invoice error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'DELETE') {
    try {
      await prisma.invoice.delete({ where: { id } });
      res.status(200).json({ message: 'Invoice deleted' });
    } catch (error) {
      console.error('Delete invoice error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
