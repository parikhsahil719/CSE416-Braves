package edu.stonybrook.cse416.braves.server.util;

import java.util.Locale;
import java.util.Map;

public final class StateCodeUtil {
    // Accept both abbreviations and human-readable names so API callers and seed utilities can normalize
    // whichever state label they already have on hand.
    private static final Map<String, String> MAP = Map.of(
            "oregon", "OR",
            "or", "OR",
            "south carolina", "SC",
            "southcarolina", "SC",
            "sc", "SC"
    );

    private StateCodeUtil() {
    }

    public static String normalizeOrThrow(String input) {
        if (input == null || input.isBlank()) {
            throw new IllegalArgumentException("stateId is required");
        }
        String normalized = MAP.get(input.trim().toLowerCase(Locale.US));
        if (normalized == null) {
            throw new IllegalArgumentException("Unsupported stateId: " + input);
        }
        return normalized;
    }

    public static int districtCount(String stateId) {
        return "OR".equals(stateId) ? 6 : 7;
    }
}
