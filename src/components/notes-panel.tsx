"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ApiNote {
  id: number;
  text: string;
  createdAt: string;
}

export function NotesPanel({ leadId }: { leadId: number }) {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");

  const { data: notes } = useQuery<ApiNote[]>({
    queryKey: ["notes", leadId],
    queryFn: async () => {
      const res = await fetch(`/api/leads/${leadId}/notes`);
      if (!res.ok) throw new Error("Failed to load notes.");
      return res.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async (noteText: string) => {
      const res = await fetch(`/api/leads/${leadId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: noteText }),
      });
      if (!res.ok) throw new Error("Failed to add note.");
      return res.json();
    },
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({ queryKey: ["notes", leadId] });
    },
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Textarea
          placeholder="Add a note…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
        />
        <Button
          size="sm"
          className="self-end"
          disabled={!text.trim() || mutation.isPending}
          onClick={() => mutation.mutate(text.trim())}
        >
          {mutation.isPending ? "Saving…" : "Add note"}
        </Button>
      </div>

      {notes && notes.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {notes.map((note) => (
            <li key={note.id} className="rounded-md border p-3 text-sm">
              <p className="whitespace-pre-wrap">{note.text}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(note.createdAt).toLocaleString("de-DE")}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No notes yet.</p>
      )}
    </div>
  );
}
