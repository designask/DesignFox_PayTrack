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
      const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
          quotations: { orderBy: { createdAt: 'desc' }, take: 10 },
          invoices: { orderBy: { createdAt: 'desc' }, take: 10 },
          projects: { orderBy: { createdAt: 'desc' }, take: 10 },
        },
      });

      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      res.status(200).json({ customer });
    } catch (error) {
      console.error('Get customer error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { name, email, phone, address, companyName } = req.body;

      const customer = await prisma.customer.update({
        where: { id },
        data: { name, email, phone, address, companyName },
      });

      res.status(200).json({ customer });
    } catch (error) {
      console.error('Update customer error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'DELETE') {
    try {
      await prisma.customer.delete({ where: { id } });
      res.status(200).json({ message: 'Customer deleted' });
    } catch (error) {
      console.error('Delete customer error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
