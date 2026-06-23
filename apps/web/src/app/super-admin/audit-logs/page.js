'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/utils/api';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const res = await api.get(
        '/api/super_admin/audit-logs'
      );

      setLogs(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const formatMetadata = (metadata) => {
    if (!metadata) return '-';

    try {
      const parsed =
        typeof metadata === 'string'
          ? JSON.parse(metadata)
          : metadata;

      const entries = Object.entries(parsed);

      if (!entries.length) return '-';

      return entries.map(([key, value]) => (
        <div key={key}>
          <span className="font-medium">
            {key.replaceAll('_', ' ')}:
          </span>{' '}
          {String(value)}
        </div>
      ));
    } catch {
      return metadata;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl">
        Loading Audit Logs...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">
          Audit Logs
        </h1>

        <Link
          href="/super-admin"
          className="bg-slate-900 text-white px-5 py-3 rounded hover:bg-slate-800"
        >
          Back
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left py-4 px-2">
                  Time
                </th>

                <th className="text-left py-4 px-2">
                  Admin
                </th>

                <th className="text-left py-4 px-2">
                  Action
                </th>

                <th className="text-left py-4 px-2">
                  Target Type
                </th>

                <th className="text-left py-4 px-2">
                  Target ID
                </th>

                <th className="text-left py-4 px-2">
                  Details
                </th>
              </tr>
            </thead>

            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b hover:bg-slate-50"
                >
                  <td className="py-4 px-2">
                    {new Date(
                      log.created_at
                    ).toLocaleString()}
                  </td>

                  <td className="py-4 px-2">
                    {log.full_name}
                  </td>

                  <td className="py-4 px-2 capitalize">
                    {log.action.replaceAll(
                      '_',
                      ' '
                    )}
                  </td>

                  <td className="py-4 px-2">
                    {log.target_type}
                  </td>

                  <td className="py-4 px-2 text-xs">
                    {log.target_id}
                  </td>

                  <td className="py-4 px-2 text-sm">
                    {formatMetadata(log.metadata)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {logs.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              No audit logs found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}