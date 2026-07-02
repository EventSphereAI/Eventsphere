'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import { useAuth } from '@/context/AuthContext'; // Fix #15 — auth guard
import RoleGuard from '@/components/RoleGuard';
import { PERMISSIONS } from '@/config/permissions';

// Fix #12 — role options defined once, reused in both places
const ROLE_OPTIONS = [
  { value: 'registration_team', label: 'Registration Team' },
  { value: 'technical_team', label: 'Technical Team' },
  { value: 'food_staff', label: 'Food Staff' },
  { value: 'hospitality_team', label: 'Hospitality Team' },
  { value: 'logistics_team', label: 'Logistics Team' },
  { value: 'volunteer_coordinator', label: 'Volunteer Coordinator' },
  { value: 'volunteer', label: 'Volunteer' },
];

const PERMISSION_OPTIONS = [
  { value: "attendance", label: "Attendance" },
  { value: "registration", label: "Registration" },
  { value: "scanner", label: "Scanner" },
  { value: "food", label: "Food" },
  { value: "accommodation", label: "Accommodation" },
];

export default function StaffPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth(); // Fix #15 & #16 — auth + renamed to avoid clash

  const [staff, setStaff] = useState([]);
  const [events, setEvents] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true); // Fix #16 — renamed from 'loading'

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Create staff form
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Fix #7
  const [role, setRole] = useState('registration_team');
  const [createLoading, setCreateLoading] = useState(false); // Fix #6
  const [createError, setCreateError] = useState('');        // Fix #1 & #18
  const [createSuccess, setCreateSuccess] = useState('');    // Fix #1

  // Fix #2 & #17 — inline password reset state instead of prompt()
  const [resetStaffId, setResetStaffId] = useState(null);
  const [resetPassword, setResetPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  // Global error state
  const [loadError, setLoadError] = useState('');   // Fix #5 & #18
  const [actionError, setActionError] = useState(''); // Fix #1 & #18
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  // Fix #15 — auth redirect
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

useEffect(() => {
  if (!authLoading && user) {
    loadStaff();
    loadEvents();
  }
}, [authLoading, user]);

  const loadStaff = async () => {
    try {
      setStaffLoading(true);
      setLoadError('');
      const { data } = await api.get('/api/staff'); // untouched
      setStaff(data || []); // Fix #14 — || [] fallback
    } catch (err) {
      console.error(err);
      setLoadError('Failed to load staff. Please refresh.'); // Fix #5 — no alert()
    } finally {
      setStaffLoading(false);
    }
  };

  const loadEvents = async () => {
  try {
    const { data } = await api.get("/api/events/");

  

    setEvents(data.events || data || []);
  } catch (err) {
    console.error(err);
  }
};

  const createStaff = async () => {
    setCreateError('');
    setCreateSuccess('');

    // Fix #3 — trim and validate before submit
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password || !role) {
      setCreateError('Please fill all fields.'); // Fix #1 — no alert()
      return;
    }

    if (password.length < 8) {
      setCreateError('Password must be at least 8 characters.');
      return;
    }

    if (selectedPermissions.length === 0) {
  setCreateError("Select at least one permission.");
  return;
}

if (selectedEvents.length === 0) {
  setCreateError("Select at least one event.");
  return;
}

    try {
      setCreateLoading(true); // Fix #6
      await api.post("/api/staff", {
  full_name: trimmedName,
  email: trimmedEmail,
  password,
  role,

  permissions: selectedPermissions,

  event_ids: selectedEvents,
});

      setFullName('');
      setEmail('');
      setPassword('');
      setRole('registration_team');
      setSelectedPermissions([]);
      setSelectedEvents([]);
      setCreateSuccess('Staff member created successfully.'); // Fix #1 — no alert()
      await loadStaff();
    } catch (err) {
      console.error(err);
      setCreateError(
        err.response?.data?.detail || 'Failed to create staff.' // Fix #1 — no alert()
      );
    } finally {
      setCreateLoading(false); // Fix #6
    }
  };

  const disableStaff = async (staffId) => {
    // Fix #4 — confirmation before disable
    if (!window.confirm('Are you sure you want to disable this staff member?')) return;
    try {
      setActionError('');
      await api.patch(`/api/staff/${staffId}/disable`); // untouched
      await loadStaff();
    } catch (err) {
      console.error(err);
      setActionError('Failed to disable staff member.'); // Fix #1 — no alert()
    }
  };

  const enableStaff = async (staffId) => {
    // Fix #4 — confirmation before enable
    if (!window.confirm('Are you sure you want to enable this staff member?')) return;
    try {
      setActionError('');
      await api.patch(`/api/staff/${staffId}/enable`); // untouched
      await loadStaff();
    } catch (err) {
      console.error(err);
      setActionError('Failed to enable staff member.'); // Fix #1 — no alert()
    }
  };

  // Fix #2 & #17 — open inline reset form instead of prompt()
  const openResetPassword = (staffId) => {
    setResetStaffId(staffId);
    setResetPassword('');
    setResetError('');
    setShowResetPassword(false);
  };

  const submitResetPassword = async () => {
    // Fix #11 — min length validation
    if (resetPassword.length < 8) {
      setResetError('New password must be at least 8 characters.');
      return;
    }

    try {
      setResetLoading(true);
      setResetError('');
      await api.patch(`/api/staff/${resetStaffId}/reset-password`, { // untouched
        password: resetPassword,
      });
      setResetStaffId(null);
      setResetPassword('');
    } catch (err) {
      console.error(err);
      setResetError('Failed to reset password. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const filteredStaff = staff.filter((member) => {
    const matchesSearch =
      member.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      member.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !roleFilter || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const activeStaff = staff.filter((s) => s.is_active).length;
  const disabledStaff = staff.filter((s) => !s.is_active).length;

  if (authLoading || staffLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl">
        Loading Staff...
      </div>
    );
  }

  if (!user) return null;

  return (
    <RoleGuard allowedRoles={PERMISSIONS.STAFF_MANAGEMENT}>
      <div className="min-h-screen bg-slate-100 p-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Staff Management</h1>
          <button
            onClick={() => router.push('/dashboard')} // untouched
            className="bg-slate-900 text-white px-5 py-3 rounded"
          >
            Dashboard
          </button>
        </div>

        {/* Fix #5 & #18 — persistent error states */}
        {loadError && (
          <div className="mb-6 p-3 bg-red-100 text-red-700 rounded border border-red-300 flex justify-between items-center">
            <span>{loadError}</span>
            <button onClick={loadStaff} className="text-sm underline ml-4">Retry</button>
          </div>
        )}
        {actionError && (
          <div className="mb-6 p-3 bg-red-100 text-red-700 rounded border border-red-300">
            {actionError}
          </div>
        )}

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow">
            <p className="text-gray-500">Total Staff</p>
            <h2 className="text-4xl font-bold">{staff.length}</h2>
          </div>
          <div className="bg-white p-6 rounded-xl shadow">
            <p className="text-gray-500">Active Staff</p>
            <h2 className="text-4xl font-bold text-green-600">{activeStaff}</h2>
          </div>
          <div className="bg-white p-6 rounded-xl shadow">
            <p className="text-gray-500">Disabled Staff</p>
            <h2 className="text-4xl font-bold text-red-600">{disabledStaff}</h2>
          </div>
        </div>

        {/* Create Staff Form */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">Add Staff Member</h2>

          {/* Fix #1 & #18 — inline success/error */}
          {createSuccess && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded border border-green-300">
              {createSuccess}
            </div>
          )}
          {createError && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">
              {createError}
            </div>
          )}

          <div className="grid md:grid-cols-4 gap-4">

            {/* Fix #8 — labels for all inputs */}
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setCreateError(''); }}
                className="w-full border rounded p-3"
                maxLength={100} // Fix #13
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setCreateError(''); }}
                className="w-full border rounded p-3"
                maxLength={200} // Fix #13
              />
            </div>

            {/* Fix #7 — show/hide password */}
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setCreateError(''); }}
                  className="w-full border rounded p-3 pr-10"
                  maxLength={200} // Fix #13
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              {/* Fix #12 — uses shared ROLE_OPTIONS */}
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full border rounded p-3"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

          </div>

          <div className="mt-6 grid md:grid-cols-2 gap-8">

  {/* Permissions */}

  <div>

    <label className="block font-medium mb-3">
      Permissions
    </label>

    <div className="space-y-2">

      {PERMISSION_OPTIONS.map((permission) => (

        <label
          key={permission.value}
          className="flex items-center gap-2"
        >

          <input
            type="checkbox"
            checked={selectedPermissions.includes(permission.value)}
            onChange={(e) => {

              if (e.target.checked) {

                setSelectedPermissions([
                  ...selectedPermissions,
                  permission.value,
                ]);

              } else {

                setSelectedPermissions(
                  selectedPermissions.filter(
                    (p) => p !== permission.value
                  )
                );

              }

            }}
          />

          {permission.label}

        </label>

      ))}

    </div>

  </div>

  {/* Assigned Events */}

  <div>

    <label className="block font-medium mb-3">
      Assigned Events
    </label>

    <div className="space-y-2 max-h-56 overflow-y-auto border rounded p-3">

      {events.map((event) => (

        <label
          key={event.id}
          className="flex items-center gap-2"
        >

          <input
            type="checkbox"
            checked={selectedEvents.includes(event.id)}
            onChange={(e) => {

              if (e.target.checked) {

                setSelectedEvents([
                  ...selectedEvents,
                  event.id,
                ]);

              } else {

                setSelectedEvents(
                  selectedEvents.filter(
                    (id) => id !== event.id
                  )
                );

              }

            }}
          />

          {event.title}

        </label>

      ))}

    </div>

  </div>

</div>



          {/* Fix #6 — loading state on button */}
          <button
            onClick={createStaff}
            disabled={createLoading}
            className="mt-4 bg-blue-600 text-white px-5 py-3 rounded disabled:opacity-60 flex items-center gap-2"
          >
            {createLoading && (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            )}
            {createLoading ? 'Creating...' : 'Create Staff'}
          </button>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Search</label>
              <input
                type="text"
                placeholder="Search by name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border rounded p-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Filter by Role</label>
              {/* Fix #12 — uses shared ROLE_OPTIONS */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full border rounded p-3"
              >
                <option value="">All Roles</option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Staff Table */}
        <div className="bg-white rounded-xl shadow p-6">

          {/* Fix #10 — staff count in header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Staff Members</h2>
            <span className="text-sm text-gray-500">
              Showing {filteredStaff.length} of {staff.length} members
            </span>
          </div>

          {/* Fix #2 & #17 — inline password reset form instead of prompt() */}
          {resetStaffId && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <h3 className="font-semibold mb-3">Reset Password</h3>
              {resetError && (
                <p className="text-red-600 text-sm mb-2">{resetError}</p>
              )}
              <div className="flex gap-3 items-center flex-wrap">
                <div className="relative">
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    placeholder="New password (min 8 chars)"
                    value={resetPassword}
                    onChange={(e) => { setResetPassword(e.target.value); setResetError(''); }}
                    className="border rounded p-2 pr-10 w-64"
                    maxLength={200}
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword((p) => !p)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm"
                  >
                    {showResetPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                <button
                  onClick={submitResetPassword}
                  disabled={resetLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
                >
                  {resetLoading ? 'Saving...' : 'Save Password'}
                </button>
                <button
                  onClick={() => { setResetStaffId(null); setResetPassword(''); setResetError(''); }}
                  className="px-4 py-2 rounded border text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">Name</th>
                  <th className="text-left py-3">Email</th>
                  <th className="text-left py-3">Role</th>
                  <th className="text-left py-3">Last Login</th>
                  <th className="text-left py-3">Status</th>
                  <th className="text-left py-3">Actions</th>
                </tr>
              </thead>
              <tbody>

                {/* Fix #9 — empty state */}
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      {search || roleFilter
                        ? 'No staff members match your search.'
                        : 'No staff members yet. Add one above.'}
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((member) => (
                    <tr
                      key={member.id}
                      className="border-b hover:bg-slate-50"
                    >
                      <td className="py-4">{member.full_name}</td>
                      <td className="py-4">{member.email}</td>
                      <td className="py-4 capitalize">
                        {member.role.replaceAll('_', ' ')} {/* untouched */}
                      </td>
                      <td className="py-4">
                        {member.last_login
                          ? new Date(member.last_login).toLocaleString()
                          : 'Never'}
                      </td>
                      <td className="py-4">
                        {member.is_active ? (
                          <span className="text-green-600 font-medium">Active</span>
                        ) : (
                          <span className="text-red-600 font-medium">Disabled</span>
                        )}
                      </td>
                      <td className="py-4">
                        <div className="flex gap-2 flex-wrap">

                          {/* Fix #2 — opens inline form instead of prompt() */}
                          <button
                            onClick={() => openResetPassword(member.id)}
                            className="bg-blue-600 text-white px-3 py-2 rounded"
                          >
                            Reset Password
                          </button>

                          {member.is_active ? (
                            <button
                              onClick={() => disableStaff(member.id)} // untouched
                              className="bg-red-600 text-white px-3 py-2 rounded"
                            >
                              Disable
                            </button>
                          ) : (
                            <button
                              onClick={() => enableStaff(member.id)} // untouched
                              className="bg-green-600 text-white px-3 py-2 rounded"
                            >
                              Enable
                            </button>
                          )}

                        </div>
                      </td>
                    </tr>
                  ))
                )}

              </tbody>
            </table>
          </div>
        </div>

      </div>
    </RoleGuard>
  );
}