package com.enterprise.maintenance.repository;

import com.enterprise.maintenance.entity.WorkOrder;
import com.enterprise.maintenance.entity.WorkOrderState;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface WorkOrderRepository extends JpaRepository<WorkOrder, UUID> {
    List<WorkOrder> findByAssetId(UUID assetId);
    List<WorkOrder> findByState(WorkOrderState state);
}