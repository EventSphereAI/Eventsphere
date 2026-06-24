'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/utils/api';
import RoleGuard from '@/components/RoleGuard';
import { PERMISSIONS } from '@/config/permissions';


export default function SuperAdminPage() {
  const router = useRouter();

  const [dashboard, setDashboard] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

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
  const confirmed = confirm(
    'Are you sure you want to suspend this organization?'
  );

  if (!confirmed) return;

  try {
    await api.patch(
      `/api/super_admin/tenant/${tenantId}/suspend`
    );

    await loadData();

    alert('Organization suspended successfully');
  } catch (error) {
    console.error(error);
    alert('Failed to suspend tenant');
  }
};

  const activateTenant = async (tenantId) => {
  const confirmed = confirm(
    'Are you sure you want to activate this organization?'
  );

  if (!confirmed) return;

  try {
    await api.patch(
      `/api/super_admin/tenant/${tenantId}/activate`
    );

    await loadData();

    alert('Organization activated');
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
    <RoleGuard allowedRoles={PERMISSIONS.SUPER_ADMIN}>
    <div className="min-h-screen bg-slate-100 p-8">

      <div className="flex justify-between items-center mb-8">
  <h1 className="text-4xl font-bold">
    EventSphere Super Admin
  </h1>

  <div className="flex gap-3">
    <button
      onClick={() => router.push('/super-admin/users')}
      className="bg-slate-900 text-white px-4 py-2 rounded-lg"
    >
      Platform Users
    </button>

    <button
      onClick={() => router.push('/super-admin/founders')}
      className="bg-slate-900 text-white px-4 py-2 rounded-lg"
    >
      Founders
    </button>

    <Link
      href="/super-admin/audit-logs"
      className="bg-slate-900 text-white px-4 py-2 rounded-lg"
    >
      Audit Logs
    </Link>
  </div>
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

      <div className="flex gap-4 mb-6 flex-wrap">

  <input
    type="text"
    placeholder="Search organization..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="border rounded px-4 py-2 w-80"
  />

  <select
    value={planFilter}
    onChange={(e) => setPlanFilter(e.target.value)}
    className="border rounded px-4 py-2"
  >
    <option value="all">All Plans</option>
    <option value="free">Free</option>
    <option value="pro">Pro</option>
    <option value="enterprise">Enterprise</option>
  </select>

  <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
    className="border rounded px-4 py-2"
  >
    <option value="all">All Status</option>
    <option value="active">Active</option>
    <option value="suspended">Suspended</option>
  </select>

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

              {tenants
  .filter((tenant) => {
    const matchesSearch =
      tenant.name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      tenant.slug
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesPlan =
      planFilter === 'all' ||
      tenant.plan === planFilter;

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' &&
        tenant.is_active) ||
      (statusFilter === 'suspended' &&
        !tenant.is_active);

    return (
      matchesSearch &&
      matchesPlan &&
      matchesStatus
    );
  })              .map((tenant) => (
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
    </RoleGuard>
  );
}