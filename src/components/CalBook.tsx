interface CalBookProps {
  slug: string;
  prefill?: {
    name?: string;
    email?: string;
  };
}

export default function CalBook({ slug, prefill }: CalBookProps) {
  const team = 'zhengrowth';

  const params = new URLSearchParams();
  if (prefill?.name) {
    params.append('name', prefill.name);
  }
  if (prefill?.email) {
    params.append('email', prefill.email);
  }
  const paramsString = params.toString();

  const src = `https://cal.com/${team}/${slug}${paramsString ? `?${paramsString}` : ''}`;

  return (
    <iframe
      src={src}
      title="Schedule with ZhenGrowth"
      className="w-full h-[80svh] rounded-2xl border border-border"
      loading="lazy"
    />
  );
}
