import { Task } from '@/features/projects';

export type TaskState = Task['status'];

/**
 * Configuration for drag and drop rules
 * Defines which task states can be moved to which columns
 */
export interface DragRule {
  from: TaskState;
  to: TaskState[];
  enabled: boolean;
}

/**
 * Default drag rules configuration
 * Defines the allowed transitions between task states
 */
export const defaultDragRules: DragRule[] = [
  {
    from: 'todo',
    to: ['in_progress', 'todo'], // Can stay in todo or move to in_progress
    enabled: true
  },
  {
    from: 'in_progress',
    to: ['todo', 'review', 'in_progress'], // Can go back to todo, forward to review, or stay
    enabled: true
  },
  {
    from: 'review',
    to: ['in_progress', 'done', 'review'], // Can go back to in_progress, forward to done, or stay
    enabled: true
  },
  {
    from: 'done',
    to: ['review', 'done'], // Can go back to review or stay in done
    enabled: true
  }
];

/**
 * Check if a task can be moved from one state to another
 */
export function canMoveTask(fromState: TaskState, toState: TaskState, rules: DragRule[] = defaultDragRules): boolean {
  const rule = rules.find((r) => r.from === fromState && r.enabled);
  if (!rule) return false;
  return rule.to.includes(toState);
}

/**
 * Get allowed destination states for a given source state
 */
export function getAllowedDestinations(
  fromState: TaskState,
  rules: DragRule[] = defaultDragRules
): TaskState[] {
  const rule = rules.find((r) => r.from === fromState && r.enabled);
  if (!rule) return [];
  return rule.to;
}

