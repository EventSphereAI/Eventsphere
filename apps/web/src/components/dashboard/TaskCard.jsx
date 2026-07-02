'use client';

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function TaskCard({
  title,
  description,
  href,
}) {
  return (
    <Link href={href}>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition">

        <h3 className="font-semibold text-xl">
          {title}
        </h3>

        <p className="text-slate-500 mt-2">
          {description}
        </p>

        <div className="flex items-center gap-2 mt-6 text-violet-600 font-semibold">

          Open

          <ArrowRight size={18} />

        </div>

      </div>

    </Link>
  );
}