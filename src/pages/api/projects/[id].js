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
      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          customer: true,
          quotation: { include: { items: true, invoices: { include: { payments: true } } } },
          steps: { orderBy: { stepOrder: 'asc' } },
        },
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      res.status(200).json({ project });
    } catch (error) {
      console.error('Get project error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { title, description, stepId, stepStatus } = req.body;

      if (stepId && stepStatus) {
        await prisma.projectStep.update({
          where: { id: stepId },
          data: { status: stepStatus },
        });
      }

      if (title || description) {
        await prisma.project.update({
          where: { id },
          data: { ...(title && { title }), ...(description && { description }) },
        });
      }

      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          customer: true,
          quotation: { include: { items: true } },
          steps: { orderBy: { stepOrder: 'asc' } },
        },
      });

      res.status(200).json({ project });
    } catch (error) {
      console.error('Update project error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
