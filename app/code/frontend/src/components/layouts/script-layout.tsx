import { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
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
import { io, Socket } from 'socket.io-client';
import { Switch } from "@/components/ui/switch";

interface ScriptLayoutProps {
  title: string;
  description: string;
  scriptName: string;
  acceptedFileTypes?: string;
  steps?: string[];
  templateUrl?: string;
  additionalInputs?: React.ReactNode;
}

interface OutputItem {
  type: "stdout" | "stderr";
  data: string;
  timestamp: string;
}

interface ScriptCompleteData {
  success: boolean;
  message: string;
  outputFile?: string;
  logFile?: string;
  error?: string;
  code?: number;
}

export function ScriptLayout({ 
  title, 
  description, 
  scriptName,
  acceptedFileTypes = ".xlsx,.xls,.csv,.txt",
  steps = [],
  templateUrl,
  additionalInputs
}: ScriptLayoutProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<OutputItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [totalEntries, setTotalEntries] = useState<number | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null);
  const [remainingTimeInSeconds, setRemainingTimeInSeconds] = useState<number | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const outputEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:8080', {
      withCredentials: true
    });

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
    });

    newSocket.on('script-output', (data: OutputItem) => {
      setOutput((prevOutput) => [...prevOutput, { ...data, timestamp: new Date().toLocaleTimeString() }]);
    });

    newSocket.on('script-complete', (data: ScriptCompleteData) => {
      setIsRunning(false);
      setOutput((prevOutput) => [
        ...prevOutput,
        { type: "stdout", data: "Script execution complete.", timestamp: new Date().toLocaleTimeString() },
      ]);
      console.log("Script completed:", data);
      // You can add further logic here based on completion data (e.g., show download links)
    });

    newSocket.on('connect_error', (err) => {
      console.error("Socket connection error:", err.message);
      setOutput((prevOutput) => [
        ...prevOutput,
        { type: "stderr", data: `Socket connection error: ${err.message}`, timestamp: new Date().toLocaleTimeString() },
      ]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (outputEndRef.current) {
      outputEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [output]);

  useEffect(() => {
    if (totalEntries !== null && totalEntries > 0) {
      const averageTimePerEntry = 2; // seconds, based on default delay in main.py
      const initialTotalSeconds = totalEntries * averageTimePerEntry;
      setRemainingTimeInSeconds(initialTotalSeconds);
    } else {
      setRemainingTimeInSeconds(null);
    }
  }, [totalEntries]);

  useEffect(() => {
    if (isRunning && remainingTimeInSeconds !== null && remainingTimeInSeconds > 0) {
      const timer = setInterval(() => {
        setRemainingTimeInSeconds((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
      return () => clearInterval(timer);
    } else if (!isRunning && remainingTimeInSeconds !== null && remainingTimeInSeconds <= 0) {
      setRemainingTimeInSeconds(0); // Ensure it doesn't go negative and stops at 0
    }
  }, [isRunning, remainingTimeInSeconds]);

  useEffect(() => {
    if (remainingTimeInSeconds !== null) {
      if (remainingTimeInSeconds < 3600) { // Less than 1 hour
        const minutes = Math.floor(remainingTimeInSeconds / 60);
        const seconds = remainingTimeInSeconds % 60;
        let timeString = `${minutes} minute${minutes === 1 ? '' : 's'}`;
        if (seconds > 0) {
          timeString += ` ${seconds} second${seconds === 1 ? '' : 's'}`;
        }
        setEstimatedTime(timeString);
      } else {
        const hours = (remainingTimeInSeconds / 3600).toFixed(1);
        setEstimatedTime(`${hours} hour${parseFloat(hours) === 1 ? '' : 's'}`);
      }
    } else {
      setEstimatedTime(null);
    }
  }, [remainingTimeInSeconds]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setOutput((prev) => [...prev, { type: "stdout", data: `Selected file: ${file.name}`, timestamp: new Date().toLocaleTimeString() }]);
      
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          setTotalEntries(json.length);
        };
        reader.readAsArrayBuffer(file);
      } catch (error) {
        console.error("Error reading Excel file:", error);
        setOutput((prev) => [...prev, { type: "stderr", data: `Error reading Excel file: ${error instanceof Error ? error.message : String(error)}`, timestamp: new Date().toLocaleTimeString() }]);
        setTotalEntries(null);
      }
    }
  };

  const handleRunScript = async () => {
    if (!selectedFile) {
      setOutput((prev) => [...prev, { type: "stderr", data: "Error: Please select a file first", timestamp: new Date().toLocaleTimeString() }]);
      return;
    }

    setIsRunning(true);
    setOutput((prev) => [...prev, { type: "stdout", data: "Starting script execution...", timestamp: new Date().toLocaleTimeString() }]);
    
    // Reset remaining time on script run
    if (totalEntries !== null) {
      const averageTimePerEntry = 2; // seconds, based on default delay in main.py
      const initialTotalSeconds = totalEntries * averageTimePerEntry;
      setRemainingTimeInSeconds(initialTotalSeconds);
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("baseUrl", "https://results.indiaresults.com/wb/caluniv/b.a-b.sc-semester-iii-2024/result.asp?rollno="); // Example base URL

    try {
      const response = await fetch(`http://localhost:8080/api/web-scrape-marks`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to run script");
      }

      const result = await response.json();
      console.log('Script execution started:', result);
    } catch (error: any) {
      setOutput((prev) => [...prev, { type: "stderr", data: `Error: ${error?.message || 'An unknown error occurred'}`, timestamp: new Date().toLocaleTimeString() }]);
      setIsRunning(false);
    }
  };

  const handleTerminateScript = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/web-scrape-marks/terminate`, {
        method: "POST",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to terminate script");
      }
      setOutput((prev) => [...prev, { type: "stdout", data: "Script execution terminated.", timestamp: new Date().toLocaleTimeString() }]);
      setIsRunning(false);
    } catch (error: any) {
      setOutput((prev) => [...prev, { type: "stderr", data: `Error terminating script: ${error?.message || 'An unknown error occurred'}`, timestamp: new Date().toLocaleTimeString() }]);
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
      <div className="flex flex-1 gap-6 p-6 min-h-0">
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
                {additionalInputs}
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
                    {estimatedTime && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Estimated time: {estimatedTime}
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
                    onClick={handleTerminateScript}
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
        <div className="flex-1 flex flex-col">
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-xl font-bold">Script Output</CardTitle>
              {(estimatedTime || totalEntries !== null) && (
                <div className="text-sm text-muted-foreground flex items-center space-x-4">
                  {totalEntries !== null && totalEntries > 0 && (
                    <span className="font-bold text-green-500">Average Time/Entry: 2 seconds</span>
                  )}
                  {estimatedTime && (
                    <span className="font-bold text-red-500">Estimated Total: {estimatedTime}</span>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-4 overflow-y-auto min-h-0 bg-white text-gray-900 font-mono text-sm rounded-lg shadow-inner h-0">
              <div className="whitespace-pre-wrap">
                {output.length === 0 ? (
                  <p className="text-gray-500">Script output will appear here...</p>
                ) : (
                  output.map((item, index) => (
                    <p key={index} className={`whitespace-pre-wrap ${item.type === "stderr" ? "text-red-600" : "text-gray-900"}`}>
                      {item.data}
                    </p>
                  ))
                )}
                <div ref={outputEndRef} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 