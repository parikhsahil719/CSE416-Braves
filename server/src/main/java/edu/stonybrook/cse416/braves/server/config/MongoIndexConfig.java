package edu.stonybrook.cse416.braves.server.config;

import edu.stonybrook.cse416.braves.server.model.*;
import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexInfo;

import java.util.List;

@Configuration
public class MongoIndexConfig {
    private final MongoTemplate mongoTemplate;

    public MongoIndexConfig(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @PostConstruct
    public void ensureIndexes() {
        mongoTemplate.indexOps(StateDocument.class)
                .ensureIndex(new Index().on("stateId", Sort.Direction.ASC));

        mongoTemplate.indexOps(StateSummaryDocument.class)
                .ensureIndex(new Index().on("stateId", Sort.Direction.ASC));

        ensureUniqueDistrictMapStateIndex();

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

    private void ensureUniqueDistrictMapStateIndex() {
        List<IndexInfo> existingIndexes = mongoTemplate.indexOps(DistrictMapDocument.class).getIndexInfo();
        for (IndexInfo indexInfo : existingIndexes) {
            if ("stateId_1".equals(indexInfo.getName()) && !indexInfo.isUnique()) {
                mongoTemplate.indexOps(DistrictMapDocument.class).dropIndex(indexInfo.getName());
                break;
            }
        }

        mongoTemplate.indexOps(DistrictMapDocument.class)
                .ensureIndex(new Index()
                        .named("district_maps_stateId_unique")
                        .on("stateId", Sort.Direction.ASC)
                        .unique());
    }
}
