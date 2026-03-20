import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// This matches our database schema
export type LogEntry = {
  id: string;
  userEmail: string;
  prompt: string;
  wasRedacted: boolean;
  redactedFields: string[];
  timestamp: string;
};

const PromptCell = ({ prompt }: { prompt: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger>
        <div 
          className="max-w-[400px] truncate font-mono text-xs cursor-pointer hover:text-blue-600 transition-colors"
          title="Click to view full prompt"
        >
          {prompt}
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Intercepted Prompt</DialogTitle>
        </DialogHeader>
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100 font-mono text-sm whitespace-pre-wrap break-words leading-relaxed text-gray-800">
          {prompt}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const columns: ColumnDef<LogEntry>[] = [
  {
    accessorKey: "timestamp",
    header: "Date",
    cell: ({ row }) => {
      return new Date(row.getValue("timestamp")).toLocaleString();
    }
  },
  {
    accessorKey: "userEmail",
    header: "User",
  },
  {
    accessorKey: "prompt",
    header: "Prompt Intercepted",
    cell: ({ row }) => {
      return <PromptCell prompt={row.getValue("prompt")} />;
    }
  },
  {
    accessorKey: "wasRedacted",
    header: "Status",
    cell: ({ row }) => {
      const wasRedacted = row.getValue("wasRedacted");
      return wasRedacted ? (
        <span className="text-red-600 font-bold flex items-center gap-1">
          Blocked
        </span>
      ) : (
        <span className="text-green-600 font-bold">Allowed</span>
      );
    }
  },
  {
    accessorKey: "redactedFields",
    header: "Violations",
    cell: ({ row }) => {
      const fields: string[] = row.getValue("redactedFields");
      if (!fields || fields.length === 0) return "-";
      return (
        <div className="flex gap-1 flex-wrap">
          {fields.map(field => (
            <Badge key={field} variant="destructive" className="text-[10px]">
              {field}
            </Badge>
          ))}
        </div>
      );
    }
  }
];
