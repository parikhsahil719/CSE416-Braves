package edu.stonybrook.cse416.braves.server.config;

import edu.stonybrook.cse416.braves.server.model.*;
import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;

@Configuration
public class MongoIndexConfig {
    private final MongoTemplate mongoTemplate;

    public MongoIndexConfig(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @PostConstruct
    public void ensureIndexes() {
        // These indexes mirror the lookup signatures used by the service layer and API routes rather than
        // indexing every stored field on every payload document.
        mongoTemplate.indexOps(StateDocument.class)
                .ensureIndex(new Index().on("stateId", Sort.Direction.ASC));

        mongoTemplate.indexOps(StateSummaryDocument.class)
                .ensureIndex(new Index().on("stateId", Sort.Direction.ASC));

        mongoTemplate.indexOps(EnsembleSummaryDocument.class)
                .ensureIndex(new Index().on("stateId", Sort.Direction.ASC));

        mongoTemplate.indexOps(DistrictTableDocument.class)
                .ensureIndex(new Index()
                        .on("stateId", Sort.Direction.ASC)
                        .on("electionId", Sort.Direction.ASC));

        mongoTemplate.indexOps(HeatmapBinDocument.class)
                .ensureIndex(new Index()
                        .on("stateId", Sort.Direction.ASC)
                        .on("groupKey", Sort.Direction.ASC));

        mongoTemplate.indexOps(GinglesResultDocument.class)
                .ensureIndex(new Index()
                        .on("stateId", Sort.Direction.ASC)
                        .on("electionId", Sort.Direction.ASC)
                        .on("groupKey", Sort.Direction.ASC));

        mongoTemplate.indexOps(GinglesTableDocument.class)
                .ensureIndex(new Index()
                        .on("stateId", Sort.Direction.ASC)
                        .on("electionId", Sort.Direction.ASC)
                        .on("groupKey", Sort.Direction.ASC));

        mongoTemplate.indexOps(EiSupportResultDocument.class)
                .ensureIndex(new Index()
                        .on("stateId", Sort.Direction.ASC)
                        .on("electionId", Sort.Direction.ASC)
                        .on("groupKey", Sort.Direction.ASC));

        mongoTemplate.indexOps(EiPrecinctBarCiDocument.class)
                .ensureIndex(new Index()
                        .on("stateId", Sort.Direction.ASC)
                        .on("electionId", Sort.Direction.ASC)
                        .on("groupKey", Sort.Direction.ASC)
                        .on("partyKey", Sort.Direction.ASC));

        mongoTemplate.indexOps(EiKdeDocument.class)
                .ensureIndex(new Index()
                        .on("stateId", Sort.Direction.ASC)
                        .on("electionId", Sort.Direction.ASC)
                        .on("groupKey", Sort.Direction.ASC)
                        .on("metricKey", Sort.Direction.ASC));

        mongoTemplate.indexOps(EnsembleSplitDocument.class)
                .ensureIndex(new Index()
                        .on("stateId", Sort.Direction.ASC)
                        .on("electionId", Sort.Direction.ASC)
                        .on("metricKey", Sort.Direction.ASC));

        mongoTemplate.indexOps(BoxWhiskerResultDocument.class)
                .ensureIndex(new Index()
                        .on("stateId", Sort.Direction.ASC)
                        .on("ensembleType", Sort.Direction.ASC)
                        .on("groupKey", Sort.Direction.ASC)
                        .on("metricKey", Sort.Direction.ASC));

        mongoTemplate.indexOps(InterestingPlanDocument.class)
                .ensureIndex(new Index()
                        .on("stateId", Sort.Direction.ASC)
                        .on("planId", Sort.Direction.ASC));

        mongoTemplate.indexOps(VraImpactThresholdTableDocument.class)
                .ensureIndex(new Index()
                        .on("stateId", Sort.Direction.ASC)
                        .on("electionId", Sort.Direction.ASC)
                        .on("groupKey", Sort.Direction.ASC));

        mongoTemplate.indexOps(MinorityEffectivenessBoxWhiskerDocument.class)
                // Keep the shared state/election slice cheap here; the document class also declares the full
                // unique compound index used by the per-ensemble lookup path.
                .ensureIndex(new Index()
                        .on("stateId", Sort.Direction.ASC)
                        .on("electionId", Sort.Direction.ASC));

        mongoTemplate.indexOps(MinorityEffectivenessHistogramDocument.class)
                .ensureIndex(new Index()
                        .on("stateId", Sort.Direction.ASC)
                        .on("electionId", Sort.Direction.ASC)
                        .on("groupKey", Sort.Direction.ASC));

        mongoTemplate.indexOps(RunManifestDocument.class)
                .ensureIndex(new Index().on("sourceManifestId", Sort.Direction.ASC));

        mongoTemplate.indexOps(IngestManifestDocument.class)
                .ensureIndex(new Index().on("sourceManifestId", Sort.Direction.ASC));
    }
}
