import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { fetchProfiles, fetchTasks, type TaskRow } from "@/lib/events";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const inputClass =
  "rounded-md border border-input bg-canvas px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

export function EventChecklist({ eventId }: { eventId: string }) {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [responsible, setResponsible] = useState("");
  const [parentId, setParentId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", eventId],
    queryFn: () => fetchTasks(eventId),
  });
  const { data: profiles = [] } = useQuery({ queryKey: ["profiles"], queryFn: fetchProfiles });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["tasks", eventId] });

  const createTask = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("tasks").insert({
        event_id: eventId,
        title: title.trim(),
        responsible_user_id: responsible || null,
        parent_task_id: parentId || null,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await invalidate();
      setTitle("");
      setResponsible("");
      setParentId("");
      setAdding(false);
      toast.success("Tarefa adicionada");
    },
    onError: () => toast.error("Não foi possível adicionar a tarefa."),
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<TaskRow> }) => {
      const { error } = await supabase.from("tasks").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
    onError: () => toast.error("Não foi possível salvar a alteração."),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await invalidate();
      toast.success("Tarefa excluída");
    },
    onError: () => toast.error("Não foi possível excluir a tarefa."),
  });

  const parents = tasks.filter((t) => !t.parent_task_id);
  const nameOf = (id: string | null) => profiles.find((p) => p.id === id)?.name ?? null;

  function TaskLine({ task, isSub }: { task: TaskRow; isSub?: boolean }) {
    const editing = editingId === task.id;
    return (
      <div className={cn("group", task.completed && "opacity-50")}>
        <div className="flex items-start gap-4">
          <button
            aria-label="Concluir tarefa"
            onClick={() => updateTask.mutate({ id: task.id, values: { completed: !task.completed } })}
            className={cn(
              "mt-1 flex size-4 shrink-0 items-center justify-center rounded-[3px] border border-input",
              task.completed && "bg-muted",
            )}
          >
            {task.completed ? <span className="size-2 rounded-[1px] bg-confirm" /> : null}
          </button>

          {editing ? (
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <input
                autoFocus
                defaultValue={task.title}
                onBlur={(e) => {
                  const value = e.target.value.trim();
                  if (value && value !== task.title)
                    updateTask.mutate({ id: task.id, values: { title: value } });
                  setEditingId(null);
                }}
                className={cn(inputClass, "flex-1")}
              />
              <select
                value={task.responsible_user_id ?? ""}
                onChange={(e) =>
                  updateTask.mutate({
                    id: task.id,
                    values: { responsible_user_id: e.target.value || null },
                  })
                }
                className={inputClass}
              >
                <option value="">Sem responsável</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {!isSub ? null : (
                <select
                  value={task.parent_task_id ?? ""}
                  onChange={(e) =>
                    updateTask.mutate({
                      id: task.id,
                      values: { parent_task_id: e.target.value || null },
                    })
                  }
                  className={inputClass}
                >
                  <option value="">Tarefa principal</option>
                  {parents
                    .filter((p) => p.id !== task.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        Subtarefa de: {p.title}
                      </option>
                    ))}
                </select>
              )}
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-between gap-3">
              <span
                className={cn(
                  "text-sm",
                  isSub ? "text-muted-foreground" : "font-medium",
                  task.completed && "line-through",
                )}
              >
                {task.title}
              </span>
              <div className="flex items-center gap-3">
                {nameOf(task.responsible_user_id) ? (
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {nameOf(task.responsible_user_id)}
                  </span>
                ) : null}
                <button
                  aria-label="Editar tarefa"
                  onClick={() => setEditingId(task.id)}
                  className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  aria-label="Excluir tarefa"
                  onClick={() => setDeleteId(task.id)}
                  className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between border-b border-foreground/10 pb-4">
        <h2 className="font-display text-xl font-medium">Checklist</h2>
        <button
          onClick={() => setAdding((v) => !v)}
          className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-accent"
        >
          <Plus className="size-3" /> Adicionar tarefa
        </button>
      </div>

      {adding ? (
        <form
          className="mb-8 flex flex-wrap items-center gap-2 rounded-md border border-dashed border-border p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (title.trim()) createTask.mutate();
          }}
        >
          <input
            autoFocus
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nome da tarefa"
            className={cn(inputClass, "min-w-48 flex-1")}
          />
          <select
            value={responsible}
            onChange={(e) => setResponsible(e.target.value)}
            className={inputClass}
          >
            <option value="">Responsável</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className={inputClass}
          >
            <option value="">Tarefa principal</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>
                Subtarefa de: {p.title}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Salvar
          </button>
        </form>
      ) : null}

      {tasks.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-foreground/[0.02] p-4">
          <p className="label-caps text-center">Este evento ainda não tem tarefas</p>
        </div>
      ) : (
        <div className="space-y-6">
          {parents.map((task) => (
            <div key={task.id}>
              <TaskLine task={task} />
              {tasks.filter((t) => t.parent_task_id === task.id).length > 0 ? (
                <div className="ml-8 mt-4 space-y-3 border-l border-border pl-4">
                  {tasks
                    .filter((t) => t.parent_task_id === task.id)
                    .map((sub) => (
                      <TaskLine key={sub.id} task={sub} isSub />
                    ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
            <AlertDialogDescription>
              A tarefa e suas subtarefas serão removidas permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) deleteTask.mutate(deleteId);
                setDeleteId(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
