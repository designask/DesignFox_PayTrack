import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { generateQuotationNumber } from '@/lib/helpers';

export default async function handler(req, res) {
  const user = authenticateRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const { status, customerId, page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = {};
      if (status) where.status = status;
      if (customerId) where.customerId = customerId;

      const [quotations, total] = await Promise.all([
        prisma.quotation.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            customer: { select: { name: true, companyName: true } },
            items: true,
            createdBy: { select: { name: true } },
          },
        }),
        prisma.quotation.count({ where }),
      ]);

      res.status(200).json({ quotations, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (error) {
      console.error('Get quotations error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'POST') {
    try {
      const { customerId, items, notes, validUntil, taxRate = 0, discountRate = 0 } = req.body;

      if (!customerId || !items || items.length === 0) {
        return res.status(400).json({ error: 'Customer and at least one item are required' });
      }

      const quotationNumber = generateQuotationNumber();

      let subtotal = 0;
      const processedItems = items.map((item) => {
        const itemTotal = item.quantity * item.unitPrice;
        const itemDiscount = (itemTotal * (item.discount || 0)) / 100;
        const itemTax = ((itemTotal - itemDiscount) * (item.tax || 0)) / 100;
        const total = itemTotal - itemDiscount + itemTax;
        subtotal += total;
        return {
          serviceName: item.serviceName,
          description: item.description || '',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          tax: item.tax || 0,
          total,
        };
      });

      const taxAmount = (subtotal * taxRate) / 100;
      const discountAmount = (subtotal * discountRate) / 100;
      const total = subtotal + taxAmount - discountAmount;

      const quotation = await prisma.quotation.create({
        data: {
          quotationNumber,
          customerId,
          subtotal,
          taxAmount,
          discountAmount,
          total,
          notes,
          validUntil: validUntil ? new Date(validUntil) : null,
          createdById: user.id,
          items: { create: processedItems },
        },
        include: { items: true, customer: true },
      });

      res.status(201).json({ quotation });
    } catch (error) {
      console.error('Create quotation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
