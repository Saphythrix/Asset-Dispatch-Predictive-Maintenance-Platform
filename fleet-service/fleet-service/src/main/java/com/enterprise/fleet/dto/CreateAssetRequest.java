package com.enterprise.fleet.dto;


import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class CreateAssetRequest {

    @NotNull(message = "Client company ID is required")
    private UUID clientCompanyId;

    @NotBlank(message = "Serial number is required")
    private String serialNumber;

    @NotBlank(message = "Asset name is required")
    private String name;

    @NotBlank(message = "Category is required")
    private String category;

    @Min(value = 1, message = "Threshold hours must be greater than 0")
    private int maintenanceThresholdHours;

    @NotNull(message = "Next maintenance date is required")
    private LocalDateTime nextMaintenanceDue;
}