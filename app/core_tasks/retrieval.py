from datetime import date
from decimal import Decimal

from sqlalchemy import Date, Numeric, cast, func, select

from app.db.model.chat import Embedding, Knowledge, Message

def serialize_knowledge(knowledge: Knowledge) -> dict:
    return {"id": knowledge.id, "knowledge_type": knowledge.knowledge_type,
            "metadata": knowledge.knowledge_metadata, "text_content": knowledge.text_content,
            "created_at": knowledge.created_at.isoformat() if knowledge.created_at else None}

def serialize_message(message: Message) -> dict:
    return {"id": message.id, "chat_id": message.chat_id,
            "message_content": message.message_content, "sent_by": message.sent_by,
            "created_at": message.created_at.isoformat() if message.created_at else None}

def get_knowledge_schema(db, user_id: int) -> dict:
    stmt= select(Knowledge.knowledge_type, Knowledge.knowledge_metadata).where(Knowledge.user_id==user_id)
    rows= db.execute(stmt).all()
    schema= {"knowledge_types": sorted({row[0] for row in rows}), "metadata": {}}
    for _, metadata in rows:
        metadata= metadata.get("metadata", metadata)
        for key, value in metadata.items():
            value_type= "number" if isinstance(value, (int, float)) else "string"
            if isinstance(value, str):
                try:
                    date.fromisoformat(value[:10])
                    value_type= "date"
                except ValueError:
                    pass
            schema["metadata"][key]= value_type
    return schema

def build_semantic_queries(user_id: int, vector: list[float], message_id: int, limit: int = 5):
    knowledge_distance= Embedding.vector.cosine_distance(vector)
    message_distance= Embedding.vector.cosine_distance(vector)
    knowledge_stmt= select(Knowledge, knowledge_distance.label("distance")).join(Embedding).where(
        Knowledge.user_id==user_id, Embedding.kind=="KNOWLEDGE"
    ).order_by(knowledge_distance).limit(limit)
    message_stmt= select(Message, message_distance.label("distance")).join(Embedding).where(
        Message.user_id==user_id, Message.id!=message_id, Embedding.kind=="MESSAGE"
    ).order_by(message_distance).limit(limit)
    return knowledge_stmt, message_stmt

def semantic_search(db, user_id: int, vector: list[float], message_id: int, knowledge_only: bool = False) -> list[dict]:
    knowledge_stmt, message_stmt= build_semantic_queries(user_id, vector, message_id)
    results= [{"source": "knowledge", "distance": float(distance), "data": serialize_knowledge(item)}
              for item, distance in db.execute(knowledge_stmt).all()]
    if not knowledge_only:
        results.extend({"source": "message", "distance": float(distance), "data": serialize_message(item)}
                       for item, distance in db.execute(message_stmt).all())
    return results

def metadata_field(field: str, schema: dict):
    expression= func.coalesce(Knowledge.knowledge_metadata[field].astext,
                              Knowledge.knowledge_metadata["metadata"][field].astext)
    if schema["metadata"][field]=="number":
        return cast(expression, Numeric)
    if schema["metadata"][field]=="date":
        return cast(expression, Date)
    return expression

def build_sql_query(user_id: int, plan: dict, schema: dict, knowledge_ids: list[int] = None):
    operation= plan.get("operation", "list")
    if operation not in ["list", "count", "sum", "avg", "min", "max"]:
        raise ValueError("Invalid SQL operation")
    fields= {"knowledge_type": Knowledge.knowledge_type, "created_at": cast(Knowledge.created_at, Date)}
    fields.update({key: metadata_field(key, schema) for key in schema["metadata"]})
    field= plan.get("field")
    group_by= plan.get("group_by")
    if field and field not in fields or group_by and group_by not in fields:
        raise ValueError("Invalid SQL field")
    if operation in ["sum", "avg"] and schema["metadata"].get(field)!="number":
        raise ValueError("Aggregation field must be numeric")
    if operation=="list":
        stmt= select(Knowledge)
    else:
        value= Knowledge.id if operation=="count" and field is None else fields.get(field)
        if value is None:
            raise ValueError("Aggregation field is required")
        aggregate= getattr(func, operation)(value).label("value")
        stmt= select(fields[group_by].label("group"), aggregate).group_by(fields[group_by]) if group_by else select(aggregate)
    stmt= stmt.where(Knowledge.user_id==user_id)
    if knowledge_ids is not None:
        stmt= stmt.where(Knowledge.id.in_(knowledge_ids))
    if plan.get("knowledge_type"):
        if plan["knowledge_type"] not in schema["knowledge_types"]:
            raise ValueError("Invalid knowledge type")
        stmt= stmt.where(Knowledge.knowledge_type==plan["knowledge_type"])
    operators= {"eq": lambda a, b: a==b, "ne": lambda a, b: a!=b,
                "gt": lambda a, b: a>b, "gte": lambda a, b: a>=b,
                "lt": lambda a, b: a<b, "lte": lambda a, b: a<=b,
                "contains": lambda a, b: a.ilike(f"%{b}%"),
                "between": lambda a, b: a.between(b[0], b[1])}
    for item in plan.get("filters", []):
        if item.get("field") not in fields or item.get("operator") not in operators:
            raise ValueError("Invalid SQL filter")
        if item["operator"]=="between" and (not isinstance(item.get("value"), list) or len(item["value"])!=2):
            raise ValueError("Between requires two values")
        stmt= stmt.where(operators[item["operator"]](fields[item["field"]], item.get("value")))
    if operation=="list":
        sort_field= plan.get("sort_field", "created_at")
        if sort_field not in fields or plan.get("sort_order", "desc") not in ["asc", "desc"]:
            raise ValueError("Invalid sort field")
        order= fields[sort_field].desc() if plan.get("sort_order", "desc")=="desc" else fields[sort_field].asc()
        stmt= stmt.order_by(order).limit(min(max(plan.get("limit", 50), 1), 100))
    return stmt

def sql_search(db, user_id: int, plan: dict, schema: dict, knowledge_ids: list[int] = None):
    stmt= build_sql_query(user_id, plan, schema, knowledge_ids)
    if plan.get("operation", "list")=="list":
        return [serialize_knowledge(item) for item in db.execute(stmt).scalars().all()]
    if plan.get("group_by"):
        return [{"group": row[0], "value": float(row[1]) if isinstance(row[1], Decimal) else row[1]}
                for row in db.execute(stmt).all()]
    value= db.execute(stmt).scalar()
    return {"operation": plan.get("operation"), "value": float(value) if isinstance(value, Decimal) else value}

def retrieve_queries(db, user_id: int, queries: list[str], strategies: list[str],
                     embeddings: list[dict], message_id: int, get_plan) -> list[dict]:
    if len(queries)!=len(strategies) or len(queries)!=len(embeddings):
        raise ValueError("Queries, strategies and embeddings must match")
    schema= get_knowledge_schema(db, user_id)
    results= []
    for i, strategy in enumerate(strategies):
        if strategy=="semantic":
            data= semantic_search(db, user_id, embeddings[i]["vector"], message_id)
        elif strategy=="sql":
            data= sql_search(db, user_id, get_plan(queries[i], schema), schema)
        elif strategy=="hybrid":
            semantic= semantic_search(db, user_id, embeddings[i]["vector"], message_id, True)
            knowledge_ids= [item["data"]["id"] for item in semantic]
            data= sql_search(db, user_id, get_plan(queries[i], schema), schema, knowledge_ids)
        else:
            raise ValueError("Invalid retrieval strategy")
        results.append({"query": queries[i], "strategy": strategy, "results": data})
    return results
