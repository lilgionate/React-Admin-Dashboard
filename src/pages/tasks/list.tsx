import { KanbanColumnSkeleton, ProjectCardSkeleton } from '@/components';
import { KanbanAddCardButton } from '@/components/tasks/kanban/add-card-button';
import { KanbanBoardContainer, KanbanBoard } from '@/components/tasks/kanban/board';
import { ProjectCardMemo } from '@/components/tasks/kanban/card';
import KanbanColumn from '@/components/tasks/kanban/column';
import KanbanItem from '@/components/tasks/kanban/item';
import { UPDATE_TASK_STAGE_MUTATION } from '@/graphql/mutations';
import { TASKS_QUERY, TASK_STAGES_QUERY } from '@/graphql/queries';
import { TaskStagesQuery, TasksQuery } from '@/graphql/types';
import { DragEndEvent } from '@dnd-kit/core';
import { useList, useUpdate, useGo } from '@refinedev/core';
import { GetFieldsFromList } from '@refinedev/nestjs-query';
import React from 'react';

type Task = GetFieldsFromList<TasksQuery>;
type TaskStage = GetFieldsFromList<TaskStagesQuery> & { tasks: Task[] };

const List = ({ children }: React.PropsWithChildren) => {
  const go = useGo();

  // Stages
  const { query: stagesQuery, result: stagesResult } = useList<GetFieldsFromList<TaskStagesQuery>>({
    resource: 'taskStages',
    filters: [{ field: 'title', operator: 'in', value: ['TODO', 'IN PROGRESS', 'IN REVIEW', 'DONE'] }],
    sorters: [{ field: 'createdAt', order: 'asc' }],
    meta: { gqlQuery: TASK_STAGES_QUERY },
  });

  const stagesArr = stagesResult.data ?? [];
  const isLoadingStages = stagesQuery.isLoading;

  // Tasks (enable once stages loaded)
  const { query: tasksQuery, result: tasksResult } = useList<GetFieldsFromList<TasksQuery>>({
    resource: 'tasks',
    sorters: [{ field: 'dueDate', order: 'asc' }],
    pagination: { mode: 'off' },
    queryOptions: { enabled: (stagesArr?.length ?? 0) > 0 },
    meta: { gqlQuery: TASKS_QUERY },
  });

  const tasksArr = tasksResult.data ?? [];
  const isLoadingTasks = tasksQuery.isLoading;

  const { mutate: updateTask } = useUpdate();

  const taskStages = React.useMemo(() => {
    if (!tasksArr.length || !stagesArr.length) {
      return { unassignedStage: [] as Task[], columns: [] as TaskStage[] };
    }

    const unassignedStage = tasksArr.filter((t) => t.stageId == null);

    const columns: TaskStage[] = stagesArr.map((stage: any) => ({
      ...stage,
      tasks: tasksArr.filter((t) => String(t.stageId ?? '') === String(stage.id)),
    }));

    return { unassignedStage, columns };
  }, [stagesArr, tasksArr]);

  const handleAddCard = ({ stageId }: { stageId: string }) => {
    if (stageId === 'unassigned') {
      go({ to: '/tasks/new', type: 'replace' });
    } else {
      go({
        to: { resource: 'tasks', action: 'create' }, // resolves to /tasks/new
        query: { stageId },
        type: 'replace',
      });
    }
  };

  const handleOnDragEnd = (event: DragEndEvent) => {
    let stageId = event.over?.id as undefined | string | null;
    const taskId = event.active.id as string;
    const taskStageId = event.active.data.current?.stageId;

    if (taskStageId === stageId) return;

    if (stageId === 'unassigned') stageId = null;

    updateTask({
      resource: 'tasks',
      id: taskId,
      values: { stageId },
      successNotification: false,
      mutationMode: 'optimistic',
      meta: { gqlMutation: UPDATE_TASK_STAGE_MUTATION },
    });
  };

  const isLoading = isLoadingStages || isLoadingTasks;
  if (isLoading) return <PageSkeleton />;

  return (
    <>
      <KanbanBoardContainer>
        <KanbanBoard onDragEnd={handleOnDragEnd}>
          <KanbanColumn
            id="unassigned"
            title="unassigned"
            count={taskStages.unassignedStage.length}
            onAddClick={() => handleAddCard({ stageId: 'unassigned' })}
          >
            {taskStages.unassignedStage.map((task) => (
              <KanbanItem key={task.id} id={task.id} data={{ ...task, stageId: 'unassigned' }}>
                <ProjectCardMemo {...task} dueDate={task.dueDate || undefined} />
              </KanbanItem>
            ))}
            {!taskStages.unassignedStage.length && (
              <KanbanAddCardButton onClick={() => handleAddCard({ stageId: 'unassigned' })} />
            )}
          </KanbanColumn>

          {taskStages.columns.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              count={column.tasks.length}
              onAddClick={() => handleAddCard({ stageId: column.id })}
            >
              {column.tasks.map((task) => (
                <KanbanItem key={task.id} id={task.id} data={task}>
                  <ProjectCardMemo {...task} dueDate={task.dueDate || undefined} />
                </KanbanItem>
              ))}
              {!column.tasks.length && (
                <KanbanAddCardButton onClick={() => handleAddCard({ stageId: column.id })} />
              )}
            </KanbanColumn>
          ))}
        </KanbanBoard>
      </KanbanBoardContainer>
      {children}
    </>
  );
};

export default List;

const PageSkeleton = () => {
  const columnCount = 6;
  const itemCount = 4;
  return (
    <KanbanBoardContainer>
      {Array.from({ length: columnCount }).map((_, i) => (
        <KanbanColumnSkeleton key={i}>
          {Array.from({ length: itemCount }).map((_, j) => (
            <ProjectCardSkeleton key={j} />
          ))}
        </KanbanColumnSkeleton>
      ))}
    </KanbanBoardContainer>
  );
};
