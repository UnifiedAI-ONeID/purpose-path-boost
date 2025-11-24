
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminSEO } from "@/hooks/useAdminSEO";
import { toast } from "sonner";

export default function AdminSEO() {
  const { seoConfig, setSeoConfig, saveSEOConfig, loading } = useAdminSEO();

  const handleSave = async () => {
    try {
      await saveSEOConfig(seoConfig);
      toast.success("SEO settings saved successfully");
    } catch (error) {
      toast.error("Failed to save SEO settings");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>SEO Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Default Title</Label>
          <Input
            id="title"
            value={seoConfig.title || ""}
            onChange={(e) => setSeoConfig({ ...seoConfig, title: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Default Description</Label>
          <Input
            id="description"
            value={seoConfig.description || ""}
            onChange={(e) =>
              setSeoConfig({ ...seoConfig, description: e.target.value })
            }
          />
        </div>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </Button>
      </CardContent>
    </Card>
  );
}
