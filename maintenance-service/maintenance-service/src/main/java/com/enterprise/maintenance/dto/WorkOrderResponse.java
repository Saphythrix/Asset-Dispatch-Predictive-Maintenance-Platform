package com.enterprise.maintenance.dto;


import com.enterprise.maintenance.entity.WorkOrderState;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkOrderResponse {
    private UUID id;
    private UUID assetId;
    private UUID bookingId;
    private UUID technicianId;
    private WorkOrderState state;
    private LocalDateTime scheduledAt;
    private LocalDateTime createdAt;
}