import { useState } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Play, StopCircle, Upload, FileText, Download, Info } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import * as XLSX from 'xlsx';

interface ScriptLayoutProps {
  title: string;
  description: string;
  scriptName: string;
  acceptedFileTypes?: string;
  steps?: string[];
  templateUrl?: string;
}

export function ScriptLayout({ 
  title, 
  description, 
  scriptName,
  acceptedFileTypes = ".xlsx,.xls,.csv,.txt",
  steps = [],
  templateUrl
}: ScriptLayoutProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [totalEntries, setTotalEntries] = useState<number | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setOutput((prev) => [...prev, `Selected file: ${file.name}`]);
      
      try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        setTotalEntries(data.length);
      } catch (error) {
        console.error('Error reading file:', error);
        setTotalEntries(null);
      }
    }
  };

  const handleRunScript = async () => {
    if (!selectedFile) {
      setOutput((prev) => [...prev, "Error: Please select a file first"]);
      return;
    }

    setIsRunning(true);
    setOutput((prev) => [...prev, "Starting script execution..."]);
    
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(`/api/scripts/${scriptName}/run`, {
        method: "POST",
        body: formData,
      });
      
      const reader = response.body?.getReader();
      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const text = new TextDecoder().decode(value);
        setOutput((prev) => [...prev, text]);
      }
    } catch (error: any) {
      setOutput((prev) => [...prev, `Error: ${error?.message || 'An unknown error occurred'}`]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleTerminate = async () => {
    try {
      await fetch(`/api/scripts/${scriptName}/terminate`, {
        method: "POST",
      });
      setOutput((prev) => [...prev, "Script execution terminated."]);
    } catch (error: any) {
      setOutput((prev) => [...prev, `Error terminating script: ${error?.message || 'An unknown error occurred'}`]);
    }
  };

  const handleDownloadTemplate = () => {
    if (templateUrl) {
      window.open(templateUrl, '_blank');
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-background/95">
      {/* Header */}
      <div className="border-b bg-card/50 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-card-foreground">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
          {steps.length > 0 && (
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 hover:bg-primary/10"
                >
                  <Info className="h-4 w-4 text-primary" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold">How it works</DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                  <ol className="space-y-3">
                    {steps.map((step, index) => (
                      <li key={index} className="flex gap-3 text-sm">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                          {index + 1}
                        </span>
                        <span className="text-muted-foreground">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 gap-6 p-6">
        {/* Left Panel - File Upload */}
        <div className="w-[400px]">
          <Card className="h-full border-muted/50 bg-card/50 shadow-sm">
            <div className="border-b bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-medium text-card-foreground">Input File</h2>
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file-upload" className="text-muted-foreground">Select a file to process</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept={acceptedFileTypes}
                    onChange={handleFileChange}
                    disabled={isRunning}
                    className="border-muted/50 bg-background/50"
                  />
                </div>
                {selectedFile && (
                  <div className="rounded-md bg-muted/30 p-3">
                    <p className="text-sm font-medium text-card-foreground">Selected file:</p>
                    <p className="text-sm text-muted-foreground">{selectedFile.name}</p>
                    {totalEntries !== null && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Total entries: {totalEntries}
                      </p>
                    )}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={handleRunScript}
                    disabled={isRunning || !selectedFile}
                    className="flex-1 gap-2 bg-primary hover:bg-primary/90"
                  >
                    <Play className="h-4 w-4" />
                    Run Script
                  </Button>
                  <Button
                    onClick={handleTerminate}
                    disabled={!isRunning}
                    variant="destructive"
                    className="gap-2 bg-destructive/90 hover:bg-destructive"
                  >
                    <StopCircle className="h-4 w-4" />
                    Terminate
                  </Button>
                </div>
                {templateUrl && (
                  <Button
                    onClick={handleDownloadTemplate}
                    variant="outline"
                    className="w-full gap-2 border-muted/50 bg-background/50 hover:bg-muted/50"
                  >
                    <Download className="h-4 w-4" />
                    Download Template
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Panel - Output */}
        <div className="flex-1">
          <Card className="h-full border-muted/50 bg-card/50 shadow-sm">
            <div className="border-b bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-medium text-card-foreground">Script Output</h2>
              </div>
            </div>
            <div className="h-[calc(100%-2.5rem)] overflow-y-auto bg-muted/20 p-4 font-mono text-sm">
              {output.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Script output will appear here...
                </div>
              ) : (
                output.map((line, i) => (
                  <div 
                    key={i} 
                    className={`whitespace-pre-wrap ${
                      line.startsWith("Error:") 
                        ? "text-destructive" 
                        : "text-card-foreground"
                    }`}
                  >
                    {line}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 