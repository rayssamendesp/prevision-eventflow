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
  const [editTitle, setEditTitle] = useState("");
  const [editResponsible, setEditResponsible] = useState("");
  const [editParentId, setEditParentId] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const tasksQuery = useQuery({
    queryKey: ["tasks", eventId],
    queryFn: () => fetchTasks(eventId),
  });
  const profilesQuery = useQuery({ queryKey: ["profiles"], queryFn: fetchProfiles });

  const tasks = tasksQuery.data ?? [];
  const profiles = profilesQuery.data ?? [];
  const parents = tasks.filter((task) => !task.parent_task_id);

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

  const saveTask = useMutation({
    mutationFn: async ({
      id,
      taskTitle,
      responsibleId,
      taskParentId,
    }: {
      id: string;
      taskTitle: string;
      responsibleId: string;
      taskParentId: string;
    }) => {
      const { error } = await supabase
        .from("tasks")
        .update({
          title: taskTitle.trim(),
          responsible_user_id: responsibleId || null,
          parent_task_id: taskParentId || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await invalidate();
      setEditingId(null);
      toast.success("Tarefa atualizada");
    },
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

  const nameOf = (id: string | null) => profiles.find((profile) => profile.id === id)?.name ?? null;
  const hasChildren = (id: string) => tasks.some((task) => task.parent_task_id === id);

  function startAdding(taskParentId = "") {
    setTitle("");
    setResponsible("");
    setParentId(taskParentId);
    setAdding(true);

    window.setTimeout(() => {
      document.getElementById("new-task-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  }

  function beginEditing(task: TaskRow) {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditResponsible(task.responsible_user_id ?? "");
    setEditParentId(task.parent_task_id ?? "");
  }

  function cancelEditing() {
    setEditingId(null);
    setEditTitle("");
    setEditResponsible("");
    setEditParentId("");
  }

  function TaskLine({ task, isSub }: { task: TaskRow; isSub?: boolean }) {
    const editing = editingId === task.id;
    const taskHasChildren = hasChildren(task.id);
    const possibleParents = parents.filter((parent) => parent.id !== task.id);

    return (
      <div className={cn("group", task.completed && "opacity-50")}>
        <div className="flex items-start gap-4">
          <button
            role="checkbox"
            aria-checked={task.completed}
            aria-label={task.completed ? "Reabrir tarefa" : "Concluir tarefa"}
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
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className={cn(inputClass, "min-w-48 flex-1")}
              />
              <select
                value={editResponsible}
                onChange={(e) => setEditResponsible(e.target.value)}
                className={inputClass}
                disabled={profilesQuery.isError}
              >
                <option value="">Sem responsável</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
              </select>
              <select
                value={taskHasChildren ? "" : editParentId}
                onChange={(e) => setEditParentId(e.target.value)}
                className={inputClass}
                disabled={taskHasChildren}
                title={taskHasChildren ? "Uma tarefa com subtarefas não pode virar subtarefa." : undefined}
              >
                <option value="">Nenhuma — tarefa principal</option>
                {possibleParents.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    Subtarefa de: {parent.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  if (!editTitle.trim()) {
                    toast.error("Informe o nome da tarefa.");
                    return;
                  }
                  saveTask.mutate({
                    id: task.id,
                    taskTitle: editTitle,
                    responsibleId: editResponsible,
                    taskParentId: taskHasChildren ? "" : editParentId,
                  });
                }}
                disabled={saveTask.isPending}
                className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                className="px-2 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Cancelar
              </button>
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
                  onClick={() => beginEditing(task)}
                  className="text-muted-foreground opacity-100 transition-opacity hover:text-foreground [@media(hover:hover)_and_(pointer:fine)]:opacity-0 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  aria-label="Excluir tarefa"
                  onClick={() => setDeleteId(task.id)}
                  className="text-muted-foreground opacity-100 transition-opacity hover:text-destructive [@media(hover:hover)_and_(pointer:fine)]:opacity-0 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100"
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
          onClick={() => {
            if (adding) {
              setAdding(false);
              setParentId("");
            } else {
              startAdding();
            }
          }}
          className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-accent"
        >
          <Plus className="size-3" /> {adding ? "Cancelar" : "Adicionar tarefa"}
        </button>
      </div>

      {profilesQuery.isError ? (
        <div className="mb-5 rounded-md border border-border bg-foreground/[0.02] p-4 text-sm text-muted-foreground">
          Não foi possível carregar os responsáveis.{" "}
          <button onClick={() => void profilesQuery.refetch()} className="font-medium text-accent hover:underline">
            Tentar novamente
          </button>
        </div>
      ) : null}

      {adding ? (
        <form
          id="new-task-form"
          className="mb-8 flex flex-wrap items-center gap-2 rounded-md border border-dashed border-border p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (title.trim()) createTask.mutate();
          }}
        >
          {parentId ? (
            <div className="w-full text-xs font-medium text-muted-foreground">
              Nova subtarefa de: <span className="text-foreground">{parents.find((task) => task.id === parentId)?.title}</span>
            </div>
          ) : null}
          <input
            autoFocus
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={parentId ? "Nome da subtarefa" : "Nome da tarefa"}
            className={cn(inputClass, "min-w-48 flex-1")}
          />
          <select
            value={responsible}
            onChange={(e) => setResponsible(e.target.value)}
            className={inputClass}
            disabled={profilesQuery.isError}
          >
            <option value="">Responsável</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className={inputClass}
          >
            <option value="">Tarefa principal</option>
            {parents.map((parent) => (
              <option key={parent.id} value={parent.id}>
                Subtarefa de: {parent.title}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={createTask.isPending}
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            Salvar
          </button>
        </form>
      ) : null}

      {tasksQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando tarefas...</p>
      ) : tasksQuery.isError ? (
        <div className="rounded-md border border-dashed border-border bg-foreground/[0.02] p-4 text-center">
          <p className="text-sm text-muted-foreground">Não foi possível carregar as tarefas.</p>
          <button
            onClick={() => void tasksQuery.refetch()}
            className="mt-2 text-[11px] font-semibold uppercase tracking-widest text-accent hover:underline"
          >
            Tentar novamente
          </button>
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-foreground/[0.02] p-4">
          <p className="label-caps text-center">Este evento ainda não tem tarefas</p>
        </div>
      ) : (
        <div className="space-y-6">
          {parents.map((task) => (
            <div key={task.id}>
              <TaskLine task={task} />
              <button
                type="button"
                onClick={() => startAdding(task.id)}
                className="ml-8 mt-2 flex items-center gap-1 text-[11px] font-medium text-accent hover:underline"
              >
                <Plus className="size-3" /> Adicionar subtarefa
              </button>
              {tasks.filter((item) => item.parent_task_id === task.id).length > 0 ? (
                <div className="ml-8 mt-4 space-y-3 border-l border-border pl-4">
                  {tasks
                    .filter((item) => item.parent_task_id === task.id)
                    .map((subtask) => (
                      <TaskLine key={subtask.id} task={subtask} isSub />
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
