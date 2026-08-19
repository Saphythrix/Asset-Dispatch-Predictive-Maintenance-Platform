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

import java.time.Duration;
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

        // 3. Calculate Scheduled Hours & Pricing Snapshot
        double hourlyRate = (asset.getHourlyRate() != null && asset.getHourlyRate() > 0) ? asset.getHourlyRate() : 100.0;
        long durationMinutes = Duration.between(request.getSlotStart(), request.getSlotEnd()).toMinutes();
        double scheduledHours = Math.max(0.5, durationMinutes / 60.0);
        double baseCost = Math.round(scheduledHours * hourlyRate * 100.0) / 100.0;

        // 4. Persist confirmed booking with billing ledger
        Booking booking = Booking.builder()
                .assetId(request.getAssetId())
                .clientCompanyId(request.getClientCompanyId())
                .createdBy(request.getCreatedBy())
                .slotStart(request.getSlotStart())
                .slotEnd(request.getSlotEnd())
                .status(BookingStatus.CONFIRMED)
                .hourlyRateSnapshot(hourlyRate)
                .baseCost(baseCost)
                .actualHoursUsed(scheduledHours)
                .overtimeHours(0.0)
                .overtimeCost(0.0)
                .totalCost(baseCost)
                .build();

        Booking savedBooking = bookingRepository.save(booking);

        // 5. Update asset status to RESERVED in fleet-service
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
    public List<BookingResponse> getAllBookings() {
        return bookingRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsByAsset(UUID assetId) {
        return bookingRepository.findByAssetId(assetId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsByCompany(UUID companyId) {
        return bookingRepository.findByClientCompanyId(companyId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public BookingResponse updateBookingStatus(UUID id, BookingStatus status, Double actualHoursUsed) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found with ID: " + id));

        booking.setStatus(status);

        if (actualHoursUsed != null && actualHoursUsed > 0) {
            booking.setActualHoursUsed(actualHoursUsed);
            long scheduledMinutes = Duration.between(booking.getSlotStart(), booking.getSlotEnd()).toMinutes();
            double scheduledHours = scheduledMinutes / 60.0;
            double rate = booking.getHourlyRateSnapshot() != null ? booking.getHourlyRateSnapshot() : 100.0;

            if (actualHoursUsed > scheduledHours) {
                double extraHours = Math.round((actualHoursUsed - scheduledHours) * 100.0) / 100.0;
                double overtimeRate = rate * 1.5; // 1.5x penalty surcharge on extra hours
                double extraCost = Math.round(extraHours * overtimeRate * 100.0) / 100.0;

                booking.setOvertimeHours(extraHours);
                booking.setOvertimeCost(extraCost);
                booking.setTotalCost(Math.round((booking.getBaseCost() + extraCost) * 100.0) / 100.0);
            } else {
                booking.setOvertimeHours(0.0);
                booking.setOvertimeCost(0.0);
                booking.setTotalCost(booking.getBaseCost());
            }
        }

        if (status == BookingStatus.CANCELLED || status == BookingStatus.REJECTED) {
            try {
                fleetServiceClient.updateAssetStatus(booking.getAssetId(), "AVAILABLE");
            } catch (Exception ignored) {}
        }

        Booking updated = bookingRepository.save(booking);
        return mapToResponse(updated);
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
                .hourlyRateSnapshot(booking.getHourlyRateSnapshot() != null ? booking.getHourlyRateSnapshot() : 100.0)
                .baseCost(booking.getBaseCost() != null ? booking.getBaseCost() : 0.0)
                .actualHoursUsed(booking.getActualHoursUsed())
                .overtimeHours(booking.getOvertimeHours() != null ? booking.getOvertimeHours() : 0.0)
                .overtimeCost(booking.getOvertimeCost() != null ? booking.getOvertimeCost() : 0.0)
                .totalCost(booking.getTotalCost() != null ? booking.getTotalCost() : 0.0)
                .createdAt(booking.getCreatedAt())
                .build();
    }
}