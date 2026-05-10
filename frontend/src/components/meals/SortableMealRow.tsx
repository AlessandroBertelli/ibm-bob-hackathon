// Wraps a row in @dnd-kit's useSortable. The whole row is the activator —
// long-press anywhere on the row to start reordering. A quick tap still
// fires the row's onClick (we rely on the PointerSensor `delay` activation
// constraint set on the parent DndContext to distinguish tap from drag).
//
// No visible drag handle anymore — the row IS the handle.

import type { ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
    id: string;
    children: ReactNode;
}

export const SortableMealRow = ({ id, children }: Props) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id,
    });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
        opacity: isDragging ? 0.9 : 1,
        // Important on iOS so long-press doesn't trigger text selection.
        touchAction: 'none',
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {children}
        </div>
    );
};

// Made with Bob
