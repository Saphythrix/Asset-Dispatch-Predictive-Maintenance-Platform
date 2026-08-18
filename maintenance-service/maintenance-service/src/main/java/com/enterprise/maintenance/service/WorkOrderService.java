package com.enterprise.maintenance.service;


import com.enterprise.maintenance.dto.CreateWorkOrderRequest;
import com.enterprise.maintenance.dto.WorkOrderResponse;
import com.enterprise.maintenance.entity.Technician;
import com.enterprise.maintenance.entity.WorkOrder;
import com.enterprise.maintenance.entity.WorkOrderState;
import com.enterprise.maintenance.entity.WorkOrderStateLog;
import com.enterprise.maintenance.repository.TechnicianRepository;
import com.enterprise.maintenance.repository.WorkOrderRepository;
import com.enterprise.maintenance.repository.WorkOrderStateLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WorkOrderService {

    private final WorkOrderRepository workOrderRepository;
    private final WorkOrderStateLogRepository stateLogRepository;
    private final TechnicianRepository technicianRepository;

    @Transactional
    public WorkOrderResponse createWorkOrder(CreateWorkOrderRequest request) {
        WorkOrder workOrder = WorkOrder.builder()
                .assetId(request.getAssetId())
                .bookingId(request.getBookingId())
                .state(WorkOrderState.CREATED)
                .scheduledAt(request.getScheduledAt())
                .build();

        WorkOrder saved = workOrderRepository.save(workOrder);
        return mapToResponse(saved);
    }

    @Transactional
    public WorkOrderResponse transitionState(UUID workOrderId, WorkOrderState targetState, UUID technicianId) {
        WorkOrder workOrder = workOrderRepository.findById(workOrderId)
                .orElseThrow(() -> new IllegalArgumentException("Work order not found: " + workOrderId));

        WorkOrderState currentState = workOrder.getState();

        if (!currentState.canTransitionTo(targetState)) {
            throw new IllegalStateException("Invalid state transition from " + currentState + " to " + targetState);
        }

        // State update & Technician assignment
        workOrder.setState(targetState);
        if (technicianId != null) {
            workOrder.setTechnicianId(technicianId);
        }

        WorkOrder updated = workOrderRepository.save(workOrder);

        // Immutable Audit Log
        WorkOrderStateLog log = WorkOrderStateLog.builder()
                .workOrderId(workOrder.getId())
                .fromState(currentState)
                .toState(targetState)
                .transitionedAt(LocalDateTime.now())
                .build();
        stateLogRepository.save(log);

        return mapToResponse(updated);
    }

    @Transactional(readOnly = true)
    public WorkOrderResponse getById(UUID id) {
        WorkOrder workOrder = workOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Work order not found: " + id));
        return mapToResponse(workOrder);
    }

    @Transactional(readOnly = true)
    public List<WorkOrderStateLog> getAuditLogs(UUID workOrderId) {
        return stateLogRepository.findByWorkOrderIdOrderByTransitionedAtDesc(workOrderId);
    }

    private WorkOrderResponse mapToResponse(WorkOrder wo) {
        return WorkOrderResponse.builder()
                .id(wo.getId())
                .assetId(wo.getAssetId())
                .bookingId(wo.getBookingId())
                .technicianId(wo.getTechnicianId())
                .state(wo.getState())
                .scheduledAt(wo.getScheduledAt())
                .createdAt(wo.getCreatedAt())
                .build();
    }
}