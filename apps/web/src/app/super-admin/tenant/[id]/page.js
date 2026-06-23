'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/utils/api';

export default function TenantDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const tenantId = params.id;

  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTenant();
  }, []);

  const fetchTenant = async () => {
    try {
      const { data } = await api.get(
        `/api/super_admin/tenant/${tenantId}`
      );

      setTenant(data);
    } catch (error) {
      console.error(error);
      alert('Failed to load tenant details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-xl">
        Loading Tenant...
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="p-8 text-xl">
        Tenant not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8">

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">
          {tenant.name}
        </h1>

        <button
          onClick={() => router.push('/super-admin')}
          className="bg-slate-800 text-white px-4 py-2 rounded"
        >
          Back
        </button>
      </div>

      {/* Stats */}

      <div className="grid md:grid-cols-3 gap-6 mb-8">

        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-500">
            Total Users
          </p>

          <h2 className="text-4xl font-bold">
            {tenant.total_users}
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-500">
            Total Events
          </p>

          <h2 className="text-4xl font-bold">
            {tenant.total_events}
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-500">
            Total Delegates
          </p>

          <h2 className="text-4xl font-bold">
            {tenant.total_delegates}
          </h2>
        </div>

      </div>

      {/* Organization Info */}

      <div className="bg-white rounded-xl shadow p-6">

        <h2 className="text-2xl font-bold mb-6">
          Organization Details
        </h2>

        <div className="space-y-4">

          <div>
            <strong>Name:</strong>{' '}
            {tenant.name}
          </div>

          <div>
            <strong>Slug:</strong>{' '}
            {tenant.slug}
          </div>

          <div>
            <strong>Plan:</strong>{' '}
            {tenant.plan}
          </div>

          <div>
            <strong>Status:</strong>{' '}
            {tenant.is_active
              ? 'Active'
              : 'Suspended'}
          </div>

          <div>
            <strong>Max Events:</strong>{' '}
            {tenant.max_events}
          </div>

          <div>
            <strong>Max Delegates:</strong>{' '}
            {tenant.max_delegates}
          </div>

          <div>
            <strong>Created At:</strong>{' '}
            {new Date(
              tenant.created_at
            ).toLocaleString()}
          </div>

        </div>

      </div>

    </div>
  );
}