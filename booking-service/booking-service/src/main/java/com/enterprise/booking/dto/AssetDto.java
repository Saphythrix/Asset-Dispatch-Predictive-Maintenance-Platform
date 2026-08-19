package com.enterprise.booking.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class AssetDto {
    private UUID id;
    private UUID clientCompanyId;
    private String serialNumber;
    private String name;
    private String category;
    private String status;
    private int operatingHours;
    private int maintenanceThresholdHours;
    private LocalDateTime nextMaintenanceDue;
    private Double hourlyRate;
}