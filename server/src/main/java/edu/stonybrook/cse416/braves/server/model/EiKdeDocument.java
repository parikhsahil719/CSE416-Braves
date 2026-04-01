package edu.stonybrook.cse416.braves.server.model;

import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "ei_kde_results")
public class EiKdeDocument extends BasePayloadDocument {
}
