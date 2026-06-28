import { ArrowUpRight } from "lucide-react";

export default function StatCard({
  title,
  value,
  icon: Icon,
  color = "from-cyan-400 to-green-400",
}) {
  return (
    <div className="card hover:shadow-lg transition-all duration-300">

      <div className="flex justify-between items-start">

        <div>

          <p className="text-sm text-muted">
            {title}
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {value}
          </h2>

        </div>

        <div
          className={`
            w-12 h-12
            rounded-xl
            bg-gradient-to-r
            ${color}
            text-white
            flex
            items-center
            justify-center
          `}
        >
          <Icon size={22} />
        </div>

      </div>

      <div className="flex items-center gap-1 mt-6 text-sm text-green-600">

        <ArrowUpRight size={16} />

        Active

      </div>

    </div>
  );
}