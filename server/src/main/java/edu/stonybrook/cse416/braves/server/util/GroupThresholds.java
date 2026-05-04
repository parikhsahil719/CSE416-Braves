package edu.stonybrook.cse416.braves.server.util;

import java.util.Map;

public final class GroupThresholds {
    // These seeded thresholds gate which demographic analyses are treated as meaningful enough to expose in
    // the demo dataset.
    public static final int MIN_GROUP_POPULATION = 200_000;

    private static final Map<String, Integer> OR = Map.of(
            "latino", 564_198,
            "asian", 234_980,
            "black", 106_809,
            "white", 3_627_243
    );

    private static final Map<String, Integer> SC = Map.of(
            "black", 1_408_060,
            "latino", 370_000,
            "white", 3_780_393,
            "asian", 120_534
    );

    private GroupThresholds() {
    }

    public static boolean isFeasible(String stateId, String group) {
        if (group == null || group.isBlank()) {
            return false;
        }
        String key = group.trim().toLowerCase();
        Integer pop = ("OR".equals(stateId) ? OR : SC).get(key);
        return pop != null && pop >= MIN_GROUP_POPULATION;
    }
}
