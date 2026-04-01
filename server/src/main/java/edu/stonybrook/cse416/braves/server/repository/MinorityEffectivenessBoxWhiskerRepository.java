package edu.stonybrook.cse416.braves.server.repository;

import edu.stonybrook.cse416.braves.server.model.MinorityEffectivenessBoxWhiskerDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface MinorityEffectivenessBoxWhiskerRepository extends MongoRepository<MinorityEffectivenessBoxWhiskerDocument, String> {
    Optional<MinorityEffectivenessBoxWhiskerDocument> findByStateIdAndElectionId(String stateId, String electionId);
}
