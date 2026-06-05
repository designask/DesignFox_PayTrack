import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { FiEye } from 'react-icons/fi';

export default function ProjectsPage() {
  const { api } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api('/api/projects?limit=100');
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getProgress = (steps) => {
    if (!steps || steps.length === 0) return 0;
    const completed = steps.filter((s) => s.status === 'COMPLETED').length;
    return Math.round((completed / steps.length) * 100);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-900">Projects</h1>
        <p className="text-gray-500 mt-1">Track project workflow and progress</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <p>No projects yet. Projects are created when quotations are approved.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const progress = getProgress(project.steps);
            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="card hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-dark-900">{project.title}</h3>
                    <p className="text-sm text-gray-500">{project.customer?.name}</p>
                  </div>
                  <FiEye className="text-gray-400" size={18} />
                </div>

                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">
                    Quotation: {project.quotation?.quotationNumber}
                  </p>
                  <p className="text-sm font-medium">
                    LKR {project.quotation?.total?.toLocaleString()}
                  </p>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        progress === 100 ? 'bg-green-500' : 'bg-primary-600'
                      }`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Step Summary */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {project.steps?.map((step) => (
                    <div
                      key={step.id}
                      className={`w-3 h-3 rounded-full ${
                        step.status === 'COMPLETED'
                          ? 'bg-green-500'
                          : step.status === 'IN_PROGRESS'
                          ? 'bg-yellow-500'
                          : 'bg-gray-300'
                      }`}
                      title={`${step.stepName}: ${step.status}`}
                    ></div>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
