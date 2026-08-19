package com.enterprise.fleet.service;


import com.enterprise.fleet.dto.AssetResponse;
import com.enterprise.fleet.dto.CreateAssetRequest;
import com.enterprise.fleet.entity.Asset;
import com.enterprise.fleet.entity.AssetStatus;
import com.enterprise.fleet.repository.AssetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AssetService {

    private final AssetRepository assetRepository;

    @Transactional
    public AssetResponse createAsset(CreateAssetRequest request) {
        if (assetRepository.findBySerialNumber(request.getSerialNumber()).isPresent()) {
            throw new IllegalArgumentException("Asset with serial number " + request.getSerialNumber() + " already exists.");
        }

        Double rate = (request.getHourlyRate() != null && request.getHourlyRate() > 0) ? request.getHourlyRate() : 100.0;

        Asset asset = Asset.builder()
                .clientCompanyId(request.getClientCompanyId())
                .serialNumber(request.getSerialNumber())
                .name(request.getName())
                .category(request.getCategory())
                .status(AssetStatus.AVAILABLE)
                .operatingHours(0)
                .maintenanceThresholdHours(request.getMaintenanceThresholdHours())
                .nextMaintenanceDue(request.getNextMaintenanceDue())
                .hourlyRate(rate)
                .build();

        Asset savedAsset = assetRepository.save(asset);
        return mapToResponse(savedAsset);
    }

    @Cacheable(value = "assets", key = "#id")
    @Transactional(readOnly = true)
    public AssetResponse getAssetById(UUID id) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Asset not found with ID: " + id));
        return mapToResponse(asset);
    }

    @Transactional(readOnly = true)
    public List<AssetResponse> getAllAssets() {
        return assetRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AssetResponse> getAssetsByCompany(UUID companyId) {
        return assetRepository.findByClientCompanyId(companyId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @CacheEvict(value = "assets", key = "#id")
    @Transactional
    public AssetResponse updateAssetStatus(UUID id, AssetStatus newStatus) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Asset not found with ID: " + id));

        asset.setStatus(newStatus);
        Asset updated = assetRepository.save(asset);
        return mapToResponse(updated);
    }

    @CacheEvict(value = "assets", key = "#id")
    @Transactional
    public AssetResponse updateAssetPrice(UUID id, Double hourlyRate) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Asset not found with ID: " + id));

        if (hourlyRate != null && hourlyRate > 0) {
            asset.setHourlyRate(hourlyRate);
        }
        Asset updated = assetRepository.save(asset);
        return mapToResponse(updated);
    }

    private AssetResponse mapToResponse(Asset asset) {
        return AssetResponse.builder()
                .id(asset.getId())
                .clientCompanyId(asset.getClientCompanyId())
                .serialNumber(asset.getSerialNumber())
                .name(asset.getName())
                .category(asset.getCategory())
                .status(asset.getStatus())
                .operatingHours(asset.getOperatingHours())
                .maintenanceThresholdHours(asset.getMaintenanceThresholdHours())
                .nextMaintenanceDue(asset.getNextMaintenanceDue())
                .hourlyRate(asset.getHourlyRate() != null ? asset.getHourlyRate() : 100.0)
                .build();
    }
}