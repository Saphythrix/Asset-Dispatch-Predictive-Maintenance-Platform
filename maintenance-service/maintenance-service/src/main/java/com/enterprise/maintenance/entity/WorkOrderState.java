package com.enterprise.maintenance.entity;

import java.util.List;

//Enum with State Machine Transition Logic
public enum WorkOrderState {
    CREATED {
        @Override
        public List<WorkOrderState> nextValidStates() {
            return List.of(ASSIGNED, FAILED);
        }
    },
    ASSIGNED {
        @Override
        public List<WorkOrderState> nextValidStates() {
            return List.of(IN_PROGRESS, FAILED);
        }
    },
    IN_PROGRESS {
        @Override
        public List<WorkOrderState> nextValidStates() {
            return List.of(COMPLETED, FAILED);
        }
    },
    COMPLETED {
        @Override
        public List<WorkOrderState> nextValidStates() {
            return List.of(); // Terminal state
        }
    },
    FAILED {
        @Override
        public List<WorkOrderState> nextValidStates() {
            return List.of(CREATED); // Can be retried
        }
    };

    public abstract List<WorkOrderState> nextValidStates();

    public boolean canTransitionTo(WorkOrderState target) {
        return nextValidStates().contains(target);
    }
}