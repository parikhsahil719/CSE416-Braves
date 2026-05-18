package edu.stonybrook.cse416.braves.server.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
@EnableCaching
public class CacheConfig {
    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager(
                "states",
                "stateSummary",
                "ensembleSummary",
                "heatmap",
                "districtTable",
                "gingles",
                "ginglesTable",
                "eiSupport",
                "eiPrecinctBarCi",
                "eiKde",
                "ensembleSplits",
                "boxWhisker",
                "interestingPlan",
                "interestingPlanList",
                "vraImpactThresholds",
                "minorityEffectivenessBoxWhisker",
                "minorityEffectivenessHistogram",
                "majorityMinorityBar",
                "districtTopology",
                "precinctTopology",
                "usStatesTopology"
        );
        cacheManager.setAllowNullValues(false);
        cacheManager.setCaffeine(
                Caffeine.newBuilder()
                        .initialCapacity(32)
                        .maximumSize(256)
                        .expireAfterAccess(Duration.ofMinutes(30))
                        .recordStats()
        );
        return cacheManager;
    }
}
