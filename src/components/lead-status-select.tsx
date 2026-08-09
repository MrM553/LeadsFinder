"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LEAD_STATUSES, type LeadStatus } from "@/types/lead";

export function LeadStatusSelect({ leadId, status }: { leadId: number; status: LeadStatus }) {
  const queryClient = useQueryClient();
  const [current, setCurrent] = useState(status);

  const mutation = useMutation({
    mutationFn: async (newStatus: LeadStatus) => {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status.");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
    },
    onError: () => setCurrent(status),
  });

  return (
    <Select
      value={current}
      onValueChange={(value) => {
        if (value === null) return;
        setCurrent(value as LeadStatus);
        mutation.mutate(value as LeadStatus);
      }}
    >
      <SelectTrigger size="sm" className="w-[150px]">
        <SelectValue>{current.replace("_", " ")}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {LEAD_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {s.replace("_", " ")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
