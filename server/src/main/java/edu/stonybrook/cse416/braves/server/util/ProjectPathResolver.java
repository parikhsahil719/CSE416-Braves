package edu.stonybrook.cse416.braves.server.util;

import java.nio.file.Files;
import java.nio.file.Path;

public final class ProjectPathResolver {
    private ProjectPathResolver() {
    }

    public static Path resolveRoot(String configuredRootPath) {
        if (configuredRootPath != null && !configuredRootPath.isBlank()) {
            Path configured = Path.of(configuredRootPath).toAbsolutePath().normalize();
            if (Files.exists(configured)) {
                return configured;
            }
        }

        Path userDir = Path.of(System.getProperty("user.dir")).toAbsolutePath().normalize();
        // The backend may start either from repo root or from server/, so probe both layouts before failing.
        if (Files.exists(userDir.resolve("mock-data"))) {
            return userDir;
        }
        if (Files.exists(userDir.resolve("../mock-data").normalize())) {
            return userDir.resolve("..").normalize();
        }
        throw new IllegalStateException("Could not resolve project root containing mock-data directory");
    }
}
