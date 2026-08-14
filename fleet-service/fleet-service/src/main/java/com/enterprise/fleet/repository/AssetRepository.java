package com.enterprise.fleet.repository;


import com.enterprise.fleet.entity.Asset;
import com.enterprise.fleet.entity.AssetStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;


public interface AssetRepository extends JpaRepository<Asset, UUID> {
    List<UUID> findByClientCompanyId(UUID clientCompanyId);
    Optional<Asset> findBySerialNumber(String serialNumber);
    List<Asset> findByStatus(AssetStatus status);
}
