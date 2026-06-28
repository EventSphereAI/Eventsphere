import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function QuickActionCard({
  href,
  title,
  description,
  icon: Icon,
  color = "from-cyan-400 to-green-400",
}) {
  return (
    <Link
      href={href}
      className="group bg-white border border-border rounded-2xl p-5 hover:shadow-soft hover:-translate-y-1 transition-all duration-300"
    >
      <div
        className={`
          w-12 h-12
          rounded-xl
          bg-gradient-to-r
          ${color}
          flex items-center justify-center
          text-white
        `}
      >
        <Icon size={22} />
      </div>

      <h3 className="mt-5 text-lg font-semibold text-text">
        {title}
      </h3>

      <p className="mt-2 text-sm text-muted">
        {description}
      </p>

      <div className="mt-5 flex items-center gap-2 text-primary font-medium">
        Open
        <ArrowRight
          size={18}
          className="group-hover:translate-x-1 transition"
        />
      </div>
    </Link>
  );
}