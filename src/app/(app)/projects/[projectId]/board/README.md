# Kanban Board - Drag and Drop

This board implements a configurable drag and drop system with validation rules.

## Components

### Item (Draggable)
- Each task card is wrapped with `useDraggable` hook
- Shows visual feedback when being dragged (opacity, ring)
- Can be dragged to any valid column

### Column (Droppable)
- Each column is wrapped with `useDroppable` hook
- Shows visual feedback when task is dragged over:
  - **Green border/background**: Valid drop target
  - **Red border/background**: Invalid drop target
- Automatically disabled if drop is not allowed

## Drag Rules Configuration

Rules are defined in `drag-rules.ts` and can be customized:

```typescript
export const defaultDragRules: DragRule[] = [
  {
    from: 'todo',
    to: ['in_progress', 'todo'], // Allowed destinations
    enabled: true
  },
  // ... more rules
];
```

### Customizing Rules

1. **Edit `drag-rules.ts`**: Modify the `defaultDragRules` array
2. **Add new transitions**: Add states to the `to` array
3. **Disable transitions**: Set `enabled: false` for a rule
4. **Dynamic rules**: Import and use `canMoveTask()` with custom rules

### Example: Restrict Done → Review Only

```typescript
{
  from: 'done',
  to: ['review'], // Can only go back to review
  enabled: true
}
```

### Example: Allow Any Transition

```typescript
{
  from: 'todo',
  to: ['todo', 'in_progress', 'review', 'done'], // All states allowed
  enabled: true
}
```

## Validation Flow

1. **During Drag**: Columns check rules in real-time and show visual feedback
2. **On Drop**: Final validation happens in `onDragEnd` handler
3. **API Call**: Only made if validation passes

## Visual Feedback

- **Dragging item**: Reduced opacity, blue ring
- **Valid drop zone**: Green border and background tint
- **Invalid drop zone**: Red border and background tint
- **Disabled columns**: Cannot accept drops that violate rules

