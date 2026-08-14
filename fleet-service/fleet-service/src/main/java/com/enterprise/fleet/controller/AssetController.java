package com.enterprise.fleet.controller;

import com.enterprise.fleet.dto.AssetResponse;
import com.enterprise.fleet.dto.CreateAssetRequest;
import com.enterprise.fleet.entity.AssetStatus;
import com.enterprise.fleet.service.AssetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/assets")
@RequiredArgsConstructor
public class AssetController {

    private final AssetService assetService;

    @PostMapping
    public ResponseEntity<AssetResponse> createAsset(@Valid @RequestBody CreateAssetRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(assetService.createAsset(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssetResponse> getAssetById(@PathVariable UUID id) {
        return ResponseEntity.ok(assetService.getAssetById(id));
    }

    @GetMapping("/company/{companyId}")
    public ResponseEntity<List<AssetResponse>> getAssetsByCompany(@PathVariable UUID companyId) {
        return ResponseEntity.ok(assetService.getAssetsByCompany(companyId));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<AssetResponse> updateAssetStatus(
            @PathVariable UUID id,
            @RequestParam AssetStatus status) {
        return ResponseEntity.ok(assetService.updateAssetStatus(id, status));
    }
}