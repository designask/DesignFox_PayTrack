import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

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
      if (customerId) where.customerId = customerId;

      const [projects, total] = await Promise.all([
        prisma.project.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            customer: { select: { name: true, companyName: true } },
            quotation: { select: { quotationNumber: true, total: true } },
            steps: { orderBy: { stepOrder: 'asc' } },
          },
        }),
        prisma.project.count({ where }),
      ]);

      res.status(200).json({ projects, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (error) {
      console.error('Get projects error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
