package com.enterprise.booking.client;

import com.enterprise.booking.dto.AssetDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.UUID;

@FeignClient(name = "fleet-service", fallbackFactory = FleetServiceClientFallbackFactory.class)
public interface FleetServiceClient {

    @GetMapping("/api/v1/assets/{id}")
    AssetDto getAssetById(@PathVariable("id") UUID id);

    @PutMapping("/api/v1/assets/{id}/status")
    AssetDto updateAssetStatus(@PathVariable("id") UUID id, @RequestParam("status") String status);
}