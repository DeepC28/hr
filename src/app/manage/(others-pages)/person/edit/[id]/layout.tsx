import Tabs from "./tabs-client";

export default function EditLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const id = params.id;

  return (
    <div className="grid gap-4">
      {/* Client tabs */}
      <Tabs id={id} />

      {/* content */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
        {children}
      </div>
    </div>
  );
}
