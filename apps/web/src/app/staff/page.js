'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import RoleGuard from '@/components/RoleGuard';
import { PERMISSIONS } from '@/config/permissions';

export default function StaffPage() {
  const router = useRouter();

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('registration_team');

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      setLoading(true);

      const { data } = await api.get('/api/staff');

      setStaff(data);
    } catch (err) {
      console.error(err);
      alert('Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  const createStaff = async () => {
    if (
      !fullName ||
      !email ||
      !password ||
      !role
    ) {
      return alert('Please fill all fields');
    }

    try {
      await api.post('/api/staff', {
        full_name: fullName,
        email,
        password,
        role,
      });

      setFullName('');
      setEmail('');
      setPassword('');
      setRole('registration_team');

      await loadStaff();

      alert('Staff created successfully');
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.detail ||
          'Failed to create staff'
      );
    }
  };

  const disableStaff = async (staffId) => {
    try {
      await api.patch(
        `/api/staff/${staffId}/disable`
      );

      await loadStaff();
    } catch (err) {
      console.error(err);

      alert('Failed to disable staff');
    }
  };

  const enableStaff = async (staffId) => {
    try {
      await api.patch(
        `/api/staff/${staffId}/enable`
      );

      await loadStaff();
    } catch (err) {
      console.error(err);

      alert('Failed to enable staff');
    }
  };

  const resetPassword = async (staffId) => {
    const newPassword = prompt(
      'Enter new password'
    );

    if (!newPassword) return;

    try {
      await api.patch(
        `/api/staff/${staffId}/reset-password`,
        {
          password: newPassword,
        }
      );

      alert('Password updated');
    } catch (err) {
      console.error(err);

      alert('Failed to reset password');
    }
  };

  const filteredStaff = staff.filter((member) => {
    const matchesSearch =
      member.full_name
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      member.email
        ?.toLowerCase()
        .includes(search.toLowerCase());

    const matchesRole =
      !roleFilter ||
      member.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const activeStaff = staff.filter(
    (s) => s.is_active
  ).length;

  const disabledStaff = staff.filter(
    (s) => !s.is_active
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl">
        Loading Staff...
      </div>
    );
  }

    return (
        <RoleGuard allowedRoles={PERMISSIONS.STAFF_MANAGEMENT}>
            <div className="min-h-screen bg-slate-100 p-8">

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">
          Staff Management
        </h1>

        <button
          onClick={() =>
            router.push('/dashboard')
          }
          className="bg-slate-900 text-white px-5 py-3 rounded"
        >
          Dashboard
        </button>
      </div>

      {/* Stats */}

      <div className="grid md:grid-cols-3 gap-6 mb-8">

        <div className="bg-white p-6 rounded-xl shadow">
          <p className="text-gray-500">
            Total Staff
          </p>

          <h2 className="text-4xl font-bold">
            {staff.length}
          </h2>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <p className="text-gray-500">
            Active Staff
          </p>

          <h2 className="text-4xl font-bold text-green-600">
            {activeStaff}
          </h2>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <p className="text-gray-500">
            Disabled Staff
          </p>

          <h2 className="text-4xl font-bold text-red-600">
            {disabledStaff}
          </h2>
        </div>

      </div>

      {/* Create Staff */}

      <div className="bg-white rounded-xl shadow p-6 mb-8">

        <h2 className="text-2xl font-bold mb-6">
          Add Staff Member
        </h2>

        <div className="grid md:grid-cols-4 gap-4">

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

          <select
            value={role}
            onChange={(e) =>
              setRole(e.target.value)
            }
            className="border rounded p-3"
          >
            <option value="registration_team">
              Registration Team
            </option>

            <option value="technical_team">
              Technical Team
            </option>

            <option value="food_staff">
              Food Staff
            </option>

            <option value="hospitality_team">
              Hospitality Team
            </option>

            <option value="logistics_team">
              Logistics Team
            </option>

            <option value="volunteer_coordinator">
              Volunteer Coordinator
            </option>

            <option value="volunteer">
              Volunteer
            </option>
          </select>

        </div>

        <button
          onClick={createStaff}
          className="mt-4 bg-blue-600 text-white px-5 py-3 rounded"
        >
          Create Staff
        </button>

      </div>

      {/* Search */}

      <div className="bg-white rounded-xl shadow p-6 mb-8">

        <div className="grid md:grid-cols-2 gap-4">

          <input
            type="text"
            placeholder="Search by name or email"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="border rounded p-3"
          />

          <select
            value={roleFilter}
            onChange={(e) =>
              setRoleFilter(e.target.value)
            }
            className="border rounded p-3"
          >
            <option value="">
              All Roles
            </option>

            <option value="registration_team">
              Registration Team
            </option>

            <option value="technical_team">
              Technical Team
            </option>

            <option value="food_staff">
              Food Staff
            </option>

            <option value="hospitality_team">
              Hospitality Team
            </option>

            <option value="logistics_team">
              Logistics Team
            </option>

            <option value="volunteer_coordinator">
              Volunteer Coordinator
            </option>

            <option value="volunteer">
              Volunteer
            </option>
          </select>

        </div>

      </div>

      {/* Staff Table */}

      <div className="bg-white rounded-xl shadow p-6">

        <h2 className="text-2xl font-bold mb-6">
          Staff Members
        </h2>

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
                  Last Login
                </th>

                <th className="text-left py-3">
                  Status
                </th>

                <th className="text-left py-3">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>

              {filteredStaff.map((member) => (
                <tr
                  key={member.id}
                  className="border-b hover:bg-slate-50"
                >
                  <td className="py-4">
                    {member.full_name}
                  </td>

                  <td className="py-4">
                    {member.email}
                  </td>

                  <td className="py-4 capitalize">
                    {member.role.replaceAll(
                      '_',
                      ' '
                    )}
                  </td>

                  <td className="py-4">
                    {member.last_login
                      ? new Date(
                          member.last_login
                        ).toLocaleString()
                      : 'Never'}
                  </td>

                  <td className="py-4">
                    {member.is_active ? (
                      <span className="text-green-600 font-medium">
                        Active
                      </span>
                    ) : (
                      <span className="text-red-600 font-medium">
                        Disabled
                      </span>
                    )}
                  </td>

                  <td className="py-4">
                    <div className="flex gap-2 flex-wrap">

                      <button
                        onClick={() =>
                          resetPassword(
                            member.id
                          )
                        }
                        className="bg-blue-600 text-white px-3 py-2 rounded"
                      >
                        Reset Password
                      </button>

                      {member.is_active ? (
                        <button
                          onClick={() =>
                            disableStaff(
                              member.id
                            )
                          }
                          className="bg-red-600 text-white px-3 py-2 rounded"
                        >
                          Disable
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            enableStaff(
                              member.id
                            )
                          }
                          className="bg-green-600 text-white px-3 py-2 rounded"
                        >
                          Enable
                        </button>
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