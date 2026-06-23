'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';

export default function FoundersPage() {
  const router = useRouter();

  const [founders, setFounders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    fetchFounders();
  }, []);

  const fetchFounders = async () => {
    try {
      const { data } = await api.get(
        '/api/super_admin/founders'
      );

      setFounders(data);
    } catch (error) {
      console.error(error);
      alert('Failed to load founders');
    } finally {
      setLoading(false);
    }
  };

  const createFounder = async () => {
    if (!fullName || !email || !password) {
      alert('Please fill all fields');
      return;
    }

    try {
      await api.post(
        '/api/super_admin/founders',
        {
          full_name: fullName,
          email,
          password,
        }
      );

      setFullName('');
      setEmail('');
      setPassword('');

      await fetchFounders();

      alert('Founder created successfully');
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.detail ||
          'Failed to create founder'
      );
    }
  };

  const deactivateFounder = async (founderId) => {
    const confirmed = confirm(
      'Are you sure you want to disable this founder?'
    );

    if (!confirmed) return;

    try {
      await api.patch(
        `/api/super_admin/founders/${founderId}/deactivate`
      );

      await fetchFounders();

      alert('Founder disabled successfully');
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.detail ||
          'Failed to deactivate founder'
      );
    }
  };

  const resetPassword = async (founderId) => {
    const newPassword = prompt(
      'Enter new password'
    );

    if (!newPassword) return;

    try {
      await api.patch(
        `/api/super_admin/founders/${founderId}/reset-password`,
        {
          password: newPassword,
        }
      );

      alert('Password updated successfully');
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.detail ||
          'Failed to reset password'
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl">
        Loading Founders...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">
          Founder Management
        </h1>

        <button
          onClick={() => router.push('/super-admin')}
          className="bg-slate-900 text-white px-5 py-3 rounded"
        >
          Back
        </button>
      </div>

      {/* Add Founder */}

      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">
          Add Founder
        </h2>

        <div className="grid md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) =>
              setFullName(e.target.value)
            }
            className="border rounded p-3"
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="border rounded p-3"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="border rounded p-3"
          />
        </div>

        <button
          onClick={createFounder}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded"
        >
          Add Founder
        </button>
      </div>

      {/* Founders Table */}

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-2xl font-bold mb-6">
          Platform Founders
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left py-4 px-2">
                  Name
                </th>

                <th className="text-left py-4 px-2">
                  Email
                </th>

                <th className="text-left py-4 px-2">
                  Last Login
                </th>

                <th className="text-left py-4 px-2">
                  Status
                </th>

                <th className="text-left py-4 px-2">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {founders.map((founder) => (
                <tr
                  key={founder.id}
                  className="border-b hover:bg-slate-50"
                >
                  <td className="py-4 px-2">
                    {founder.full_name}
                  </td>

                  <td className="py-4 px-2">
                    {founder.email}
                  </td>

                  <td className="py-4 px-2">
                    {founder.last_login
                      ? new Date(
                          founder.last_login
                        ).toLocaleString()
                      : 'Never'}
                  </td>

                  <td className="py-4 px-2">
                    {founder.is_active ? (
                      <span className="text-green-600 font-medium">
                        Active
                      </span>
                    ) : (
                      <span className="text-red-600 font-medium">
                        Disabled
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-2">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() =>
                          resetPassword(founder.id)
                        }
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                      >
                        Reset Password
                      </button>

                      {founder.email !==
                        'raj@event-sphere.in' && (
                        <button
                          onClick={() =>
                            deactivateFounder(
                              founder.id
                            )
                          }
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                        >
                          Disable
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {founders.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              No founders found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}