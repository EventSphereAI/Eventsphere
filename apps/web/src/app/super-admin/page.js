'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';

export default function SuperAdminPage() {
  const router = useRouter();

  const [dashboard, setDashboard] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const dashboardRes = await api.get(
        '/api/super_admin/dashboard'
      );

      const analyticsRes = await api.get(
        '/api/super_admin/analytics'
      );

      const tenantsRes = await api.get(
        '/api/super_admin/tenants'
      );

      setDashboard(dashboardRes.data);
      setAnalytics(analyticsRes.data);
      setTenants(tenantsRes.data);
    } catch (error) {
      console.error(error);
      alert('Failed to load Super Admin Dashboard');
    } finally {
      setLoading(false);
    }
  };

  const suspendTenant = async (tenantId) => {
    try {
      await api.patch(
        `/api/super_admin/tenant/${tenantId}/suspend`
      );

      await loadData();
    } catch (error) {
      console.error(error);
      alert('Failed to suspend tenant');
    }
  };

  const activateTenant = async (tenantId) => {
    try {
      await api.patch(
        `/api/super_admin/tenant/${tenantId}/activate`
      );

      await loadData();
    } catch (error) {
      console.error(error);
      alert('Failed to activate tenant');
    }
  };

  const updatePlan = async (tenantId, plan) => {
    try {
      await api.patch(
        `/api/super_admin/tenant/${tenantId}/plan`,
        {
          plan,
        }
      );

      await loadData();
    } catch (error) {
      console.error(error);
      alert('Failed to update plan');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl">
        Loading Super Admin Dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8">

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">
          EventSphere Super Admin
        </h1>

        <button
          onClick={() => router.push('/super-admin/users')}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg"
        >
          Platform Users
        </button>
      </div>

      {/* Dashboard Stats */}

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-500">Total Tenants</p>
          <h2 className="text-4xl font-bold">
            {dashboard.total_tenants}
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-500">Total Users</p>
          <h2 className="text-4xl font-bold">
            {dashboard.total_users}
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-500">Total Events</p>
          <h2 className="text-4xl font-bold">
            {dashboard.total_events}
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-500">Total Delegates</p>
          <h2 className="text-4xl font-bold">
            {dashboard.total_delegates}
          </h2>
        </div>
      </div>

      {/* Analytics */}

      <div className="grid md:grid-cols-5 gap-6 mb-10">
        <div className="bg-white rounded-xl shadow p-6">
          <p>Free Plans</p>
          <h2 className="text-3xl font-bold">
            {analytics.free_plan}
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <p>Pro Plans</p>
          <h2 className="text-3xl font-bold">
            {analytics.pro_plan}
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <p>Enterprise Plans</p>
          <h2 className="text-3xl font-bold">
            {analytics.enterprise_plan}
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <p>Active Tenants</p>
          <h2 className="text-3xl font-bold">
            {analytics.active_tenants}
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <p>Inactive Tenants</p>
          <h2 className="text-3xl font-bold">
            {analytics.inactive_tenants}
          </h2>
        </div>
      </div>

      {/* Organizations */}

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-2xl font-bold mb-6">
          Organizations
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">

            <thead>
              <tr className="border-b">
                <th className="text-left py-3">Organization</th>
                <th className="text-left py-3">Slug</th>
                <th className="text-left py-3">Plan</th>
                <th className="text-left py-3">Status</th>
                <th className="text-left py-3">Actions</th>
              </tr>
            </thead>

            <tbody>

              {tenants.map((tenant) => (
                <tr
                  key={tenant.id}
                  className="border-b hover:bg-slate-50"
                >
                  <td className="py-4">
                    {tenant.name}
                  </td>

                  <td className="py-4">
                    {tenant.slug}
                  </td>

                  <td className="py-4">

                    {tenant.slug === 'eventsphere-admin' ? (
                      <span className="font-medium">
                        Enterprise
                      </span>
                    ) : (
                      <select
                        value={tenant.plan}
                        onChange={(e) =>
                          updatePlan(
                            tenant.id,
                            e.target.value
                          )
                        }
                        className="border rounded px-2 py-1"
                      >
                        <option value="free">
                          Free
                        </option>

                        <option value="pro">
                          Pro
                        </option>

                        <option value="enterprise">
                          Enterprise
                        </option>
                      </select>
                    )}

                  </td>

                  <td className="py-4">
                    {tenant.is_active ? (
                      <span className="text-green-600 font-medium">
                        Active
                      </span>
                    ) : (
                      <span className="text-red-600 font-medium">
                        Suspended
                      </span>
                    )}
                  </td>

                  <td className="py-4">
                    <div className="flex gap-2">

                      <button
                        onClick={() =>
                          router.push(
                            `/super-admin/tenant/${tenant.id}`
                          )
                        }
                        className="bg-blue-600 text-white px-3 py-2 rounded"
                      >
                        View
                      </button>

                      {tenant.slug !== 'eventsphere-admin' && (
                        tenant.is_active ? (
                          <button
                            onClick={() =>
                              suspendTenant(
                                tenant.id
                              )
                            }
                            className="bg-red-600 text-white px-3 py-2 rounded"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              activateTenant(
                                tenant.id
                              )
                            }
                            className="bg-green-600 text-white px-3 py-2 rounded"
                          >
                            Activate
                          </button>
                        )
                      )}

                    </div>
                  </td>

                </tr>
              ))}

            </tbody>

          </table>
        </div>
      </div>

    </div>
  );
}