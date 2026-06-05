import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export default async function handler(req, res) {
  const user = authenticateRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const { search, page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
              { companyName: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {};

      const [customers, total] = await Promise.all([
        prisma.customer.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            _count: { select: { quotations: true, invoices: true, projects: true } },
          },
        }),
        prisma.customer.count({ where }),
      ]);

      res.status(200).json({ customers, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (error) {
      console.error('Get customers error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'POST') {
    try {
      const { name, email, phone, address, companyName } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Customer name is required' });
      }

      const customer = await prisma.customer.create({
        data: { name, email, phone, address, companyName },
      });

      res.status(201).json({ customer });
    } catch (error) {
      console.error('Create customer error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
