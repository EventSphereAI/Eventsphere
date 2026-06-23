'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';

export default function PlatformUsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get(
        '/api/super_admin/users'
      );

      setUsers(data);
    } catch (error) {
      console.error(error);
      alert('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl">
        Loading Platform Users...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8">

      <div className="flex justify-between items-center mb-8">

        <h1 className="text-4xl font-bold">
          Platform Users
        </h1>

        <button
          onClick={() => router.push('/super-admin')}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg"
        >
          Back to Dashboard
        </button>

      </div>

      <div className="bg-white rounded-xl shadow p-6">

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead>
              <tr className="border-b">
                <th className="text-left py-3">
                  Name
                </th>

                <th className="text-left py-3">
                  Email
                </th>

                <th className="text-left py-3">
                  Role
                </th>

                <th className="text-left py-3">
                  Organization
                </th>
              </tr>
            </thead>

            <tbody>

              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b hover:bg-slate-50"
                >
                  <td className="py-4">
                    {user.full_name}
                  </td>

                  <td className="py-4">
                    {user.email}
                  </td>

                  <td className="py-4">
                    <span
                      className={
                        user.role === 'super_admin'
                          ? 'text-purple-600 font-bold'
                          : 'text-slate-700'
                      }
                    >
                      {user.role}
                    </span>
                  </td>

                  <td className="py-4">
                    {user.tenant_name}
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