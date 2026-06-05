import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { FiArrowLeft, FiCheck, FiClock, FiCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ProjectDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { api } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const res = await api(`/api/projects/${id}`);
      const data = await res.json();
      setProject(data.project);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateStep = async (stepId, status) => {
    try {
      await api(`/api/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ stepId, stepStatus: status }),
      });
      toast.success('Step updated');
      fetchProject();
    } catch (error) {
      toast.error('Failed to update step');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!project) return <div className="text-center py-12 text-gray-400">Project not found</div>;

  const getStepIcon = (status) => {
    if (status === 'COMPLETED') return <FiCheck className="text-green-500" size={18} />;
    if (status === 'IN_PROGRESS') return <FiClock className="text-yellow-500" size={18} />;
    return <FiCircle className="text-gray-300" size={18} />;
  };

  const getStepColor = (status) => {
    if (status === 'COMPLETED') return 'border-green-500 bg-green-50';
    if (status === 'IN_PROGRESS') return 'border-yellow-500 bg-yellow-50';
    return 'border-gray-200 bg-white';
  };

  const progress = project.steps
    ? Math.round((project.steps.filter((s) => s.status === 'COMPLETED').length / project.steps.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
          <FiArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-dark-900">{project.title}</h1>
          <p className="text-gray-500 mt-1">
            {project.customer?.name} {project.customer?.companyName ? `- ${project.customer.companyName}` : ''}
          </p>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Project Progress</h3>
          <span className={`badge ${progress === 100 ? 'badge-success' : 'badge-info'}`}>
            {progress}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${progress === 100 ? 'bg-green-500' : 'bg-primary-600'}`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Workflow Timeline */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-6">Workflow Steps</h3>
        <div className="space-y-4">
          {project.steps?.map((step, index) => (
            <div key={step.id} className="flex items-start gap-4">
              {/* Timeline Line */}
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${getStepColor(step.status)}`}>
                  {getStepIcon(step.status)}
                </div>
                {index < project.steps.length - 1 && (
                  <div className={`w-0.5 h-12 mt-1 ${step.status === 'COMPLETED' ? 'bg-green-300' : 'bg-gray-200'}`}></div>
                )}
              </div>

              {/* Step Content */}
              <div className={`flex-1 pb-4 border rounded-lg p-4 ${getStepColor(step.status)}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-dark-900">{step.stepName}</p>
                    <p className="text-xs text-gray-500 mt-1">Step {step.stepOrder} of {project.steps.length}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`badge ${
                        step.status === 'COMPLETED'
                          ? 'badge-success'
                          : step.status === 'IN_PROGRESS'
                          ? 'badge-warning'
                          : 'badge-gray'
                      }`}
                    >
                      {step.status.replace('_', ' ')}
                    </span>
                    {step.status !== 'COMPLETED' && (
                      <select
                        value={step.status}
                        onChange={(e) => updateStep(step.id, e.target.value)}
                        className="text-xs border rounded px-2 py-1"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Project Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-3">Quotation Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Quotation #</span>
              <Link href={`/quotations/${project.quotation?.id}`} className="text-primary-600 font-medium">
                {project.quotation?.quotationNumber}
              </Link>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total Value</span>
              <span className="font-medium">LKR {project.quotation?.total?.toLocaleString()}</span>
            </div>
          </div>

          {project.quotation?.items && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium mb-2">Services:</p>
              <div className="space-y-1">
                {project.quotation.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.serviceName}</span>
                    <span>LKR {item.total?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-3">Invoices & Payments</h3>
          {project.quotation?.invoices?.length > 0 ? (
            <div className="space-y-3">
              {project.quotation.invoices.map((inv) => (
                <Link
                  key={inv.id}
                  href={`/invoices/${inv.id}`}
                  className="block p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">{inv.invoiceNumber}</p>
                      <p className="text-xs text-gray-500">{inv.type} Invoice</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">LKR {inv.total?.toLocaleString()}</p>
                      <span
                        className={`badge text-xs ${
                          inv.status === 'PAID' ? 'badge-success' : 'badge-warning'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No invoices created yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
