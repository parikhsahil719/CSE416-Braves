package edu.stonybrook.cse416.braves.server.repository;

import edu.stonybrook.cse416.braves.server.model.MinorityEffectivenessHistogramDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface MinorityEffectivenessHistogramRepository extends MongoRepository<MinorityEffectivenessHistogramDocument, String> {
    Optional<MinorityEffectivenessHistogramDocument> findByStateIdAndGroupKeyAndElectionId(String stateId, String groupKey, String electionId);
}
