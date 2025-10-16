import { useEffect, useState } from 'react';

export function useExperiment(
  profileId: string,
  key: string,
  variants: string[] = ['A', 'B']
): string {
  const [variant, setVariant] = useState<string>('A');

  useEffect(() => {
    const storageKey = `exp.${key}.${profileId}`;
    let current = localStorage.getItem(storageKey);

    if (!current) {
      // Assign random variant
      current = variants[Math.floor(Math.random() * variants.length)];
      localStorage.setItem(storageKey, current);
    }

    setVariant(current);
  }, [profileId, key, variants]);

  return variant;
}
