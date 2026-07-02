'use client';

export default function DashboardSection({
  title,
  children,
}) {
  return (
    <section className="mt-10">

      <h2 className="text-2xl font-bold mb-6">
        {title}
      </h2>

      {children}

    </section>
  );
}