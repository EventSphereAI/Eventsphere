import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function QuickActionCard({
  href,
  title,
  description,
  icon: Icon,
  color = "from-cyan-500 to-blue-500",
}) {
  return (
    <Link
      href={href}
      className="
        group
        rounded-2xl
        border
        border-border
        bg-white
        p-6
        transition-all
        duration-300
        hover:border-cyan-200
        hover:shadow-xl
        hover:-translate-y-1
      "
    >
      <div
        className={`
          h-14
          w-14
          rounded-2xl
          bg-gradient-to-br
          ${color}
          flex
          items-center
          justify-center
          shadow-md
        `}
      >
        <Icon
          size={24}
          className="text-white"
        />
      </div>

      <h3 className="mt-6 text-lg font-semibold text-text">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-muted">
        {description}
      </p>

      <div className="mt-6 flex items-center text-primary font-semibold">
        Open

        <ArrowRight
          size={18}
          className="
            ml-2
            transition-transform
            duration-300
            group-hover:translate-x-1
          "
        />
      </div>
    </Link>
  );
}