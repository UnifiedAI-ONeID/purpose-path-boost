
import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase/config";

export interface SEOConfig {
  title: string;
  description: string;
}

export function useAdminSEO() {
  const [seoConfig, setSeoConfig] = useState<SEOConfig>({ title: "", description: "" });
  const [loading, setLoading] = useState(true);
  const seoConfigRef = doc(db, "settings", "seo");

  useEffect(() => {
    const fetchSEOConfig = async () => {
      try {
        const docSnap = await getDoc(seoConfigRef);
        if (docSnap.exists()) {
          setSeoConfig(docSnap.data() as SEOConfig);
        }
      } catch (error) {
        console.error("Error fetching SEO config:", error);
      }
      setLoading(false);
    };
    fetchSEOConfig();
  }, []);

  const saveSEOConfig = async (newConfig: SEOConfig) => {
    setLoading(true);
    try {
      await setDoc(seoConfigRef, newConfig);
      setSeoConfig(newConfig);
    } catch (error) {
      console.error("Error saving SEO config:", error);
      throw error;
    }
    setLoading(false);
  };

  return { seoConfig, setSeoConfig, saveSEOConfig, loading };
}
