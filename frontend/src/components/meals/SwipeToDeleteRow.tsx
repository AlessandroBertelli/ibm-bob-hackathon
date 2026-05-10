// Wraps a row with iOS-style swipe-to-delete. Drag left to reveal a single
// red trash button. Tapping the trash deletes immediately. The small ✕ closes
// the drawer.
//
// When the drawer is open and the user taps the row body, we intercept the
// tap, snap the drawer closed, and stop propagation — otherwise the row's
// own onClick would also fire and open the detail modal, which is confusing.

import type { ReactNode } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { t } from '../../i18n/en';

const DRAWER_WIDTH = 96;
const DRAWER_OPEN_THRESHOLD = -DRAWER_WIDTH / 2;

interface Props {
    onDelete: () => void;
    children: ReactNode;
}

export const SwipeToDeleteRow = ({ onDelete, children }: Props) => {
    const x = useMotionValue(0);
    const drawerOpacity = useTransform(x, [-DRAWER_WIDTH, -32, 0], [1, 0.4, 0]);

    const snapClosed = () => {
        animate(x, 0, { type: 'spring', stiffness: 320, damping: 32 });
    };
    const snapOpen = () => {
        animate(x, -DRAWER_WIDTH, { type: 'spring', stiffness: 320, damping: 32 });
    };

    const handleDragEnd = () => {
        if (x.get() < DRAWER_OPEN_THRESHOLD) {
            snapOpen();
        } else {
            snapClosed();
        }
    };

    /**
     * If the drawer is open, swallow the tap and just close it. Otherwise
     * let the children's own onClick run (which usually opens the detail
     * modal).
     */
    const handleClickCapture = (e: React.MouseEvent) => {
        if (x.get() < DRAWER_OPEN_THRESHOLD) {
            e.stopPropagation();
            e.preventDefault();
            snapClosed();
        }
    };

    return (
        <div className="relative overflow-hidden rounded-2xl">
            {/* Action drawer behind the row */}
            <motion.div
                style={{ opacity: drawerOpacity }}
                className="absolute inset-y-0 right-0 flex items-center justify-end pr-3 gap-2 pointer-events-auto"
            >
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        snapClosed();
                    }}
                    aria-label={t.common.close}
                    className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 grid place-items-center text-sm shadow"
                >
                    ✕
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        snapClosed();
                        onDelete();
                    }}
                    aria-label={t.common.delete}
                    className="w-12 h-12 rounded-full bg-red-500 text-white grid place-items-center shadow-md text-xl hover:bg-red-600 transition-colors"
                >
                    🗑
                </button>
            </motion.div>

            <motion.div
                drag="x"
                dragConstraints={{ left: -DRAWER_WIDTH, right: 0 }}
                dragElastic={0.05}
                style={{ x }}
                onDragEnd={handleDragEnd}
                onClickCapture={handleClickCapture}
                className="relative bg-transparent cursor-grab active:cursor-grabbing"
            >
                {children}
            </motion.div>
        </div>
    );
};

// Made with Bob
