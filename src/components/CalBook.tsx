export default function CalBook({
  slug,
  prefill
}: {
  slug: string;
  prefill?: { name?: string; email?: string };
}) {
  const team = 'zhengrowth';
  const params = new URLSearchParams(prefill as any).toString();
  const src = `https://cal.com/${team}/${slug}${params ? `?${params}` : ''}`;

  return (
    <iframe
      src={src}
      title="Schedule with ZhenGrowth"
      className="w-full h-[80svh] rounded-2xl border border-border"
      loading="lazy"
    />
  );
}
