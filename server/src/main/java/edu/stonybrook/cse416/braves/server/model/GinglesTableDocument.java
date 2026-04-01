package edu.stonybrook.cse416.braves.server.model;

import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "gingles_tables")
public class GinglesTableDocument extends BasePayloadDocument {
}
