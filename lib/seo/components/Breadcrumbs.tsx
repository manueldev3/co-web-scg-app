import { JsonLd } from "./JsonLd";
import { buildBreadcrumbSchema, BreadcrumbItem } from "../schemas";

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const schema = buildBreadcrumbSchema(items) as Record<string, unknown>;

  return (
    <>
      <JsonLd data={schema} />
      <nav aria-label="Breadcrumb" className="text-sm text-[#BCBEC0] py-2 px-4">
        <ol className="flex flex-wrap gap-1 list-none p-0 m-0">
          {items.map((item, i) => {
            const isLast = i === items.length - 1;
            return (
              <li key={item.href} className="flex items-center gap-1">
                {i > 0 && <span aria-hidden="true">/</span>}
                {isLast ? (
                  <span aria-current="page" className="text-[#9ED0FA]">
                    {item.label}
                  </span>
                ) : (
                  <a href={item.href} className="hover:text-[#9ED0FA] transition-colors">
                    {item.label}
                  </a>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
