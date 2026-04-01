package edu.stonybrook.cse416.braves.server.dto;

public record SkeletonResponse(
        String schemaVersion,
        String status,
        String message,
        String route
) {
}
