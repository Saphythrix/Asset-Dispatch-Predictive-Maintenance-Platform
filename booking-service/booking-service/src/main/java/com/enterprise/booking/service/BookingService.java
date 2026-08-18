package com.enterprise.booking.service;

import com.enterprise.booking.client.FleetServiceClient;
import com.enterprise.booking.dto.AssetDto;
import com.enterprise.booking.dto.BookingResponse;
import com.enterprise.booking.dto.CreateBookingRequest;
import com.enterprise.booking.entity.Booking;
import com.enterprise.booking.entity.BookingStatus;
import com.enterprise.booking.exception.AssetUnavailableException;
import com.enterprise.booking.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final FleetServiceClient fleetServiceClient;

    @Transactional
    public BookingResponse createBooking(CreateBookingRequest request) {
        if (request.getSlotEnd().isBefore(request.getSlotStart()) || request.getSlotEnd().isEqual(request.getSlotStart())) {
            throw new IllegalArgumentException("Slot end time must be strictly after slot start time.");
        }

        // 1. Verify Asset exists & is AVAILABLE via OpenFeign
        AssetDto asset;
        try {
            asset = fleetServiceClient.getAssetById(request.getAssetId());
        } catch (Exception ex) {
            throw new IllegalArgumentException("Asset not found with ID: " + request.getAssetId());
        }

        if (!"AVAILABLE".equalsIgnoreCase(asset.getStatus()) && !"RESERVED".equalsIgnoreCase(asset.getStatus())) {
            throw new AssetUnavailableException("Asset is currently in state: " + asset.getStatus() + " and cannot be booked.");
        }

        // 2. Validate overlapping time slots with Pessimistic Lock
        List<Booking> overlapping = bookingRepository.findOverlappingBookings(
                request.getAssetId(),
                BookingStatus.CONFIRMED,
                request.getSlotStart(),
                request.getSlotEnd()
        );

        if (!overlapping.isEmpty()) {
            throw new AssetUnavailableException("Asset is already booked for the requested time slot.");
        }

        // 3. Persist confirmed booking
        Booking booking = Booking.builder()
                .assetId(request.getAssetId())
                .clientCompanyId(request.getClientCompanyId())
                .createdBy(request.getCreatedBy())
                .slotStart(request.getSlotStart())
                .slotEnd(request.getSlotEnd())
                .status(BookingStatus.CONFIRMED)
                .build();

        Booking savedBooking = bookingRepository.save(booking);

        // 4. Update asset status to RESERVED in fleet-service
        fleetServiceClient.updateAssetStatus(request.getAssetId(), "RESERVED");

        return mapToResponse(savedBooking);
    }

    @Transactional(readOnly = true)
    public BookingResponse getBookingById(UUID id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found with ID: " + id));
        return mapToResponse(booking);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsByAsset(UUID assetId) {
        return bookingRepository.findByAssetId(assetId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    private BookingResponse mapToResponse(Booking booking) {
        return BookingResponse.builder()
                .id(booking.getId())
                .assetId(booking.getAssetId())
                .clientCompanyId(booking.getClientCompanyId())
                .createdBy(booking.getCreatedBy())
                .slotStart(booking.getSlotStart())
                .slotEnd(booking.getSlotEnd())
                .status(booking.getStatus())
                .createdAt(booking.getCreatedAt())
                .build();
    }
}