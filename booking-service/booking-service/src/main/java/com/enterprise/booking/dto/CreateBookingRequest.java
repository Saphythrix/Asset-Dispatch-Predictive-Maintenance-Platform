package com.enterprise.booking.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class CreateBookingRequest {

    @NotNull(message = "Asset ID is required")
    private UUID assetId;

    @NotNull(message = "Client company ID is required")
    private UUID clientCompanyId;

    @NotNull(message = "Created by User ID is required")
    private UUID createdBy;

    @NotNull(message = "Slot start time is required")
    private LocalDateTime slotStart;

    @NotNull(message = "Slot end time is required")
    private LocalDateTime slotEnd;
}