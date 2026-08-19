package com.enterprise.maintenance.controller;

import com.enterprise.maintenance.dto.CreateWorkOrderRequest;
import com.enterprise.maintenance.dto.WorkOrderResponse;
import com.enterprise.maintenance.entity.WorkOrderState;
import com.enterprise.maintenance.entity.WorkOrderStateLog;
import com.enterprise.maintenance.service.WorkOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/work-orders")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class WorkOrderController {

    private final WorkOrderService workOrderService;

    @PostMapping
    public ResponseEntity<WorkOrderResponse> createWorkOrder(@Valid @RequestBody CreateWorkOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(workOrderService.createWorkOrder(request));
    }

    @GetMapping
    public ResponseEntity<List<WorkOrderResponse>> getAllWorkOrders() {
        return ResponseEntity.ok(workOrderService.getAllWorkOrders());
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkOrderResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(workOrderService.getById(id));
    }

    @PatchMapping("/{id}/transition")
    public ResponseEntity<WorkOrderResponse> transitionState(
            @PathVariable UUID id,
            @RequestParam WorkOrderState targetState,
            @RequestParam(required = false) UUID technicianId) {
        return ResponseEntity.ok(workOrderService.transitionState(id, targetState, technicianId));
    }

    @GetMapping("/{id}/logs")
    public ResponseEntity<List<WorkOrderStateLog>> getAuditLogs(@PathVariable UUID id) {
        return ResponseEntity.ok(workOrderService.getAuditLogs(id));
    }
}