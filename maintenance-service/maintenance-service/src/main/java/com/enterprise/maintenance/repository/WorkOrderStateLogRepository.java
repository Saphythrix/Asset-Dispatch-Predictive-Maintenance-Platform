package com.enterprise.maintenance.repository;


import com.enterprise.maintenance.entity.WorkOrderStateLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface WorkOrderStateLogRepository extends JpaRepository<WorkOrderStateLog, UUID> {
    List<WorkOrderStateLog> findByWorkOrderIdOrderByTransitionedAtDesc(UUID workOrderId);
}