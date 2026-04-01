package edu.stonybrook.cse416.braves.server.model;

import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "minority_effectiveness_histograms")
public class MinorityEffectivenessHistogramDocument extends BasePayloadDocument {
}
