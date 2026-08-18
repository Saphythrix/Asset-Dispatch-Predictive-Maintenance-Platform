package com.enterprise.maintenance.dto;


import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class CreateWorkOrderRequest {
    @NotNull(message = "Asset ID is required")
    private UUID assetId;

    private UUID bookingId;

    @NotNull(message = "Scheduled time is required")
    private LocalDateTime scheduledAt;
}