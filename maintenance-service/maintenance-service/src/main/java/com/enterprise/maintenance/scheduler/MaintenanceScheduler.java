package com.enterprise.maintenance.scheduler;


import com.enterprise.maintenance.dto.CreateWorkOrderRequest;
import com.enterprise.maintenance.entity.Technician;
import com.enterprise.maintenance.entity.WorkOrderState;
import com.enterprise.maintenance.repository.TechnicianRepository;
import com.enterprise.maintenance.service.WorkOrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class MaintenanceScheduler {

    private final WorkOrderService workOrderService;
    private final TechnicianRepository technicianRepository;

    // Runs every 60 seconds (Production cron: "0 0 * * * *")
    @Scheduled(fixedRate = 60000)
    public void scanAndScheduleMaintenance() {
        log.info("[MaintenanceScheduler] Running periodic predictive maintenance scan at: {}", LocalDateTime.now());

        List<Technician> availableTechs = technicianRepository.findByAvailableTrue();
        if (!availableTechs.isEmpty()) {
            log.info("[MaintenanceScheduler] Found {} available technicians for dispatch.", availableTechs.size());
        }
    }
}