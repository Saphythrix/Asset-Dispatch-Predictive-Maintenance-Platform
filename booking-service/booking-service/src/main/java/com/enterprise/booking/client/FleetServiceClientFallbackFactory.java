package com.enterprise.booking.client;


import com.enterprise.booking.dto.AssetDto;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class FleetServiceClientFallbackFactory implements FallbackFactory<FleetServiceClient> {

    @Override
    public FleetServiceClient create(Throwable cause) {
        return new FleetServiceClient() {
            @Override
            public AssetDto getAssetById(UUID id) {
                // Return a graceful degraded response or fallback mock
                AssetDto fallbackAsset = new AssetDto();
                fallbackAsset.setId(id);
                fallbackAsset.setStatus("UNAVAILABLE_TEMPORARY_OUTAGE");
                fallbackAsset.setName("Service Temporarily Degraded");
                return fallbackAsset;
            }

            @Override
            public AssetDto updateAssetStatus(UUID id, String status) {
                AssetDto fallbackAsset = new AssetDto();
                fallbackAsset.setId(id);
                fallbackAsset.setStatus("DEGRADED");
                return fallbackAsset;
            }
        };
    }
}