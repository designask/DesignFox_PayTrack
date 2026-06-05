import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { PROJECT_STEPS } from '@/lib/helpers';

export default async function handler(req, res) {
  const user = authenticateRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const quotation = await prisma.quotation.findUnique({
        where: { id },
        include: {
          items: true,
          customer: true,
          createdBy: { select: { name: true } },
          invoices: true,
          project: { include: { steps: { orderBy: { stepOrder: 'asc' } } } },
        },
      });

      if (!quotation) {
        return res.status(404).json({ error: 'Quotation not found' });
      }

      res.status(200).json({ quotation });
    } catch (error) {
      console.error('Get quotation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { status, items, notes, validUntil } = req.body;

      const updateData = {};
      if (status) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;
      if (validUntil) updateData.validUntil = new Date(validUntil);

      if (items) {
        await prisma.quotationItem.deleteMany({ where: { quotationId: id } });

        let subtotal = 0;
        const processedItems = items.map((item) => {
          const itemTotal = item.quantity * item.unitPrice;
          const itemDiscount = (itemTotal * (item.discount || 0)) / 100;
          const itemTax = ((itemTotal - itemDiscount) * (item.tax || 0)) / 100;
          const total = itemTotal - itemDiscount + itemTax;
          subtotal += total;
          return {
            quotationId: id,
            serviceName: item.serviceName,
            description: item.description || '',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount || 0,
            tax: item.tax || 0,
            total,
          };
        });

        await prisma.quotationItem.createMany({ data: processedItems });
        updateData.subtotal = subtotal;
        updateData.total = subtotal;
      }

      // If approving, create a project
      if (status === 'APPROVED') {
        const existing = await prisma.project.findUnique({ where: { quotationId: id } });
        if (!existing) {
          const quotation = await prisma.quotation.findUnique({
            where: { id },
            include: { customer: true },
          });

          await prisma.project.create({
            data: {
              quotationId: id,
              customerId: quotation.customerId,
              title: `Project - ${quotation.quotationNumber}`,
              steps: {
                create: PROJECT_STEPS.map((step, index) => ({
                  stepName: step,
                  stepOrder: index + 1,
                  status: index === 0 ? 'COMPLETED' : 'PENDING',
                })),
              },
            },
          });
        }
      }

      const quotation = await prisma.quotation.update({
        where: { id },
        data: updateData,
        include: { items: true, customer: true },
      });

      res.status(200).json({ quotation });
    } catch (error) {
      console.error('Update quotation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'DELETE') {
    try {
      await prisma.quotation.delete({ where: { id } });
      res.status(200).json({ message: 'Quotation deleted' });
    } catch (error) {
      console.error('Delete quotation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
