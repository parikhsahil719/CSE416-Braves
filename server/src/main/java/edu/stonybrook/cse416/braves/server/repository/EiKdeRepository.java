package edu.stonybrook.cse416.braves.server.repository;

import edu.stonybrook.cse416.braves.server.model.EiKdeDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface EiKdeRepository extends MongoRepository<EiKdeDocument, String> {
    Optional<EiKdeDocument> findByStateIdAndGroupKeyAndElectionIdAndMetricKey(
            String stateId,
            String groupKey,
            String electionId,
            String metricKey
    );
}
