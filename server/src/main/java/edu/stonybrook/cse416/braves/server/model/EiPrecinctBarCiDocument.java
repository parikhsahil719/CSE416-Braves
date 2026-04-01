package edu.stonybrook.cse416.braves.server.model;

import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "ei_precinct_bar_ci_results")
public class EiPrecinctBarCiDocument extends BasePayloadDocument {
    private String partyKey;

    public String getPartyKey() {
        return partyKey;
    }

    public void setPartyKey(String partyKey) {
        this.partyKey = partyKey;
    }
}
