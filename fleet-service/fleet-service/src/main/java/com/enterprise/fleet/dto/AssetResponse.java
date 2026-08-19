package com.enterprise.fleet.dto;


import com.enterprise.fleet.entity.AssetStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    private UUID id;
    private UUID clientCompanyId;
    private String serialNumber;
    private String name;
    private String category;
    private AssetStatus status;
    private int operatingHours;
    private int maintenanceThresholdHours;
    private LocalDateTime nextMaintenanceDue;
    private Double hourlyRate;
}