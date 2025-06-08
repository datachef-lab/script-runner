import { ScriptLayout } from "@/components/layouts/script-layout";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function WebScrapeMarksScriptPage() {
  const [baseUrl, setBaseUrl] = useState("");

  return (
    <ScriptLayout
      title="Web Scrape Marks Script"
      description="Automatically scrapes and extracts marks data from web sources using browser automation."
      scriptName="web-scrape-marks"
      additionalInputs={
        <div className="space-y-2">
          <Label htmlFor="base-url" className="text-muted-foreground">Base URL</Label>
          <Input
            id="base-url"
            type="url"
            placeholder="Enter the base URL for scraping"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            required
          />
        </div>
      }
    />
  );
}
