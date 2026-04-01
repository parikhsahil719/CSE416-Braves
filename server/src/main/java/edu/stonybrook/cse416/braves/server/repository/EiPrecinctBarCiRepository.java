package edu.stonybrook.cse416.braves.server.repository;

import edu.stonybrook.cse416.braves.server.model.EiPrecinctBarCiDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface EiPrecinctBarCiRepository extends MongoRepository<EiPrecinctBarCiDocument, String> {
    Optional<EiPrecinctBarCiDocument> findByStateIdAndGroupKeyAndElectionIdAndPartyKey(
            String stateId,
            String groupKey,
            String electionId,
            String partyKey
    );
}
