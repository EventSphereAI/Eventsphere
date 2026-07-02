'use client';

export default function DashboardHeader({
  title,
  subtitle,
  user,
}) {
  const hour = new Date().getHours();

  let greeting = "Good Evening";

  if (hour < 12) greeting = "Good Morning";
  else if (hour < 17) greeting = "Good Afternoon";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">

        <div>

          <h1 className="text-4xl font-bold text-slate-900">
            {greeting}, {user?.full_name} 👋
          </h1>

          <p className="text-slate-500 mt-3 text-lg">
            {subtitle}
          </p>

        </div>

        <div className="mt-6 lg:mt-0">

          <div className="inline-flex items-center rounded-full bg-violet-100 px-4 py-2">

            <span className="text-violet-700 font-semibold">

              {title}

            </span>

          </div>

        </div>

      </div>

    </div>
  );
}