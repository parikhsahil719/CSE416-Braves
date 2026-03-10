package edu.stonybrook.cse416.braves.server.service;

import edu.stonybrook.cse416.braves.server.model.DistrictMapDocument;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.TreeSet;

@Service
public class MongoDatabaseHealthService implements DatabaseHealthService {
    private final MongoTemplate mongoTemplate;

    public MongoDatabaseHealthService(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public Map<String, Object> getHealth() {
        Document pingResult = mongoTemplate.executeCommand(new Document("ping", 1));
        long districtMapCount = mongoTemplate.count(new Query(), DistrictMapDocument.class);

        return Map.of(
                "status", "ok",
                "service", "braves-server",
                "database", mongoTemplate.getDb().getName(),
                "mongoStatus", pingResult.getDouble("ok") == 1.0 ? "ok" : "degraded",
                "collections", Map.of(
                        "district_maps", districtMapCount
                ),
                "availableCollections", new TreeSet<>(mongoTemplate.getCollectionNames())
        );
    }
}
