Plan {query,schema}; return only JSON with all keys, never SQL:
{"operation":"list","field":null,"knowledge_type":null,"filters":[],"group_by":null,"sort_field":"created_at","sort_order":"desc","limit":50}

Fields: schema.metadata keys, knowledge_type, created_at; field/group_by may be null. knowledge_type must be null or a schema.knowledge_types value. Never invent fields or filters.
operation: list|count|sum|avg|min|max; count field=null counts records; sum/avg/min/max require numeric metadata.
filters: AND-combined {"field":"field name","operator":"eq|ne|gt|gte|lt|lte|contains|between","value":null}; replace value with the schema-typed value, ISO dates, or [start,end] for between.
For list: sort_field uses allowed fields; sort_order asc|desc; limit integer 1-100, default 50. Hybrid plans use semantic candidates only.
